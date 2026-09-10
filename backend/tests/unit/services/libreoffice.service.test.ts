import { convertWithOptions } from "libreoffice-convert";
import {
  GatewayTimeoutException,
  ServiceUnavailableException,
} from "../../../src/exceptions/http-exceptions";

jest.mock("libreoffice-convert", () => ({
  convertWithOptions: jest.fn(),
}));

const mockedConvertWithOptions = jest.mocked(convertWithOptions);

const mockEnv: { libreofficeBinPath?: string; libreofficeTimeoutMs: number } = {
  libreofficeBinPath: undefined,
  libreofficeTimeoutMs: 60_000,
};

jest.mock("../../../src/config/env", () => ({
  get env() {
    return mockEnv;
  },
}));

import { convertWithLibreOffice } from "../../../src/services/libreoffice.service";

describe("libreoffice.service convertWithLibreOffice", () => {
  beforeEach(() => {
    mockedConvertWithOptions.mockReset();
    mockEnv.libreofficeBinPath = undefined;
    mockEnv.libreofficeTimeoutMs = 60_000;
  });

  it("resolves with the converted buffer on success", async () => {
    const expected = Buffer.from("converted document");
    mockedConvertWithOptions.mockImplementation(
      (_document, _format, _filter, _options, callback) => {
        callback(null, expected);
      },
    );

    const result = await convertWithLibreOffice({
      document: Buffer.from("source"),
      fileName: "source.docx",
      targetFormat: "pdf",
    });

    expect(result).toBe(expected);
  });

  it("passes the target format and additional args through to convertWithOptions", async () => {
    mockedConvertWithOptions.mockImplementation(
      (_document, _format, _filter, _options, callback) => {
        callback(null, Buffer.from("ok"));
      },
    );

    await convertWithLibreOffice({
      document: Buffer.from("source"),
      fileName: "source.pdf",
      targetFormat: "docx",
      additionalArgs: ["--infilter=writer_pdf_import"],
    });

    expect(mockedConvertWithOptions).toHaveBeenCalledWith(
      expect.any(Buffer),
      "docx",
      undefined,
      expect.objectContaining({
        fileName: "source.pdf",
        sofficeAdditionalArgs: ["--infilter=writer_pdf_import"],
      }),
      expect.any(Function),
    );
  });

  it("forwards a configured LIBREOFFICE_BIN_PATH as a soffice binary path candidate", async () => {
    mockEnv.libreofficeBinPath = "/custom/path/to/soffice";

    mockedConvertWithOptions.mockImplementation(
      (_document, _format, _filter, _options, callback) => {
        callback(null, Buffer.from("ok"));
      },
    );

    await convertWithLibreOffice({
      document: Buffer.from("source"),
      fileName: "source.docx",
      targetFormat: "pdf",
    });

    expect(mockedConvertWithOptions).toHaveBeenCalledWith(
      expect.any(Buffer),
      "pdf",
      undefined,
      expect.objectContaining({
        sofficeBinaryPaths: ["/custom/path/to/soffice"],
      }),
      expect.any(Function),
    );
  });

  it("passes an empty soffice binary path list when LIBREOFFICE_BIN_PATH is unset", async () => {
    mockedConvertWithOptions.mockImplementation(
      (_document, _format, _filter, _options, callback) => {
        callback(null, Buffer.from("ok"));
      },
    );

    await convertWithLibreOffice({
      document: Buffer.from("source"),
      fileName: "source.docx",
      targetFormat: "pdf",
    });

    expect(mockedConvertWithOptions).toHaveBeenCalledWith(
      expect.any(Buffer),
      "pdf",
      undefined,
      expect.objectContaining({ sofficeBinaryPaths: [] }),
      expect.any(Function),
    );
  });

  it("maps a missing soffice binary error to ServiceUnavailableException", async () => {
    mockedConvertWithOptions.mockImplementation(
      (_document, _format, _filter, _options, callback) => {
        callback(new Error("Could not find soffice binary"), Buffer.alloc(0));
      },
    );

    await expect(
      convertWithLibreOffice({
        document: Buffer.from("source"),
        fileName: "source.docx",
        targetFormat: "pdf",
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("maps a killed/timed-out conversion to GatewayTimeoutException", async () => {
    mockedConvertWithOptions.mockImplementation(
      (_document, _format, _filter, _options, callback) => {
        const timeoutError = Object.assign(new Error("Command failed"), {
          killed: true,
          signal: "SIGTERM",
        });
        callback(timeoutError, Buffer.alloc(0));
      },
    );

    await expect(
      convertWithLibreOffice({
        document: Buffer.from("source"),
        fileName: "source.docx",
        targetFormat: "pdf",
        timeoutMs: 5000,
      }),
    ).rejects.toBeInstanceOf(GatewayTimeoutException);
  });

  it("rethrows unrecognized errors unchanged", async () => {
    const unexpected = new Error("something else went wrong");
    mockedConvertWithOptions.mockImplementation(
      (_document, _format, _filter, _options, callback) => {
        callback(unexpected, Buffer.alloc(0));
      },
    );

    await expect(
      convertWithLibreOffice({
        document: Buffer.from("source"),
        fileName: "source.docx",
        targetFormat: "pdf",
      }),
    ).rejects.toThrow("something else went wrong");
  });
});
