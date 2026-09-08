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
    convertDocxToHtml: vi.fn(),
    openPrintPreview: vi.fn(),
  };
});

import {
  convertDocxToHtml,
  openPrintPreview,
} from "../../src/services/wordToPdfService";

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
    vi.mocked(convertDocxToHtml).mockReset();
    vi.mocked(openPrintPreview).mockReset();
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

  it("converts a file and opens the print preview on request", async () => {
    vi.mocked(convertDocxToHtml).mockResolvedValue({
      html: "<p>Body</p>",
      warnings: [],
    });
    vi.mocked(openPrintPreview).mockReturnValue(true);

    render(<WordToPdfPanel />);
    await uploadFile(makeFile("report.docx", DOCX_TYPE));

    await userEvent.click(screen.getByRole("button", { name: "Convert" }));

    const printButton = await screen.findByRole("button", {
      name: "Preview & print",
    });
    await userEvent.click(printButton);

    expect(openPrintPreview).toHaveBeenCalledWith("<p>Body</p>", "report");
  });

  it("shows a warning note when the conversion had messages", async () => {
    vi.mocked(convertDocxToHtml).mockResolvedValue({
      html: "<p>Body</p>",
      warnings: ["Unrecognized style 'Foo'"],
    });

    render(<WordToPdfPanel />);
    await uploadFile(makeFile("report.docx", DOCX_TYPE));
    await userEvent.click(screen.getByRole("button", { name: "Convert" }));

    expect(await screen.findByText(/1 note/i)).toBeInTheDocument();
  });

  it("shows a popup-blocked message when the preview window cannot open", async () => {
    vi.mocked(convertDocxToHtml).mockResolvedValue({
      html: "<p>Body</p>",
      warnings: [],
    });
    vi.mocked(openPrintPreview).mockReturnValue(false);

    render(<WordToPdfPanel />);
    await uploadFile(makeFile("report.docx", DOCX_TYPE));
    await userEvent.click(screen.getByRole("button", { name: "Convert" }));

    const printButton = await screen.findByRole("button", {
      name: "Preview & print",
    });
    await userEvent.click(printButton);

    expect(
      await screen.findByText(/browser blocked the preview window/i),
    ).toBeInTheDocument();
  });

  it("shows an error and a retry option when conversion fails", async () => {
    vi.mocked(convertDocxToHtml).mockRejectedValue(
      new Error("The file could not be converted."),
    );

    render(<WordToPdfPanel />);
    await uploadFile(makeFile("report.docx", DOCX_TYPE));
    await userEvent.click(screen.getByRole("button", { name: "Convert" }));

    expect(
      await screen.findByText("The file could not be converted."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("converts every queued file when 'Convert all' is clicked", async () => {
    vi.mocked(convertDocxToHtml).mockResolvedValue({
      html: "<p>Body</p>",
      warnings: [],
    });

    render(<WordToPdfPanel />);
    await uploadFile(makeFile("one.docx", DOCX_TYPE));
    await uploadFile(makeFile("two.docx", DOCX_TYPE));

    await userEvent.click(screen.getByRole("button", { name: "Convert all" }));

    await waitFor(() => {
      expect(
        screen.getAllByRole("button", { name: "Preview & print" }),
      ).toHaveLength(2);
    });
    expect(convertDocxToHtml).toHaveBeenCalledTimes(2);
  });

  it("clears the queue when 'Clear' is clicked", async () => {
    render(<WordToPdfPanel />);
    await uploadFile(makeFile("report.docx", DOCX_TYPE));

    expect(screen.getByText("report.docx")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.queryByText("report.docx")).not.toBeInTheDocument();
  });
});
