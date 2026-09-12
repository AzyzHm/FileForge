import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PdfToWordPanel } from "../../src/components/PdfToWordPanel";

vi.mock("../../src/services/pdfToWordService", async () => {
  const actual = await vi.importActual<
    typeof import("../../src/services/pdfToWordService")
  >("../../src/services/pdfToWordService");
  return {
    ...actual,
    convertPdfToWord: vi.fn(),
  };
});

import { convertPdfToWord } from "../../src/services/pdfToWordService";

function makeFile(name: string, type: string, size = 2048): File {
  const file = new File(["stub-content"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

async function uploadFile(file: File, options?: { applyAccept?: boolean }) {
  const input = screen.getByLabelText(/browse your files/i);
  await userEvent.upload(input, file, {
    applyAccept: options?.applyAccept ?? true,
  });
}

describe("PdfToWordPanel", () => {
  beforeEach(() => {
    vi.mocked(convertPdfToWord).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists an uploaded PDF file", async () => {
    render(<PdfToWordPanel />);

    await uploadFile(makeFile("report.pdf", "application/pdf"));

    expect(screen.getByText("report.pdf")).toBeInTheDocument();
  });

  it("skips files that are not PDFs and reports the count", async () => {
    render(<PdfToWordPanel />);

    await uploadFile(makeFile("report.docx", "application/msword"), {
      applyAccept: false,
    });

    expect(await screen.findByText(/1 file was skipped/i)).toBeInTheDocument();
    expect(screen.queryByText("report.docx")).not.toBeInTheDocument();
  });

  it("converts a file and shows a download link", async () => {
    const blob = new Blob(["PK-stub"]);
    vi.mocked(convertPdfToWord).mockResolvedValue({
      blob,
      filename: "report.docx",
    });

    render(<PdfToWordPanel />);
    await uploadFile(makeFile("report.pdf", "application/pdf"));

    await userEvent.click(screen.getByRole("button", { name: "Convert" }));

    const downloadLink = await screen.findByRole("link", {
      name: /download/i,
    });
    expect(downloadLink).toHaveAttribute("download", "report.docx");
  });

  it("shows an error and a retry option when conversion fails", async () => {
    vi.mocked(convertPdfToWord).mockRejectedValue(
      new Error("The conversion timed out. Try a smaller file."),
    );

    render(<PdfToWordPanel />);
    await uploadFile(makeFile("report.pdf", "application/pdf"));

    await userEvent.click(screen.getByRole("button", { name: "Convert" }));

    expect(
      await screen.findByText("The conversion timed out. Try a smaller file."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("converts every queued file when 'Convert all' is clicked", async () => {
    const blob = new Blob(["PK-stub"]);
    vi.mocked(convertPdfToWord).mockResolvedValue({
      blob,
      filename: "report.docx",
    });

    render(<PdfToWordPanel />);
    await uploadFile(makeFile("one.pdf", "application/pdf"));
    await uploadFile(makeFile("two.pdf", "application/pdf"));

    await userEvent.click(screen.getByRole("button", { name: "Convert all" }));

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: /download/i })).toHaveLength(
        2,
      );
    });
    expect(convertPdfToWord).toHaveBeenCalledTimes(2);
  });

  it("clears the queue when 'Clear' is clicked", async () => {
    render(<PdfToWordPanel />);
    await uploadFile(makeFile("report.pdf", "application/pdf"));

    expect(screen.getByText("report.pdf")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.queryByText("report.pdf")).not.toBeInTheDocument();
  });
});
