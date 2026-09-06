import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PDFDocument } from "pdf-lib";
import { PdfSplitPanel } from "../../src/components/PdfSplitPanel";

vi.mock("../../src/services/pdfService", async () => {
  const actual = await vi.importActual<
    typeof import("../../src/services/pdfService")
  >("../../src/services/pdfService");
  return {
    ...actual,
    splitPdf: vi.fn(),
    splitPdfByRanges: vi.fn(),
  };
});

import { splitPdf, splitPdfByRanges } from "../../src/services/pdfService";

function makeFile(name: string): File {
  return new File(["stub-content"], name, { type: "application/pdf" });
}

async function makeRealPdfFile(name: string, pageCount: number): Promise<File> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    doc.addPage([200, 200]);
  }
  const bytes = await doc.save();
  return new File([bytes], name, { type: "application/pdf" });
}

async function uploadFile(file: File) {
  const input = screen.getByLabelText(/browse your files/i);
  await userEvent.upload(input, file);
}

describe("PdfSplitPanel", () => {
  beforeEach(() => {
    vi.mocked(splitPdf).mockReset();
    vi.mocked(splitPdfByRanges).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the uploaded file", async () => {
    render(<PdfSplitPanel />);
    await uploadFile(makeFile("report.pdf"));
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
  });

  it("rejects files that are not PDFs", async () => {
    render(<PdfSplitPanel />);

    const input = screen.getByLabelText(/browse your files/i);
    await userEvent.upload(
      input,
      new File(["stub"], "photo.png", { type: "image/png" }),
      { applyAccept: false },
    );

    expect(await screen.findByText(/not a PDF/i)).toBeInTheDocument();
  });

  it("shows the page count once it can read the file", async () => {
    render(<PdfSplitPanel />);
    await uploadFile(await makeRealPdfFile("report.pdf", 6));

    expect(await screen.findByText(/6 pages/i)).toBeInTheDocument();
  });

  it("defaults to every-page mode with Split enabled", async () => {
    render(<PdfSplitPanel />);
    await uploadFile(makeFile("report.pdf"));

    expect(screen.getByRole("radio", { name: "Every page" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("button", { name: "Split" })).toBeEnabled();
  });

  it("splits every page and lists a download link per page", async () => {
    vi.mocked(splitPdf).mockResolvedValue([
      {
        blob: new Blob(["p1"], { type: "application/pdf" }),
        fileName: "report-page-1.pdf",
      },
      {
        blob: new Blob(["p2"], { type: "application/pdf" }),
        fileName: "report-page-2.pdf",
      },
    ]);

    render(<PdfSplitPanel />);
    await uploadFile(makeFile("report.pdf"));
    await userEvent.click(screen.getByRole("button", { name: "Split" }));

    expect(await screen.findByText("report-page-1.pdf")).toBeInTheDocument();
    expect(screen.getByText("report-page-2.pdf")).toBeInTheDocument();
    expect(splitPdfByRanges).not.toHaveBeenCalled();
  });

  it("shows range rows and disables Split until a From value is entered", async () => {
    render(<PdfSplitPanel />);
    await uploadFile(makeFile("report.pdf"));

    await userEvent.click(screen.getByRole("radio", { name: "Page ranges" }));

    expect(screen.getByRole("button", { name: "Split" })).toBeDisabled();
    expect(screen.getAllByLabelText("From page")).toHaveLength(1);
  });

  it("lets the user add and remove range rows", async () => {
    render(<PdfSplitPanel />);
    await uploadFile(makeFile("report.pdf"));
    await userEvent.click(screen.getByRole("radio", { name: "Page ranges" }));

    await userEvent.click(
      screen.getByRole("button", { name: "+ Add another range" }),
    );
    expect(screen.getAllByLabelText("From page")).toHaveLength(2);

    await userEvent.click(
      screen.getByRole("button", { name: "Remove range 2" }),
    );
    expect(screen.getAllByLabelText("From page")).toHaveLength(1);
  });

  it("splits by range using the entered From/To values", async () => {
    vi.mocked(splitPdfByRanges).mockResolvedValue([
      {
        blob: new Blob(["r1"], { type: "application/pdf" }),
        fileName: "report-pages-1-3.pdf",
      },
      {
        blob: new Blob(["r2"], { type: "application/pdf" }),
        fileName: "report-page-5.pdf",
      },
    ]);

    render(<PdfSplitPanel />);
    await uploadFile(makeFile("report.pdf"));
    await userEvent.click(screen.getByRole("radio", { name: "Page ranges" }));

    const [fromInput] = screen.getAllByLabelText("From page");
    const [toInput] = screen.getAllByLabelText("To page, optional");
    await userEvent.type(fromInput, "1");
    await userEvent.type(toInput, "3");

    await userEvent.click(
      screen.getByRole("button", { name: "+ Add another range" }),
    );
    const fromInputs = screen.getAllByLabelText("From page");
    await userEvent.type(fromInputs[1], "5");

    await userEvent.click(screen.getByRole("button", { name: "Split" }));

    expect(await screen.findByText("report-pages-1-3.pdf")).toBeInTheDocument();
    expect(screen.getByText("report-page-5.pdf")).toBeInTheDocument();
    expect(splitPdfByRanges).toHaveBeenCalledWith(expect.any(File), [
      { start: 1, end: 3 },
      { start: 5, end: 5 },
    ]);
    expect(splitPdf).not.toHaveBeenCalled();
  });

  it("shows an error message when a range is invalid", async () => {
    vi.mocked(splitPdfByRanges).mockRejectedValue(
      new Error("Page 20 is beyond the document's 5 pages."),
    );

    render(<PdfSplitPanel />);
    await uploadFile(makeFile("report.pdf"));
    await userEvent.click(screen.getByRole("radio", { name: "Page ranges" }));

    const [fromInput] = screen.getAllByLabelText("From page");
    await userEvent.type(fromInput, "20");
    await userEvent.click(screen.getByRole("button", { name: "Split" }));

    expect(await screen.findByText(/beyond the document/i)).toBeInTheDocument();
  });

  it("shows an error message when splitting fails", async () => {
    vi.mocked(splitPdf).mockRejectedValue(new Error("Broken PDF."));

    render(<PdfSplitPanel />);
    await uploadFile(makeFile("report.pdf"));
    await userEvent.click(screen.getByRole("button", { name: "Split" }));

    expect(await screen.findByText("Broken PDF.")).toBeInTheDocument();
  });

  it("clears the file when Clear is clicked", async () => {
    render(<PdfSplitPanel />);
    await uploadFile(makeFile("report.pdf"));

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.queryByText("report.pdf")).not.toBeInTheDocument();
  });
});
