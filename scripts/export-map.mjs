/**
 * export-map.mjs
 * Gera os arquivos Tiled a partir do mapa atual do jogo.
 *
 * Uso: node scripts/export-map.mjs
 *
 * Cria:
 *   tiled/tileset-types.tsj   — definição do tileset no Tiled
 *   tiled/map.tmj              — mapa editável no Tiled
 *   public/assets/map.json    — mesmo mapa, carregado pelo Phaser
 *   public/assets/tileset-map.png — paleta visual de tiles
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Tipos de tile (espelho de constants.ts)
// ─────────────────────────────────────────────────────────────────────────────
const TILE_TYPES = [
  { id: 0,  name: 'grass',       solid: false, color: [0x5a, 0x9c, 0x3a] },
  { id: 1,  name: 'wall',        solid: true,  color: [0x7a, 0x90, 0x98] },
  { id: 2,  name: 'bush',        solid: true,  color: [0x3a, 0x7a, 0x24] },
  { id: 3,  name: 'path',        solid: false, color: [0xa0, 0x78, 0x48] },
  { id: 4,  name: 'water',       solid: true,  color: [0x2e, 0xc0, 0xc0] },
  { id: 5,  name: 'house-wall',  solid: true,  color: [0x9a, 0x58, 0x48] },
  { id: 6,  name: 'sand',        solid: false, color: [0xd4, 0xb0, 0x60] },
  { id: 7,  name: 'dungeon',     solid: false, color: [0x40, 0x40, 0x40] },
  { id: 8,  name: 'forest',      solid: false, color: [0x2a, 0x60, 0x18] },
  { id: 9,  name: 'tree',        solid: true,  color: [0x1e, 0x4a, 0x10] },
  { id: 10, name: 'cactus',      solid: true,  color: [0x28, 0x6a, 0x20] },
  { id: 11, name: 'ruin-wall',   solid: true,  color: [0x50, 0x48, 0x40] },
  { id: 12, name: 'castle-wall', solid: true,  color: [0x4a, 0x50, 0x60] },
  { id: 13, name: 'castle-door', solid: false, color: [0x2c, 0x28, 0x38] },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. Gerador do mapa (port de constants.ts)
// ─────────────────────────────────────────────────────────────────────────────
function generateMap() {
  const R = 48, C = 64;
  const m = Array.from({ length: R }, () => new Array(C).fill(0));

  const S = (r, c, t) => { if (r >= 0 && r < R && c >= 0 && c < C) m[r][c] = t; };
  const F = (r1, c1, r2, c2, t) => {
    for (let r = Math.max(0, r1); r <= Math.min(R - 1, r2); r++)
      for (let c = Math.max(0, c1); c <= Math.min(C - 1, c2); c++)
        m[r][c] = t;
  };
  const houseFrame = (r, c, w, h, doorR, doorC) => {
    for (let dc = c; dc < c + w; dc++) { S(r, dc, 5); S(r + h - 1, dc, 5); }
    for (let dr = r + 1; dr < r + h - 1; dr++) { S(dr, c, 5); S(dr, c + w - 1, 5); }
    S(doorR, doorC, 3);
  };

  // Border
  F(0, 0, 0, C - 1, 1); F(R - 1, 0, R - 1, C - 1, 1);
  F(0, 0, R - 1, 0, 1); F(0, C - 1, R - 1, C - 1, 1);

  // Biome floors
  F(1, 1, R - 2, 18, 8);      // West forest
  F(1, 45, 21, C - 2, 6);     // NE desert
  F(22, 45, R - 2, C - 2, 7); // SE ruins

  // Forest trees
  for (let r = 1; r < R - 1; r++)
    for (let c = 1; c <= 18; c++)
      if (r % 2 === 1 && (r * 3 + c * 7) % 5 === 0) m[r][c] = 9;

  // Swamp water patches
  const swamp = [
    [29,2],[29,3],[30,2],[30,3],[30,4],
    [32,8],[32,9],[33,8],[33,9],[33,10],
    [35,3],[35,4],[36,3],[36,4],[36,5],
    [37,12],[37,13],[38,12],[38,13],
    [40,5],[40,6],[41,5],[41,6],[41,7],
    [42,14],[42,15],[43,14],[43,15],
    [44,2],[44,3],[45,2],[45,3],[45,4],
    [30,15],[31,15],[31,16],
    [39,10],[39,11],[40,10],
  ];
  for (const [r, c] of swamp) S(r, c, 4);

  // Desert cacti
  for (let r = 1; r <= 21; r++)
    for (let c = 45; c <= 62; c++)
      if ((r * 5 + c * 3) % 7 === 0 && m[r][c] === 6) m[r][c] = 10;

  // Desert outpost
  for (let c = 52; c <= 59; c++) { S(4, c, 1); S(10, c, 1); }
  for (let r = 5; r <= 9; r++) { S(r, 52, 1); S(r, 59, 1); }
  S(10, 55, 6); S(10, 56, 6);

  // Ruins
  const ruinFrames = [[26,46,7,7,32,49],[26,54,8,8,33,57],[37,46,7,8,43,49],[37,55,8,8,44,58]];
  for (const [r,c,h,w,doorR,doorC] of ruinFrames) {
    for (let dc=c; dc<c+w; dc++) { S(r,dc,11); S(r+h-1,dc,11); }
    for (let dr=r+1; dr<r+h-1; dr++) { S(dr,c,11); S(dr,c+w-1,11); }
    S(doorR,doorC,7); S(doorR,doorC+1,7);
  }
  const rubble = [[24,47],[24,52],[24,58],[25,50],[25,61],[34,46],[34,53],[34,56],[35,61],[35,48],[45,47],[45,55],[45,60],[46,51],[46,58]];
  for (const [r,c] of rubble) if (r>=22 && c>=45) S(r,c,11);

  // Main paths
  F(22, 1, 23, C - 2, 3); F(1, 30, R - 2, 31, 3);
  F(1, 9, R - 2, 10, 3);  F(1, 53, 21, 54, 3);
  F(22, 53, R - 2, 54, 3); F(11, 19, 12, 44, 3);

  // Village houses
  houseFrame(3, 20, 8, 7, 9, 23); houseFrame(3, 33, 8, 7, 9, 36);
  houseFrame(14, 20, 8, 7, 14, 23); houseFrame(14, 33, 8, 7, 14, 36);
  S(6, 28, 1); S(6, 29, 4); S(6, 32, 1);

  // South grassland bushes
  const bushPos = [
    [25,21],[25,27],[25,34],[25,41],[27,23],[27,32],[27,38],[27,44],
    [29,20],[29,28],[29,36],[29,43],[31,22],[31,29],[31,37],[31,44],
    [33,21],[33,27],[33,35],[33,42],[35,23],[35,31],[35,39],[35,44],
    [37,21],[37,29],[37,36],[37,43],[39,24],[39,32],[39,38],[39,44],
    [41,21],[41,28],[41,35],[41,42],[43,23],[43,30],[43,38],[43,44],
    [45,21],[45,27],[45,35],[45,42],
  ];
  for (const [r, c] of bushPos) if (m[r][c] === 0) S(r, c, 2);

  // Pond in south grass
  F(32, 21, 34, 25, 4);

  // Re-apply roads (clear obstacles on them)
  F(22, 1, 23, C - 2, 3); F(1, 30, R - 2, 31, 3);
  F(1, 9, R - 2, 10, 3);  F(1, 53, 21, 54, 3);
  F(22, 53, R - 2, 54, 3); F(11, 19, 12, 44, 3);

  // Castle
  F(27, 23, 37, 33, 7);
  F(26, 22, 26, 34, 12); F(38, 22, 38, 34, 12);
  F(26, 22, 38, 22, 12); F(26, 34, 38, 34, 12);
  S(26, 27, 13); S(26, 28, 13);
  F(26, 22, 27, 23, 12); F(26, 33, 27, 34, 12);
  F(37, 22, 38, 23, 12); F(37, 33, 38, 34, 12);
  F(29, 25, 29, 31, 12); F(35, 25, 35, 31, 12);
  F(29, 25, 35, 25, 12); F(29, 31, 35, 31, 12);
  S(35, 28, 7); S(35, 29, 7);
  F(24, 27, 25, 28, 3);

  return m;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PNG writer (Node built-in zlib — sem deps extras)
// ─────────────────────────────────────────────────────────────────────────────
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) {
    c ^= b;
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function makePNG(width, height, rgb) {
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  // Raw scanlines with filter byte 0
  const raw = [];
  for (let y = 0; y < height; y++) {
    raw.push(0);
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      raw.push(rgb[i], rgb[i+1], rgb[i+2]);
    }
  }
  const idat = deflateSync(Buffer.from(raw));
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Gera a paleta PNG (1 tile 32×32 por tipo)
// ─────────────────────────────────────────────────────────────────────────────
function buildPaletteImage() {
  const TILE_W = 32, TILE_H = 32;
  const count = TILE_TYPES.length;        // 14
  const W = TILE_W * count, H = TILE_H;
  const rgb = new Uint8Array(W * H * 3);

  for (const { id, color } of TILE_TYPES) {
    const [r, g, b] = color;
    const ox = id * TILE_W;
    for (let y = 0; y < TILE_H; y++) {
      for (let x = 0; x < TILE_W; x++) {
        // thin white border so tiles look distinct in Tiled
        const border = x === 0 || y === 0 || x === TILE_W - 1 || y === TILE_H - 1;
        const i = ((y * W) + (ox + x)) * 3;
        rgb[i]   = border ? 0xff : r;
        rgb[i+1] = border ? 0xff : g;
        rgb[i+2] = border ? 0xff : b;
      }
    }
  }
  return makePNG(W, H, rgb);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Monta o JSON do Tiled
// ─────────────────────────────────────────────────────────────────────────────
function buildTiledMap(mapData) {
  const R = mapData.length, C = mapData[0].length;
  // Tiled usa IDs 1-based (0 = célula vazia). Nosso tipo 0 vira ID 1.
  const flat = mapData.flat().map(t => t + 1);

  const tileset = {
    columns: TILE_TYPES.length,
    firstgid: 1,
    image: '../public/assets/tileset-map.png',  // relativo ao .tmj
    imageheight: 32,
    imagewidth: 32 * TILE_TYPES.length,
    margin: 0,
    name: 'tileset-types',
    spacing: 0,
    tilecount: TILE_TYPES.length,
    tileheight: 32,
    tilewidth: 32,
    tiledversion: '1.11.2',
    type: 'tileset',
    version: '1.10',
    tiles: TILE_TYPES.map(t => ({
      id: t.id,
      properties: [
        { name: 'solid', type: 'bool',   value: t.solid },
        { name: 'type',  type: 'int',    value: t.id    },
        { name: 'name',  type: 'string', value: t.name  },
      ],
    })),
  };

  const layer = {
    data: flat,
    height: R,
    id: 1,
    name: 'Ground',
    opacity: 1,
    type: 'tilelayer',
    visible: true,
    width: C,
    x: 0, y: 0,
  };

  const map = {
    height: R,
    infinite: false,
    layers: [layer],
    nextlayerid: 2,
    nextobjectid: 1,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    tiledversion: '1.11.2',
    tileheight: 32,
    tilesets: [{ firstgid: 1, source: 'tileset-types.tsj' }],
    tilewidth: 32,
    type: 'map',
    version: '1.10',
    width: C,
  };

  return { tileset, map };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Escreve tudo
// ─────────────────────────────────────────────────────────────────────────────
const mapData = generateMap();
const { tileset, map } = buildTiledMap(mapData);

mkdirSync('tiled', { recursive: true });
mkdirSync('public/assets', { recursive: true });

// Tiled files
writeFileSync('tiled/tileset-types.tsj', JSON.stringify(tileset, null, 2));
writeFileSync('tiled/map.tmj',           JSON.stringify(map,     null, 2));

// Phaser asset (map com imagem relativa à pasta assets/)
const phaserMap = structuredClone(map);
phaserMap.tilesets = [{ firstgid: 1, source: 'tileset-map.tsj' }];
// Phaser não precisa do .tsj externo — embed direto
phaserMap.tilesets = [{
  ...tileset,
  firstgid: 1,
  image: 'tileset-map.png',  // relativo a public/assets/
}];
writeFileSync('public/assets/map.json', JSON.stringify(phaserMap, null, 2));

// Palette PNG
writeFileSync('public/assets/tileset-map.png', buildPaletteImage());

console.log('✓ tiled/tileset-types.tsj');
console.log('✓ tiled/map.tmj');
console.log('✓ public/assets/map.json');
console.log('✓ public/assets/tileset-map.png  (14 tiles, 32×32 cada)');
console.log('');
console.log('Abra tiled/map.tmj no Tiled Map Editor.');
console.log('Após editar: File → Export As → JSON → public/assets/map.json');
