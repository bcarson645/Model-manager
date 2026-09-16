function reportFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `player-mod-reports-${date}.pdf`;
}

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
/** 210mm at 96dpi — fixed capture width so html2canvas matches A4. */
const CAPTURE_WIDTH_PX = 794;

function addImageWithPageBreaks(
  pdf: import("jspdf").jsPDF,
  imgData: string,
  imgWidth: number,
  imgHeight: number,
  margin: number
): void {
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageContentHeight = pageHeight - margin * 2;
  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
  heightLeft -= pageContentHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
    heightLeft -= pageContentHeight;
  }
}

function preparePageForCapture(pageEl: HTMLElement): void {
  pageEl.style.width = `${A4_WIDTH_MM}mm`;
  pageEl.style.maxWidth = `${A4_WIDTH_MM}mm`;
  pageEl.style.minWidth = `${A4_WIDTH_MM}mm`;
  pageEl.style.boxSizing = "border-box";
  pageEl.style.padding = "10mm";
  pageEl.style.marginBottom = "0";
  pageEl.style.minHeight = "0";
}

export async function downloadReportsPdf(
  root: HTMLElement,
  filename = reportFilename()
): Promise<void> {
  const [{ jsPDF }, html2canvasModule] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);
  const html2canvas = html2canvasModule.default;

  const pages = root.querySelectorAll<HTMLElement>(".report-page");
  if (pages.length === 0) return;

  const margin = 10;
  const contentWidth = A4_WIDTH_MM - margin * 2;

  let pdf: import("jspdf").jsPDF | null = null;

  for (let i = 0; i < pages.length; i++) {
    const pageEl = pages[i]!;
    preparePageForCapture(pageEl);
    const scrollHeight = pageEl.scrollHeight;

    const canvas = await html2canvas(pageEl, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
      width: CAPTURE_WIDTH_PX,
      windowWidth: CAPTURE_WIDTH_PX,
      height: scrollHeight,
      windowHeight: scrollHeight,
      onclone: (_doc, el) => {
        preparePageForCapture(el as HTMLElement);
      },
    });

    const imgData = canvas.toDataURL("image/png");
    const imgHeight = (canvas.height * contentWidth) / canvas.width;

    if (!pdf) {
      pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    } else {
      pdf.addPage();
    }
    addImageWithPageBreaks(pdf, imgData, contentWidth, imgHeight, margin);
  }

  pdf!.save(filename);
}
