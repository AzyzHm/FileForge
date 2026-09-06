import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PdfMergePanel } from "../../src/components/PdfMergePanel";

vi.mock("../../src/services/pdfService", async () => {
  const actual = await vi.importActual<
    typeof import("../../src/services/pdfService")
  >("../../src/services/pdfService");
  return {
    ...actual,
    mergePdfs: vi.fn(),
  };
});

import { mergePdfs } from "../../src/services/pdfService";

function makeFile(name: string): File {
  return new File(["stub-content"], name, { type: "application/pdf" });
}

async function uploadFiles(files: File[]) {
  const input = screen.getByLabelText(/browse your files/i);
  await userEvent.upload(input, files);
}

describe("PdfMergePanel", () => {
  beforeEach(() => {
    vi.mocked(mergePdfs).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists uploaded PDFs in order", async () => {
    render(<PdfMergePanel />);

    await uploadFiles([makeFile("a.pdf"), makeFile("b.pdf")]);

    expect(screen.getByText("1. a.pdf")).toBeInTheDocument();
    expect(screen.getByText("2. b.pdf")).toBeInTheDocument();
  });

  it("skips non-PDF files and reports the count", async () => {
    render(<PdfMergePanel />);

    const input = screen.getByLabelText(/browse your files/i);
    await userEvent.upload(
      input,
      new File(["stub"], "photo.png", { type: "image/png" }),
      { applyAccept: false },
    );

    expect(await screen.findByText(/not a PDF/i)).toBeInTheDocument();
  });

  it("disables Merge until at least two files are added", async () => {
    render(<PdfMergePanel />);

    await uploadFiles([makeFile("a.pdf")]);

    expect(screen.getByRole("button", { name: "Merge" })).toBeDisabled();
  });

  it("reorders files with the move buttons", async () => {
    render(<PdfMergePanel />);
    await uploadFiles([makeFile("a.pdf"), makeFile("b.pdf")]);

    await userEvent.click(screen.getByLabelText("Move b.pdf up"));

    expect(screen.getByText("1. b.pdf")).toBeInTheDocument();
    expect(screen.getByText("2. a.pdf")).toBeInTheDocument();
  });

  it("merges files and shows a download link on success", async () => {
    const blob = new Blob(["merged"], { type: "application/pdf" });
    vi.mocked(mergePdfs).mockResolvedValue(blob);

    render(<PdfMergePanel />);
    await uploadFiles([makeFile("a.pdf"), makeFile("b.pdf")]);

    await userEvent.click(screen.getByRole("button", { name: "Merge" }));

    const downloadLink = await screen.findByRole("link", {
      name: /download merged.pdf/i,
    });
    expect(downloadLink).toHaveAttribute("download", "merged.pdf");
  });

  it("shows an error message when merging fails", async () => {
    vi.mocked(mergePdfs).mockRejectedValue(new Error("Something broke."));

    render(<PdfMergePanel />);
    await uploadFiles([makeFile("a.pdf"), makeFile("b.pdf")]);

    await userEvent.click(screen.getByRole("button", { name: "Merge" }));

    expect(await screen.findByText("Something broke.")).toBeInTheDocument();
  });

  it("clears the queue when Clear is clicked", async () => {
    render(<PdfMergePanel />);
    await uploadFiles([makeFile("a.pdf"), makeFile("b.pdf")]);

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.queryByText("1. a.pdf")).not.toBeInTheDocument();
  });
});
