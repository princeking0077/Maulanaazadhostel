import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Export a DOM element's visual contents to a PDF offline (no server required)
// element: the DOM node to capture (e.g. ref.current)
// filename: desired PDF filename without extension
export async function exportElementToPDF(element: HTMLElement, filename: string) {
  if (!element) return;
  // Ensure element is visible for capture
  const originalOverflow = element.style.overflow;
  element.style.overflow = 'visible';
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 40; // margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const y = 20;
    if (imgHeight < pageHeight - 40) {
      pdf.addImage(imgData, 'PNG', 20, y, imgWidth, imgHeight, undefined, 'FAST');
    } else {
      // Split into pages if content taller than one page
      let remainingHeight = imgHeight;
      let position = 0;
      while (remainingHeight > 0) {
        pdf.addImage(imgData, 'PNG', 20, 20 - position, imgWidth, imgHeight, undefined, 'FAST');
        remainingHeight -= pageHeight;
        position += pageHeight;
        if (remainingHeight > 0) pdf.addPage();
      }
    }

    pdf.save(`${filename}.pdf`);
  } catch (err) {
    console.error('PDF export failed', err);
  } finally {
    element.style.overflow = originalOverflow;
  }
}

// Convenience helper: pass a ref.current or querySelector string
export async function exportBySelectorToPDF(selector: string, filename: string) {
  const element = document.querySelector(selector) as HTMLElement | null;
  if (!element) {
    console.warn('PDF export: selector not found', selector);
    return;
  }
  await exportElementToPDF(element, filename);
}