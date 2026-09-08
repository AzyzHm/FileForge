import type { WordToPdfResult } from "../types/wordToPdf";

const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const STYLE_MAP = [
  "p[style-name='Title'] => h1.doc-title:fresh",
  "p[style-name='Subtitle'] => h2.doc-subtitle:fresh",
  "p[style-name='Heading 7'] => h6:fresh",
  "p[style-name='Heading 8'] => h6:fresh",
  "p[style-name='Heading 9'] => h6:fresh",
  "p[style-name='Quote'] => blockquote.doc-quote:fresh",
  "p[style-name='Intense Quote'] => blockquote.doc-intense-quote:fresh",
  "p[style-name='Caption'] => p.doc-caption:fresh",
  "p[style-name='List Paragraph'] => p.doc-list-paragraph:fresh",
  "r[style-name='Strong'] => strong",
  "r[style-name='Emphasis'] => em",
  "r[style-name='Intense Emphasis'] => strong > em",
  "r[style-name='Subtle Emphasis'] => em.doc-subtle",
  "r[style-name='Book Title'] => cite",
  "r[style-name='Intense Reference'] => strong.doc-intense-reference",
  "r[style-name='Subtle Reference'] => span.doc-subtle-reference",
];

export function isDocxFile(file: File): boolean {
  if (file.type.toLowerCase() === DOCX_MIME_TYPE) {
    return true;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension === "docx";
}

export function buildDocumentTitle(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function convertDocxToHtml(file: File): Promise<WordToPdfResult> {
  if (!isDocxFile(file)) {
    throw new Error(`"${file.name}" is not a .docx file.`);
  }

  try {
    const mammoth = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    const { value, messages } = await mammoth.convertToHtml(
      { arrayBuffer },
      { convertImage: mammoth.images.dataUri, styleMap: STYLE_MAP },
    );

    const warnings = messages
      .filter((message) => message.type === "warning")
      .map((message) => message.message);

    return { html: value, warnings };
  } catch {
    throw new Error(
      `"${file.name}" could not be converted. It may be corrupted or password-protected.`,
    );
  }
}

export function buildPrintDocument(html: string, title: string): string {
  const safeTitle = escapeHtml(title);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${safeTitle}</title>
<style>
  @page { margin: 1in; }
  body {
    font-family: "Calibri", "Segoe UI", Arial, sans-serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #1a1a1a;
    max-width: 8.5in;
    margin: 0 auto;
    padding: 0.5in 0;
  }
  h1, h2, h3, h4, h5, h6 {
    line-height: 1.25;
    margin: 1em 0 0.5em;
  }
  p { margin: 0 0 0.75em; }
  img { max-width: 100%; }
  ul, ol { margin: 0 0 0.75em 1.5em; padding: 0; }
  li { margin-bottom: 0.25em; }
  table {
    border-collapse: collapse;
    width: 100%;
    table-layout: auto;
    margin: 0.5em 0 1em;
  }
  td, th { border: 1px solid #999; padding: 4px 8px; vertical-align: top; }
  th { background: #f1f5f9; text-align: left; }
  .doc-title { font-size: 24pt; margin-top: 0; }
  .doc-subtitle {
    font-size: 14pt;
    font-weight: normal;
    color: #475569;
    margin-top: 0;
  }
  .doc-quote, .doc-intense-quote {
    margin: 0 0 0.75em;
    padding-left: 1em;
    border-left: 3px solid #cbd5e1;
    font-style: italic;
    color: #334155;
  }
  .doc-intense-quote { font-weight: 600; }
  .doc-caption {
    font-size: 10pt;
    color: #64748b;
    text-align: center;
  }
  .doc-list-paragraph { margin: 0 0 0.5em; }
  .doc-subtle { color: #64748b; }
  .doc-intense-reference { font-weight: 600; }
  .doc-subtle-reference { color: #64748b; }
  @media print {
    body { padding: 0; }
  }
</style>
</head>
<body>
${html}
</body>
</html>`;
}

export function openPrintPreview(html: string, title: string): boolean {
  const previewWindow = window.open("", "_blank");

  if (!previewWindow) {
    return false;
  }

  const document = buildPrintDocument(html, title);
  previewWindow.document.open();
  previewWindow.document.write(document);
  previewWindow.document.close();

  previewWindow.onload = () => {
    previewWindow.focus();
    previewWindow.print();
  };

  return true;
}
