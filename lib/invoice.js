import jsPDF from 'jspdf';
import { fmt } from './rates';

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

/**
 * Builds a jsPDF document for a single invoice. Returns the doc so the
 * caller decides how to persist it (trigger a download, or write it to a
 * chosen folder via the File System Access API).
 */
export function buildInvoicePDF({ business, client, project, lines, finalPrice, depositPct, paymentTerms, invoiceNumber, notes }) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 56;
  let y = 64;

  const [inkR, inkG, inkB] = hexToRgb(THEME.ink);
  const [softR, softG, softB] = hexToRgb(THEME.inkSoft);
  const [goldR, goldG, goldB] = hexToRgb(THEME.gold);
  const [ruleR, ruleG, ruleB] = hexToRgb(THEME.rule);

  // Business name / header
  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(inkR, inkG, inkB);
  doc.text(business.name || 'Your Business Name', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(softR, softG, softB);
  let contactY = y + 16;
  [business.email, business.phone, business.address].filter(Boolean).forEach((line) => {
    doc.text(line, margin, contactY);
    contactY += 12;
  });

  // INVOICE label, top right
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(goldR, goldG, goldB);
  doc.text('INVOICE', pageWidth - margin, y, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(softR, softG, softB);
  const invLabel = `INV-${String(invoiceNumber).padStart(4, '0')}`;
  const today = new Date();
  const terms = PAYMENT_TERMS[paymentTerms] || PAYMENT_TERMS.due_on_receipt;
  const due = new Date(today);
  due.setDate(due.getDate() + terms.days);
  doc.text(invLabel, pageWidth - margin, y + 16, { align: 'right' });
  doc.text(`Issued: ${today.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`, pageWidth - margin, y + 28, { align: 'right' });
  doc.text(`Due: ${due.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} (${terms.label})`, pageWidth - margin, y + 40, { align: 'right' });

  y = Math.max(contactY, y + 52) + 20;

  // Rule
  doc.setDrawColor(ruleR, ruleG, ruleB);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  // Bill To
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(softR, softG, softB);
  doc.text('BILL TO', margin, y);
  y += 16;
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(inkR, inkG, inkB);
  doc.text(client || 'Client name', margin, y);
  if (project) {
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(softR, softG, softB);
    doc.text(project, margin, y);
  }
  y += 32;

  // Line items table header
  doc.setDrawColor(inkR, inkG, inkB);
  doc.setLineWidth(1.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(softR, softG, softB);
  doc.text('DESCRIPTION', margin, y);
  doc.text('AMOUNT', pageWidth - margin, y, { align: 'right' });
  y += 10;
  doc.setDrawColor(ruleR, ruleG, ruleB);
  doc.setLineWidth(0.75);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  lines.forEach((l) => {
    if (y > 680) { doc.addPage(); y = 64; }
    doc.setTextColor(inkR, inkG, inkB);
    doc.text(l.label, margin, y);
    const priceText = l.low === l.high ? fmt(l.low) : `${fmt(l.low)}\u2013${fmt(l.high)}`;
    doc.text(priceText, pageWidth - margin, y, { align: 'right' });
    y += 8;
    doc.setDrawColor(ruleR, ruleG, ruleB);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;
  });

  y += 8;
  doc.setDrawColor(inkR, inkG, inkB);
  doc.setLineWidth(1.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 26;

  // Totals block
  const depositAmt = finalPrice * (depositPct / 100);
  const balanceAmt = finalPrice - depositAmt;

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(inkR, inkG, inkB);
  doc.text('Total due', margin, y);
  doc.text(fmt(finalPrice), pageWidth - margin, y, { align: 'right' });
  y += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(softR, softG, softB);
  doc.text(`Deposit due to start (${depositPct}%)`, margin, y);
  doc.text(fmt(depositAmt), pageWidth - margin, y, { align: 'right' });
  y += 16;
  doc.text('Balance due on completion', margin, y);
  doc.text(fmt(balanceAmt), pageWidth - margin, y, { align: 'right' });
  y += 36;

  // Notes / footer
  if (notes) {
    doc.setDrawColor(ruleR, ruleG, ruleB);
    doc.setLineWidth(0.75);
    doc.line(margin, y, pageWidth - margin, y);
    y += 20;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(softR, softG, softB);
    const wrapped = doc.splitTextToSize(notes, pageWidth - margin * 2);
    doc.text(wrapped, margin, y);
  }

  return doc;
}

export function invoiceFilename({ client, project, invoiceNumber }) {
  const safe = (s) => (s || '').replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '');
  const parts = ['INV-' + String(invoiceNumber).padStart(4, '0'), safe(client) || 'client', safe(project)].filter(Boolean);
  return parts.join('_') + '.pdf';
}

/**
 * Saves a PDF Blob either into a previously chosen directory (File System
 * Access API — Chrome/Edge only) or via a normal browser download.
 */
export async function savePdf(doc, filename, folderHandle) {
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
