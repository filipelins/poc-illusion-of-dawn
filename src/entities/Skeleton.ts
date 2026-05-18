import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';
import { moveSlide, worldDist } from '../utils/iso';
import {
  SKELETON_HP, SKELETON_SPEED, SKELETON_CHARGE_SPEED, SKELETON_DAMAGE,
  SKELETON_DETECT, SKELETON_ALERT_DUR, SKELETON_CHARGE_DUR,
  SKELETON_STUN_DUR, SKELETON_RADIUS
} from '../constants';
import type { BasePlayer as Player } from './BasePlayer';

type SkeletonState = 'patrol' | 'alert' | 'charge' | 'stunned';

export class Skeleton extends BaseEnemy {
  private aiState: SkeletonState = 'patrol';
  private stateTimer = 0;
  private patrolAx: number;
  private patrolAy: number;
  private patrolBx: number;
  private patrolBy: number;
  private patrolIdx: 0 | 1 = 0;
  private chargeVx = 0;
  private chargeVy = 0;
  private prevX = 0;
  private prevY = 0;

  constructor(scene: Phaser.Scene, wx: number, wy: number) {
    super(scene, wx, wy, 'skeleton', SKELETON_HP, SKELETON_SPEED, SKELETON_DAMAGE, SKELETON_RADIUS);
    const offset = 1.5 + Math.random() * 1.5;
    this.patrolAx = wx - offset; this.patrolAy = wy;
    this.patrolBx = wx + offset; this.patrolBy = wy;
  }

  private enterAlert(): void {
    this.aiState = 'alert';
    this.stateTimer = SKELETON_ALERT_DUR;
    this.sprite.setTint(0xffaa00);
    this.scene.time.delayedCall(SKELETON_ALERT_DUR, () => { if (this.sprite.active) this.sprite.clearTint(); });
  }

  private enterCharge(px: number, py: number): void {
    this.aiState = 'charge';
    this.stateTimer = SKELETON_CHARGE_DUR;
    const d = worldDist(this.worldX, this.worldY, px, py);
    this.chargeVx = ((px - this.worldX) / d) * SKELETON_CHARGE_SPEED;
    this.chargeVy = ((py - this.worldY) / d) * SKELETON_CHARGE_SPEED;
  }

  updateAI(player: Player, delta: number): void {
    const dt = delta / 1000;
    const dist = this.distToPlayer(player);

    this.prevX = this.worldX;
    this.prevY = this.worldY;

    switch (this.aiState) {
      case 'patrol': {
        const tx = this.patrolIdx === 0 ? this.patrolAx : this.patrolBx;
        const ty = this.patrolIdx === 0 ? this.patrolAy : this.patrolBy;
        this.moveToward(tx, ty, SKELETON_SPEED * 0.6, delta);
        if (worldDist(this.worldX, this.worldY, tx, ty) < 0.2) {
          this.patrolIdx = this.patrolIdx === 0 ? 1 : 0;
        }
        if (dist < SKELETON_DETECT) this.enterAlert();
        break;
      }
      case 'alert': {
        this.stateTimer -= delta;
        if (this.stateTimer <= 0) this.enterCharge(player.worldX, player.worldY);
        // Wobble in place
        this.sprite.setAngle(Math.sin(this.scene.time.now * 0.02) * 8);
        break;
      }
      case 'charge': {
        this.stateTimer -= delta;
        const moved = moveSlide(this.worldX, this.worldY, this.chargeVx * dt, this.chargeVy * dt, this.radius);
        this.worldX = moved.x;
        this.worldY = moved.y;

        // Hit wall = stun
        const still = worldDist(this.worldX, this.worldY, this.prevX, this.prevY) < 0.005;
        if (still && this.stateTimer > 150) {
          this.aiState = 'stunned';
          this.stateTimer = SKELETON_STUN_DUR;
          this.sprite.setTint(0x8888ff);
          this.sprite.setAngle(0);
          break;
        }
        if (this.stateTimer <= 0 || dist > SKELETON_DETECT * 1.6) {
          this.aiState = 'patrol';
          this.sprite.clearTint();
          this.sprite.setAngle(0);
        }
        break;
      }
      case 'stunned': {
        this.stateTimer -= delta;
        // Spin while stunned
        this.sprite.setAngle(this.sprite.angle + delta * 0.4);
        if (this.stateTimer <= 0) {
          this.aiState = 'patrol';
          this.sprite.clearTint();
          this.sprite.setAngle(0);
          if (dist < SKELETON_DETECT) this.enterAlert();
        }
        break;
      }
    }

    this.sprite.setFlipX(player.worldX < this.worldX);
  }
}
