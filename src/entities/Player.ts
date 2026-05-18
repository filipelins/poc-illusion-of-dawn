import Phaser from 'phaser';
import { isoX, isoY, isoDepth } from '../utils/iso';
import {
  TILE_SIZE,
  PLAYER_SPEED, PLAYER_DEFEND_SPEED, PLAYER_MAX_HP,
  PLAYER_ATTACK_DAMAGE, PLAYER_SWORD_REACH, PLAYER_SWORD_WIDTH,
  PLAYER_SWORD_DUR, PLAYER_SWORD_CD
} from '../constants';
import { BasePlayer } from './BasePlayer';

export class Player extends BasePlayer {
  private swordSprite: Phaser.GameObjects.Image;

  protected getMaxSpeed():       number { return PLAYER_SPEED; }
  protected getDefendSpeed():    number { return PLAYER_DEFEND_SPEED; }
  protected getAttackDuration(): number { return PLAYER_SWORD_DUR; }
  protected getAttackCooldown(): number { return PLAYER_SWORD_CD; }
  getAttackDamage():             number { return PLAYER_ATTACK_DAMAGE; }

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
  }

  protected endAttack(): void {
    super.endAttack();
    this.swordSprite.setVisible(false);
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
