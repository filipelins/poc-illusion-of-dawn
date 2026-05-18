import Phaser from 'phaser';
import { isoX, isoY, isoDepth } from '../utils/iso';
import {
  TILE_SIZE,
  BARD_MAX_HP, BARD_SPEED, BARD_DEFEND_SPEED,
  BARD_ATTACK_DAMAGE, BARD_LUTE_REACH, BARD_LUTE_WIDTH,
  BARD_ATTACK_DUR, BARD_ATTACK_CD,
  BARD_SPECIAL_CD, BARD_SPECIAL_SPEED, BARD_SPECIAL_RANGE
} from '../constants';
import { BasePlayer, type SpecialProjectile } from './BasePlayer';
import { NoteProjectile } from './NoteProjectile';

// 8 directions for the circular note burst (cardinal + diagonal)
const BURST_DIRS: [number, number][] = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [0.707, 0.707], [-0.707, 0.707], [0.707, -0.707], [-0.707, -0.707]
];

export class Bard extends BasePlayer {
  private luteSprite: Phaser.GameObjects.Image;
  private specialCooldown = 0;
  private notes: NoteProjectile[] = [];

  protected getMaxSpeed():       number { return BARD_SPEED; }
  protected getDefendSpeed():    number { return BARD_DEFEND_SPEED; }
  protected getAttackDuration(): number { return BARD_ATTACK_DUR; }
  protected getAttackCooldown(): number { return BARD_ATTACK_CD; }
  getAttackDamage():             number { return BARD_ATTACK_DAMAGE; }

  constructor(scene: Phaser.Scene, wx: number, wy: number) {
    super(scene, wx, wy, BARD_MAX_HP);

    this.sprite = scene.add.sprite(
      isoX(wx, wy) + TILE_SIZE / 2,
      isoY(wx, wy) + TILE_SIZE / 2,
      'bard-down'
    );
    this.sprite.setOrigin(0.5, 0.85).setDepth(isoDepth(wx, wy) + 0.5);

    this.luteSprite = scene.add.image(
      isoX(wx, wy) + TILE_SIZE / 2,
      isoY(wx, wy) + TILE_SIZE / 2,
      'lute-h'
    ).setVisible(false).setDepth(isoDepth(wx, wy) + 0.6).setOrigin(0.5, 0.5);
  }

  protected endAttack(): void {
    super.endAttack();
    this.luteSprite.setVisible(false);
  }

  // ── Special: circular note burst ────────────────────────────────────

  protected onSpecialInput(key: Phaser.Input.Keyboard.Key, delta: number): void {
    if (this.specialCooldown > 0) this.specialCooldown -= delta;

    if (Phaser.Input.Keyboard.JustDown(key) && this.specialCooldown <= 0) {
      this.fireNotes();
    }

    // Tick active notes
    for (let i = this.notes.length - 1; i >= 0; i--) {
      this.notes[i].update(BARD_SPECIAL_SPEED, delta);
      if (!this.notes[i].active) this.notes.splice(i, 1);
    }

    // Publish special readiness
    this.scene.registry.set('specialReady', this.specialCooldown <= 0);
    this.scene.registry.set('specialFrac', Math.max(0, 1 - this.specialCooldown / BARD_SPECIAL_CD));
  }

  private fireNotes(): void {
    this.specialCooldown = BARD_SPECIAL_CD;

    for (const [dx, dy] of BURST_DIRS) {
      this.notes.push(
        new NoteProjectile(this.scene, this.worldX, this.worldY, dx, dy, BARD_SPECIAL_RANGE)
      );
    }

    // Golden flash on Bard sprite
    this.sprite.setTint(0xffdd44);
    this.scene.time.delayedCall(250, () => { if (this.sprite.active) this.sprite.clearTint(); });

    // Screen shockwave
    this.scene.cameras.main.flash(120, 255, 220, 50, false);
    this.scene.cameras.main.shake(80, 0.005);
  }

  getSpecialProjectiles(): SpecialProjectile[] { return this.notes; }

  // ── Lute swing visual ───────────────────────────────────────────────

  protected updateWeapon(): void {
    if (!this._attacking) { this.luteSprite.setVisible(false); return; }

    const half = TILE_SIZE / 2;
    let sx = this.sprite.x, sy = this.sprite.y;
    let tex = 'lute-h';

    switch (this.facing) {
      case 'right': sx += half + 4; tex = 'lute-h'; break;
      case 'left':  sx -= half + 4; tex = 'lute-h'; break;
      case 'down':  sy += half + 2; tex = 'lute-v'; break;
      case 'up':    sy -= half + 2; tex = 'lute-v'; break;
    }

    this.luteSprite
      .setTexture(tex).setPosition(sx, sy).setVisible(true)
      .setDepth(isoDepth(this.worldX, this.worldY) + 0.6);
  }

  // ── Lute hitbox (wider than sword) ──────────────────────────────────

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
    return forward > 0.05 && forward < BARD_LUTE_REACH && lateral < BARD_LUTE_WIDTH / 2;
  }

  // ── Sprite sync ───────────────────────────────────────────────────

  protected syncSprite(): void {
    this.updateSpriteTransform(0.5);
    this.sprite.setTexture(`bard-${this.facing}`);
  }
}
