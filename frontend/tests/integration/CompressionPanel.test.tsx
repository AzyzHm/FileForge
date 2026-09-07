import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompressionPanel } from "../../src/components/CompressionPanel";

vi.mock("../../src/services/compressionService", async () => {
  const actual = await vi.importActual<
    typeof import("../../src/services/compressionService")
  >("../../src/services/compressionService");
  return {
    ...actual,
    compressImage: vi.fn(),
  };
});

import { compressImage } from "../../src/services/compressionService";

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

describe("CompressionPanel", () => {
  beforeEach(() => {
    vi.mocked(compressImage).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists an uploaded file with the balanced level selected by default", async () => {
    render(<CompressionPanel />);

    await uploadFile(makeFile("photo.png", "image/png"));

    expect(screen.getByText("photo.png")).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Balanced", selected: true }),
    ).toBeInTheDocument();
  });

  it("skips files that are not PNG or JPG and reports the count", async () => {
    render(<CompressionPanel />);

    await uploadFile(makeFile("icon.svg", "image/svg+xml"), {
      applyAccept: false,
    });

    expect(await screen.findByText(/1 file was skipped/i)).toBeInTheDocument();
    expect(screen.queryByText("icon.svg")).not.toBeInTheDocument();
  });

  it("compresses a file and shows a download link with the size reduction", async () => {
    const compressed = makeFile("photo.png", "image/png", 512);
    vi.mocked(compressImage).mockResolvedValue(compressed);

    render(<CompressionPanel />);
    await uploadFile(makeFile("photo.png", "image/png", 2048));

    await userEvent.click(screen.getByRole("button", { name: "Compress" }));

    const downloadLink = await screen.findByRole("link", { name: /download/i });
    expect(downloadLink).toHaveAttribute("download", "photo-compressed.png");
    expect(screen.getByText(/75% smaller/i)).toBeInTheDocument();
  });

  it("shows an error and a retry option when compression fails", async () => {
    vi.mocked(compressImage).mockRejectedValue(
      new Error("The file could not be compressed."),
    );

    render(<CompressionPanel />);
    await uploadFile(makeFile("photo.jpg", "image/jpeg"));

    await userEvent.click(screen.getByRole("button", { name: "Compress" }));

    expect(
      await screen.findByText("The file could not be compressed."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("compresses every queued file when 'Compress all' is clicked", async () => {
    const compressed = makeFile("photo.png", "image/png", 512);
    vi.mocked(compressImage).mockResolvedValue(compressed);

    render(<CompressionPanel />);
    await uploadFile(makeFile("one.png", "image/png"));
    await uploadFile(makeFile("two.png", "image/png"));

    await userEvent.click(screen.getByRole("button", { name: "Compress all" }));

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: /download/i })).toHaveLength(
        2,
      );
    });
    expect(compressImage).toHaveBeenCalledTimes(2);
  });

  it("clears the queue when 'Clear' is clicked", async () => {
    render(<CompressionPanel />);
    await uploadFile(makeFile("photo.png", "image/png"));

    expect(screen.getByText("photo.png")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.queryByText("photo.png")).not.toBeInTheDocument();
  });
});
