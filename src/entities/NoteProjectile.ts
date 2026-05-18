import Phaser from 'phaser';
import { isoX, isoY, isoDepth, isWall, worldDist } from '../utils/iso';
import { TILE_SIZE, BARD_SPECIAL_DAMAGE } from '../constants';
import type { SpecialProjectile } from './BasePlayer';

export class NoteProjectile implements SpecialProjectile {
  worldX: number;
  worldY: number;
  readonly damage = BARD_SPECIAL_DAMAGE;
  readonly radius = 0.28;

  private vx: number;
  private vy: number;
  private sprite: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private alive = true;
  private distTraveled = 0;
  private readonly maxDist: number;
  private rotAngle = Math.random() * 360;

  get active(): boolean { return this.alive; }

  constructor(
    scene: Phaser.Scene,
    wx: number, wy: number,
    dirX: number, dirY: number,
    maxDist: number
  ) {
    this.scene = scene;
    this.worldX = wx;
    this.worldY = wy;
    this.maxDist = maxDist;
    const len = Math.hypot(dirX, dirY) || 1;
    this.vx = dirX / len;
    this.vy = dirY / len;

    // Build sprite: gold circle + a ♪ shape using graphics
    const sx = isoX(wx, wy) + TILE_SIZE / 2;
    const sy = isoY(wx, wy) + TILE_SIZE / 2;

    const gfx = scene.add.graphics();
    // Outer glow
    gfx.fillStyle(0xffaa00, 0.4); gfx.fillCircle(0, 0, 10);
    // Main note circle
    gfx.fillStyle(0xffdd44, 1);   gfx.fillCircle(0, 0, 7);
    gfx.fillStyle(0xfff4a0, 0.8); gfx.fillCircle(-2, -2, 3);
    // Note stem
    gfx.fillStyle(0xffdd44, 1);   gfx.fillRect(5, -14, 2, 12);
    // Note flag
    gfx.fillStyle(0xffbb00, 1);   gfx.fillTriangle(7, -14, 7, -8, 13, -10);

    this.sprite = scene.add.container(sx, sy, [gfx]);
    this.sprite.setDepth(isoDepth(wx, wy) + 1.2);

    // Pulsing scale tween
    scene.tweens.add({
      targets: this.sprite,
      scaleX: { from: 0.8, to: 1.2 },
      scaleY: { from: 0.8, to: 1.2 },
      duration: 180, yoyo: true, repeat: -1
    });
  }

  update(speed: number, delta: number): void {
    if (!this.alive) return;
    const dt = delta / 1000;
    const dx = this.vx * speed * dt;
    const dy = this.vy * speed * dt;

    this.worldX += dx;
    this.worldY += dy;
    this.distTraveled += worldDist(0, 0, dx, dy);

    if (isWall(this.worldX, this.worldY) || this.distTraveled >= this.maxDist) {
      this.explode();
      return;
    }

    this.rotAngle += delta * 0.4;
    const sx = isoX(this.worldX, this.worldY) + TILE_SIZE / 2;
    const sy = isoY(this.worldX, this.worldY) + TILE_SIZE / 2;
    this.sprite.setPosition(sx, sy);
    this.sprite.setAngle(this.rotAngle);
    this.sprite.setDepth(isoDepth(this.worldX, this.worldY) + 1.2);
  }

  hitsPoint(wx: number, wy: number, r: number): boolean {
    return this.alive && worldDist(this.worldX, this.worldY, wx, wy) < this.radius + r;
  }

  explode(): void {
    if (!this.alive) return;
    this.alive = false;
    this.scene.tweens.killTweensOf(this.sprite);

    this.scene.add.particles(this.sprite.x, this.sprite.y, 'blank', {
      speed: { min: 20, max: 70 },
      scale: { start: 0.7, end: 0 },
      tint: [0xffdd44, 0xffaa00, 0xffffff, 0xff8800],
      lifespan: 300, quantity: 8, emitting: false
    }).explode(8);

    this.sprite.destroy();
  }
}
