/**
 * Gera assets/icon.ico (256×256, formato ICO simples com 1 frame BMP).
 * Executar uma vez antes do electron:build:win.
 * Não requer dependências externas.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../assets/icon.ico');

const SIZE = 256;

// ── Paleta (cores do jogo) ──────────────────────────────────────────
// Fundo: azul-esverdeado do overworld (#2ec0c0)
// Foreground: verde do knight (#2e8a2e) + dourado (#ddaa00)

function writeLe16(buf, offset, val) {
  buf[offset]     = val & 0xff;
  buf[offset + 1] = (val >> 8) & 0xff;
}
function writeLe32(buf, offset, val) {
  buf[offset]     = val & 0xff;
  buf[offset + 1] = (val >> 8) & 0xff;
  buf[offset + 2] = (val >> 16) & 0xff;
  buf[offset + 3] = (val >> 24) & 0xff;
}

// Build raw BGRA pixels (256×256)
const pixels = Buffer.alloc(SIZE * SIZE * 4, 0);

function setPixel(x, y, r, g, b, a = 255) {
  const i = (y * SIZE + x) * 4;
  pixels[i]     = b;
  pixels[i + 1] = g;
  pixels[i + 2] = r;
  pixels[i + 3] = a;
}

function fillRect(x, y, w, h, r, g, b, a = 255) {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++)
      setPixel(x + dx, y + dy, r, g, b, a);
}

function fillCircle(cx, cy, radius, r, g, b, a = 255) {
  for (let y = cy - radius; y <= cy + radius; y++)
    for (let x = cx - radius; x <= cx + radius; x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2 && x >= 0 && y >= 0 && x < SIZE && y < SIZE)
        setPixel(x, y, r, g, b, a);
}

// Background: teal (#2ec0c0)
fillRect(0, 0, SIZE, SIZE, 0x2e, 0xc0, 0xc0);

// Outer circle: dark green (#1e5c1e)
fillCircle(128, 128, 118, 0x1e, 0x5c, 0x1e);

// Inner circle: green (#2e8a2e)
fillCircle(128, 128, 108, 0x2e, 0x8a, 0x2e);

// Sword vertical: light gray (#ccccdd)
fillRect(122, 40, 12, 140, 0xcc, 0xcc, 0xdd);
// Sword highlight
fillRect(125, 40, 4, 140, 0xee, 0xee, 0xff);
// Guard horizontal: gold (#ddaa00)
fillRect(98, 100, 60, 14, 0xdd, 0xaa, 0x00);
// Guard highlight
fillRect(98, 100, 60, 5, 0xff, 0xcc, 0x33);
// Handle: dark brown (#664422)
fillRect(120, 180, 16, 42, 0x66, 0x44, 0x22);

// Gold ring at top
fillCircle(128, 128, 120, 0xdd, 0xaa, 0x00, 80);

// ── Build ICO file ──────────────────────────────────────────────────

// BMP DIB header: BITMAPINFOHEADER (40 bytes)
const HEADER_SIZE = 40;
const ROW_BYTES   = SIZE * 4;
const BMP_DATA    = SIZE * SIZE * 4;
const AND_MASK    = Math.ceil(SIZE * SIZE / 8); // 1-bit AND mask
const IMG_SIZE    = HEADER_SIZE + BMP_DATA + AND_MASK;

const bmp = Buffer.alloc(HEADER_SIZE + BMP_DATA + AND_MASK, 0);
writeLe32(bmp, 0,  HEADER_SIZE);   // biSize
writeLe32(bmp, 4,  SIZE);          // biWidth
writeLe32(bmp, 8,  SIZE * 2);      // biHeight (doubled for ICO — includes AND mask)
writeLe16(bmp, 12, 1);             // biPlanes
writeLe16(bmp, 14, 32);            // biBitCount (BGRA)
writeLe32(bmp, 16, 0);             // biCompression (BI_RGB)
writeLe32(bmp, 20, BMP_DATA);      // biSizeImage

// Copy pixel data bottom-up (BMP is stored bottom-to-top)
for (let y = 0; y < SIZE; y++) {
  const srcRow = y * ROW_BYTES;
  const dstRow = HEADER_SIZE + (SIZE - 1 - y) * ROW_BYTES;
  pixels.copy(bmp, dstRow, srcRow, srcRow + ROW_BYTES);
}
// AND mask stays zero (fully opaque)

// ICO header + directory
const ICO_HEADER = 6;   // ICONDIR
const ICO_ENTRY  = 16;  // ICONDIRENTRY
const DATA_OFFSET = ICO_HEADER + ICO_ENTRY;

const ico = Buffer.alloc(DATA_OFFSET + IMG_SIZE);
writeLe16(ico, 0, 0);     // reserved
writeLe16(ico, 2, 1);     // type = ICO
writeLe16(ico, 4, 1);     // image count

// ICONDIRENTRY
ico[6]  = 0;              // width  (0 = 256)
ico[7]  = 0;              // height (0 = 256)
ico[8]  = 0;              // color count
ico[9]  = 0;              // reserved
writeLe16(ico, 10, 1);    // planes
writeLe16(ico, 12, 32);   // bit count
writeLe32(ico, 14, IMG_SIZE);         // size of image data
writeLe32(ico, 18, DATA_OFFSET);      // offset of image data

bmp.copy(ico, DATA_OFFSET);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, ico);
console.log(`✓ Ícone gerado: ${OUT} (${ico.length} bytes)`);
