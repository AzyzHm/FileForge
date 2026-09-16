import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";

describe("App", () => {
  it("shows the image converter by default", async () => {
    render(<App />);
    expect(
      await screen.findByText(/drag images here, or/i),
    ).toBeInTheDocument();
  });

  it("does not open the tools menu on load", () => {
    render(<App />);
    expect(
      screen.getByRole("button", { name: "Open tools menu" }),
    ).toBeInTheDocument();
  });

  it("switches to the compress images panel", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("tab", { name: "Compress" }));
    expect(
      await screen.findByText(/drag images here to compress/i),
    ).toBeInTheDocument();
  });

  it("switches to the remove background panel", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("tab", { name: "Remove BG" }));
    expect(
      await screen.findByText(/drag photos here to remove the background/i),
    ).toBeInTheDocument();
  });

  it("switches to the merge PDFs panel", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("tab", { name: "Merge PDFs" }));
    expect(await screen.findByText(/drag pdfs here/i)).toBeInTheDocument();
  });

  it("switches to the split PDF panel", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("tab", { name: "Split PDF" }));
    expect(await screen.findByText(/drag a pdf here/i)).toBeInTheDocument();
  });

  it("switches to the word to pdf panel", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("tab", { name: "Word to PDF" }));
    expect(
      await screen.findByText(/drag word documents here/i),
    ).toBeInTheDocument();
  });

  it("switches to the pdf to word panel", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("tab", { name: "PDF to Word" }));
    expect(await screen.findByText(/drag pdf files here/i)).toBeInTheDocument();
  });

  it("switches to the compress pdf panel", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("tab", { name: "Compress PDF" }));
    expect(await screen.findByText(/drag pdf files here/i)).toBeInTheDocument();
  });
});
