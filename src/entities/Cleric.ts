import Phaser from 'phaser';
import { isoX, isoY, isoDepth } from '../utils/iso';
import { getAudio } from '../systems/AudioSystem';
import {
  TILE_SIZE,
  CLERIC_MAX_HP, CLERIC_SPEED, CLERIC_DEFEND_SPEED,
  CLERIC_ATTACK_DAMAGE, CLERIC_BOLT_SPEED, CLERIC_BOLT_RANGE,
  CLERIC_ATTACK_DUR, CLERIC_ATTACK_CD,
  CLERIC_SPECIAL_CD, CLERIC_SPECIAL_DUR
} from '../constants';
import { BasePlayer, type SpecialProjectile } from './BasePlayer';
import { MagicBolt } from './MagicBolt';

export class Cleric extends BasePlayer {
  private staffSprite: Phaser.GameObjects.Image;
  private specialCooldown = 0;
  private realmTimer = 0;
  private realmActive = false;
  private bolts: MagicBolt[] = [];
  private realmAura: Phaser.GameObjects.Graphics;

  protected getMaxSpeed():       number { return CLERIC_SPEED; }
  protected getDefendSpeed():    number { return CLERIC_DEFEND_SPEED; }
  protected getAttackDuration(): number { return CLERIC_ATTACK_DUR; }
  protected getAttackCooldown(): number { return CLERIC_ATTACK_CD; }
  getAttackDamage():             number {
    return CLERIC_ATTACK_DAMAGE * (this.realmActive ? 2 : 1);
  }

  constructor(scene: Phaser.Scene, wx: number, wy: number) {
    super(scene, wx, wy, CLERIC_MAX_HP);

    this.sprite = scene.add.sprite(
      isoX(wx, wy) + TILE_SIZE / 2,
      isoY(wx, wy) + TILE_SIZE / 2,
      'cleric-down'
    );
    this.sprite.setOrigin(0.5, 0.85).setDepth(isoDepth(wx, wy) + 0.5);

    this.staffSprite = scene.add.image(
      isoX(wx, wy) + TILE_SIZE / 2,
      isoY(wx, wy) + TILE_SIZE / 2,
      'staff-h'
    ).setVisible(false).setDepth(isoDepth(wx, wy) + 0.6).setOrigin(0.5, 0.5);

    this.realmAura = scene.add.graphics().setDepth(isoDepth(wx, wy) + 0.45);
  }

  protected beginAttack(): void {
    super.beginAttack();
    let dx = 0, dy = 0;
    switch (this.facing) {
      case 'right': dx =  1; break;
      case 'left':  dx = -1; break;
      case 'down':  dy =  1; break;
      case 'up':    dy = -1; break;
    }
    this.bolts.push(new MagicBolt(
      this.scene,
      this.worldX + dx * 0.5, this.worldY + dy * 0.5 - 0.3,
      dx, dy, this.getAttackDamage(), CLERIC_BOLT_RANGE
    ));
    this.scene.cameras.main.flash(70, 30, 80, 210, false);
  }

  protected endAttack(): void {
    super.endAttack();
    this.staffSprite.setVisible(false);
  }

  getAttackProjectiles(): SpecialProjectile[] { return this.bolts; }

  protected onSpecialInput(key: Phaser.Input.Keyboard.Key, delta: number): void {
    if (this.specialCooldown > 0) this.specialCooldown -= delta;

    if (this.realmActive) {
      this.realmTimer -= delta;
      if (this.realmTimer <= 0) this.deactivateRealm();
    }

    for (let i = this.bolts.length - 1; i >= 0; i--) {
      this.bolts[i].update(CLERIC_BOLT_SPEED, delta);
      if (!this.bolts[i].active) this.bolts.splice(i, 1);
    }

    if (this.isSpecialJustPressed(key) && this.specialCooldown <= 0 && !this.realmActive) {
      getAudio(this.scene)?.playEffect('special');
      this.activateRealm();
    }

    // Pulsing aura during realm
    if (this.realmActive) {
      const sx = isoX(this.worldX, this.worldY) + TILE_SIZE / 2;
      const sy = isoY(this.worldX, this.worldY) + TILE_SIZE / 2;
      const a = 0.12 + Math.sin(this.scene.time.now * 0.009) * 0.07;
      this.realmAura.clear();
      this.realmAura.fillStyle(0xaaddff, a);
      this.realmAura.fillCircle(sx, sy, 28);
      this.realmAura.setDepth(isoDepth(this.worldX, this.worldY) + 0.49);
    } else {
      this.realmAura.clear();
    }

    const ready = this.specialCooldown <= 0 && !this.realmActive;
    this.scene.registry.set('specialReady', ready);
    this.scene.registry.set('specialFrac',
      this.realmActive ? 1 : Math.max(0, 1 - this.specialCooldown / CLERIC_SPECIAL_CD)
    );
    this.scene.registry.set('clericRealm', this.realmActive);
  }

  private activateRealm(): void {
    this.realmActive = true;
    this.realmTimer = CLERIC_SPECIAL_DUR;
    // Cooldown includes the realm duration so it starts after realm ends
    this.specialCooldown = CLERIC_SPECIAL_CD + CLERIC_SPECIAL_DUR;

    this.scene.cameras.main.flash(320, 80, 0, 200, false);
    this.scene.cameras.main.shake(160, 0.009);

    this.sprite.setTint(0xbbaaff);
    this.scene.time.delayedCall(420, () => { if (this.sprite.active) this.sprite.clearTint(); });
  }

  private deactivateRealm(): void {
    this.realmActive = false;
    this.scene.cameras.main.flash(220, 50, 0, 140, false);
  }

  protected updateWeapon(): void {
    if (!this._attacking) { this.staffSprite.setVisible(false); return; }

    const half = TILE_SIZE / 2;
    let sx = this.sprite.x, sy = this.sprite.y;
    let tex = 'staff-h';
    let fx = false, fy = false;

    switch (this.facing) {
      case 'right': sx += half + 4; break;
      case 'left':  sx -= half + 4; fx = true; break;
      case 'down':  sy += half + 2; tex = 'staff-v'; break;
      case 'up':    sy -= half + 2; tex = 'staff-v'; fy = true; break;
    }

    this.staffSprite
      .setTexture(tex).setPosition(sx, sy).setVisible(true)
      .setFlipX(fx).setFlipY(fy)
      .setDepth(isoDepth(this.worldX, this.worldY) + 0.6);
  }

  checkSwordHit(_ewx: number, _ewy: number): boolean { return false; }

  protected syncSprite(): void {
    this.updateSpriteTransform(0.5);
    this.sprite.setTexture(`cleric-${this.facing}`);
  }
}
