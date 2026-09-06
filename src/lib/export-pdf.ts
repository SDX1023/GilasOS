import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function forceDarkText(root: HTMLElement) {
  const all = root.querySelectorAll("*");
  for (const el of all) {
    const s = el as HTMLElement;
    s.style.color = "#1a1a1a";
    s.style.opacity = "1";
    if (s.tagName === "SPAN" && s.style.color) {
      s.style.color = "#1a1a1a";
    }
  }
}

function restoreElements(root: HTMLElement, snapshots: Map<HTMLElement, string>) {
  for (const [el, orig] of snapshots) {
    el.style.color = orig || "";
    el.style.opacity = "";
  }
}

export async function exportToPdf(element: HTMLElement, filename: string) {
  const margin = 12.7; // 0.5 inch in mm

  const origBg = element.style.background;
  const origBorder = element.style.border;
  const origBorderRadius = element.style.borderRadius;
  const origPadding = element.style.padding;
  const origMaxWidth = element.style.maxWidth;

  element.style.background = "#ffffff";
  element.style.border = "none";
  element.style.borderRadius = "0";
  element.style.padding = "0";
  element.style.maxWidth = "100%";

  const snapshots = new Map<HTMLElement, string>();
  const allEls = element.querySelectorAll("*");
  for (const el of allEls) {
    const s = el as HTMLElement;
    snapshots.set(s, s.style.color);
  }
  forceDarkText(element);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  element.style.background = origBg;
  element.style.border = origBorder;
  element.style.borderRadius = origBorderRadius;
  element.style.padding = origPadding;
  element.style.maxWidth = origMaxWidth;
  restoreElements(element, snapshots);

  const contentWidth = 215.9 - margin * 2; // usable width inside margins
  const pageHeight = 279.4 - margin * 2;   // usable height inside margins
  const imgHeight = (canvas.height * contentWidth) / canvas.width;
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "letter");
  let position = margin;
  let remainingHeight = imgHeight;

  pdf.addImage(imgData, "PNG", margin, margin, contentWidth, imgHeight);
  remainingHeight -= pageHeight;

  while (remainingHeight > 0) {
    position = margin - (pageHeight * (Math.ceil(imgHeight / pageHeight) - Math.ceil(remainingHeight / pageHeight)));
    pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, position, contentWidth, imgHeight);
    remainingHeight -= pageHeight;
  }

  pdf.save(`${filename}.pdf`);
}
