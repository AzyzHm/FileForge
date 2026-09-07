import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BackgroundRemovalPanel } from "../../src/components/BackgroundRemovalPanel";

vi.mock("../../src/services/backgroundRemovalService", async () => {
  const actual = await vi.importActual<
    typeof import("../../src/services/backgroundRemovalService")
  >("../../src/services/backgroundRemovalService");
  return {
    ...actual,
    removeImageBackground: vi.fn(),
  };
});

import { removeImageBackground } from "../../src/services/backgroundRemovalService";

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

describe("BackgroundRemovalPanel", () => {
  beforeEach(() => {
    vi.mocked(removeImageBackground).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists an uploaded photo", async () => {
    render(<BackgroundRemovalPanel />);

    await uploadFile(makeFile("photo.png", "image/png"));

    expect(screen.getByText("photo.png")).toBeInTheDocument();
  });

  it("skips files that are not PNG, JPG, or WEBP and reports the count", async () => {
    render(<BackgroundRemovalPanel />);

    await uploadFile(makeFile("icon.svg", "image/svg+xml"), {
      applyAccept: false,
    });

    expect(await screen.findByText(/1 file was skipped/i)).toBeInTheDocument();
    expect(screen.queryByText("icon.svg")).not.toBeInTheDocument();
  });

  it("removes the background and shows a download link", async () => {
    const cutout = makeFile("photo-no-bg.png", "image/png", 512);
    vi.mocked(removeImageBackground).mockResolvedValue(cutout);

    render(<BackgroundRemovalPanel />);
    await uploadFile(makeFile("photo.png", "image/png"));

    await userEvent.click(
      screen.getByRole("button", { name: "Remove background" }),
    );

    const downloadLink = await screen.findByRole("link", { name: /download/i });
    expect(downloadLink).toHaveAttribute("download", "photo-no-bg.png");
  });

  it("shows an error and a retry option when processing fails", async () => {
    vi.mocked(removeImageBackground).mockRejectedValue(
      new Error("The file could not be processed."),
    );

    render(<BackgroundRemovalPanel />);
    await uploadFile(makeFile("photo.jpg", "image/jpeg"));

    await userEvent.click(
      screen.getByRole("button", { name: "Remove background" }),
    );

    expect(
      await screen.findByText("The file could not be processed."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("processes every queued file when 'Remove all backgrounds' is clicked", async () => {
    const cutout = makeFile("photo-no-bg.png", "image/png", 512);
    vi.mocked(removeImageBackground).mockResolvedValue(cutout);

    render(<BackgroundRemovalPanel />);
    await uploadFile(makeFile("one.png", "image/png"));
    await uploadFile(makeFile("two.png", "image/png"));

    await userEvent.click(
      screen.getByRole("button", { name: "Remove all backgrounds" }),
    );

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: /download/i })).toHaveLength(
        2,
      );
    });
    expect(removeImageBackground).toHaveBeenCalledTimes(2);
  });

  it("clears the queue when 'Clear' is clicked", async () => {
    render(<BackgroundRemovalPanel />);
    await uploadFile(makeFile("photo.png", "image/png"));

    expect(screen.getByText("photo.png")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.queryByText("photo.png")).not.toBeInTheDocument();
  });
});
