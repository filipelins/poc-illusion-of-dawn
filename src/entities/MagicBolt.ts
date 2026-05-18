import Phaser from 'phaser';
import { isoX, isoY, isoDepth, isWall, worldDist } from '../utils/iso';
import { TILE_SIZE } from '../constants';
import type { SpecialProjectile } from './BasePlayer';

export class MagicBolt implements SpecialProjectile {
  private container: Phaser.GameObjects.Container;
  private distTraveled = 0;
  private _dx: number;
  private _dy: number;
  private _maxDist: number;
  private _active = true;
  private _worldX: number;
  private _worldY: number;
  private _damage: number;
  private pulseTween: Phaser.Tweens.Tween | null = null;

  get active(): boolean { return this._active; }
  get worldX(): number  { return this._worldX; }
  get worldY(): number  { return this._worldY; }
  get damage(): number  { return this._damage; }
  readonly radius = 0.32;

  constructor(
    scene: Phaser.Scene,
    wx: number, wy: number,
    dx: number, dy: number,
    damage: number, maxDist: number
  ) {
    this._worldX = wx;
    this._worldY = wy;
    this._damage = damage;
    this._maxDist = maxDist;

    const len = Math.hypot(dx, dy) || 1;
    this._dx = dx / len;
    this._dy = dy / len;

    const sx = isoX(wx, wy) + TILE_SIZE / 2;
    const sy = isoY(wx, wy) + TILE_SIZE / 2;

    const gfx = scene.add.graphics();
    gfx.fillStyle(0x2244cc, 0.22); gfx.fillCircle(0, 0, 15);
    gfx.fillStyle(0x6699ff, 0.55); gfx.fillCircle(0, 0, 9);
    gfx.fillStyle(0xaaddff, 1);    gfx.fillCircle(0, 0, 6);
    gfx.fillStyle(0xffffff, 1);    gfx.fillCircle(0, 0, 3);

    this.container = scene.add.container(sx, sy, [gfx]);
    this.container.setDepth(isoDepth(wx, wy) + 0.55);

    this.pulseTween = scene.tweens.add({
      targets: this.container,
      scaleX: { from: 0.85, to: 1.2 },
      scaleY: { from: 0.85, to: 1.2 },
      duration: 180, yoyo: true, repeat: -1
    });
  }

  update(speed: number, delta: number): void {
    if (!this._active) return;
    const step = speed * (delta / 1000);
    this._worldX += this._dx * step;
    this._worldY += this._dy * step;
    this.distTraveled += step;

    const sx = isoX(this._worldX, this._worldY) + TILE_SIZE / 2;
    const sy = isoY(this._worldX, this._worldY) + TILE_SIZE / 2;
    this.container.setPosition(sx, sy);
    this.container.setDepth(isoDepth(this._worldX, this._worldY) + 0.55);

    if (this.distTraveled >= this._maxDist || isWall(this._worldX, this._worldY)) {
      this.explode();
    }
  }

  hitsPoint(wx: number, wy: number, r: number): boolean {
    return this._active && worldDist(this._worldX, this._worldY, wx, wy) < r + this.radius;
  }

  explode(): void {
    if (!this._active) return;
    this._active = false;
    if (this.pulseTween) { this.pulseTween.stop(); this.pulseTween = null; }

    const sx = isoX(this._worldX, this._worldY) + TILE_SIZE / 2;
    const sy = isoY(this._worldX, this._worldY) + TILE_SIZE / 2;
    const scene = this.container.scene;

    const emitter = scene.add.particles(sx, sy, 'blank', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.6, end: 0 },
      tint: [0x4488ff, 0xaaddff, 0xffffff],
      lifespan: 300, quantity: 7, emitting: false
    });
    emitter.explode(7);
    scene.time.delayedCall(380, () => emitter.destroy());
    this.container.destroy();
  }
}
