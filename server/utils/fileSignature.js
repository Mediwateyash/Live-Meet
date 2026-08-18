import fs from 'fs';

export function validateFileMagicBytes(filePath) {
  try {
    const buffer = Buffer.alloc(8);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    const hex = buffer.toString('hex').toUpperCase();

    // JPEG: starts with FF D8 FF (FFD8FF)
    if (hex.startsWith('FFD8FF')) {
      return 'jpeg';
    }
    // PNG: starts with 89 50 4E 47 0D 0A 1A 0A (89504E47)
    if (hex.startsWith('89504E47')) {
      return 'png';
    }
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

    // Fallback for TXT: check if it only contains printable text and no script tags
    const content = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' }).substring(0, 1000);
    // Reject HTML/JavaScript script tag injections
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('<script') || lowerContent.includes('javascript:') || lowerContent.includes('onload=') || lowerContent.includes('onerror=')) {
      return null;
    }
    // Reject binary content
    if (!content.includes('\0')) {
      const isAllPrintable = /^[\x20-\x7E\r\n\t]*$/.test(content);
      // Fallback fallback: if it's reasonably plain text
      if (isAllPrintable || !/[^\x09\x0A\x0D\x20-\x7E\x80-\xFF]/.test(content)) {
        return 'txt';
      }
    }
  } catch (error) {
    console.error('[validateFileMagicBytes] Error:', error);
  }
  return null;
}
