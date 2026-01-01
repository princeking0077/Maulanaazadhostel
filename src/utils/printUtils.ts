export function openPrintWindow(html: string, title: string = 'Print') {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>
    body { font-family: 'Segoe UI', Arial; padding: 16px; }
    @media print { .no-print { display:none; } }
  </style></head><body>`);
  win.document.write('<div class="print-container">' + html + '</div>');
  win.document.write('<button class="no-print" onclick="window.print()" style="margin-bottom:16px;">Print</button>');
  win.document.write('</body></html>');
  win.document.close();
}
