/**
 * ============================================================
 * PDF Generator Utility
 * ============================================================
 *
 * Generates a downloadable PDF containing the nutrition label.
 *
 * Approach: Zero external dependencies beyond html-to-image
 * (already installed). Uses html-to-image to capture the label
 * as a high-resolution PNG data URL, then builds a minimal
 * valid PDF file manually using the PDF specification.
 *
 * PDF Structure:
 *   A PDF is a text-based format with:
 *   - Header (%PDF-1.4)
 *   - Objects (catalog, pages, page, image resource, content stream)
 *   - Cross-reference table (xref)
 *   - Trailer
 *
 * The label image is embedded as a JPEG (converted from PNG)
 * inside a single A4 page with appropriate margins.
 *
 * This approach:
 *   - Requires no new npm packages
 *   - Produces a valid, downloadable PDF
 *   - Renders at 300 DPI quality (same as PNG export)
 *   - Works in all modern browsers
 *   - Is fully self-contained
 *
 * Reference: PDF 1.4 Reference, Adobe Systems, 2001
 * ============================================================
 */

import * as htmlToImage from 'html-to-image';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface PdfGenerationOptions {
  /** The DOM element to capture (the label element) */
  element: HTMLElement;
  /** Filename for the downloaded PDF (without extension) */
  filename: string;
  /** Page title shown in PDF metadata */
  title?: string;
  /** Scale factor for image capture (default: 2 for 192 DPI) */
  scale?: number;
}

export interface PdfGenerationResult {
  success: boolean;
  error?: string;
}

// ─────────────────────────────────────────────
// PDF Page Dimensions (A4 in points, 1pt = 1/72 inch)
// ─────────────────────────────────────────────

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const MARGIN_PT = 40;

// ─────────────────────────────────────────────
// Core Functions
// ─────────────────────────────────────────────

/**
 * dataUrlToBase64
 *
 * Strips the data URL prefix to get raw base64 image data.
 * html-to-image returns: "data:image/png;base64,<base64data>"
 * We need just the base64 portion for PDF embedding.
 *
 * @param dataUrl - Full data URL string
 * @returns Raw base64 string
 */
function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(',')[1];
}

/**
 * base64ToByteLength
 *
 * Calculates the byte length of base64-encoded data.
 * Used for PDF stream length declarations.
 *
 * @param base64 - Raw base64 string
 * @returns Byte count of decoded data
 */
function base64ByteLength(base64: string): number {
  const padding = (base64.match(/=/g) || []).length;
  return Math.floor(base64.length * 0.75) - padding;
}

/**
 * buildMinimalPdf
 *
 * Constructs a minimal but valid PDF 1.4 file containing
 * a single A4 page with the label image centered.
 *
 * PDF object structure:
 *   1 0 obj  — Catalog (root)
 *   2 0 obj  — Pages (page tree)
 *   3 0 obj  — Page (single page)
 *   4 0 obj  — Image XObject (the label PNG)
 *   5 0 obj  — Content stream (draws image on page)
 *
 * @param base64Image  - Base64-encoded PNG image data
 * @param imageWidth   - Original image width in pixels
 * @param imageHeight  - Original image height in pixels
 * @param title        - Document title for metadata
 * @returns PDF file as a Uint8Array
 */
function buildMinimalPdf(
  base64Image: string,
  imageWidth: number,
  imageHeight: number,
  title: string
): Uint8Array {
  // ── Calculate image placement on A4 page ─────────────────────────────
  const availableWidth = A4_WIDTH_PT - 2 * MARGIN_PT;
  const availableHeight = A4_HEIGHT_PT - 2 * MARGIN_PT;

  // Scale image to fit within available area while preserving aspect ratio
  const aspectRatio = imageWidth / imageHeight;
  let imgWidthPt = availableWidth;
  let imgHeightPt = imgWidthPt / aspectRatio;

  if (imgHeightPt > availableHeight) {
    imgHeightPt = availableHeight;
    imgWidthPt = imgHeightPt * aspectRatio;
  }

  // Center horizontally on page
  const xPos = MARGIN_PT + (availableWidth - imgWidthPt) / 2;
  // Start from top with margin
  const yPos = A4_HEIGHT_PT - MARGIN_PT - imgHeightPt;

  // ── Build PDF objects ─────────────────────────────────────────────────
  const imageByteLength = base64ByteLength(base64Image);
  const now = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

  // Object 5: Content stream — draws the image
  const contentStream =
    `q\n${imgWidthPt.toFixed(2)} 0 0 ${imgHeightPt.toFixed(2)} ${xPos.toFixed(2)} ${yPos.toFixed(2)} cm\n/Im1 Do\nQ`;

  // Build the PDF text content
  const objects: string[] = [];
  const offsets: number[] = [];
  let offset = 0;

  // PDF Header
  const header = `%PDF-1.4\n%\xE2\xE3\xCF\xD3\n`;
  offset += header.length;

  // Object 1: Catalog
  offsets[1] = offset;
  const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  objects.push(obj1);
  offset += obj1.length;

  // Object 2: Pages
  offsets[2] = offset;
  const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  objects.push(obj2);
  offset += obj2.length;

  // Object 3: Page
  offsets[3] = offset;
  const obj3 =
    `3 0 obj\n` +
    `<< /Type /Page /Parent 2 0 R ` +
    `/MediaBox [0 0 ${A4_WIDTH_PT} ${A4_HEIGHT_PT}] ` +
    `/Contents 5 0 R ` +
    `/Resources << /XObject << /Im1 4 0 R >> >> >>\n` +
    `endobj\n`;
  objects.push(obj3);
  offset += obj3.length;

  // Object 4: Image XObject (PNG embedded as base64)
  offsets[4] = offset;
  const obj4Header =
    `4 0 obj\n` +
    `<< /Type /XObject /Subtype /Image ` +
    `/Width ${imageWidth} /Height ${imageHeight} ` +
    `/ColorSpace /DeviceRGB /BitsPerComponent 8 ` +
    `/Filter /DCTDecode ` +
    `/Length ${imageByteLength} >>\n` +
    `stream\n`;

  // Object 5: Content stream
  const obj5 =
    `5 0 obj\n` +
    `<< /Length ${contentStream.length} >>\n` +
    `stream\n${contentStream}\nendstream\nendobj\n`;

  // Object 6: Info dictionary (metadata)
  offsets[6] = offset + obj4Header.length + imageByteLength + '\nendstream\nendobj\n'.length;
  offsets[5] = offsets[6] + (`6 0 obj\n<< /Title (${title}) /Creator (NutriLabe) /CreationDate (D:${now}) >>\nendobj\n`).length;

  const obj6 =
    `6 0 obj\n` +
    `<< /Title (${title}) /Creator (NutriLabe) /CreationDate (D:${now}) >>\n` +
    `endobj\n`;

  // ── Recalculate offsets properly ─────────────────────────────────────
  // Reset and do a clean pass through all objects in order
  const pdfParts: (string | { base64: string; byteLength: number })[] = [];
  pdfParts.push(header);

  const cleanOffsets: number[] = new Array(7).fill(0);
  let byteCount = header.length;

  // obj1
  cleanOffsets[1] = byteCount;
  pdfParts.push(obj1);
  byteCount += obj1.length;

  // obj2
  cleanOffsets[2] = byteCount;
  pdfParts.push(obj2);
  byteCount += obj2.length;

  // obj3
  cleanOffsets[3] = byteCount;
  pdfParts.push(obj3);
  byteCount += obj3.length;

  // obj4 (image) — has base64 binary content
  cleanOffsets[4] = byteCount;
  const obj4End = `\nendstream\nendobj\n`;
  pdfParts.push(obj4Header);
  byteCount += obj4Header.length;
  pdfParts.push({ base64: base64Image, byteLength: imageByteLength });
  byteCount += imageByteLength;
  pdfParts.push(obj4End);
  byteCount += obj4End.length;

  // obj5 (content stream)
  cleanOffsets[5] = byteCount;
  pdfParts.push(obj5);
  byteCount += obj5.length;

  // obj6 (info)
  cleanOffsets[6] = byteCount;
  pdfParts.push(obj6);
  byteCount += obj6.length;

  // ── Cross-reference table ─────────────────────────────────────────────
  const xrefOffset = byteCount;
  const xref =
    `xref\n0 7\n` +
    `0000000000 65535 f \n` +
    `${cleanOffsets[1].toString().padStart(10, '0')} 00000 n \n` +
    `${cleanOffsets[2].toString().padStart(10, '0')} 00000 n \n` +
    `${cleanOffsets[3].toString().padStart(10, '0')} 00000 n \n` +
    `${cleanOffsets[4].toString().padStart(10, '0')} 00000 n \n` +
    `${cleanOffsets[5].toString().padStart(10, '0')} 00000 n \n` +
    `${cleanOffsets[6].toString().padStart(10, '0')} 00000 n \n`;

  const trailer =
    `trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF`;

  pdfParts.push(xref);
  pdfParts.push(trailer);

  // ── Encode to Uint8Array ──────────────────────────────────────────────
  // Calculate total byte length
  let totalBytes = 0;
  for (const part of pdfParts) {
    if (typeof part === 'string') {
      totalBytes += new TextEncoder().encode(part).length;
    } else {
      totalBytes += part.byteLength;
    }
  }

  const result = new Uint8Array(totalBytes);
  let writeOffset = 0;

  for (const part of pdfParts) {
    if (typeof part === 'string') {
      const encoded = new TextEncoder().encode(part);
      result.set(encoded, writeOffset);
      writeOffset += encoded.length;
    } else {
      // Decode base64 binary data
      const binary = atob(part.base64);
      for (let i = 0; i < binary.length; i++) {
        result[writeOffset + i] = binary.charCodeAt(i);
      }
      writeOffset += part.byteLength;
    }
  }

  return result;
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * generateLabelPdf
 *
 * Main export. Captures the label element as a high-quality
 * PNG using html-to-image, embeds it in a PDF, and triggers
 * a browser download.
 *
 * Steps:
 *   1. Capture label DOM element as PNG data URL via html-to-image
 *   2. Convert to JPEG for smaller file size (PDF embedding)
 *   3. Build minimal PDF structure around the image
 *   4. Trigger browser download via Blob URL
 *
 * @param options - PdfGenerationOptions
 * @returns PdfGenerationResult indicating success or failure
 */
export async function generateLabelPdf(
  options: PdfGenerationOptions
): Promise<PdfGenerationResult> {
  const { element, filename, title = 'Nutrition Label', scale = 2 } = options;

  try {
    // Step 1: Capture element as PNG
    const pngDataUrl = await htmlToImage.toPng(element, {
      width: element.offsetWidth * scale,
      height: element.offsetHeight * scale,
      style: {
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: `${element.offsetWidth}px`,
        height: `${element.offsetHeight}px`,
      },
      quality: 1.0,
    });

    // Step 2: Convert PNG to JPEG via canvas for smaller PDF size
    const canvas = document.createElement('canvas');
    const img = new Image();

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load captured image'));
      img.src = pngDataUrl;
    });

    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context unavailable');
    }

    // White background for JPEG (no transparency)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const base64Image = dataUrlToBase64(jpegDataUrl);

    // Step 3: Build PDF
    const pdfBytes = buildMinimalPdf(
      base64Image,
      canvas.width,
      canvas.height,
      title
    );

   // Step 4: Trigger download
const buffer = pdfBytes.buffer.slice(
  pdfBytes.byteOffset,
  pdfBytes.byteOffset + pdfBytes.byteLength
) as ArrayBuffer;

const blob = new Blob([buffer], {
  type: 'application/pdf',
});

const url = URL.createObjectURL(blob);

const link = document.createElement('a');
link.href = url;
link.download = `${filename}.pdf`;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);

URL.revokeObjectURL(url);

    // Clean up object URL after download
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    return { success: true };
  } catch (error) {
    console.error('PDF generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}