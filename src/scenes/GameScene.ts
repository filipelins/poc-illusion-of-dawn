import Phaser from 'phaser';
import {
  TILE_SIZE, MAP_COLS, MAP_ROWS, MAP_DATA,
  WORLD_W, WORLD_H, CONTACT_RADIUS, PROJ_SPEED, SOLID_TILES,
  BOSS_CONTACT_DIST, CASTLE_DOOR_WX, CASTLE_DOOR_WY
} from '../constants';
import { worldDist, isWall, setCurrentMap } from '../utils/iso';
import { getAudio } from '../systems/AudioSystem';
import { Player }  from '../entities/Player';
import { Bard }    from '../entities/Bard';
import { Cleric }       from '../entities/Cleric';
import { MindDevourer } from '../entities/MindDevourer';
import type { BasePlayer } from '../entities/BasePlayer';
import { Slime }   from '../entities/Slime';
import { Skeleton } from '../entities/Skeleton';
import { Wizard }  from '../entities/Wizard';
import type { BaseEnemy } from '../entities/BaseEnemy';
import { WeatherSystem } from '../systems/WeatherSystem';

const PLAYER_MAX_HP = 10;

export class GameScene extends Phaser.Scene {
  private player!: BasePlayer;
  private enemies: BaseEnemy[] = [];
  private wizards: Wizard[] = [];
  private boss: MindDevourer | null = null;
  private bossSpawned = false;

  private weather!: WeatherSystem;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private defendKey!: Phaser.Input.Keyboard.Key;
  private specialKey!: Phaser.Input.Keyboard.Key;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private doorPrompt!: Phaser.GameObjects.Text;
  private padInteractPrev = false;

  constructor() { super({ key: 'GameScene' }); }

  create(): void {
    this.enemies = [];
    this.wizards = [];
    this.boss = null;
    this.bossSpawned = false;

    setCurrentMap(MAP_DATA, MAP_COLS, MAP_ROWS);
    this.buildTileMap();
    this.spawnPlayer();
    this.spawnEnemies();
    this.setupCamera();
    this.setupInput();

    this.doorPrompt = this.add.text(0, 0, '[ E ]  Entrar no Castelo', {
      fontSize: '11px', color: '#ffeeaa',
      fontFamily: 'monospace', stroke: '#221100', strokeThickness: 3
    }).setScrollFactor(0).setDepth(200).setVisible(false);
    this.doorPrompt.setPosition(this.scale.width / 2 - this.doorPrompt.width / 2, this.scale.height - 80);

    const returnFromCastle = this.registry.get('returnFromCastle') as boolean;
    if (returnFromCastle) {
      this.registry.set('returnFromCastle', false);
      const savedHp = this.registry.get('savedHP') as number;
      if (savedHp !== undefined) {
        this.player.hp = savedHp;
        this.registry.set('playerHP', savedHp);
      }
      this.player.worldX = CASTLE_DOOR_WX;
      this.player.worldY = CASTLE_DOOR_WY + 2;
    }

    this.weather = new WeatherSystem(this);

    if (!this.scene.isActive('UIScene')) this.scene.launch('UIScene');

    const hp = this.player.hp;
    this.registry.set('playerHP', hp);
    this.registry.set('playerMaxHP', this.player.maxHp);
    this.registry.set('playerDefending', false);
    this.registry.set('playerAttacking', false);
    this.registry.set('specialReady', false);
    this.registry.set('specialFrac', 0);
    this.registry.set('selectedChar', this.registry.get('selectedChar') ?? 'knight');
    getAudio(this)?.playMusic('overworld');
  }

  update(_t: number, delta: number): void {
    this.weather.update(delta);
    this.player.update(this.cursors, this.attackKey, this.defendKey, this.specialKey, delta);

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.active) { this.enemies.splice(i, 1); continue; }
      e.update(this.player, delta);
      this.checkWeaponHit(e);
      this.checkMeleeContact(e);
    }

    // Trigger boss when all enemies cleared
    if (!this.bossSpawned && this.enemies.length === 0) {
      this.bossSpawned = true;
      this.announceBoss();
      this.time.delayedCall(2200, () => this.spawnBoss());
    }

    // Boss update & combat
    if (this.boss) {
      if (!this.boss.active) {
        getAudio(this)?.playEffect('victory');
        getAudio(this)?.playMusic('overworld');
        this.boss = null;
      }
      else {
        this.boss.update(this.player, delta);
        this.checkWeaponHit(this.boss);
        this.checkBossContact();
        this.checkBossProjectiles();

        // Player attack bolts (Cleric) vs boss
        for (const bolt of this.player.getAttackProjectiles()) {
          if (!bolt.active || !this.boss) continue;
          if (bolt.hitsPoint(this.boss.worldX, this.boss.worldY, this.boss.radius)) {
            const dx = this.boss.worldX - bolt.worldX;
            const dy = this.boss.worldY - bolt.worldY;
            const len = worldDist(bolt.worldX, bolt.worldY, this.boss.worldX, this.boss.worldY) || 1;
            this.boss.takeDamage(bolt.damage, dx / len, dy / len);
            bolt.explode();
          }
        }
        // Bard notes vs boss
        for (const note of this.player.getSpecialProjectiles()) {
          if (!note.active || !this.boss) continue;
          if (note.hitsPoint(this.boss.worldX, this.boss.worldY, this.boss.radius)) {
            const dx = this.boss.worldX - note.worldX;
            const dy = this.boss.worldY - note.worldY;
            const len = worldDist(note.worldX, note.worldY, this.boss.worldX, this.boss.worldY) || 1;
            this.boss.takeDamage(note.damage, dx / len, dy / len);
            note.explode();
          }
        }
      }
    }

    // Wizard projectiles vs player
    for (const wiz of this.wizards) {
      for (let i = wiz.projectiles.length - 1; i >= 0; i--) {
        const proj = wiz.projectiles[i];
        if (!proj.active) continue;
        if (proj.hitsPoint(this.player.worldX, this.player.worldY, this.player.radius)) {
          const dx = this.player.worldX - proj.worldX;
          const dy = this.player.worldY - proj.worldY;
          const len = worldDist(proj.worldX, proj.worldY, this.player.worldX, this.player.worldY) || 1;
          const dirX = dx / len, dirY = dy / len;
          if (this.player.isDefending() && this.player.isBlockingDir(-dirX, -dirY)) {
            this.showBlocked(this.player.x, this.player.y);
            proj.splash();
          } else {
            this.player.takeDamage(proj.damage, dirX * 0.5, dirY * 0.5);
            proj.splash();
          }
        }
      }
    }

    // Attack projectiles (Cleric bolts) vs regular enemies
    for (const bolt of this.player.getAttackProjectiles()) {
      if (!bolt.active) continue;
      for (const enemy of this.enemies) {
        if (!enemy.isAlive()) continue;
        if (bolt.hitsPoint(enemy.worldX, enemy.worldY, enemy.radius)) {
          const dx = enemy.worldX - bolt.worldX;
          const dy = enemy.worldY - bolt.worldY;
          const len = worldDist(bolt.worldX, bolt.worldY, enemy.worldX, enemy.worldY) || 1;
          enemy.takeDamage(bolt.damage, dx / len, dy / len);
          bolt.explode();
        }
      }
    }

    // Bard special notes vs regular enemies
    for (const note of this.player.getSpecialProjectiles()) {
      if (!note.active) continue;
      for (const enemy of this.enemies) {
        if (!enemy.isAlive()) continue;
        if (note.hitsPoint(enemy.worldX, enemy.worldY, enemy.radius)) {
          const dx = enemy.worldX - note.worldX;
          const dy = enemy.worldY - note.worldY;
          const len = worldDist(note.worldX, note.worldY, enemy.worldX, enemy.worldY) || 1;
          enemy.takeDamage(note.damage, dx / len, dy / len);
          note.explode();
        }
      }
    }

    // Castle door interaction
    const nearGate = worldDist(this.player.worldX, this.player.worldY, CASTLE_DOOR_WX, CASTLE_DOOR_WY) < 2.0;
    this.doorPrompt.setVisible(nearGate);
    const pad = (this.input.gamepad as Phaser.Input.Gamepad.GamepadPlugin)?.getPad(0);
    // B / Circle (button 1) to interact — manual justPressed tracking
    const bDown = pad?.buttons[1]?.pressed === true;
    const padInteract = bDown && !this.padInteractPrev;
    this.padInteractPrev = bDown;
    if (nearGate && (Phaser.Input.Keyboard.JustDown(this.interactKey) || padInteract)) {
      this.enterCastle();
    }
  }

  // ── TILE MAP ─────────────────────────────────────────────────────────

  private floorTex(type: number, row: number, col: number): string {
    if (type === 12 || type === 13) return 'tile-dungeon';
    if (type === 3) return 'tile-path';
    if (type === 6 || type === 10) return 'tile-sand';
    if (type === 7 || type === 11) return 'tile-dungeon';
    if (type === 8 || type === 9)  return 'tile-forest';
    if (col <= 19) return 'tile-forest';
    if (col >= 45) return row <= 22 ? 'tile-sand' : 'tile-dungeon';
    return 'tile-floor';
  }

  private buildTileMap(): void {
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;
        const type = MAP_DATA[row][col];

        this.add.image(x, y, this.floorTex(type, row, col)).setOrigin(0, 0).setDepth(0);

        let topTex: string | null = null;
        if      (type === 1 || type === 11) topTex = 'tile-wall';
        else if (type === 2)                topTex = 'tile-bush';
        else if (type === 9)                topTex = 'tile-tree';
        else if (type === 10)               topTex = 'tile-cactus';
        else if (type === 4)                topTex = 'tile-water';
        else if (type === 5)                topTex = 'tile-house-wall';
        else if (type === 12)               topTex = 'tile-castle-wall';
        else if (type === 13)               topTex = 'tile-castle-door';

        if (topTex) this.add.image(x, y, topTex).setOrigin(0, 0).setDepth(row + 0.1);
      }
    }
  }

  // ── SPAWN ────────────────────────────────────────────────────────────

  private spawnPlayer(): void {
    const charId = this.registry.get('selectedChar') as string ?? 'knight';
    if (charId === 'bard') {
      this.player = new Bard(this, 30.5, 6.5);
    } else if (charId === 'cleric') {
      this.player = new Cleric(this, 30.5, 6.5);
    } else {
      this.player = new Player(this, 30.5, 6.5);
    }
  }

  private spawnEnemies(): void {
    const px = 30.5, py = 6.5;

    const freePoints = (): Array<[number, number]> => {
      const pts: Array<[number, number]> = [];
      for (let r = 1; r < MAP_ROWS - 1; r++) {
        for (let c = 1; c < MAP_COLS - 1; c++) {
          if (SOLID_TILES.has(MAP_DATA[r][c])) continue;
          if (worldDist(c, r, px, py) < 4) continue;
          pts.push([c + 0.5, r + 0.5]);
        }
      }
      return Phaser.Utils.Array.Shuffle(pts) as typeof pts;
    };

    const pts = freePoints();
    let idx = 0;

    for (let i = 0; i < 14; i++) {
      const [wx, wy] = pts[idx++];
      this.enemies.push(new Slime(this, wx, wy));
    }
    for (let i = 0; i < 8; i++) {
      const [wx, wy] = pts[idx++];
      this.enemies.push(new Skeleton(this, wx, wy));
    }
    for (let i = 0; i < 5; i++) {
      const [wx, wy] = pts[idx++];
      const wiz = new Wizard(this, wx, wy);
      this.enemies.push(wiz);
      this.wizards.push(wiz);
    }
  }

  // ── COMBAT ───────────────────────────────────────────────────────────

  private checkWeaponHit(enemy: BaseEnemy): void {
    if (!this.player.isAttacking()) return;
    if (this.player.hitEnemies.has(enemy)) return;
    if (!enemy.isAlive()) return;

    if (this.player.checkSwordHit(enemy.worldX, enemy.worldY)) {
      this.player.hitEnemies.add(enemy);
      const dx = enemy.worldX - this.player.worldX;
      const dy = enemy.worldY - this.player.worldY;
      const len = worldDist(enemy.worldX, enemy.worldY, this.player.worldX, this.player.worldY) || 1;
      enemy.takeDamage(this.player.getAttackDamage(), dx / len, dy / len);

      this.add.particles(enemy.x, enemy.y - 10, 'blank', {
        speed: { min: 40, max: 120 },
        scale: { start: 0.5, end: 0 },
        tint: [0xffdd44, 0xffffff],
        lifespan: 280, quantity: 6, emitting: false
      }).explode(6);
    }
  }

  private announceBoss(): void {
    getAudio(this)?.playEffect('bossRoar');
    this.registry.set('bossAnnouncing', true);
    this.time.delayedCall(3800, () => this.registry.set('bossAnnouncing', false));
  }

  private spawnBoss(): void {
    getAudio(this)?.playMusic('boss');
    let bx = 30.5, by = 24.5;
    for (let attempt = 0; attempt < 14; attempt++) {
      const a = Math.random() * Math.PI * 2;
      const d = 9 + Math.random() * 5;
      const nx = Phaser.Math.Clamp(this.player.worldX + Math.cos(a) * d, 3, 61);
      const ny = Phaser.Math.Clamp(this.player.worldY + Math.sin(a) * d, 3, 45);
      if (!isWall(nx, ny)) { bx = nx; by = ny; break; }
    }

    this.boss = new MindDevourer(this, bx, by);
    this.registry.set('bossHP',    this.boss.hp);
    this.registry.set('bossMaxHP', this.boss.maxHp);
    this.registry.set('bossPhase', 1);
    this.registry.set('bossActive', true);
  }

  private checkBossContact(): void {
    if (!this.boss || !this.boss.active || this.player.isInvincible()) return;
    if (worldDist(this.player.worldX, this.player.worldY, this.boss.worldX, this.boss.worldY) > BOSS_CONTACT_DIST) return;
    const dx = this.player.worldX - this.boss.worldX;
    const dy = this.player.worldY - this.boss.worldY;
    const len = worldDist(this.player.worldX, this.player.worldY, this.boss.worldX, this.boss.worldY) || 1;
    this.player.takeDamage(this.boss.damage, dx / len, dy / len);
  }

  private checkBossProjectiles(): void {
    if (!this.boss) return;
    for (const proj of this.boss.projectiles) {
      if (!proj.active) continue;
      if (!proj.hitsPoint(this.player.worldX, this.player.worldY, this.player.radius)) continue;
      const dx = this.player.worldX - proj.worldX;
      const dy = this.player.worldY - proj.worldY;
      const len = worldDist(proj.worldX, proj.worldY, this.player.worldX, this.player.worldY) || 1;
      const dirX = dx / len, dirY = dy / len;
      if (this.player.isDefending() && this.player.isBlockingDir(-dirX, -dirY)) {
        this.showBlocked(this.player.x, this.player.y);
      } else {
        this.player.takeDamage(proj.damage, dirX * 0.5, dirY * 0.5);
      }
      proj.splash();
    }
  }

  private checkMeleeContact(enemy: BaseEnemy): void {
    if (!enemy.isAlive()) return;
    if (this.player.isInvincible()) return;
    if (worldDist(this.player.worldX, this.player.worldY, enemy.worldX, enemy.worldY) > CONTACT_RADIUS) return;

    const dx = this.player.worldX - enemy.worldX;
    const dy = this.player.worldY - enemy.worldY;
    const len = worldDist(this.player.worldX, this.player.worldY, enemy.worldX, enemy.worldY) || 1;
    const dirX = dx / len, dirY = dy / len;

    if (this.player.isDefending() && this.player.isBlockingDir(-dirX, -dirY)) {
      this.showBlocked(this.player.x, this.player.y);
      return;
    }
    this.player.takeDamage(enemy.damage, dirX, dirY);
  }

  private enterCastle(): void {
    getAudio(this)?.playEffect('interact');
    this.registry.set('savedHP', this.player.hp);
    this.cameras.main.fade(400, 0, 0, 0);
    this.time.delayedCall(420, () => this.scene.start('CastleScene'));
  }

  private showBlocked(sx: number, sy: number): void {
    getAudio(this)?.playEffect('blocked');
    const txt = this.add.text(sx, sy - 20, 'BLOCKED!', {
      fontSize: '12px', color: '#44ddff',
      fontFamily: 'monospace', stroke: '#001133', strokeThickness: 3
    }).setDepth(99).setOrigin(0.5);
    this.tweens.add({
      targets: txt, y: txt.y - 20, alpha: 0, duration: 500,
      onComplete: () => txt.destroy()
    });
  }

  // ── CAMERA ───────────────────────────────────────────────────────────

  private setupCamera(): void {
    this.cameras.main.setZoom(2.5);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    const camTarget = this.add.rectangle(0, 0, 1, 1, 0x000000, 0);
    this.cameras.main.startFollow(camTarget, true, 0.1, 0.1);

    this.events.on('update', () => {
      camTarget.setPosition(this.player.x, this.player.y);
    });
  }

  // ── INPUT ────────────────────────────────────────────────────────────

  private setupInput(): void {
    const kb = this.input.keyboard!;
    this.cursors   = kb.createCursorKeys();
    this.attackKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.defendKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.specialKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

    const W = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    const A = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    const S = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    const D = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    const ck = this.cursors as unknown as Record<string, Phaser.Input.Keyboard.Key>;
    ck['W'] = W; ck['A'] = A; ck['S'] = S; ck['D'] = D;

    const space = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    space.on('down', () => {
      (this.attackKey as unknown as Record<string, boolean>)['_justDown'] = true;
    });

    kb.on('keydown-SHIFT', () => { (this.defendKey as unknown as Record<string, boolean>)['isDown'] = true; });
    kb.on('keyup-SHIFT',   () => { (this.defendKey as unknown as Record<string, boolean>)['isDown'] = false; });

    this.interactKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }
}
