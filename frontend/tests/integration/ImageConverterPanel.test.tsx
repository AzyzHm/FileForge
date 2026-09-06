import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageConverterPanel } from "../../src/components/ImageConverterPanel";

vi.mock("../../src/services/imageConversionService", async () => {
  const actual = await vi.importActual<
    typeof import("../../src/services/imageConversionService")
  >("../../src/services/imageConversionService");
  return {
    ...actual,
    convertImage: vi.fn(),
  };
});

import { convertImage } from "../../src/services/imageConversionService";

function makeFile(name: string, type: string): File {
  return new File(["stub-content"], name, { type });
}

async function uploadFile(file: File, options?: { applyAccept?: boolean }) {
  const input = screen.getByLabelText(/browse your files/i);
  await userEvent.upload(input, file, {
    applyAccept: options?.applyAccept ?? true,
  });
}

describe("ImageConverterPanel", () => {
  beforeEach(() => {
    vi.mocked(convertImage).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists an uploaded file with its default target format", async () => {
    render(<ImageConverterPanel />);

    await uploadFile(makeFile("photo.png", "image/png"));

    expect(screen.getByText("photo.png")).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "JPG", selected: true }),
    ).toBeInTheDocument();
  });

  it("skips files that are not PNG, JPG, or SVG and reports the count", async () => {
    render(<ImageConverterPanel />);

    await uploadFile(makeFile("notes.pdf", "application/pdf"), {
      applyAccept: false,
    });

    expect(await screen.findByText(/1 file was skipped/i)).toBeInTheDocument();
    expect(screen.queryByText("notes.pdf")).not.toBeInTheDocument();
  });

  it("converts a file and shows a download link on success", async () => {
    const blob = new Blob(["converted"], { type: "image/jpeg" });
    vi.mocked(convertImage).mockResolvedValue(blob);

    render(<ImageConverterPanel />);
    await uploadFile(makeFile("photo.png", "image/png"));

    await userEvent.click(screen.getByRole("button", { name: "Convert" }));

    const downloadLink = await screen.findByRole("link", { name: /download/i });
    expect(downloadLink).toHaveAttribute("download", "photo.jpg");
  });

  it("shows an error and a retry option when conversion fails", async () => {
    vi.mocked(convertImage).mockRejectedValue(
      new Error("The canvas exploded."),
    );

    render(<ImageConverterPanel />);
    await uploadFile(makeFile("photo.png", "image/png"));

    await userEvent.click(screen.getByRole("button", { name: "Convert" }));

    expect(await screen.findByText("The canvas exploded.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("converts every queued file when 'Convert all' is clicked", async () => {
    const blob = new Blob(["converted"], { type: "image/jpeg" });
    vi.mocked(convertImage).mockResolvedValue(blob);

    render(<ImageConverterPanel />);
    await uploadFile(makeFile("one.png", "image/png"));
    await uploadFile(makeFile("two.png", "image/png"));

    await userEvent.click(screen.getByRole("button", { name: "Convert all" }));

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: /download/i })).toHaveLength(
        2,
      );
    });
    expect(convertImage).toHaveBeenCalledTimes(2);
  });

  it("clears the queue when 'Clear' is clicked", async () => {
    render(<ImageConverterPanel />);
    await uploadFile(makeFile("photo.png", "image/png"));

    expect(screen.getByText("photo.png")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.queryByText("photo.png")).not.toBeInTheDocument();
  });
});
