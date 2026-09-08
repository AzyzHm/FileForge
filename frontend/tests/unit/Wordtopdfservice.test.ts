import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const convertToHtmlMock = vi.fn();

vi.mock("mammoth", () => ({
  convertToHtml: (...args: unknown[]) => convertToHtmlMock(...args),
  images: { dataUri: "data-uri-converter" },
}));

import {
  buildDocumentTitle,
  buildPrintDocument,
  convertDocxToHtml,
  escapeHtml,
  isDocxFile,
  openPrintPreview,
} from "../../src/services/wordToPdfService";

function makeFile(name: string, type: string, content = "stub"): File {
  return new File([content], name, { type });
}

describe("isDocxFile", () => {
  it("accepts the docx MIME type", () => {
    expect(
      isDocxFile(
        makeFile(
          "report.docx",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ),
      ),
    ).toBe(true);
  });

  it("falls back to the file extension when the MIME type is missing", () => {
    expect(isDocxFile(makeFile("report.DOCX", ""))).toBe(true);
  });

  it("rejects legacy .doc files and other formats", () => {
    expect(isDocxFile(makeFile("report.doc", "application/msword"))).toBe(
      false,
    );
    expect(isDocxFile(makeFile("report.pdf", "application/pdf"))).toBe(false);
  });
});

describe("buildDocumentTitle", () => {
  it("strips the extension", () => {
    expect(buildDocumentTitle("Quarterly Report.docx")).toBe(
      "Quarterly Report",
    );
  });

  it("handles file names without an extension", () => {
    expect(buildDocumentTitle("report")).toBe("report");
  });
});

describe("escapeHtml", () => {
  it("escapes HTML-significant characters", () => {
    expect(escapeHtml(`<b>"Tom & Jerry's"</b>`)).toBe(
      "&lt;b&gt;&quot;Tom &amp; Jerry&#39;s&quot;&lt;/b&gt;",
    );
  });
});

describe("buildPrintDocument", () => {
  it("wraps the body HTML with an escaped title and print styles", () => {
    const document = buildPrintDocument(
      "<p>Hello</p>",
      "<script>alert(1)</script>",
    );

    expect(document).toContain("<p>Hello</p>");
    expect(document).toContain("&lt;script&gt;alert(1)&lt;/script&gt;</title>");
    expect(document).toContain("@page");
    expect(document).toContain(".doc-title");
    expect(document).toContain(".doc-quote");
    expect(document).not.toContain("<script>alert(1)</script>");
  });
});

describe("convertDocxToHtml", () => {
  beforeEach(() => {
    convertToHtmlMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects files that are not .docx without calling the library", async () => {
    await expect(
      convertDocxToHtml(makeFile("report.pdf", "application/pdf")),
    ).rejects.toThrow(/not a \.docx file/i);
    expect(convertToHtmlMock).not.toHaveBeenCalled();
  });

  it("converts a docx file to HTML using data URI images", async () => {
    convertToHtmlMock.mockResolvedValue({
      value: "<p>Body text</p>",
      messages: [{ type: "warning", message: "Unrecognized style" }],
    });

    const file = makeFile(
      "report.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    const result = await convertDocxToHtml(file);

    expect(result.html).toBe("<p>Body text</p>");
    expect(result.warnings).toEqual(["Unrecognized style"]);
    expect(convertToHtmlMock).toHaveBeenCalledWith(
      expect.objectContaining({ arrayBuffer: expect.any(ArrayBuffer) }),
      expect.objectContaining({
        convertImage: "data-uri-converter",
        styleMap: expect.arrayContaining([
          expect.stringContaining("style-name='Title'"),
          expect.stringContaining("style-name='Quote'"),
        ]),
      }),
    );
  });

  it("wraps library failures in a friendly error", async () => {
    convertToHtmlMock.mockRejectedValue(new Error("boom"));

    await expect(
      convertDocxToHtml(makeFile("report.docx", "")),
    ).rejects.toThrow(/could not be converted/i);
  });
});

describe("openPrintPreview", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false when the popup is blocked", () => {
    vi.spyOn(window, "open").mockReturnValue(null);

    const opened = openPrintPreview("<p>Hi</p>", "My Doc");

    expect(opened).toBe(false);
  });

  it("writes the document and prints once the preview window loads", () => {
    const write = vi.fn();
    const openDoc = vi.fn();
    const closeDoc = vi.fn();
    const focus = vi.fn();
    const print = vi.fn();

    const fakeWindow = {
      document: { open: openDoc, write, close: closeDoc },
      focus,
      print,
      onload: null as (() => void) | null,
    };

    vi.spyOn(window, "open").mockReturnValue(fakeWindow as unknown as Window);

    const opened = openPrintPreview("<p>Hi</p>", "My Doc");

    expect(opened).toBe(true);
    expect(openDoc).toHaveBeenCalled();
    expect(write).toHaveBeenCalledWith(expect.stringContaining("<p>Hi</p>"));
    expect(closeDoc).toHaveBeenCalled();
    expect(print).not.toHaveBeenCalled();

    fakeWindow.onload?.();

    expect(focus).toHaveBeenCalled();
    expect(print).toHaveBeenCalled();
  });
});
