/**
 * NewspaperPdfExport
 * Client-side PDF export using html2canvas + jsPDF
 */

export async function exportNewspaperPdf(
  editionTitle: string,
  format: 'A4' = 'A4'
): Promise<void> {
  try {
    // Dynamically import to reduce bundle size
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    // Get all pages marked with data-pdf-page
    const pages = document.querySelectorAll('[data-pdf-page]');

    if (pages.length === 0) {
      console.error('No pages found to export');
      return;
    }

    // Create PDF (portrait, A4 dimensions in pixels)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [794, 1123], // A4 in pixels
    });

    // Render each page
    for (let i = 0; i < pages.length; i++) {
      const pageElement = pages[i] as HTMLElement;

      // Convert page to canvas
      const canvas = await html2canvas(pageElement, {
        backgroundColor: '#ffffff',
        scale: 2, // High quality
        logging: false,
        useCORS: true,
      });

      // Add to PDF
      const imgData = canvas.toDataURL('image/png');

      if (i > 0) {
        pdf.addPage([794, 1123]);
      }

      pdf.addImage(imgData, 'PNG', 0, 0, 794, 1123);
    }

    // Download
    pdf.save(`${editionTitle}.pdf`);
  } catch (err) {
    console.error('Error exporting PDF:', err);
    throw err;
  }
}
