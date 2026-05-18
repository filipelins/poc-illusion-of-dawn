import Phaser from 'phaser';
import { isoX, isoY, isoDepth, moveSlide } from '../utils/iso';
import { TILE_SIZE, PLAYER_INVINCIBILITY, PLAYER_KNOCKBACK, PLAYER_RADIUS } from '../constants';

export type TopDir = 'down' | 'up' | 'left' | 'right';

export interface SpecialProjectile {
  readonly active: boolean;
  readonly worldX: number;
  readonly worldY: number;
  readonly damage: number;
  readonly radius: number;
  update(speed: number, delta: number): void;
  hitsPoint(wx: number, wy: number, r: number): boolean;
  explode(): void;
}

export abstract class BasePlayer {
  worldX: number;
  worldY: number;
  hp: number;
  readonly maxHp: number;
  readonly radius = PLAYER_RADIUS;

  protected facing: TopDir = 'down';
  protected _attacking = false;
  protected _defending = false;
  protected attackTimer = 0;
  protected attackCooldown = 0;
  private invincibilityTimer = 0;
  private flashTimer = 0;
  private knockVx = 0;
  private knockVy = 0;
  private knockTimer = 0;

  readonly hitEnemies = new Set<object>();
  protected sprite!: Phaser.GameObjects.Sprite;
  protected scene: Phaser.Scene;

  get x(): number { return this.sprite.x; }
  get y(): number { return this.sprite.y; }
  get active(): boolean { return this.sprite.active; }

  isAttacking():  boolean { return this._attacking; }
  isDefending():  boolean { return this._defending; }
  isInvincible(): boolean { return this.invincibilityTimer > 0; }
  getFacing():    TopDir  { return this.facing; }

  // Subclass must implement:
  abstract getAttackDamage(): number;
  abstract checkSwordHit(ewx: number, ewy: number): boolean;
  protected abstract getAttackDuration():  number;
  protected abstract getAttackCooldown():  number;
  protected abstract getMaxSpeed():        number;
  protected abstract getDefendSpeed():     number;
  protected abstract updateWeapon():       void;
  protected abstract syncSprite():         void;

  // Optional override:
  getSpecialProjectiles(): SpecialProjectile[] { return []; }
  getAttackProjectiles():  SpecialProjectile[] { return []; }
  protected onSpecialInput(_key: Phaser.Input.Keyboard.Key, _delta: number): void {}
  protected endAttack(): void { this._attacking = false; }

  isBlockingDir(dirX: number, dirY: number): boolean {
    switch (this.facing) {
      case 'right': return dirX < 0;
      case 'left':  return dirX > 0;
      case 'down':  return dirY < 0;
      case 'up':    return dirY > 0;
    }
  }

  constructor(scene: Phaser.Scene, wx: number, wy: number, maxHp: number) {
    this.scene = scene;
    this.worldX = wx;
    this.worldY = wy;
    this.maxHp = maxHp;
    this.hp = maxHp;
  }

  update(
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    attackKey:  Phaser.Input.Keyboard.Key,
    defendKey:  Phaser.Input.Keyboard.Key,
    specialKey: Phaser.Input.Keyboard.Key,
    delta: number
  ): void {
    this.tickTimers(delta);
    this.handleDefend(defendKey);
    this.handleAttackInput(attackKey);
    this.onSpecialInput(specialKey, delta);
    this.handleMovement(cursors, delta);
    this.updateWeapon();
    this.updateFlash(delta);
    this.syncSprite();
    this.publishRegistry();
  }

  // ── Shared: timers ─────────────────────────────────────────────────

  private tickTimers(delta: number): void {
    if (this.attackTimer > 0) {
      this.attackTimer -= delta;
      if (this.attackTimer <= 0) this.endAttack();
    }
    if (this.attackCooldown > 0) this.attackCooldown -= delta;
    if (this.invincibilityTimer > 0) this.invincibilityTimer -= delta;
    if (this.knockTimer > 0) {
      this.knockTimer -= delta;
      this.knockVx *= 0.82;
      this.knockVy *= 0.82;
    }
  }

  // ── Shared: defend ─────────────────────────────────────────────────

  private handleDefend(key: Phaser.Input.Keyboard.Key): void {
    if (!this._attacking) this._defending = key.isDown;
  }

  // ── Shared: attack input ───────────────────────────────────────────

  protected handleAttackInput(key: Phaser.Input.Keyboard.Key): void {
    if (Phaser.Input.Keyboard.JustDown(key) && this.attackCooldown <= 0 && !this._attacking) {
      this.beginAttack();
    }
  }

  protected beginAttack(): void {
    this._attacking = true;
    this._defending = false;
    this.attackTimer = this.getAttackDuration();
    this.attackCooldown = this.getAttackCooldown();
    this.hitEnemies.clear();
    this.scene.cameras.main.shake(55, 0.004);
  }

  // ── Shared: movement ───────────────────────────────────────────────

  private handleMovement(cursors: Phaser.Types.Input.Keyboard.CursorKeys, delta: number): void {
    const dt = delta / 1000;
    const ck = cursors as unknown as Record<string, Phaser.Input.Keyboard.Key>;

    const up    = cursors.up.isDown    || ck['W']?.isDown;
    const down  = cursors.down.isDown  || ck['S']?.isDown;
    const left  = cursors.left.isDown  || ck['A']?.isDown;
    const right = cursors.right.isDown || ck['D']?.isDown;

    let dx = 0, dy = 0;
    if (up)    dy -= 1;
    if (down)  dy += 1;
    if (left)  dx -= 1;
    if (right) dx += 1;

    if (!this._attacking && (dx !== 0 || dy !== 0)) {
      if (Math.abs(dy) >= Math.abs(dx)) {
        this.facing = dy > 0 ? 'down' : 'up';
      } else {
        this.facing = dx > 0 ? 'right' : 'left';
      }
    }

    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    const spd = this._defending ? this.getDefendSpeed() : this.getMaxSpeed();
    const moveDx = (dx * spd + (this.knockTimer > 0 ? this.knockVx : 0)) * dt;
    const moveDy = (dy * spd + (this.knockTimer > 0 ? this.knockVy : 0)) * dt;

    if (moveDx !== 0 || moveDy !== 0) {
      const moved = moveSlide(this.worldX, this.worldY, moveDx, moveDy, this.radius);
      this.worldX = moved.x;
      this.worldY = moved.y;
    }

    if ((dx !== 0 || dy !== 0) && !this._attacking) {
      this.sprite.setAngle(Math.sin(this.scene.time.now * 0.014) * 3);
    } else if (!this._attacking) {
      this.sprite.setAngle(0);
    }
  }

  // ── Shared: damage ────────────────────────────────────────────────

  takeDamage(amount: number, dirX: number, dirY: number): void {
    if (this.invincibilityTimer > 0) return;
    this.hp = Math.max(0, this.hp - amount);
    this.invincibilityTimer = PLAYER_INVINCIBILITY;
    this.flashTimer = 0;
    this.knockVx = dirX * PLAYER_KNOCKBACK;
    this.knockVy = dirY * PLAYER_KNOCKBACK;
    this.knockTimer = 260;
    this.scene.cameras.main.flash(100, 255, 50, 50, false);
    this.scene.cameras.main.shake(90, 0.007);
    if (this.hp <= 0) this.onDie();
  }

  // ── Shared: flash on hit ──────────────────────────────────────────

  private updateFlash(delta: number): void {
    if (this.invincibilityTimer > 0) {
      this.flashTimer -= delta;
      if (this.flashTimer <= 0) {
        this.flashTimer = 110;
        this.sprite.setAlpha(this.sprite.alpha < 1 ? 1 : 0.25);
      }
    } else {
      this.sprite.setAlpha(1);
    }
  }

  // ── Shared: sprite position helper ───────────────────────────────

  protected updateSpriteTransform(depthOffset = 0.5): void {
    const sx = isoX(this.worldX, this.worldY) + TILE_SIZE / 2;
    const sy = isoY(this.worldX, this.worldY) + TILE_SIZE / 2;
    this.sprite.setPosition(sx, sy);
    this.sprite.setDepth(isoDepth(this.worldX, this.worldY) + depthOffset);
  }

  // ── Shared: registry ─────────────────────────────────────────────

  protected publishRegistry(): void {
    this.scene.registry.set('playerHP', this.hp);
    this.scene.registry.set('playerMaxHP', this.maxHp);
    this.scene.registry.set('playerDefending', this._defending);
    this.scene.registry.set('playerAttacking', this._attacking);
  }

  private onDie(): void {
    this.scene.cameras.main.fade(800, 0, 0, 0);
    this.scene.time.delayedCall(900, () => this.scene.scene.restart());
  }
}
