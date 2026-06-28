import { TILE_SIZE, MAP_DATA, MAP_COLS, MAP_ROWS, SOLID_TILES } from '../constants';

interface MapConfig {
  data: number[][];
  cols: number;
  rows: number;
  collision?: number[][];
}

let cfg: MapConfig = { data: MAP_DATA, cols: MAP_COLS, rows: MAP_ROWS };

export function setCurrentMap(
  data: number[][], cols: number, rows: number,
  collision?: number[][]
): void {
  cfg = { data, cols, rows, collision };
}

export function isoX(wx: number, _wy: number): number { return wx * TILE_SIZE; }
export function isoY(_wx: number, wy: number): number  { return wy * TILE_SIZE; }
export function isoDepth(_wx: number, wy: number): number { return wy; }

export function isWall(wx: number, wy: number): boolean {
  const col = Math.floor(wx);
  const row = Math.floor(wy);
  if (col < 0 || col >= cfg.cols || row < 0 || row >= cfg.rows) return true;
  if (cfg.collision) return cfg.collision[row][col] !== 0;
  return SOLID_TILES.has(cfg.data[row][col]);
}

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
  return { x: xOk ? nx : wx, y: yOk ? ny : wy };
}

export function worldDist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}
