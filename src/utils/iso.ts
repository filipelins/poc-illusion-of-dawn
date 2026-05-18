import { TILE_SIZE, MAP_DATA, MAP_COLS, MAP_ROWS, SOLID_TILES } from '../constants';

/** World tile coords → screen X */
export function isoX(wx: number, _wy: number): number {
  return wx * TILE_SIZE;
}

/** World tile coords → screen Y */
export function isoY(_wx: number, wy: number): number {
  return wy * TILE_SIZE;
}

/** Depth for painter's algorithm — sort by world Y */
export function isoDepth(_wx: number, wy: number): number {
  return wy;
}

/** True if the continuous world position is inside a solid tile. */
export function isWall(wx: number, wy: number): boolean {
  const col = Math.floor(wx);
  const row = Math.floor(wy);
  if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return true;
  return SOLID_TILES.has(MAP_DATA[row][col]);
}

/** Move from (wx,wy) by (dx,dy) with axis-separated wall sliding. */
export function moveSlide(
  wx: number, wy: number,
  dx: number, dy: number,
  radius: number
): { x: number; y: number } {
  const r = radius;
  const nx = wx + dx;
  const ny = wy + dy;

  const xOk = !isWall(nx + Math.sign(dx) * r, wy + r) &&
               !isWall(nx + Math.sign(dx) * r, wy - r);
  const yOk = !isWall(wx + r, ny + Math.sign(dy) * r) &&
               !isWall(wx - r, ny + Math.sign(dy) * r);

  return {
    x: xOk ? nx : wx,
    y: yOk ? ny : wy
  };
}

/** Euclidean distance in world units. */
export function worldDist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}
