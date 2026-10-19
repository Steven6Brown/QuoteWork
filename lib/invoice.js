import jsPDF from 'jspdf';
import { fmt, fmtRange } from './rates';

// Matches the CSS custom properties in globals.css (light theme values,
// since PDFs can't read CSS variables)
export const THEME = {
  ink: '#1f2b27',
  inkSoft: '#54615c',
  gold: '#9c7a26',
  stamp: '#a8412c',
  rule: '#c7cec9',
  paper: '#f7f9f6',
};

export const PAYMENT_TERMS = {
  due_on_receipt: { label: 'Due on receipt', days: 0 },
  net15: { label: 'Net 15', days: 15 },
  net30: { label: 'Net 30', days: 30 },
};

// Project invoices are INV-0001, 0002, ...; pay-in-full (management) invoices
// have their own series, MGT-0001, 0002, ..., so both can start at 0001
// without two documents sharing one number.
export function invoiceLabel(number, payInFull) {
  return `${payInFull ? 'MGT' : 'INV'}-${String(number).padStart(4, '0')}`;
}

export function nextInvoiceNumber() {
  let counter = 1;
  try {
    counter = parseInt(localStorage.getItem('invoiceCounter') || '0', 10) + 1;
  } catch {}
  return counter;
}

function hexToRgb(hex) {
  const v = hex.replace('#', '');
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

// Fetches an image from the app's public folder and returns a data URL for
// jsPDF, or null if it can't be loaded (the invoice then prints without it).
export async function loadImageDataUrl(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const BAND = '#0A0D12';       // matches the Aquila Digital logo background
const BAND_GOLD = '#E0AE50';  // the logo's gold, for accents on the dark band
const BAND_SOFT = '#B9C0C7';
const TABLE_HEAD = '#F1F3F0';

/**
 * Builds a jsPDF document for a single invoice. Returns the doc so the
 * caller decides how to persist it (trigger a download, or write it to a
 * chosen folder via the File System Access API).
 */
export function buildInvoicePDF({ business, client, project, lines, finalPrice, depositPct, paymentTerms, invoiceNumber, notes, logo, recurring, payInFull }) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;

  const rgb = (hex) => hexToRgb(hex);
  const fill = (hex) => doc.setFillColor(...rgb(hex));
  const text = (hex) => doc.setTextColor(...rgb(hex));
  const stroke = (hex) => doc.setDrawColor(...rgb(hex));

  // ---- Header band with logo ----
  const bandHeight = 118;
  fill(BAND);
  doc.rect(0, 0, pageWidth, bandHeight, 'F');
  let nameX = margin;
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', 36, 9, 100, 100);
      nameX = 150;
    } catch {}
  }
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  text('#FFFFFF');
  doc.text(business.name || 'Your Business Name', nameX, 54);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  text(BAND_SOFT);
  let cy = 72;
  [business.email, business.phone, business.address].filter(Boolean).forEach((line) => {
    doc.text(line, nameX, cy);
    cy += 13;
  });

  doc.setFont('times', 'bold');
  doc.setFontSize(26);
  text(BAND_GOLD);
  doc.text('INVOICE', pageWidth - margin, 54, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  text('#FFFFFF');
  const invLabel = invoiceLabel(invoiceNumber, payInFull);
  doc.text(invLabel, pageWidth - margin, 74, { align: 'right' });

  // ---- Bill to + invoice details ----
  const today = new Date();
  const terms = PAYMENT_TERMS[paymentTerms] || PAYMENT_TERMS.due_on_receipt;
  const due = new Date(today);
  due.setDate(due.getDate() + terms.days);
  const dateOpts = { year: 'numeric', month: 'short', day: 'numeric' };

  let y = bandHeight + 38;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  text(THEME.inkSoft);
  doc.text('BILL TO', margin, y);
  doc.setFont('times', 'bold');
  doc.setFontSize(15);
  text(THEME.ink);
  doc.text(client || 'Client name', margin, y + 19);
  let leftBottom = y + 19;
  if (project) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    text(THEME.inkSoft);
    doc.text(project, margin, y + 35);
    leftBottom = y + 35;
  }

  const detailRows = [
    ['Issued', today.toLocaleDateString(undefined, dateOpts)],
    ['Due', due.toLocaleDateString(undefined, dateOpts)],
    ['Terms', terms.label],
  ];
  detailRows.forEach(([label, value], i) => {
    const ry = y + i * 16;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    text(THEME.inkSoft);
    doc.text(label.toUpperCase(), pageWidth - margin - 150, ry);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    text(THEME.ink);
    doc.text(value, pageWidth - margin, ry, { align: 'right' });
  });

  y = Math.max(leftBottom, y + 2 * 16) + 34;

  // ---- Line items table ----
  fill(TABLE_HEAD);
  doc.rect(margin, y, contentWidth, 26, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  text(THEME.inkSoft);
  doc.text('DESCRIPTION', margin + 12, y + 17);
  doc.text('AMOUNT', pageWidth - margin - 12, y + 17, { align: 'right' });
  y += 26;

  stroke(THEME.rule);
  doc.setLineWidth(0.5);
  lines.forEach((l) => {
    const wrapped = doc.splitTextToSize(l.invoiceLabel || l.label, contentWidth - 150);
    const rowHeight = Math.max(32, 18 + wrapped.length * 13);
    if (y + rowHeight > pageHeight - 220) { doc.addPage(); y = 64; }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    text(THEME.ink);
    doc.text(wrapped, margin + 12, y + 20);
    const priceText = fmtRange(l.low, l.high);
    text(l.high < 0 && l.low < 0 ? THEME.stamp : THEME.ink);
    doc.text(priceText, pageWidth - margin - 12, y + 20, { align: 'right' });
    y += rowHeight;
    doc.line(margin, y, pageWidth - margin, y);
  });

  // ---- Totals ----
  if (y > pageHeight - 250) { doc.addPage(); y = 64; }
  y += 22;
  const depositAmt = finalPrice * (depositPct / 100);
  const balanceAmt = finalPrice - depositAmt;
  const boxW = 270;
  const boxX = pageWidth - margin - boxW;

  fill(BAND);
  doc.rect(boxX, y, boxW, 46, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  text(BAND_SOFT);
  doc.text('TOTAL DUE', boxX + 16, y + 28);
  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  text(BAND_GOLD);
  doc.text(fmt(finalPrice), boxX + boxW - 16, y + 31, { align: 'right' });
  y += 46;

  if (payInFull) {
    // Single-payment invoice (e.g. annual management): no deposit/balance split
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    text(THEME.inkSoft);
    doc.text(`Payment due in full: ${due.toLocaleDateString(undefined, dateOpts)}`, boxX + boxW - 16, y + 24, { align: 'right' });
    y += 50;
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    text(THEME.ink);
    doc.text(`Deposit due to start (${depositPct}%)`, boxX + 16, y + 26);
    doc.text(fmt(depositAmt), boxX + boxW - 16, y + 26, { align: 'right' });
    stroke(THEME.rule);
    doc.line(boxX, y + 38, boxX + boxW, y + 38);
    doc.setFont('helvetica', 'normal');
    text(THEME.inkSoft);
    doc.text('Balance due on completion', boxX + 16, y + 58);
    doc.text(fmt(balanceAmt), boxX + boxW - 16, y + 58, { align: 'right' });
    y += 84;
  }

  // ---- Optional recurring management note ----
  if (recurring) {
    const wrappedRec = doc.splitTextToSize(recurring, contentWidth - 32);
    const recH = 20 + wrappedRec.length * 13;
    fill('#F8F3E6');
    doc.rect(margin, y, contentWidth, recH, 'F');
    fill(BAND_GOLD);
    doc.rect(margin, y, 4, recH, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    text(THEME.ink);
    doc.text(wrappedRec, margin + 18, y + 17);
    y += recH + 20;
  }

  // ---- Notes ----
  if (notes) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    text(THEME.inkSoft);
    const wrappedNotes = doc.splitTextToSize(notes, contentWidth);
    doc.text(wrappedNotes, margin, y + 8);
  }

  // ---- Footer on every page ----
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    stroke(THEME.rule);
    doc.setLineWidth(0.75);
    doc.line(margin, pageHeight - 52, pageWidth - margin, pageHeight - 52);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    text(THEME.inkSoft);
    doc.text([business.name, business.email].filter(Boolean).join('  ·  '), margin, pageHeight - 36);
    doc.text(`${invLabel}  ·  Page ${p} of ${pageCount}`, pageWidth - margin, pageHeight - 36, { align: 'right' });
  }

  return doc;
}

export function invoiceFilename({ client, project, invoiceNumber, payInFull }) {
  const safe = (s) => (s || '').replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '');
  const parts = [invoiceLabel(invoiceNumber, payInFull), safe(client) || 'client', safe(project)].filter(Boolean);
  return parts.join('_') + '.pdf';
}

/**
 * Saves a PDF Blob either into a previously chosen directory (File System
 * Access API — Chrome/Edge only) or via a normal browser download.
 */
// Tries the local save route, which writes into the folder set in .env.local
// for this invoice type. Returns { savedTo: 'configured', folder } or null.
async function saveToConfiguredFolder(doc, filename, kind) {
  try {
    const res = await fetch(`/api/save-invoice?type=${kind}&filename=${encodeURIComponent(filename)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/pdf' },
      body: doc.output('arraybuffer'),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.saved ? { savedTo: 'configured', folder: data.folder } : null;
  } catch {
    return null;
  }
}

export async function savePdf(doc, filename, folderHandle, kind = 'project') {
  const configured = await saveToConfiguredFolder(doc, filename, kind);
  if (configured) return configured;

  if (folderHandle) {
    try {
      const fileHandle = await folderHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(doc.output('blob'));
      await writable.close();
      return { savedTo: 'folder' };
    } catch (err) {
      // Fall through to normal download if folder write fails (e.g. permission revoked)
    }
  }
  doc.save(filename);
  return { savedTo: 'download' };
}

/**
 * Attempts to delete an invoice file from the previously chosen folder.
 * Only possible if the person used "Choose invoices folder" (Chrome/Edge)
 * and the invoice was saved there rather than downloaded normally.
 * Returns true if the file was actually removed from disk.
 */
export async function deleteInvoiceFile(folderHandle, filename) {
  if (!folderHandle) return false;
  try {
    await folderHandle.removeEntry(filename);
    return true;
  } catch (err) {
    return false;
  }
}
