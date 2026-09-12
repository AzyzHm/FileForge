import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WordToPdfPanel } from "../../src/components/WordToPdfPanel";

vi.mock("../../src/services/wordToPdfService", async () => {
  const actual = await vi.importActual<
    typeof import("../../src/services/wordToPdfService")
  >("../../src/services/wordToPdfService");
  return {
    ...actual,
    convertDocxToPdf: vi.fn(),
  };
});

import { convertDocxToPdf } from "../../src/services/wordToPdfService";

const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

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

describe("WordToPdfPanel", () => {
  beforeEach(() => {
    vi.mocked(convertDocxToPdf).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists an uploaded docx file", async () => {
    render(<WordToPdfPanel />);

    await uploadFile(makeFile("report.docx", DOCX_TYPE));

    expect(screen.getByText("report.docx")).toBeInTheDocument();
  });

  it("skips files that are not .docx and reports the count", async () => {
    render(<WordToPdfPanel />);

    await uploadFile(makeFile("report.pdf", "application/pdf"), {
      applyAccept: false,
    });

    expect(await screen.findByText(/1 file was skipped/i)).toBeInTheDocument();
    expect(screen.queryByText("report.pdf")).not.toBeInTheDocument();
  });

  it("converts a file on the server and shows a PDF download link", async () => {
    const blob = new Blob(["%PDF-stub"]);
    vi.mocked(convertDocxToPdf).mockResolvedValue({
      blob,
      filename: "report.pdf",
    });

    render(<WordToPdfPanel />);
    await uploadFile(makeFile("report.docx", DOCX_TYPE));

    await userEvent.click(screen.getByRole("button", { name: "Convert" }));

    const downloadLink = await screen.findByRole("link", {
      name: /download pdf/i,
    });
    expect(downloadLink).toHaveAttribute("download", "report.pdf");
  });

  it("shows an error and a retry option when conversion fails", async () => {
    vi.mocked(convertDocxToPdf).mockRejectedValue(
      new Error("The conversion timed out. Try a smaller file."),
    );

    render(<WordToPdfPanel />);
    await uploadFile(makeFile("report.docx", DOCX_TYPE));

    await userEvent.click(screen.getByRole("button", { name: "Convert" }));

    expect(
      await screen.findByText("The conversion timed out. Try a smaller file."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("converts every queued file when 'Convert all' is clicked", async () => {
    const blob = new Blob(["%PDF-stub"]);
    vi.mocked(convertDocxToPdf).mockResolvedValue({
      blob,
      filename: "report.pdf",
    });

    render(<WordToPdfPanel />);
    await uploadFile(makeFile("one.docx", DOCX_TYPE));
    await uploadFile(makeFile("two.docx", DOCX_TYPE));

    await userEvent.click(screen.getByRole("button", { name: "Convert all" }));

    await waitFor(() => {
      expect(
        screen.getAllByRole("link", { name: /download pdf/i }),
      ).toHaveLength(2);
    });
    expect(convertDocxToPdf).toHaveBeenCalledTimes(2);
  });

  it("clears the queue when 'Clear' is clicked", async () => {
    render(<WordToPdfPanel />);
    await uploadFile(makeFile("report.docx", DOCX_TYPE));

    expect(screen.getByText("report.docx")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.queryByText("report.docx")).not.toBeInTheDocument();
  });
});
