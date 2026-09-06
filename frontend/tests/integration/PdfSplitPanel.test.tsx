import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
        label: "Page 1",
      },
      {
        blob: new Blob(["p2"], { type: "application/pdf" }),
        fileName: "report-page-2.pdf",
        label: "Page 2",
      },
    ]);

    render(<PdfSplitPanel />);
    await uploadFile(makeFile("report.pdf"));
    await userEvent.click(screen.getByRole("button", { name: "Split" }));

    expect(await screen.findByText("Page 1")).toBeInTheDocument();
    expect(screen.getByText("Page 2")).toBeInTheDocument();
    expect(splitPdfByRanges).not.toHaveBeenCalled();
  });

  it("shows a range input and disables Split until a value is entered", async () => {
    render(<PdfSplitPanel />);
    await uploadFile(makeFile("report.pdf"));

    await userEvent.click(screen.getByRole("radio", { name: "Page ranges" }));

    expect(screen.getByRole("button", { name: "Split" })).toBeDisabled();
    expect(
      screen.getByLabelText(/pages or ranges, separated by commas/i),
    ).toBeInTheDocument();
  });

  it("splits by range and lists a download link per range", async () => {
    vi.mocked(splitPdfByRanges).mockResolvedValue([
      {
        blob: new Blob(["r1"], { type: "application/pdf" }),
        fileName: "report-pages-1-3.pdf",
        label: "Pages 1-3",
      },
      {
        blob: new Blob(["r2"], { type: "application/pdf" }),
        fileName: "report-page-5.pdf",
        label: "Page 5",
      },
    ]);

    render(<PdfSplitPanel />);
    await uploadFile(makeFile("report.pdf"));
    await userEvent.click(screen.getByRole("radio", { name: "Page ranges" }));

    const rangeInput = screen.getByLabelText(
      /pages or ranges, separated by commas/i,
    );
    await userEvent.type(rangeInput, "1-3, 5");
    await userEvent.click(screen.getByRole("button", { name: "Split" }));

    expect(await screen.findByText("Pages 1-3")).toBeInTheDocument();
    expect(screen.getByText("Page 5")).toBeInTheDocument();
    expect(splitPdfByRanges).toHaveBeenCalledWith(expect.any(File), "1-3, 5");
    expect(splitPdf).not.toHaveBeenCalled();
  });

  it("shows an error message when a range is invalid", async () => {
    vi.mocked(splitPdfByRanges).mockRejectedValue(
      new Error('"1-20" goes beyond the document\'s 5 pages.'),
    );

    render(<PdfSplitPanel />);
    await uploadFile(makeFile("report.pdf"));
    await userEvent.click(screen.getByRole("radio", { name: "Page ranges" }));
    await userEvent.type(
      screen.getByLabelText(/pages or ranges, separated by commas/i),
      "1-20",
    );
    await userEvent.click(screen.getByRole("button", { name: "Split" }));

    expect(
      await screen.findByText(/goes beyond the document/i),
    ).toBeInTheDocument();
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
