/**
 * Frame mapping for assets/tileset-grass.png
 *
 * Tileset: 576×384 px · 64×64 px per frame · 9 cols × 6 rows = 54 frames (0–53)
 * Frame index = row * 9 + col
 *
 * Verify visually at: http://localhost:3000/tileset-viewer.html
 *
 * Autotile bitmask (4-bit cardinal, 1 = neighbour is land / not water):
 *   bit 0 (value 1) = North
 *   bit 1 (value 2) = East
 *   bit 2 (value 4) = South
 *   bit 3 (value 8) = West
 *   15 (1111) = fully surrounded = interior grass
 *
 * Left group layout (cols 0–3):
 *   Row 0: NW edge · N edge · NE edge · [variant]
 *   Row 1: W edge  · Interior · E edge  · [variant]
 *   Row 2: SW edge · S edge   · SE edge · [isolated]
 *   Row 3: cliff-face left · mid · right · corner
 *   Row 4: cliff-face base left · mid · right · corner
 *   Row 5: cliff base caps
 */

// ── Grass surface tiles (left group, rows 0–2) ─────────────────────────────
// Bitmask → frame index.  Bit set = that neighbour is land (not water).
export const GRASS_SURFACE: Record<number, number> = {
  15: 10,  // all surrounded          → interior          (r1 c1)
  14:  1,  // E+S+W  (no N)           → N-edge            (r0 c1)
  13: 11,  // N+S+W  (no E)           → E-edge            (r1 c2)
  11: 19,  // N+E+W  (no S)           → S-edge            (r2 c1)
   7:  9,  // N+E+S  (no W)           → W-edge            (r1 c0)
  12:  2,  // S+W    (no N+E)         → NE outer corner   (r0 c2)
   9: 20,  // N+W    (no E+S)         → SE outer corner   (r2 c2)
   6:  0,  // E+S    (no N+W)         → NW outer corner   (r0 c0)
   3: 18,  // N+E    (no S+W)         → SW outer corner   (r2 c0)
  10:  1,  // E+W    (no N+S)  strip  → fallback N-edge
   5: 10,  // N+S    (no E+W)  strip  → fallback interior
   8:  9,  // W only                  → W-edge fallback
   4: 19,  // S only                  → S-edge fallback
   2: 11,  // E only                  → E-edge fallback
   1:  1,  // N only                  → N-edge fallback
   0: 10,  // isolated                → interior fallback
};

// ── Cliff face tiles (left group, rows 3–4) ───────────────────────────────
// Rendered one tile below the S-edge surface tile (inside the water tile row).
export const CLIFF_FACE = {
  southLeft:  27,   // left end of cliff row   (r3 c0)
  south:      28,   // middle of cliff row      (r3 c1)
  southRight: 29,   // right end of cliff row   (r3 c2)
  base:       36,   // cliff base middle        (r4 c0)
};

// ── Tall cliff variants (right group, cols 4–8) ───────────────────────────
// Use these if you ever need a 2-tile-tall cliff (not used in the current map).
export const GRASS_SURFACE_TALL: Record<number, number> = {
  15:  5,  // tall interior   (r0 c5) — placeholder, verify in viewer
  11:  6,  // tall S-edge            — placeholder
};

// Convenience shorthand — interior grass frame.
export const GRASS_INTERIOR_FRAME = GRASS_SURFACE[15]; // 10
