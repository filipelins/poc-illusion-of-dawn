import Phaser from 'phaser';
import { isoX, isoY, isoDepth, moveSlide, worldDist } from '../utils/iso';
import { TILE_SIZE, ENEMY_KNOCKBACK, ENEMY_KNOCKBACK_DUR } from '../constants';
import type { BasePlayer as Player } from './BasePlayer';
import { getAudio } from '../systems/AudioSystem';

export abstract class BaseEnemy {
  worldX: number;
  worldY: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;

  protected sprite: Phaser.GameObjects.Sprite;
  protected scene: Phaser.Scene;

  private knockVx = 0;
  private knockVy = 0;
  private knockTimer = 0;
  private flashTimer = 0;

  get active(): boolean { return this.sprite.active; }
  get x(): number { return this.sprite.x; }
  get y(): number { return this.sprite.y; }

  constructor(
    scene: Phaser.Scene,
    worldX: number, worldY: number,
    texture: string,
    hp: number, speed: number, damage: number, radius: number
  ) {
    this.scene = scene;
    this.worldX = worldX;
    this.worldY = worldY;
    this.hp = hp;
    this.maxHp = hp;
    this.speed = speed;
    this.damage = damage;
    this.radius = radius;

    const sx = isoX(worldX, worldY) + TILE_SIZE / 2;
    const sy = isoY(worldX, worldY) + TILE_SIZE / 2;
    this.sprite = scene.add.sprite(sx, sy, texture);
    this.sprite.setOrigin(0.5, 0.75);
    this.syncSprite();
  }

  protected syncSprite(): void {
    const sx = isoX(this.worldX, this.worldY) + TILE_SIZE / 2;
    const sy = isoY(this.worldX, this.worldY) + TILE_SIZE / 2;
    this.sprite.setPosition(sx, sy);
    this.sprite.setDepth(isoDepth(this.worldX, this.worldY) + 0.4);
  }

  abstract updateAI(player: Player, delta: number): void;

  update(player: Player, delta: number): void {
    if (!this.sprite.active) return;

    const dt = delta / 1000;

    if (this.flashTimer > 0) {
      this.flashTimer -= delta;
      if (this.flashTimer <= 0) this.sprite.clearTint();
    }

    if (this.knockTimer > 0) {
      this.knockTimer -= delta;
      this.knockVx *= 0.85;
      this.knockVy *= 0.85;

      const moved = moveSlide(this.worldX, this.worldY, this.knockVx * dt, this.knockVy * dt, this.radius);
      this.worldX = moved.x;
      this.worldY = moved.y;
      this.syncSprite();
      return;
    }

    this.updateAI(player, delta);
    this.syncSprite();
  }

  takeDamage(amount: number, dirX: number, dirY: number): void {
    if (!this.sprite.active) return;
    this.hp -= amount;
    this.knockVx = dirX * ENEMY_KNOCKBACK;
    this.knockVy = dirY * ENEMY_KNOCKBACK;
    this.knockTimer = ENEMY_KNOCKBACK_DUR;
    this.sprite.setTint(0xff4444);
    this.flashTimer = 140;
    if (this.hp <= 0) {
      getAudio(this.scene)?.playEffect('enemyDie');
      this.die();
    } else {
      getAudio(this.scene)?.playEffect('hit');
    }
  }

  isAlive(): boolean { return this.hp > 0 && this.sprite.active; }

  distToPlayer(player: Player): number {
    return worldDist(this.worldX, this.worldY, player.worldX, player.worldY);
  }

  protected moveToward(tx: number, ty: number, spd: number, delta: number): void {
    const dt = delta / 1000;
    const dist = worldDist(this.worldX, this.worldY, tx, ty);
    if (dist < 0.01) return;
    const dx = ((tx - this.worldX) / dist) * spd * dt;
    const dy = ((ty - this.worldY) / dist) * spd * dt;
    const pos = moveSlide(this.worldX, this.worldY, dx, dy, this.radius);
    this.worldX = pos.x;
    this.worldY = pos.y;
  }

  protected die(): void {
    const sx = isoX(this.worldX, this.worldY) + TILE_SIZE / 2;
    const sy = isoY(this.worldX, this.worldY) + TILE_SIZE / 2;
    const particles = this.scene.add.particles(sx, sy, 'blank', {
      speed: { min: 30, max: 100 },
      scale: { start: 0.6, end: 0 },
      tint: [0xffdd44, 0xff8800, 0xffffff],
      lifespan: 380,
      quantity: 10,
      emitting: false
    });
    particles.explode(10);
    this.scene.time.delayedCall(500, () => particles.destroy());
    this.sprite.destroy();
  }
}
