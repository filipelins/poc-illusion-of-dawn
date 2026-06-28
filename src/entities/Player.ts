import Phaser from 'phaser';
import { isoX, isoY, isoDepth } from '../utils/iso';
import { getAudio } from '../systems/AudioSystem';
import {
  TILE_SIZE,
  PLAYER_SPEED, PLAYER_DEFEND_SPEED, PLAYER_MAX_HP,
  PLAYER_ATTACK_DAMAGE, PLAYER_SWORD_REACH, PLAYER_SWORD_WIDTH,
  PLAYER_SWORD_DUR, PLAYER_SWORD_CD,
  KNIGHT_FURY_DUR, KNIGHT_FURY_CD, KNIGHT_FURY_DMG_MULT,
} from '../constants';
import { BasePlayer } from './BasePlayer';

export class Player extends BasePlayer {
  private swordSprite: Phaser.GameObjects.Image;

  // ── Fúria ──────────────────────────────────────────────────────────
  private furyActive    = false;
  private furyTimer     = 0;
  private furyCooldown  = 0;
  private furyAura:     Phaser.GameObjects.Graphics;
  private furyEmitter:  Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  protected getMaxSpeed():       number { return PLAYER_SPEED; }
  protected getDefendSpeed():    number { return PLAYER_DEFEND_SPEED; }
  protected getAttackDuration(): number { return PLAYER_SWORD_DUR; }
  protected getAttackCooldown(): number { return PLAYER_SWORD_CD; }
  getAttackDamage():             number {
    return PLAYER_ATTACK_DAMAGE * (this.furyActive ? KNIGHT_FURY_DMG_MULT : 1);
  }

  // Invulnerável durante a fúria
  takeDamage(amount: number, dirX: number, dirY: number): void {
    if (this.furyActive) return;
    super.takeDamage(amount, dirX, dirY);
  }

  constructor(scene: Phaser.Scene, wx: number, wy: number) {
    super(scene, wx, wy, PLAYER_MAX_HP);

    this.sprite = scene.add.sprite(
      isoX(wx, wy) + TILE_SIZE / 2,
      isoY(wx, wy) + TILE_SIZE / 2,
      'player-down'
    );
    this.sprite.setOrigin(0.5, 0.85).setDepth(isoDepth(wx, wy) + 0.5);

    this.swordSprite = scene.add.image(
      isoX(wx, wy) + TILE_SIZE / 2,
      isoY(wx, wy) + TILE_SIZE / 2,
      'sword-h'
    ).setVisible(false).setDepth(isoDepth(wx, wy) + 0.6).setOrigin(0.5, 0.5);

    this.furyAura = scene.add.graphics().setDepth(isoDepth(wx, wy) + 0.45);
  }

  protected endAttack(): void {
    super.endAttack();
    this.swordSprite.setVisible(false);
  }

  // ── Fúria: habilidade especial ────────────────────────────────────

  protected onSpecialInput(key: Phaser.Input.Keyboard.Key, delta: number): void {
    if (this.furyCooldown > 0) this.furyCooldown -= delta;

    if (this.furyActive) {
      this.furyTimer -= delta;
      if (this.furyTimer <= 0) this.deactivateFury();
    }

    if (this.isSpecialJustPressed(key) && this.furyCooldown <= 0 && !this.furyActive) {
      getAudio(this.scene)?.playEffect('special');
      this.activateFury();
    }

    // Aura pulsante durante a fúria
    if (this.furyActive) {
      const sx = isoX(this.worldX, this.worldY) + TILE_SIZE / 2;
      const sy = isoY(this.worldX, this.worldY) + TILE_SIZE / 2;
      const a  = 0.14 + Math.sin(this.scene.time.now * 0.012) * 0.09;
      this.furyAura.clear();
      this.furyAura.fillStyle(0xff4400, a);
      this.furyAura.fillCircle(sx, sy, 30);
      this.furyAura.lineStyle(2, 0xff8800, 0.5);
      this.furyAura.strokeCircle(sx, sy, 30);
      this.furyAura.setDepth(isoDepth(this.worldX, this.worldY) + 0.45);
      if (this.furyEmitter) {
        this.furyEmitter.setPosition(sx, sy)
          .setDepth(isoDepth(this.worldX, this.worldY) + 0.48);
      }
    } else {
      this.furyAura.clear();
    }

    const ready = this.furyCooldown <= 0 && !this.furyActive;
    this.scene.registry.set('specialReady', ready);
    this.scene.registry.set('specialFrac',
      this.furyActive
        ? 1
        : Math.max(0, 1 - this.furyCooldown / KNIGHT_FURY_CD)
    );
    this.scene.registry.set('furyActive', this.furyActive);
  }

  private activateFury(): void {
    this.furyActive   = true;
    this.furyTimer    = KNIGHT_FURY_DUR;
    this.furyCooldown = KNIGHT_FURY_CD + KNIGHT_FURY_DUR;

    this.scene.cameras.main.flash(300, 255, 90, 0, false);
    this.scene.cameras.main.shake(220, 0.013);
    this.sprite.setTint(0xff6600);

    // Emitter de fogo persistente
    const sx = isoX(this.worldX, this.worldY) + TILE_SIZE / 2;
    const sy = isoY(this.worldX, this.worldY) + TILE_SIZE / 2;

    this.furyEmitter = this.scene.add.particles(sx, sy, 'blank', {
      speed:    { min: 18, max: 55 },
      scale:    { start: 0.65, end: 0 },
      tint:     [0xff2200, 0xff6600, 0xffaa00, 0xffcc44],
      lifespan: 380,
      frequency: 35,
      quantity:  2,
    }).setDepth(isoDepth(this.worldX, this.worldY) + 0.48);

    // Explosão inicial
    const burst = this.scene.add.particles(sx, sy, 'blank', {
      speed:    { min: 55, max: 200 },
      scale:    { start: 0.85, end: 0 },
      tint:     [0xff2200, 0xff6600, 0xffaa00, 0xffffff],
      lifespan: 520,
      quantity:  28,
      emitting: false,
    });
    burst.explode(28);
    this.scene.time.delayedCall(620, () => burst.destroy());
  }

  private deactivateFury(): void {
    this.furyActive = false;

    if (this.sprite.active) this.sprite.clearTint();
    if (this.furyEmitter)   { this.furyEmitter.destroy(); this.furyEmitter = null; }
    this.furyAura.clear();

    this.scene.cameras.main.flash(220, 200, 80, 0, false);
  }

  // ── Sword visuals ──────────────────────────────────────────────────

  protected updateWeapon(): void {
    if (!this._attacking) { this.swordSprite.setVisible(false); return; }

    const half = TILE_SIZE / 2;
    let sx = this.sprite.x, sy = this.sprite.y;
    let tex = 'sword-h';

    switch (this.facing) {
      case 'right': sx += half + 4; tex = 'sword-h'; break;
      case 'left':  sx -= half + 4; tex = 'sword-h'; break;
      case 'down':  sy += half + 2; tex = 'sword-v'; break;
      case 'up':    sy -= half + 2; tex = 'sword-v'; break;
    }

    this.swordSprite
      .setTexture(tex).setPosition(sx, sy).setVisible(true)
      .setDepth(isoDepth(this.worldX, this.worldY) + 0.6);
  }

  // ── Sword hitbox ───────────────────────────────────────────────────

  checkSwordHit(ewx: number, ewy: number): boolean {
    if (!this._attacking) return false;
    const ex = ewx - this.worldX, ey = ewy - this.worldY;
    let fdx = 0, fdy = 0;
    switch (this.facing) {
      case 'right': fdx =  1; fdy =  0; break;
      case 'left':  fdx = -1; fdy =  0; break;
      case 'down':  fdx =  0; fdy =  1; break;
      case 'up':    fdx =  0; fdy = -1; break;
    }
    const px = -fdy, py = fdx;
    const forward = ex * fdx + ey * fdy;
    const lateral = Math.abs(ex * px + ey * py);
    return forward > 0.05 && forward < PLAYER_SWORD_REACH && lateral < PLAYER_SWORD_WIDTH / 2;
  }

  // ── Sprite sync ───────────────────────────────────────────────────

  protected syncSprite(): void {
    this.updateSpriteTransform(0.5);
    this.sprite.setTexture(`player-${this.facing}`);
  }
}
