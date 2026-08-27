import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportToPdf(element: HTMLElement, filename: string) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");
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
