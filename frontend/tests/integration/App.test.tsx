import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App";

describe("App", () => {
  it("shows the image converter by default", () => {
    render(<App />);
    expect(
      screen.getByText(/convert images between png, jpg, and svg/i),
    ).toBeInTheDocument();
  });

  it("switches to the compress images panel", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("tab", { name: "Compress" }));
    expect(
      screen.getByText(/drag images here to compress/i),
    ).toBeInTheDocument();
  });

  it("switches to the remove background panel", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("tab", { name: "Remove BG" }));
    expect(
      screen.getByText(/drag photos here to remove the background/i),
    ).toBeInTheDocument();
  });

  it("switches to the merge PDFs panel", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("tab", { name: "Merge PDFs" }));
    expect(screen.getByText(/drag pdfs here/i)).toBeInTheDocument();
  });

  it("switches to the split PDF panel", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("tab", { name: "Split PDF" }));
    expect(screen.getByText(/drag a pdf here/i)).toBeInTheDocument();
  });

  it("switches to the word to pdf panel", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("tab", { name: "Word to PDF" }));
    expect(screen.getByText(/drag word documents here/i)).toBeInTheDocument();
  });

  it("switches to the pdf to word panel", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("tab", { name: "PDF to Word" }));
    expect(screen.getByText(/drag pdf files here/i)).toBeInTheDocument();
  });

  it("switches to the compress pdf panel", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("tab", { name: "Compress PDF" }));
    expect(screen.getByText(/drag pdf files here/i)).toBeInTheDocument();
  });
});
