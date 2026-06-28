// Generates tiled/heavenbrock.tmj and public/assets/heavenbrock.json
import { writeFileSync } from 'node:fs';

const COLS = 48;
const ROWS = 36;

function makeMap() {
  const ground    = Array.from({ length: ROWS }, () => new Array(COLS).fill(1)); // 1 = grass
  const collision = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
  const decor     = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));

  const fill = (layer, r1, c1, r2, c2, val) => {
    for (let r = Math.max(0, r1); r <= Math.min(ROWS - 1, r2); r++)
      for (let c = Math.max(0, c1); c <= Math.min(COLS - 1, c2); c++)
        layer[r][c] = val;
  };

  const P = 4; // path  (type 3 after -1 in game)
  const W = 5; // water (type 4 after -1 in game)

  // ── Border collision ────────────────────────────────────────────────
  fill(collision, 0,        0, 0,        COLS - 1, 1);
  fill(collision, ROWS - 1, 0, ROWS - 1, COLS - 1, 1);
  fill(collision, 0, 0,        ROWS - 1, 0,        1);
  fill(collision, 0, COLS - 1, ROWS - 1, COLS - 1, 1);
  // South exit gap
  for (let c = 20; c <= 25; c++) collision[ROWS - 1][c] = 0;

  // ── Paths (Ground) ──────────────────────────────────────────────────
  fill(ground, 15, 1,  16, COLS - 2, P); // E-W main road
  fill(ground,  9, 22, ROWS - 2, 23, P); // N-S central road (from Tavern door)
  fill(ground, 10, 19, 14, 27, P);       // central square (plaza)
  fill(ground,  7,  5, 14,  6, P);       // NW house path connector
  fill(ground,  7, 40, 14, 41, P);       // NE house path connector
  fill(ground, 17,  4, 19,  5, P);       // W house connector
  fill(ground, 17, 41, 19, 42, P);       // E house connector
  fill(ground, 17, 14, 21, 15, P);       // SW house connector
  fill(ground, 17, 32, 21, 33, P);       // SE house connector
  fill(ground, 27, 20, ROWS - 2, 25, P); // south entry (wide)

  // ── Water pond (NW area) ─────────────────────────────────────────────
  fill(ground,    11,  7, 13, 11, W);
  fill(collision, 11,  7, 13, 11, 1);

  // ── TAVERN — rows 2-9, cols 18-28 (11×8) ────────────────────────────
  fill(collision, 2, 18, 9, 28, 1);
  collision[9][22] = 0; // south door left
  collision[9][23] = 0; // south door right

  // ── HOUSE NW — rows 3-7, cols 3-8 (6×5) ────────────────────────────
  fill(collision, 3, 3, 7, 8, 1);
  collision[7][5] = 0; // south door
  collision[7][6] = 0;

  // ── HOUSE NE — rows 3-7, cols 38-43 (6×5) ──────────────────────────
  fill(collision, 3, 38, 7, 43, 1);
  collision[7][40] = 0; // south door
  collision[7][41] = 0;

  // ── HOUSE W — rows 19-23, cols 2-8 (7×5) ───────────────────────────
  fill(collision, 19, 2, 23, 8, 1);
  collision[19][4] = 0; // north door
  collision[19][5] = 0;

  // ── HOUSE E — rows 19-23, cols 39-45 (7×5) ─────────────────────────
  fill(collision, 19, 39, 23, 45, 1);
  collision[19][41] = 0; // north door
  collision[19][42] = 0;

  // ── HOUSE SW — rows 21-26, cols 12-18 (7×6) ────────────────────────
  fill(collision, 21, 12, 26, 18, 1);
  collision[21][14] = 0; // north door
  collision[21][15] = 0;

  // ── HOUSE SE — rows 21-26, cols 30-36 (7×6) ────────────────────────
  fill(collision, 21, 30, 26, 36, 1);
  collision[21][32] = 0; // north door
  collision[21][33] = 0;

  return { ground, collision, decor };
}

function toTiledJson(ground, collision, decor) {
  const layer = (id, name, data) => ({
    data: data.flat(),
    height: ROWS,
    id,
    name,
    opacity: 1,
    type: 'tilelayer',
    visible: true,
    width: COLS,
    x: 0,
    y: 0,
  });

  return {
    compressionlevel: -1,
    height: ROWS,
    infinite: false,
    layers: [
      layer(1, 'Ground',    ground),
      layer(2, 'Decor',     decor),
      layer(3, 'Collision', collision),
    ],
    nextlayerid: 4,
    nextobjectid: 1,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    tiledversion: '1.12.2',
    tileheight: 32,
    tilesets: [
      { firstgid: 1,  source: 'tileset-types.tsj' },
      { firstgid: 15, source: 'map.tsx' },
    ],
    tilewidth: 32,
    type: 'map',
    version: '1.10',
    width: COLS,
  };
}

const { ground, collision, decor } = makeMap();
const json = JSON.stringify(toTiledJson(ground, collision, decor), null, 2);

writeFileSync('public/assets/heavenbrock.json', json);
writeFileSync('tiled/heavenbrock.tmj', json);
console.log(`✓ heavenbrock map generated (${COLS}×${ROWS})`);
