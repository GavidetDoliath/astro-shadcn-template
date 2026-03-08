export async function exportToPdf(journalTitle: string, issueNumber?: number): Promise<void> {
  const { default: html2canvas } = await import('html2canvas');
  const { jsPDF } = await import('jspdf');

  const pages = window.document.querySelectorAll<HTMLElement>('[data-pdf-page]');
  if (!pages.length) {
    window.alert('Aucune page à exporter.');
    return;
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const canvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
  }

  const filename = issueNumber ? `BAT-n${issueNumber}.pdf` : `${journalTitle.replace(/\s+/g, '-').toLowerCase()}.pdf`;
  pdf.save(filename);
}
