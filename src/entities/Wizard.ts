import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';
import { worldDist, isWall } from '../utils/iso';
import {
  WIZARD_HP, WIZARD_SPEED, WIZARD_DAMAGE, WIZARD_DETECT,
  WIZARD_PREF_DIST, WIZARD_FLEE_DIST, WIZARD_FIRE_CD, WIZARD_RADIUS,
  PROJ_SPEED
} from '../constants';
import type { BasePlayer as Player } from './BasePlayer';
import { Projectile } from './Projectile';

type WizardState = 'idle' | 'position' | 'shoot' | 'flee';

export class Wizard extends BaseEnemy {
  private aiState: WizardState = 'idle';
  private fireCooldown: number;
  private shootTimer = 0;
  private floatPhase = Math.random() * Math.PI * 2;
  readonly projectiles: Projectile[] = [];

  constructor(scene: Phaser.Scene, wx: number, wy: number) {
    super(scene, wx, wy, 'wizard', WIZARD_HP, WIZARD_SPEED, WIZARD_DAMAGE, WIZARD_RADIUS);
    this.fireCooldown = WIZARD_FIRE_CD * (0.4 + Math.random() * 0.6);
  }

  private shoot(player: Player): void {
    const dx = player.worldX - this.worldX;
    const dy = player.worldY - this.worldY;
    this.projectiles.push(new Projectile(this.scene, this.worldX, this.worldY - 0.5, dx, dy));

    this.sprite.setTint(0xff88ff);
    this.scene.time.delayedCall(180, () => { if (this.sprite.active) this.sprite.clearTint(); });

    // Blink-teleport backward
    const wx = this.worldX, wy = this.worldY;
    const len = worldDist(this.worldX, this.worldY, player.worldX, player.worldY) || 1;
    const bx = Phaser.Math.Clamp(this.worldX - (dx / len) * 1.5, 1.5, 62.5);
    const by = Phaser.Math.Clamp(this.worldY - (dy / len) * 1.5, 1.5, 46.5);
    this.sprite.setAlpha(0.15);
    if (!isWall(bx, by)) { this.worldX = bx; this.worldY = by; } else { this.worldX = wx; this.worldY = wy; }
    this.scene.time.delayedCall(140, () => { if (this.sprite.active) this.sprite.setAlpha(1); });
  }

  updateAI(player: Player, delta: number): void {
    const dist = this.distToPlayer(player);

    // Float bob
    this.floatPhase += delta * 0.0028;
    this.worldY += Math.sin(this.floatPhase) * 0.004;

    if (this.aiState === 'idle' && dist < WIZARD_DETECT) this.aiState = 'position';
    if (this.aiState !== 'idle' && dist > WIZARD_DETECT * 1.3) this.aiState = 'idle';

    this.fireCooldown -= delta;

    switch (this.aiState) {
      case 'idle':
        this.worldX += Math.sin(this.floatPhase * 0.5) * 0.004;
        break;

      case 'flee': {
        const dx = this.worldX - player.worldX;
        const dy = this.worldY - player.worldY;
        const len = worldDist(this.worldX, this.worldY, player.worldX, player.worldY) || 1;
        this.moveToward(
          this.worldX + (dx / len) * 2,
          this.worldY + (dy / len) * 2,
          WIZARD_SPEED * 1.7, delta
        );
        if (dist > WIZARD_PREF_DIST) this.aiState = 'position';
        break;
      }

      case 'position': {
        if (dist < WIZARD_FLEE_DIST) { this.aiState = 'flee'; break; }

        if (dist < WIZARD_PREF_DIST - 0.5) {
          // Back away
          const dx = this.worldX - player.worldX;
          const dy = this.worldY - player.worldY;
          const len = worldDist(this.worldX, this.worldY, player.worldX, player.worldY) || 1;
          this.moveToward(this.worldX + dx / len, this.worldY + dy / len, WIZARD_SPEED, delta);
        } else if (dist > WIZARD_PREF_DIST + 0.5) {
          this.moveToward(player.worldX, player.worldY, WIZARD_SPEED * 0.5, delta);
        } else {
          // Strafe
          const dx = player.worldX - this.worldX;
          const dy = player.worldY - this.worldY;
          const dt = delta / 1000;
          this.worldX += -dy * WIZARD_SPEED * 0.3 * dt;
          this.worldY += dx * WIZARD_SPEED * 0.3 * dt;
        }

        if (this.fireCooldown <= 0) {
          this.aiState = 'shoot';
          this.shootTimer = 260;
          this.fireCooldown = WIZARD_FIRE_CD + Math.random() * 500;
        }
        break;
      }

      case 'shoot': {
        this.shootTimer -= delta;
        if (this.shootTimer <= 0) {
          this.shoot(player);
          this.aiState = 'position';
        }
        break;
      }
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(PROJ_SPEED, delta);
      if (!p.active) this.projectiles.splice(i, 1);
    }

    this.sprite.setFlipX(player.worldX < this.worldX);
  }
}
