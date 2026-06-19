import Phaser from 'phaser';
import {
  VILLAGER_SPEED, VILLAGER_DAMAGE, VILLAGER_HP,
  VILLAGER_RADIUS, VILLAGER_DETECT_RANGE, VILLAGER_WANDER_INT,
} from '../constants';
import { isoX, isoY, moveSlide } from '../utils/iso';

type VState = 'happy' | 'desperate' | 'aggro';

export class Villager extends Phaser.GameObjects.Sprite {
  worldX: number;
  worldY: number;
  hp = VILLAGER_HP;
  readonly damage = VILLAGER_DAMAGE;
  readonly radius = VILLAGER_RADIUS;

  private vstate: VState = 'happy';
  private wanderX  = 0;
  private wanderY  = 0;
  private wanderTimer = 0;

  constructor(scene: Phaser.Scene, wx: number, wy: number) {
    super(scene, isoX(wx, wy), isoY(wx, wy), 'npc-happy');
    this.worldX = wx;
    this.worldY = wy;
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    this.setOrigin(0.5, 0.9).setDepth(wy);
  }

  setRealm(dark: boolean): void {
    if (!dark) {
      this.vstate = 'happy';
      this.hp    = VILLAGER_HP;
      this.setTexture('npc-happy').clearTint();
    } else {
      const aggro = Math.random() < 0.30;
      this.vstate = aggro ? 'aggro' : 'desperate';
      this.setTexture(aggro ? 'npc-aggro' : 'npc-desperate');
      if (!aggro) this.setTint(0xaaaacc);
    }
  }

  isAggro(): boolean  { return this.vstate === 'aggro'; }
  isAlive(): boolean  { return this.active && this.hp > 0; }

  takeDamage(dmg: number): void {
    if (!this.active) return;
    this.hp -= dmg;
    this.setTint(0xff5555);
    this.scene.time.delayedCall(80, () => {
      if (!this.active) return;
      if (this.vstate === 'desperate') this.setTint(0xaaaacc);
      else this.clearTint();
    });
    if (this.hp <= 0) this.die();
  }

  private die(): void {
    this.scene.add.particles(this.x, this.y - 8, 'blank', {
      speed: { min: 25, max: 70 }, scale: { start: 0.3, end: 0 },
      tint: [0x8844aa, 0x441133], lifespan: 220, quantity: 4, emitting: false,
    }).explode(4);
    this.destroy();
  }

  update(playerWx: number, playerWy: number, delta: number): void {
    if (!this.active) return;
    const dt = delta / 1000;
    let dx = 0, dy = 0;

    if (this.vstate === 'happy') {
      this.wanderTimer -= delta;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = VILLAGER_WANDER_INT + Math.random() * 2000;
        if (Math.random() < 0.25) {
          this.wanderX = 0; this.wanderY = 0;
        } else {
          const a = Math.random() * Math.PI * 2;
          this.wanderX = Math.cos(a); this.wanderY = Math.sin(a);
        }
      }
      dx = this.wanderX * VILLAGER_SPEED * dt;
      dy = this.wanderY * VILLAGER_SPEED * dt;

    } else if (this.vstate === 'aggro') {
      const ddx  = playerWx - this.worldX;
      const ddy  = playerWy - this.worldY;
      const dist = Math.hypot(ddx, ddy);
      if (dist > 0.01 && dist < VILLAGER_DETECT_RANGE) {
        dx = (ddx / dist) * VILLAGER_SPEED * 1.5 * dt;
        dy = (ddy / dist) * VILLAGER_SPEED * 1.5 * dt;
      } else if (dist >= VILLAGER_DETECT_RANGE) {
        this.wanderTimer -= delta;
        if (this.wanderTimer <= 0) {
          this.wanderTimer = 1800 + Math.random() * 1200;
          const a = Math.random() * Math.PI * 2;
          this.wanderX = Math.cos(a); this.wanderY = Math.sin(a);
        }
        dx = this.wanderX * VILLAGER_SPEED * dt;
        dy = this.wanderY * VILLAGER_SPEED * dt;
      }
    }
    // desperate state: stationary

    if (dx !== 0 || dy !== 0) {
      const pos = moveSlide(this.worldX, this.worldY, dx, dy, this.radius);
      this.worldX = pos.x;
      this.worldY = pos.y;
    }

    this.x = isoX(this.worldX, this.worldY);
    this.y = isoY(this.worldX, this.worldY);
    this.setDepth(this.worldY);
  }
}
