import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';
import { moveSlide } from '../utils/iso';
import {
  SLIME_HP, SLIME_SPEED, SLIME_DAMAGE, SLIME_DETECT, SLIME_RADIUS, SLIME_WANDER_INTERVAL
} from '../constants';
import type { BasePlayer as Player } from './BasePlayer';

type SlimeState = 'wander' | 'chase';

export class Slime extends BaseEnemy {
  private aiState: SlimeState = 'wander';
  private wanderTimer = 0;
  private wanderDx = 0;
  private wanderDy = 0;
  private bouncePhase = Math.random() * Math.PI * 2;

  constructor(scene: Phaser.Scene, wx: number, wy: number) {
    super(scene, wx, wy, 'slime', SLIME_HP, SLIME_SPEED, SLIME_DAMAGE, SLIME_RADIUS);
    this.randomWander();
  }

  private randomWander(): void {
    const a = Math.random() * Math.PI * 2;
    this.wanderDx = Math.cos(a);
    this.wanderDy = Math.sin(a);
    this.wanderTimer = SLIME_WANDER_INTERVAL * (0.6 + Math.random() * 0.8);
  }

  updateAI(player: Player, delta: number): void {
    const dist = this.distToPlayer(player);

    if (this.aiState === 'wander' && dist < SLIME_DETECT) this.aiState = 'chase';
    if (this.aiState === 'chase' && dist > SLIME_DETECT * 1.5) {
      this.aiState = 'wander';
      this.randomWander();
    }

    if (this.aiState === 'chase') {
      this.moveToward(player.worldX, player.worldY, SLIME_SPEED, delta);
    } else {
      const dt = delta / 1000;
      this.wanderTimer -= delta;
      if (this.wanderTimer <= 0) this.randomWander();
      const moved = moveSlide(this.worldX, this.worldY, this.wanderDx * SLIME_SPEED * 0.55 * dt, this.wanderDy * SLIME_SPEED * 0.55 * dt, this.radius);
      // Bounce off walls
      if (moved.x === this.worldX || moved.y === this.worldY) this.randomWander();
      this.worldX = moved.x;
      this.worldY = moved.y;
    }

    // Squish animation
    this.bouncePhase += delta * 0.005;
    const s = 1 + Math.sin(this.bouncePhase) * 0.09;
    this.sprite.setScale(s, 1 / s);
  }
}
