import Phaser from 'phaser';
import { isoX, isoY, isoDepth, isWall, worldDist } from '../utils/iso';
import { TILE_SIZE } from '../constants';

export class BossProjectile {
  worldX: number;
  worldY: number;
  readonly damage: number;
  private vx: number;
  private vy: number;
  private sprite: Phaser.GameObjects.Sprite;
  private scene: Phaser.Scene;
  private alive = true;
  private homingStrength: number;

  get active(): boolean { return this.alive; }
  readonly radius = 0.4;

  constructor(
    scene: Phaser.Scene, wx: number, wy: number,
    tvx: number, tvy: number,
    damage: number, homing = 0
  ) {
    this.scene = scene;
    this.worldX = wx;
    this.worldY = wy;
    this.damage = damage;
    this.homingStrength = homing;

    const len = Math.hypot(tvx, tvy) || 1;
    this.vx = tvx / len;
    this.vy = tvy / len;

    this.sprite = scene.add.sprite(
      isoX(wx, wy) + TILE_SIZE / 2,
      isoY(wx, wy) + TILE_SIZE / 2,
      'boss-projectile'
    );
    this.sprite.setOrigin(0.5, 0.5).setDepth(isoDepth(wx, wy) + 1);

    scene.tweens.add({
      targets: this.sprite,
      scaleX: { from: 0.7, to: 1.3 }, scaleY: { from: 0.7, to: 1.3 },
      alpha: { from: 0.8, to: 1 },
      duration: 280, yoyo: true, repeat: -1
    });
  }

  update(speed: number, delta: number, playerX?: number, playerY?: number): void {
    if (!this.alive) return;

    if (this.homingStrength > 0 && playerX !== undefined && playerY !== undefined) {
      const toAngle = Math.atan2(playerY - this.worldY, playerX - this.worldX);
      const curAngle = Math.atan2(this.vy, this.vx);
      let diff = toAngle - curAngle;
      while (diff > Math.PI)  diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const rotate = Math.min(Math.abs(diff), this.homingStrength * delta * 0.0015) * Math.sign(diff);
      const na = curAngle + rotate;
      this.vx = Math.cos(na);
      this.vy = Math.sin(na);
    }

    const dt = delta / 1000;
    this.worldX += this.vx * speed * dt;
    this.worldY += this.vy * speed * dt;

    if (isWall(this.worldX, this.worldY)) { this.splash(); return; }

    this.sprite.setPosition(isoX(this.worldX, this.worldY) + TILE_SIZE / 2, isoY(this.worldX, this.worldY) + TILE_SIZE / 2);
    this.sprite.setDepth(isoDepth(this.worldX, this.worldY) + 1);
  }

  hitsPoint(wx: number, wy: number, r: number): boolean {
    return this.alive && worldDist(this.worldX, this.worldY, wx, wy) < r + this.radius;
  }

  splash(): void {
    if (!this.alive) return;
    this.alive = false;
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.add.particles(this.sprite.x, this.sprite.y, 'blank', {
      speed: { min: 40, max: 110 },
      scale: { start: 0.6, end: 0 },
      tint: [0x8800cc, 0xff44ff, 0xffffff],
      lifespan: 300, quantity: 8, emitting: false
    }).explode(8);
    this.sprite.destroy();
  }
}
