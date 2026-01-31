import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

const qrDir = path.join(__dirname, '../../../qrcodes');

export async function generateAndSaveQR(qrCode: string): Promise<string> {
  if (!fs.existsSync(qrDir)) {
    fs.mkdirSync(qrDir, { recursive: true });
  }
  const qrPath = path.join(qrDir, `${qrCode}.png`);
  await QRCode.toFile(qrPath, qrCode);
  return qrPath;
}

export function deleteQR(qrCode: string): void {
  const qrPath = path.join(qrDir, `${qrCode}.png`);
  if (fs.existsSync(qrPath)) {
    fs.unlinkSync(qrPath);
  }
}

export function getQRRelativePath(qrCode: string): string {
  return `/qrcodes/${qrCode}.png`;
}
