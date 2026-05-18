import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';
import { isoX, isoY, isoDepth, isWall, worldDist } from '../utils/iso';
import {
  TILE_SIZE,
  BOSS_HP, BOSS_SPEED, BOSS_SPEED_P2, BOSS_DAMAGE, BOSS_RADIUS,
  BOSS_ORBIT_DIST, BOSS_ORBIT_DIST_P2, BOSS_PROJ_SPEED, BOSS_PROJ_DAMAGE,
  BOSS_SPREAD_CD, BOSS_SPREAD_CD_P2, BOSS_BURST_CD, BOSS_BURST_CD_P2,
  BOSS_TELEPORT_CD, BOSS_WINDUP_DUR
} from '../constants';
import type { BasePlayer as Player } from './BasePlayer';
import { BossProjectile } from './BossProjectile';

type BossState = 'entry' | 'orbit' | 'windup';

export class MindDevourer extends BaseEnemy {
  private bossState: BossState = 'entry';
  private stateTimer = 2200;
  private orbitAngle: number;
  private spreadCooldown = 1500;
  private burstCooldown = 11000;
  private teleportCooldown = BOSS_TELEPORT_CD;
  private floatPhase = Math.random() * Math.PI * 2;
  private phase: 1 | 2 = 1;
  private phase2Triggered = false;
  private trailEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

  readonly projectiles: BossProjectile[] = [];

  constructor(scene: Phaser.Scene, wx: number, wy: number) {
    super(scene, wx, wy, 'mind-devourer', BOSS_HP, BOSS_SPEED, BOSS_DAMAGE, BOSS_RADIUS);

    this.sprite.setOrigin(0.5, 0.5).setScale(1.4).setAlpha(0);
    this.orbitAngle = Math.random() * Math.PI * 2;

    const sx = isoX(wx, wy) + TILE_SIZE / 2;
    const sy = isoY(wx, wy) + TILE_SIZE / 2;

    // Spawn burst
    const burst = scene.add.particles(sx, sy, 'blank', {
      speed: { min: 70, max: 220 },
      scale: { start: 1.0, end: 0 },
      tint: [0x8800cc, 0xff44ff, 0x220044],
      lifespan: 700, quantity: 28, emitting: false
    });
    burst.explode(28);
    scene.time.delayedCall(800, () => burst.destroy());

    scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 1100, ease: 'Sine.InOut' });
    scene.cameras.main.flash(450, 100, 0, 220, false);
    scene.cameras.main.shake(320, 0.013);

    // Persistent psychic trail
    this.trailEmitter = scene.add.particles(sx, sy, 'blank', {
      speed: { min: 8, max: 45 },
      scale: { start: 0.45, end: 0 },
      tint: [0x8800cc, 0x440066, 0xcc44ff],
      lifespan: 360, frequency: 50, quantity: 2
    }).setDepth(isoDepth(wx, wy) + 0.3);
  }

  // ── Override: no knockback stun so boss fights fluidly ────────────

  takeDamage(amount: number, _dirX: number, _dirY: number): void {
    if (!this.sprite.active) return;
    this.hp -= amount;
    this.sprite.setTint(0xff2200);
    this.scene.time.delayedCall(100, () => { if (this.sprite.active) this.sprite.clearTint(); });
    if (this.hp <= 0) this.die();
  }

  // ── AI ─────────────────────────────────────────────────────────────

  updateAI(player: Player, delta: number): void {
    const speed = this.phase === 2 ? BOSS_SPEED_P2 : BOSS_SPEED;

    // Float
    this.floatPhase += delta * 0.0022;
    this.worldY += Math.sin(this.floatPhase) * 0.0025;

    // Phase 2 trigger at 50% HP
    if (!this.phase2Triggered && this.hp <= this.maxHp * 0.5) {
      this.phase2Triggered = true;
      this.phase = 2;
      this.enterPhase2();
    }

    switch (this.bossState) {
      case 'entry':
        this.stateTimer -= delta;
        if (this.stateTimer <= 0) this.bossState = 'orbit';
        break;

      case 'orbit': {
        const orbitR = this.phase === 2 ? BOSS_ORBIT_DIST_P2 : BOSS_ORBIT_DIST;
        this.orbitAngle += delta * 0.00048 * (this.phase === 2 ? 1.8 : 1);
        const tx = player.worldX + Math.cos(this.orbitAngle) * orbitR;
        const ty = player.worldY + Math.sin(this.orbitAngle) * orbitR;
        this.moveToward(tx, ty, speed, delta);

        this.spreadCooldown -= delta;
        this.burstCooldown  -= delta;
        if (this.phase === 2) this.teleportCooldown -= delta;

        if (this.spreadCooldown <= 0) {
          this.bossState = 'windup';
          this.stateTimer = this.phase === 2 ? 500 : BOSS_WINDUP_DUR;
          this.spreadCooldown = this.phase === 2 ? BOSS_SPREAD_CD_P2 : BOSS_SPREAD_CD;
        } else if (this.burstCooldown <= 0) {
          this.fireBurst();
          this.burstCooldown = this.phase === 2 ? BOSS_BURST_CD_P2 : BOSS_BURST_CD;
        } else if (this.phase === 2 && this.teleportCooldown <= 0) {
          this.doTeleport(player);
          this.teleportCooldown = BOSS_TELEPORT_CD;
        }
        break;
      }

      case 'windup': {
        this.stateTimer -= delta;
        this.sprite.setAngle(Math.sin(this.scene.time.now * 0.048) * 14);
        if (this.stateTimer <= 0) {
          this.sprite.setAngle(0);
          this.fireSpread(player);
          this.bossState = 'orbit';
        }
        break;
      }
    }

    // Update projectiles (passing player pos for homing)
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(BOSS_PROJ_SPEED, delta, player.worldX, player.worldY);
      if (!p.active) this.projectiles.splice(i, 1);
    }

    // Trail follows boss
    const sx = isoX(this.worldX, this.worldY) + TILE_SIZE / 2;
    const sy = isoY(this.worldX, this.worldY) + TILE_SIZE / 2;
    this.trailEmitter.setPosition(sx, sy).setDepth(isoDepth(this.worldX, this.worldY) + 0.3);

    this.sprite.setFlipX(player.worldX < this.worldX);

    // Publish to UI
    this.scene.registry.set('bossHP',    this.hp);
    this.scene.registry.set('bossMaxHP', this.maxHp);
    this.scene.registry.set('bossPhase', this.phase);
    this.scene.registry.set('bossActive', true);
  }

  // ── Attacks ────────────────────────────────────────────────────────

  private fireSpread(player: Player): void {
    const angle = Math.atan2(player.worldY - this.worldY, player.worldX - this.worldX);
    const count = this.phase === 2 ? 5 : 3;
    const arc   = 0.44;

    for (let i = 0; i < count; i++) {
      const a = angle - arc + (arc * 2 / (count - 1)) * i;
      const homing = this.phase === 2 ? 0.32 : 0;
      this.projectiles.push(new BossProjectile(
        this.scene, this.worldX, this.worldY - 0.5,
        Math.cos(a), Math.sin(a), BOSS_PROJ_DAMAGE, homing
      ));
    }

    this.sprite.setTint(0xff44dd);
    this.scene.time.delayedCall(180, () => { if (this.sprite.active) this.sprite.clearTint(); });
    this.scene.cameras.main.shake(75, 0.005);
  }

  private fireBurst(): void {
    const count = this.phase === 2 ? 12 : 8;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      this.projectiles.push(new BossProjectile(
        this.scene, this.worldX, this.worldY - 0.5,
        Math.cos(a), Math.sin(a), BOSS_PROJ_DAMAGE, 0
      ));
    }

    const sx = isoX(this.worldX, this.worldY) + TILE_SIZE / 2;
    const sy = isoY(this.worldX, this.worldY) + TILE_SIZE / 2;
    const e = this.scene.add.particles(sx, sy, 'blank', {
      speed: { min: 60, max: 180 },
      scale: { start: 0.9, end: 0 },
      tint: [0x8800cc, 0xff44ff, 0xffffff],
      lifespan: 450, quantity: 22, emitting: false
    });
    e.explode(22);
    this.scene.time.delayedCall(550, () => e.destroy());

    this.scene.cameras.main.flash(240, 120, 0, 190, false);
    this.scene.cameras.main.shake(120, 0.009);
  }

  private doTeleport(player: Player): void {
    let tx = this.worldX, ty = this.worldY;
    for (let attempt = 0; attempt < 12; attempt++) {
      const a = Math.random() * Math.PI * 2;
      const d = 4 + Math.random() * 5;
      const nx = Phaser.Math.Clamp(player.worldX + Math.cos(a) * d, 2, 62);
      const ny = Phaser.Math.Clamp(player.worldY + Math.sin(a) * d, 2, 46);
      if (!isWall(nx, ny)) { tx = nx; ty = ny; break; }
    }

    this.scene.tweens.add({
      targets: this.sprite, alpha: 0, duration: 140,
      onComplete: () => {
        if (!this.sprite.active) return;
        this.worldX = tx; this.worldY = ty;
        this.scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 260 });

        const sx = isoX(tx, ty) + TILE_SIZE / 2;
        const sy = isoY(tx, ty) + TILE_SIZE / 2;
        const e = this.scene.add.particles(sx, sy, 'blank', {
          speed: { min: 45, max: 140 },
          scale: { start: 0.7, end: 0 },
          tint: [0x8800cc, 0xff44ff, 0xffffff],
          lifespan: 380, quantity: 16, emitting: false
        });
        e.explode(16);
        this.scene.time.delayedCall(450, () => e.destroy());
      }
    });
  }

  private enterPhase2(): void {
    this.spreadCooldown = 700;
    this.burstCooldown  = 2200;

    this.scene.cameras.main.flash(420, 160, 0, 230, false);
    this.scene.cameras.main.shake(280, 0.016);

    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(550, () => { if (this.sprite.active) this.sprite.clearTint(); });

    const sx = isoX(this.worldX, this.worldY) + TILE_SIZE / 2;
    const sy = isoY(this.worldX, this.worldY) + TILE_SIZE / 2;
    const e = this.scene.add.particles(sx, sy, 'blank', {
      speed: { min: 90, max: 280 },
      scale: { start: 1.3, end: 0 },
      tint: [0xff0000, 0xff44ff, 0x8800cc, 0xffffff],
      lifespan: 750, quantity: 35, emitting: false
    });
    e.explode(35);
    this.scene.time.delayedCall(850, () => e.destroy());

    this.scene.registry.set('bossPhase', 2);
  }

  // ── Death ──────────────────────────────────────────────────────────

  protected die(): void {
    this.trailEmitter.destroy();
    for (const p of this.projectiles) p.splash();

    const sx = isoX(this.worldX, this.worldY) + TILE_SIZE / 2;
    const sy = isoY(this.worldX, this.worldY) + TILE_SIZE / 2;

    for (let wave = 0; wave < 3; wave++) {
      this.scene.time.delayedCall(wave * 320, () => {
        const e = this.scene.add.particles(sx, sy, 'blank', {
          speed: { min: 70 + wave * 55, max: 220 + wave * 65 },
          scale: { start: 1.1 - wave * 0.2, end: 0 },
          tint: [0x8800cc, 0xff44ff, 0xff0000, 0xffffff],
          lifespan: 750, quantity: 28 + wave * 12, emitting: false
        });
        e.explode(28 + wave * 12);
        this.scene.time.delayedCall(850, () => e.destroy());
        this.scene.cameras.main.flash(200, 100 + wave * 35, 0, 200, false);
        this.scene.cameras.main.shake(150 + wave * 65, 0.011 + wave * 0.005);
      });
    }

    this.scene.time.delayedCall(1100, () => {
      this.scene.registry.set('bossHP', 0);
      this.scene.registry.set('bossActive', false);

      const txt = this.scene.add.text(500, 370, 'VENCIDO!', {
        fontSize: '34px', color: '#ffdd44',
        fontFamily: 'monospace', stroke: '#440000', strokeThickness: 6
      }).setOrigin(0.5).setDepth(999).setScrollFactor(0);

      this.scene.tweens.add({
        targets: txt, y: 270, alpha: 0,
        duration: 3000, ease: 'Sine.Out',
        onComplete: () => txt.destroy()
      });
    });

    this.sprite.destroy();
  }
}
