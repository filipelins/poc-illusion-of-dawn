import Phaser from 'phaser';
import { isoX, isoY, isoDepth, isWall, worldDist } from '../utils/iso';
import { TILE_SIZE } from '../constants';

export class Projectile {
  worldX: number;
  worldY: number;
  readonly damage = 1;
  private vx: number;
  private vy: number;
  private sprite: Phaser.GameObjects.Sprite;
  private scene: Phaser.Scene;
  private alive = true;

  get active(): boolean { return this.alive; }

  constructor(scene: Phaser.Scene, wx: number, wy: number, tvx: number, tvy: number) {
    this.scene = scene;
    this.worldX = wx;
    this.worldY = wy;
    const len = Math.hypot(tvx, tvy) || 1;
    this.vx = (tvx / len);
    this.vy = (tvy / len);

    this.sprite = scene.add.sprite(isoX(wx, wy) + TILE_SIZE / 2, isoY(wx, wy) + TILE_SIZE / 2, 'projectile');
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setDepth(isoDepth(wx, wy) + 1);

    // Pulsing glow
    scene.tweens.add({
      targets: this.sprite,
      scaleX: { from: 0.8, to: 1.2 },
      scaleY: { from: 0.8, to: 1.2 },
      alpha: { from: 0.85, to: 1 },
      duration: 250, yoyo: true, repeat: -1
    });
  }

  update(speed: number, delta: number): void {
    if (!this.alive) return;
    const dt = delta / 1000;
    this.worldX += this.vx * speed * dt;
    this.worldY += this.vy * speed * dt;

    // Hit wall
    if (isWall(this.worldX, this.worldY)) {
      this.splash();
      return;
    }

    this.sprite.setPosition(isoX(this.worldX, this.worldY) + TILE_SIZE / 2, isoY(this.worldX, this.worldY) + TILE_SIZE / 2);
    this.sprite.setDepth(isoDepth(this.worldX, this.worldY) + 1);
  }

  hitsPoint(wx: number, wy: number, radius: number): boolean {
    return this.alive && worldDist(this.worldX, this.worldY, wx, wy) < radius + 0.3;
  }

  splash(): void {
    if (!this.alive) return;
    this.alive = false;
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.add.particles(this.sprite.x, this.sprite.y, 'blank', {
      speed: { min: 30, max: 80 },
      scale: { start: 0.5, end: 0 },
      tint: [0x9966ff, 0xccaaff, 0xffffff],
      lifespan: 260, quantity: 6, emitting: false
    }).explode(6);
    this.sprite.destroy();
  }
}
