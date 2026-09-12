import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PdfCompressionPanel } from "../../src/components/PdfCompressionPanel";

vi.mock("../../src/services/pdfCompressionService", async () => {
  const actual = await vi.importActual<
    typeof import("../../src/services/pdfCompressionService")
  >("../../src/services/pdfCompressionService");
  return {
    ...actual,
    compressPdfOnServer: vi.fn(),
  };
});

import { compressPdfOnServer } from "../../src/services/pdfCompressionService";

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

describe("PdfCompressionPanel", () => {
  beforeEach(() => {
    vi.mocked(compressPdfOnServer).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists an uploaded PDF with the eBook quality selected by default", async () => {
    render(<PdfCompressionPanel />);

    await uploadFile(makeFile("big.pdf", "application/pdf"));

    expect(screen.getByText("big.pdf")).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "eBook (balanced)", selected: true }),
    ).toBeInTheDocument();
  });

  it("skips files that are not PDFs and reports the count", async () => {
    render(<PdfCompressionPanel />);

    await uploadFile(makeFile("photo.png", "image/png"), {
      applyAccept: false,
    });

    expect(await screen.findByText(/1 file was skipped/i)).toBeInTheDocument();
    expect(screen.queryByText("photo.png")).not.toBeInTheDocument();
  });

  it("compresses a file with the selected quality and shows the size reduction", async () => {
    const compressed = new Blob(["small"]);
    Object.defineProperty(compressed, "size", { value: 512 });
    vi.mocked(compressPdfOnServer).mockResolvedValue({
      blob: compressed,
      filename: "big.pdf",
    });

    render(<PdfCompressionPanel />);
    await uploadFile(makeFile("big.pdf", "application/pdf", 2048));

    await userEvent.selectOptions(
      screen.getByRole("combobox"),
      "Screen (smallest)",
    );
    await userEvent.click(screen.getByRole("button", { name: "Compress" }));

    const downloadLink = await screen.findByRole("link", {
      name: /download/i,
    });
    expect(downloadLink).toHaveAttribute("download", "big.pdf");
    expect(compressPdfOnServer).toHaveBeenCalledWith(
      expect.anything(),
      "screen",
    );
    expect(screen.getByText(/75% smaller/i)).toBeInTheDocument();
  });

  it("shows an error and a retry option when compression fails", async () => {
    vi.mocked(compressPdfOnServer).mockRejectedValue(
      new Error("The conversion service is temporarily unavailable."),
    );

    render(<PdfCompressionPanel />);
    await uploadFile(makeFile("big.pdf", "application/pdf"));

    await userEvent.click(screen.getByRole("button", { name: "Compress" }));

    expect(
      await screen.findByText(
        "The conversion service is temporarily unavailable.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("compresses every queued file when 'Compress all' is clicked", async () => {
    const compressed = new Blob(["small"]);
    vi.mocked(compressPdfOnServer).mockResolvedValue({
      blob: compressed,
      filename: "file.pdf",
    });

    render(<PdfCompressionPanel />);
    await uploadFile(makeFile("one.pdf", "application/pdf"));
    await uploadFile(makeFile("two.pdf", "application/pdf"));

    await userEvent.click(screen.getByRole("button", { name: "Compress all" }));

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: /download/i })).toHaveLength(
        2,
      );
    });
    expect(compressPdfOnServer).toHaveBeenCalledTimes(2);
  });

  it("clears the queue when 'Clear' is clicked", async () => {
    render(<PdfCompressionPanel />);
    await uploadFile(makeFile("big.pdf", "application/pdf"));

    expect(screen.getByText("big.pdf")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.queryByText("big.pdf")).not.toBeInTheDocument();
  });
});
