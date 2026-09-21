function escapePdf(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function ascii(text: string): string {
  return text.replace(/[^\x20-\x7E]/g, '?');
}

export function buildSimplePdf(title: string, lines: string[]): Blob {
  const wrapped: string[] = [];
  for (const line of lines) {
    const clean = ascii(line);
    if (!clean) {
      wrapped.push(' ');
      continue;
    }
    for (let i = 0; i < clean.length; i += 92) wrapped.push(clean.slice(i, i + 92));
  }

  const content = [
    'BT',
    '/F1 14 Tf',
    '50 760 Td',
    '14 TL',
    `(${escapePdf(ascii(title))}) Tj`,
    'T*',
    '/F1 9 Tf',
    '11 TL',
    ...wrapped.slice(0, 58).map((line) => `(${escapePdf(line)}) Tj T*`),
    'ET',
  ].join('\n');

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
    `4 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Courier >> endobj',
  ];

  let body = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (const obj of objects) {
    offsets.push(body.length);
    body += `${obj}\n`;
  }
  const xrefStart = body.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    xref += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  body += xref;
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new Blob([body], { type: 'application/pdf' });
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
