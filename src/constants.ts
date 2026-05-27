// ── Tile dimensions ────────────────────────────────────────────────
export const TILE_SIZE = 32;

// ── Tile types ─────────────────────────────────────────────────────
// Walkable: 0=grass  3=path  6=sand  7=dungeon  8=forest
// Solid:    1=wall   2=bush  4=water 5=house-wall 9=forest-tree 10=cactus 11=ruin-wall
export const SOLID_TILES = new Set<number>([1, 2, 4, 5, 9, 10, 11, 12]);

// ── Map ────────────────────────────────────────────────────────────
export const MAP_COLS = 64;
export const MAP_ROWS = 48;

function generateMap(): number[][] {
  const R = MAP_ROWS, C = MAP_COLS;
  const m: number[][] = Array.from({ length: R }, () => new Array(C).fill(0));

  const S = (r: number, c: number, t: number) => {
    if (r >= 0 && r < R && c >= 0 && c < C) m[r][c] = t;
  };
  const F = (r1: number, c1: number, r2: number, c2: number, t: number) => {
    for (let r = Math.max(0, r1); r <= Math.min(R - 1, r2); r++)
      for (let c = Math.max(0, c1); c <= Math.min(C - 1, c2); c++)
        m[r][c] = t;
  };
  const houseFrame = (r: number, c: number, w: number, h: number, doorR: number, doorC: number) => {
    for (let dc = c; dc < c + w; dc++) { S(r, dc, 5); S(r + h - 1, dc, 5); }
    for (let dr = r + 1; dr < r + h - 1; dr++) { S(dr, c, 5); S(dr, c + w - 1, 5); }
    S(doorR, doorC, 3);
  };

  // ── Border ──────────────────────────────────────────────────────
  F(0, 0, 0, C - 1, 1);
  F(R - 1, 0, R - 1, C - 1, 1);
  F(0, 0, R - 1, 0, 1);
  F(0, C - 1, R - 1, C - 1, 1);

  // ── Biome floors ────────────────────────────────────────────────
  F(1, 1, R - 2, 18, 8);       // West forest
  F(1, 45, 21, C - 2, 6);      // NE desert
  F(22, 45, R - 2, C - 2, 7);  // SE ruins

  // ── Forest trees ────────────────────────────────────────────────
  for (let r = 1; r < R - 1; r++)
    for (let c = 1; c <= 18; c++)
      if (r % 2 === 1 && (r * 3 + c * 7) % 5 === 0) m[r][c] = 9;

  // ── Swamp water patches (SW) ─────────────────────────────────────
  const swamp: [number, number][] = [
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

  // ── Desert cacti ────────────────────────────────────────────────
  for (let r = 1; r <= 21; r++)
    for (let c = 45; c <= 62; c++)
      if ((r * 5 + c * 3) % 7 === 0 && m[r][c] === 6) m[r][c] = 10;

  // Desert outpost (rows 4-10, cols 52-59)
  for (let c = 52; c <= 59; c++) { S(4, c, 1); S(10, c, 1); }
  for (let r = 5; r <= 9; r++) { S(r, 52, 1); S(r, 59, 1); }
  S(10, 55, 6); S(10, 56, 6); // door

  // ── Ruins walls (SE: rows 23-46, cols 45-62) ────────────────────
  const ruinFrames: [number, number, number, number, number, number][] = [
    [26,46,7,7,32,49],
    [26,54,8,8,33,57],
    [37,46,7,8,43,49],
    [37,55,8,8,44,58],
  ];
  for (const [r,c,h,w,doorR,doorC] of ruinFrames) {
    for (let dc=c; dc<c+w; dc++) { S(r,dc,11); S(r+h-1,dc,11); }
    for (let dr=r+1; dr<r+h-1; dr++) { S(dr,c,11); S(dr,c+w-1,11); }
    S(doorR,doorC,7); S(doorR,doorC+1,7); // gap
  }
  // Scattered ruin rubble
  const rubble: [number,number][] = [
    [24,47],[24,52],[24,58],[25,50],[25,61],
    [34,46],[34,53],[34,56],[35,61],[35,48],
    [45,47],[45,55],[45,60],[46,51],[46,58],
  ];
  for (const [r,c] of rubble) if (r>=22 && c>=45) S(r,c,11);

  // ── Main paths ──────────────────────────────────────────────────
  F(22, 1, 23, C - 2, 3);  // E-W main road
  F(1, 30, R - 2, 31, 3);  // N-S main road
  F(1, 9, R - 2, 10, 3);   // Forest path
  F(1, 53, 21, 54, 3);     // Desert path N
  F(22, 53, R - 2, 54, 3); // Ruins path S

  // ── Village streets ─────────────────────────────────────────────
  F(11, 19, 12, 44, 3);

  // ── Village houses ──────────────────────────────────────────────
  houseFrame(3, 20, 8, 7, 9, 23);   // NW house  (door south)
  houseFrame(3, 33, 8, 7, 9, 36);   // NE house  (door south)
  houseFrame(14, 20, 8, 7, 14, 23); // SW house  (door north)
  houseFrame(14, 33, 8, 7, 14, 36); // SE house  (door north)
  // Well/fountain in village square
  S(6, 28, 1); S(6, 29, 4); S(6, 32, 1); // decorative well stones + water

  // ── South grassland bushes ──────────────────────────────────────
  const bushPos: [number,number][] = [
    [25,21],[25,27],[25,34],[25,41],
    [27,23],[27,32],[27,38],[27,44],
    [29,20],[29,28],[29,36],[29,43],
    [31,22],[31,29],[31,37],[31,44],
    [33,21],[33,27],[33,35],[33,42],
    [35,23],[35,31],[35,39],[35,44],
    [37,21],[37,29],[37,36],[37,43],
    [39,24],[39,32],[39,38],[39,44],
    [41,21],[41,28],[41,35],[41,42],
    [43,23],[43,30],[43,38],[43,44],
    [45,21],[45,27],[45,35],[45,42],
  ];
  for (const [r, c] of bushPos) if (m[r][c] === 0) S(r, c, 2);

  // Pond in south grass
  F(32, 21, 34, 25, 4);

  // ── Re-apply roads last (clears obstacles on them) ──────────────
  F(22, 1, 23, C - 2, 3);
  F(1, 30, R - 2, 31, 3);
  F(1, 9, R - 2, 10, 3);
  F(1, 53, 21, 54, 3);
  F(22, 53, R - 2, 54, 3);
  F(11, 19, 12, 44, 3);

  // ── Castle (rows 26-38, cols 22-34) ────────────────────────────────
  // Interior courtyard floor
  F(27, 23, 37, 33, 7);
  // Outer walls
  F(26, 22, 26, 34, 12); // north wall
  F(38, 22, 38, 34, 12); // south wall
  F(26, 22, 38, 22, 12); // west wall
  F(26, 34, 38, 34, 12); // east wall
  // North gate entrance (walkable, triggers transition)
  S(26, 27, 13); S(26, 28, 13);
  // Corner towers
  F(26, 22, 27, 23, 12); F(26, 33, 27, 34, 12);
  F(37, 22, 38, 23, 12); F(37, 33, 38, 34, 12);
  // Inner keep outer walls
  F(29, 25, 29, 31, 12); // keep north
  F(35, 25, 35, 31, 12); // keep south
  F(29, 25, 35, 25, 12); // keep west
  F(29, 31, 35, 31, 12); // keep east
  // Keep gate (south face of inner keep)
  S(35, 28, 7); S(35, 29, 7);
  // Path from main road to castle gate
  F(24, 27, 25, 28, 3);

  return m;
}

export const MAP_DATA: number[][] = generateMap();

export const WORLD_W = MAP_COLS * TILE_SIZE;  // 2048
export const WORLD_H = MAP_ROWS * TILE_SIZE;  // 1536

// ── Castle overworld gate position ─────────────────────────────────────
export const CASTLE_DOOR_WX = 27.5;
export const CASTLE_DOOR_WY = 26.0;

// ── Player ─────────────────────────────────────────────────────────
export const PLAYER_SPEED         = 4.5;
export const PLAYER_DEFEND_SPEED  = 2.0;
export const PLAYER_MAX_HP        = 10;
export const PLAYER_ATTACK_DAMAGE = 2;
export const PLAYER_SWORD_REACH   = 1.1;
export const PLAYER_SWORD_WIDTH   = 3;
export const PLAYER_SWORD_DUR     = 220;
export const PLAYER_SWORD_CD      = 460;
export const PLAYER_INVINCIBILITY = 1100;
export const PLAYER_KNOCKBACK     = 4.0;
export const PLAYER_RADIUS        = 0.38;

// ── Slime ──────────────────────────────────────────────────────────
export const SLIME_HP              = 2;
export const SLIME_SPEED           = 1.6;
export const SLIME_DAMAGE          = 1;
export const SLIME_DETECT          = 5.5;
export const SLIME_WANDER_INTERVAL = 2400;
export const SLIME_RADIUS          = 0.35;

// ── Skeleton ───────────────────────────────────────────────────────
export const SKELETON_HP           = 4;
export const SKELETON_SPEED        = 2.4;
export const SKELETON_CHARGE_SPEED = 6.0;
export const SKELETON_DAMAGE       = 1;
export const SKELETON_DETECT       = 8.0;
export const SKELETON_ALERT_DUR    = 650;
export const SKELETON_CHARGE_DUR   = 800;
export const SKELETON_STUN_DUR     = 480;
export const SKELETON_RADIUS       = 0.38;

// ── Wizard ─────────────────────────────────────────────────────────
export const WIZARD_HP             = 5;
export const WIZARD_SPEED          = 1.4;
export const WIZARD_DAMAGE         = 1;
export const WIZARD_DETECT         = 9.0;
export const WIZARD_PREF_DIST      = 5.0;
export const WIZARD_FLEE_DIST      = 2.5;
export const WIZARD_FIRE_CD        = 2200;
export const WIZARD_RADIUS         = 0.35;
export const PROJ_SPEED            = 7.0;

// ── Enemy shared ───────────────────────────────────────────────────
export const ENEMY_KNOCKBACK     = 3.5;
export const ENEMY_KNOCKBACK_DUR = 280;
export const CONTACT_RADIUS      = 0.55;

// ── Bard ───────────────────────────────────────────────────────────
export const BARD_MAX_HP         = 7;
export const BARD_SPEED          = 5.5;
export const BARD_DEFEND_SPEED   = 2.5;
export const BARD_ATTACK_DAMAGE  = 1;
export const BARD_LUTE_REACH     = 1.0;
export const BARD_LUTE_WIDTH     = 1.4;
export const BARD_ATTACK_DUR     = 200;
export const BARD_ATTACK_CD      = 380;
export const BARD_SPECIAL_DAMAGE = 1;
export const BARD_SPECIAL_CD     = 4000;
export const BARD_SPECIAL_SPEED  = 8.0;
export const BARD_SPECIAL_RANGE  = 5.5;

// ── Mind Devourer Boss ─────────────────────────────────────────────
export const BOSS_HP             = 80;
export const BOSS_SPEED          = 2.0;
export const BOSS_SPEED_P2       = 3.2;
export const BOSS_DAMAGE         = 2;
export const BOSS_RADIUS         = 0.7;
export const BOSS_ORBIT_DIST     = 7.0;
export const BOSS_ORBIT_DIST_P2  = 5.5;
export const BOSS_PROJ_SPEED     = 4.0;
export const BOSS_PROJ_DAMAGE    = 2;
export const BOSS_SPREAD_CD      = 2600;
export const BOSS_SPREAD_CD_P2   = 1500;
export const BOSS_BURST_CD       = 9000;
export const BOSS_BURST_CD_P2    = 5000;
export const BOSS_TELEPORT_CD    = 7000;
export const BOSS_WINDUP_DUR     = 700;
export const BOSS_CONTACT_DIST   = 1.1;

// ── Cleric ─────────────────────────────────────────────────────────
export const CLERIC_MAX_HP       = 8;
export const CLERIC_SPEED        = 4.0;
export const CLERIC_DEFEND_SPEED = 2.0;
export const CLERIC_ATTACK_DAMAGE = 2;
export const CLERIC_BOLT_SPEED   = 6.5;
export const CLERIC_BOLT_RANGE   = 4.5;
export const CLERIC_ATTACK_DUR   = 300;
export const CLERIC_ATTACK_CD    = 600;
export const CLERIC_SPECIAL_CD   = 8000;
export const CLERIC_SPECIAL_DUR  = 2000;
