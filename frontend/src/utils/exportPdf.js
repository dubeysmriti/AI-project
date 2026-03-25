import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportElementAsPdf({ element, filename = "analysis.pdf" }) {
  if (!element) throw new Error("exportElementAsPdf: missing element");

  // html2canvas works best if we render at higher scale for readability.
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#0b1220",
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "p",
    unit: "px",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgProps = pdf.getImageProperties(imgData);
  const imgWidth = imgProps.width;
  const imgHeight = imgProps.height;

  // Fit image to A4 while preserving aspect ratio.
  const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
  const renderWidth = imgWidth * ratio;
  const renderHeight = imgHeight * ratio;

  const x = (pageWidth - renderWidth) / 2;
  const y = 10;

  pdf.addImage(imgData, "PNG", x, y, renderWidth, renderHeight);
  pdf.save(filename);
}

