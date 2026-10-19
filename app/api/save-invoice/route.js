import { promises as fs } from 'fs';
import path from 'path';

// Local-only: writes an invoice PDF into a folder configured in .env.local.
// Only works when the app runs on this machine (localhost); anywhere else, or
// with no folders configured, it returns an error and the app falls back to a
// normal browser download.
const FOLDERS = {
  project: () => process.env.INVOICE_DIR_PROJECT,
  management: () => process.env.INVOICE_DIR_MANAGEMENT,
};
const SAFE_FILENAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,150}\.pdf$/;
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request) {
  const host = (request.headers.get('host') || '').split(':')[0];
  if (host !== 'localhost' && host !== '127.0.0.1') {
    return Response.json({ error: 'Local saving is only available on localhost.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const filename = searchParams.get('filename') || '';
  const getDir = FOLDERS[type];
  const dir = getDir ? getDir() : '';

  if (!dir) return Response.json({ error: 'No folder configured for this invoice type.' }, { status: 501 });
  if (!SAFE_FILENAME.test(filename)) return Response.json({ error: 'Invalid filename.' }, { status: 400 });

  const body = Buffer.from(await request.arrayBuffer());
  if (body.length === 0 || body.length > MAX_BYTES) return Response.json({ error: 'Invalid file size.' }, { status: 400 });
  if (body.subarray(0, 5).toString() !== '%PDF-') return Response.json({ error: 'Not a PDF.' }, { status: 400 });

  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), body);
    return Response.json({ saved: true, folder: path.basename(dir) });
  } catch {
    return Response.json({ error: 'Could not write to the configured folder.' }, { status: 500 });
  }
}
