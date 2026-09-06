export async function exportToPdf(element: HTMLElement, filename: string) {
  const cloned = element.cloneNode(true) as HTMLElement;

  for (const el of cloned.querySelectorAll("*")) {
    (el as HTMLElement).style.color = "#1a1a1a";
    (el as HTMLElement).style.opacity = "1";
    (el as HTMLElement).style.background = "transparent";
  }
  cloned.style.background = "#ffffff";
  cloned.style.border = "none";
  cloned.style.borderRadius = "0";
  cloned.style.padding = "24px";
  cloned.style.maxWidth = "100%";

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${filename}</title>
<style>
  @page { size: letter; margin: 0.5in; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #1a1a1a; background: #fff; margin: 0; padding: 0.5in;
    line-height: 1.6; -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  h1 { font-size: 1.75rem; font-weight: 700; margin: 0.8em 0 0.5em; color: #000; }
  h2 { font-size: 1.35rem; font-weight: 700; margin: 1.2em 0 0.4em; padding-bottom: 0.3em; border-bottom: 1px solid #e5e7eb; color: #111; page-break-after: avoid; }
  h3 { font-size: 1.1rem; font-weight: 600; margin: 1em 0 0.3em; color: #374151; page-break-after: avoid; }
  p { margin: 0.5em 0; line-height: 1.7; color: #1a1a1a; }
  strong { color: #000; }
  ul, ol { margin: 0.5em 0; padding-left: 1.5em; }
  li { margin: 0.25em 0; color: #1a1a1a; }
  blockquote { border-left: 3px solid #7c3aed; padding: 0.5em 1em; margin: 0.6em 0; background: #f5f3ff; border-radius: 0 6px 6px 0; }
  code { color: #dc2626; background: #f3f4f6; padding: 0.1em 0.3em; border-radius: 3px; font-size: 0.9em; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 1em 0; }
  table { border-collapse: collapse; width: 100%; margin: 0.6em 0; font-size: 14px; }
  th, td { border: 1px solid #d1d5db; padding: 6px 10px; text-align: left; color: #1a1a1a; }
  th { background: #f9fafb !important; font-weight: 600; }
  img { max-width: 100%; height: auto; }
  * { color: #1a1a1a !important; }
  a { color: #2563eb !important; }
</style></head><body>${cloned.innerHTML}</body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) return;

  win.onload = () => {
    setTimeout(() => {
      win.print();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, 500);
  };
}
