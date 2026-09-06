import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function forceDarkText(root: HTMLElement) {
  const all = root.querySelectorAll("*");
  for (const el of all) {
    const s = el as HTMLElement;
    s.style.color = "#1a1a1a";
    s.style.opacity = "1";
  }
}

function restoreElements(snapshots: Map<HTMLElement, string>) {
  for (const [el, orig] of snapshots) {
    el.style.color = orig || "";
    el.style.opacity = "";
  }
}

export async function exportToPdf(element: HTMLElement, filename: string) {
  const margin = 12.7; // 0.5 inch in mm

  const origStyles = {
    bg: element.style.background,
    border: element.style.border,
    borderRadius: element.style.borderRadius,
    padding: element.style.padding,
    maxWidth: element.style.maxWidth,
  };

  element.style.background = "#ffffff";
  element.style.border = "none";
  element.style.borderRadius = "0";
  element.style.padding = "0";
  element.style.maxWidth = "100%";

  const snapshots = new Map<HTMLElement, string>();
  for (const el of element.querySelectorAll("*")) {
    snapshots.set(el as HTMLElement, (el as HTMLElement).style.color);
  }
  forceDarkText(element);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  Object.assign(element.style, origStyles);
  restoreElements(snapshots);

  const contentWidthMm = 215.9 - margin * 2;
  const contentHeightMm = 279.4 - margin * 2;
  const scale = contentWidthMm / canvas.width;
  const contentHeightPx = contentHeightMm / scale;
  const totalHeightPx = canvas.height;

  const pdf = new jsPDF("p", "mm", "letter");
  let srcY = 0;
  let page = 0;

  while (srcY < totalHeightPx) {
    if (page > 0) pdf.addPage();

    const sliceHeight = Math.min(contentHeightPx, totalHeightPx - srcY);
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceHeight;
    const ctx = sliceCanvas.getContext("2d")!;
    ctx.drawImage(canvas, 0, srcY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

    const sliceData = sliceCanvas.toDataURL("image/png");
    const sliceHeightMm = sliceHeight * scale;
    pdf.addImage(sliceData, "PNG", margin, margin, contentWidthMm, sliceHeightMm);

    srcY += contentHeightPx;
    page++;
  }

  pdf.save(`${filename}.pdf`);
}
