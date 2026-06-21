import fs from 'fs';

export function validateFileMagicBytes(filePath) {
  try {
    const buffer = Buffer.alloc(8);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    const hex = buffer.toString('hex').toUpperCase();

    // PDF: starts with %PDF (25 50 44 46)
    if (hex.startsWith('25504446')) {
      return 'pdf';
    }
    // ZIP based formats (DOCX, PPTX): starts with PK\x03\x04 (50 4B 03 04)
    if (hex.startsWith('504B0304')) {
      return 'zip'; // Can be docx or pptx
    }
    // OLE2 formats (DOC, PPT): starts with D0 CF 11 E0 A1 B1 1A E1
    if (hex.startsWith('D0CF11E0A1B11AE1')) {
      return 'ole'; // Can be doc or ppt
    }

    // Fallback for TXT: check if there are no null bytes
    const content = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' }).substring(0, 1000);
    if (!content.includes('\0')) {
      return 'txt';
    }
  } catch (error) {
    console.error('[validateFileMagicBytes] Error:', error);
  }
  return null;
}
