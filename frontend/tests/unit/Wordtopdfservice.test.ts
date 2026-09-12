import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const convertFileOnServerMock = vi.fn();

vi.mock("../../src/services/apiClient", async () => {
  const actual = await vi.importActual<
    typeof import("../../src/services/apiClient")
  >("../../src/services/apiClient");
  return {
    ...actual,
    convertFileOnServer: (...args: unknown[]) =>
      convertFileOnServerMock(...args),
  };
});

import {
  convertDocxToPdf,
  isDocxFile,
} from "../../src/services/wordToPdfService";

const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function makeFile(name: string, type: string, content = "stub"): File {
  return new File([content], name, { type });
}

describe("isDocxFile", () => {
  it("accepts files with the docx MIME type", () => {
    expect(isDocxFile(makeFile("report.docx", DOCX_TYPE))).toBe(true);
  });

  it("accepts files with a .docx extension even with an unusual MIME type", () => {
    expect(isDocxFile(makeFile("report.docx", ""))).toBe(true);
  });

  it("rejects other file types", () => {
    expect(isDocxFile(makeFile("report.pdf", "application/pdf"))).toBe(false);
  });
});

describe("convertDocxToPdf", () => {
  beforeEach(() => {
    convertFileOnServerMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects files that are not .docx without calling the server", async () => {
    await expect(
      convertDocxToPdf(makeFile("report.pdf", "application/pdf")),
    ).rejects.toThrow(/not a \.docx file/i);
    expect(convertFileOnServerMock).not.toHaveBeenCalled();
  });

  it("posts the file to the word-to-pdf endpoint and returns the result", async () => {
    const blob = new Blob(["%PDF-stub"]);
    convertFileOnServerMock.mockResolvedValue({
      blob,
      filename: "report.pdf",
    });

    const file = makeFile("report.docx", DOCX_TYPE);
    const result = await convertDocxToPdf(file);

    expect(result).toEqual({ blob, filename: "report.pdf" });
    expect(convertFileOnServerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/api/v1/convert/word-to-pdf",
        file,
        fallbackFilename: "report.pdf",
      }),
    );
  });

  it("propagates server errors", async () => {
    convertFileOnServerMock.mockRejectedValue(
      new Error("The conversion timed out. Try a smaller file."),
    );

    await expect(
      convertDocxToPdf(makeFile("report.docx", DOCX_TYPE)),
    ).rejects.toThrow(/timed out/i);
  });
});
