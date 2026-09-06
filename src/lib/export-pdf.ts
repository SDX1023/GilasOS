import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportToPdf(element: HTMLElement, filename: string) {
  const origBg = element.style.background;
  const origBorder = element.style.border;
  const origBorderRadius = element.style.borderRadius;

  element.style.background = "#ffffff";
  element.style.border = "none";
  element.style.borderRadius = "0";
  element.style.padding = "24px";

  const pdfStyle = document.createElement("style");
  pdfStyle.id = "pdf-export-style";
  pdfStyle.textContent = `
    .markdown-viewer * { color: #1a1a1a !important; }
    .markdown-viewer h1 { color: #000000 !important; border-bottom-color: #e5e7eb !important; }
    .markdown-viewer h2 { color: #111827 !important; border-bottom-color: #e5e7eb !important; }
    .markdown-viewer h3 { color: #374151 !important; }
    .markdown-viewer a { color: #2563eb !important; }
    .markdown-viewer code { color: #dc2626 !important; background: #f3f4f6 !important; }
    .markdown-viewer blockquote { border-left-color: #7c3aed !important; background: #f5f3ff !important; }
    .markdown-viewer th, .markdown-viewer td { border-color: #d1d5db !important; }
    .markdown-viewer th { background: #f9fafb !important; }
    .markdown-viewer hr { border-top-color: #e5e7eb !important; }
  `;
  document.head.appendChild(pdfStyle);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  element.style.background = origBg;
  element.style.border = origBorder;
  element.style.borderRadius = origBorderRadius;
  pdfStyle.remove();

  const imgWidth = 215.9; // Letter width in mm (8.5")
  const pageHeight = 279.4; // Letter height in mm (11")
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "letter");
  let position = 0;
  let remainingHeight = imgHeight;

  // First page
  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  remainingHeight -= pageHeight;

  // Add more pages if content overflows
  while (remainingHeight > 0) {
    position = -(pageHeight * (Math.ceil(imgHeight / pageHeight) - Math.ceil(remainingHeight / pageHeight)));
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    remainingHeight -= pageHeight;
  }

  pdf.save(`${filename}.pdf`);
}
