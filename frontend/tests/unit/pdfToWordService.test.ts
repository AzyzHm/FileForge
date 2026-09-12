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
  convertPdfToWord,
  isPdfFile,
} from "../../src/services/pdfToWordService";

function makeFile(name: string, type: string, content = "stub"): File {
  return new File([content], name, { type });
}

describe("isPdfFile", () => {
  it("accepts PDF files", () => {
    expect(isPdfFile(makeFile("report.pdf", "application/pdf"))).toBe(true);
  });

  it("rejects other file types", () => {
    expect(isPdfFile(makeFile("report.docx", "application/msword"))).toBe(
      false,
    );
  });
});

describe("convertPdfToWord", () => {
  beforeEach(() => {
    convertFileOnServerMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects files that are not .pdf without calling the server", async () => {
    await expect(
      convertPdfToWord(makeFile("report.docx", "application/msword")),
    ).rejects.toThrow(/not a \.pdf file/i);
    expect(convertFileOnServerMock).not.toHaveBeenCalled();
  });

  it("posts the file to the pdf-to-word endpoint and returns the result", async () => {
    const blob = new Blob(["PK-stub"]);
    convertFileOnServerMock.mockResolvedValue({
      blob,
      filename: "report.docx",
    });

    const file = makeFile("report.pdf", "application/pdf");
    const result = await convertPdfToWord(file);

    expect(result).toEqual({ blob, filename: "report.docx" });
    expect(convertFileOnServerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/api/v1/convert/pdf-to-word",
        file,
        fallbackFilename: "report.docx",
      }),
    );
  });

  it("propagates server errors", async () => {
    convertFileOnServerMock.mockRejectedValue(
      new Error("The conversion timed out. Try a smaller file."),
    );

    await expect(
      convertPdfToWord(makeFile("report.pdf", "application/pdf")),
    ).rejects.toThrow(/timed out/i);
  });
});
