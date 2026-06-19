import Phaser from 'phaser';
import {
  TILE_SIZE, MAP_COLS, MAP_ROWS,
  WORLD_W, WORLD_H, CONTACT_RADIUS, SOLID_TILES,
  BOSS_CONTACT_DIST, CASTLE_DOOR_WX, CASTLE_DOOR_WY,
  VILLAGER_COUNT,
} from '../constants';
import { createPlayer, setupSceneInput, setupFollowCamera } from '../utils/sceneHelpers';
import { worldDist, isWall, setCurrentMap } from '../utils/iso';
import { getAudio } from '../systems/AudioSystem';
import { MindDevourer } from '../entities/MindDevourer';
import type { BasePlayer } from '../entities/BasePlayer';
import { Slime }    from '../entities/Slime';
import { Skeleton } from '../entities/Skeleton';
import { Wizard }   from '../entities/Wizard';
import { Villager } from '../entities/Villager';
import type { BaseEnemy } from '../entities/BaseEnemy';
import { WeatherSystem } from '../systems/WeatherSystem';
import { GRASS_SURFACE, CLIFF_FACE } from '../config/TilesetGrass';

type TileRef = { img: Phaser.GameObjects.Image; lightTex: string; darkTex: string };

// Tiles that swap to a dark variant when the realm toggles
const DARK_TEX: Record<string, string> = {
  'tile-wall':       'tile-wall-dark',
  'tile-house-wall': 'tile-house-wall-dark',
  'tile-bush':       'tile-bush-dark',
};

export class GameScene extends Phaser.Scene {
  private mapData: number[][] = [];
  private player!: BasePlayer;
  private enemies:  BaseEnemy[] = [];
  private wizards:  Wizard[]    = [];
  private villagers: Villager[] = [];
  private boss: MindDevourer | null = null;
  private bossSpawned = false;

  private tileRefs: TileRef[] = [];

  private darkRealm         = false;
  private realmUnlocked     = false;
  private realmTransitioning = false;
  private realmKey!: Phaser.Input.Keyboard.Key;

  private weather!: WeatherSystem;

  private cursors!:    Phaser.Types.Input.Keyboard.CursorKeys;
  private attackKey!:  Phaser.Input.Keyboard.Key;
  private defendKey!:  Phaser.Input.Keyboard.Key;
  private specialKey!: Phaser.Input.Keyboard.Key;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private doorPrompt!: Phaser.GameObjects.Text;
  private padInteractPrev = false;
  private padRealmPrev    = false;

  constructor() { super({ key: 'GameScene' }); }

  create(): void {
    this.enemies   = [];
    this.wizards   = [];
    this.villagers = [];
    this.tileRefs  = [];
    this.boss      = null;
    this.bossSpawned = false;
    this.realmTransitioning = false;

    this.darkRealm     = this.registry.get('darkRealm')     === true;
    this.realmUnlocked = this.registry.get('realmUnlocked') === true;

    this.mapData = this.loadMapData();
    setCurrentMap(this.mapData, MAP_COLS, MAP_ROWS);
    this.buildTileMap();
    this.player = createPlayer(this, 30.5, 6.5);
    this.spawnEnemies();
    this.spawnVillagers();
    setupFollowCamera(this, this.player, WORLD_W, WORLD_H);

    const input = setupSceneInput(this);
    this.cursors     = input.cursors;
    this.attackKey   = input.attackKey;
    this.defendKey   = input.defendKey;
    this.specialKey  = input.specialKey;
    this.interactKey = input.interactKey;

    this.realmKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);

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

    // Apply dark realm state immediately if already active
    if (this.darkRealm) {
      for (const ref of this.tileRefs) ref.img.setTexture(ref.darkTex);
      for (const v of this.villagers)  v.setRealm(true);
    }

    this.weather = new WeatherSystem(this);
    if (this.darkRealm) this.weather.suppress(true);

    if (!this.scene.isActive('UIScene')) this.scene.launch('UIScene');

    this.registry.set('playerHP',       this.player.hp);
    this.registry.set('playerMaxHP',    this.player.maxHp);
    this.registry.set('playerDefending', false);
    this.registry.set('playerAttacking', false);
    this.registry.set('specialReady',   false);
    this.registry.set('specialFrac',    0);
    this.registry.set('selectedChar',   this.registry.get('selectedChar') ?? 'knight');

    getAudio(this)?.playMusic(this.darkRealm ? 'dark-realm' : 'overworld');
  }

  update(_t: number, delta: number): void {
    if (!this.darkRealm) this.weather.update(delta);

    this.player.update(this.cursors, this.attackKey, this.defendKey, this.specialKey, delta);

    // Realm toggle — R key or Back/Select (button 8)
    const pad0 = (this.input.gamepad as Phaser.Input.Gamepad.GamepadPlugin)?.getPad(0);
    const padRealmDown = pad0?.buttons[8]?.pressed === true;
    const padRealmJust = padRealmDown && !this.padRealmPrev;
    this.padRealmPrev  = padRealmDown;
    if (this.realmUnlocked && !this.realmTransitioning &&
        (Phaser.Input.Keyboard.JustDown(this.realmKey) || padRealmJust)) {
      this.toggleRealm();
    }

    // Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.active) { this.enemies.splice(i, 1); continue; }
      e.update(this.player, delta);
      this.checkWeaponHit(e);
      this.checkMeleeContact(e);
    }

    // Villagers
    for (let i = this.villagers.length - 1; i >= 0; i--) {
      const v = this.villagers[i];
      if (!v.active) { this.villagers.splice(i, 1); continue; }
      v.update(this.player.worldX, this.player.worldY, delta);
      if (v.isAggro()) {
        // Player weapon hits aggro villagers
        if (this.player.isAttacking() && !this.player.hitEnemies.has(v as unknown as BaseEnemy)) {
          if (this.player.checkSwordHit(v.worldX, v.worldY)) {
            this.player.hitEnemies.add(v as unknown as BaseEnemy);
            v.takeDamage(this.player.getAttackDamage());
          }
        }
        // Aggro villager damages player
        if (!this.player.isInvincible() &&
            worldDist(this.player.worldX, this.player.worldY, v.worldX, v.worldY) < CONTACT_RADIUS) {
          const dx = this.player.worldX - v.worldX;
          const dy = this.player.worldY - v.worldY;
          const len = worldDist(this.player.worldX, this.player.worldY, v.worldX, v.worldY) || 1;
          this.player.takeDamage(v.damage, dx / len, dy / len);
        }
      }
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
        getAudio(this)?.playMusic(this.darkRealm ? 'dark-realm' : 'overworld');
        this.boss = null;
      } else {
        this.boss.update(this.player, delta);
        this.checkWeaponHit(this.boss);
        this.checkBossContact();
        this.checkBossProjectiles();

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

    // Cleric bolts vs regular enemies
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

    // Bard notes vs regular enemies
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
    const bDown      = pad?.buttons[1]?.pressed === true;
    const padInteract = bDown && !this.padInteractPrev;
    this.padInteractPrev = bDown;
    if (nearGate && (Phaser.Input.Keyboard.JustDown(this.interactKey) || padInteract)) {
      this.enterCastle();
    }
  }

  // ── TILE MAP ──────────────────────────────────────────────────────────

  private floorTex(type: number, row: number, col: number): string {
    if (type === 12 || type === 13) return 'tile-dungeon';
    if (type === 3)                 return 'tile-path';
    if (type === 6 || type === 10)  return 'tile-sand';
    if (type === 7 || type === 11)  return 'tile-dungeon';
    if (type === 8 || type === 9)   return 'tile-forest';
    if (col <= 19)  return 'tile-forest';
    if (col >= 45)  return row <= 22 ? 'tile-sand' : 'tile-dungeon';
    return 'tile-floor';
  }

  private loadMapData(): number[][] {
    const json = this.cache.json.get('map-data') as {
      layers: Array<{ data: number[]; name: string }>;
      width: number; height: number;
    };
    const layer = json.layers.find(l => l.name === 'Ground')!;
    const flat  = layer.data;
    const data: number[][] = [];
    for (let r = 0; r < MAP_ROWS; r++)
      data.push(flat.slice(r * MAP_COLS, (r + 1) * MAP_COLS).map(id => id - 1));
    return data;
  }

  private getGrassBitmask(row: number, col: number): number {
    const land = (r: number, c: number) =>
      r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLS && this.mapData[r][c] !== 4;
    return (land(row - 1, col) ? 1 : 0)
         | (land(row, col + 1) ? 2 : 0)
         | (land(row + 1, col) ? 4 : 0)
         | (land(row, col - 1) ? 8 : 0);
  }

  private buildTileMap(): void {
    let rngState = 42;
    const rng = () => {
      rngState = (rngState * 1664525 + 1013904223) & 0xffffffff;
      return (rngState >>> 0) / 4294967296;
    };

    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const x    = col * TILE_SIZE;
        const y    = row * TILE_SIZE;
        const type = this.mapData[row][col];

        if (type === 4) {
          this.add.image(x, y, 'tile-water').setOrigin(0, 0).setDepth(0).setAlpha(0.55);
          rng(); rng(); rng();
          continue;
        }

        if (type === 0) {
          const mask  = this.getGrassBitmask(row, col);
          const frame = GRASS_SURFACE[mask] ?? GRASS_SURFACE[15];
          this.add.image(x, y, 'raw-tileset', frame)
            .setOrigin(0, 0).setDisplaySize(TILE_SIZE, TILE_SIZE).setDepth(0);

          if (!(mask & 4) && row + 1 < MAP_ROWS && this.mapData[row + 1][col] === 4) {
            const cfFrame = !(mask & 8) ? CLIFF_FACE.southLeft
                          : !(mask & 2) ? CLIFF_FACE.southRight
                          : CLIFF_FACE.south;
            this.add.image(x, y + TILE_SIZE, 'raw-tileset', cfFrame)
              .setOrigin(0, 0).setDisplaySize(TILE_SIZE, TILE_SIZE).setDepth(row + 1.1);
          }
          continue;
        }

        // Floor tile — path has a dark variant
        const floorKey = this.floorTex(type, row, col);
        const floorImg = this.add.image(x, y, floorKey).setOrigin(0, 0).setDepth(0);
        if (type === 3) {
          this.tileRefs.push({ img: floorImg, lightTex: 'tile-path', darkTex: 'tile-path-dark' });
        }

        // Obstacle tile
        let topTex: string | null = null;
        if      (type === 1 || type === 11) topTex = 'tile-wall';
        else if (type === 2)                topTex = 'tile-bush';
        else if (type === 9)                topTex = 'tile-tree';
        else if (type === 10)               topTex = 'tile-cactus';
        else if (type === 5)                topTex = 'tile-house-wall';
        else if (type === 12)               topTex = 'tile-castle-wall';
        else if (type === 13)               topTex = 'tile-castle-door';

        if (topTex) {
          const img = this.add.image(x, y, topTex).setOrigin(0, 0).setDepth(row + 0.1);
          const darkTex = DARK_TEX[topTex];
          if (darkTex) this.tileRefs.push({ img, lightTex: topTex, darkTex });
        }

        if ((type === 1 || type === 11) && rng() < 0.25) {
          const rockKey = `raw-rock${Math.floor(rng() * 4) + 1}`;
          const ox = Math.floor(rng() * 20) + 4;
          const oy = Math.floor(rng() * 16) + 4;
          this.add.image(x + ox, y + oy, rockKey)
            .setDisplaySize(18, 18).setDepth(row + 0.5).setAlpha(0.92);
        }
      }
    }
  }

  // ── SPAWN ─────────────────────────────────────────────────────────────

  private spawnEnemies(): void {
    const px = 30.5, py = 6.5;
    const freePoints = (): Array<[number, number]> => {
      const pts: Array<[number, number]> = [];
      for (let r = 1; r < MAP_ROWS - 1; r++) {
        for (let c = 1; c < MAP_COLS - 1; c++) {
          if (SOLID_TILES.has(this.mapData[r][c])) continue;
          if (worldDist(c, r, px, py) < 4) continue;
          pts.push([c + 0.5, r + 0.5]);
        }
      }
      return Phaser.Utils.Array.Shuffle(pts) as typeof pts;
    };

    const pts = freePoints();
    let idx = 0;
    for (let i = 0; i < 14; i++) { const [wx, wy] = pts[idx++]; this.enemies.push(new Slime(this, wx, wy)); }
    for (let i = 0; i < 8;  i++) { const [wx, wy] = pts[idx++]; this.enemies.push(new Skeleton(this, wx, wy)); }
    for (let i = 0; i < 5;  i++) {
      const [wx, wy] = pts[idx++];
      const wiz = new Wizard(this, wx, wy);
      this.enemies.push(wiz);
      this.wizards.push(wiz);
    }
  }

  private spawnVillagers(): void {
    const pts: Array<[number, number]> = [];
    // Village area: rows 3-20, cols 19-44 — walkable tiles only, far from player spawn
    for (let r = 3; r <= 20; r++) {
      for (let c = 19; c <= 44; c++) {
        if (SOLID_TILES.has(this.mapData[r][c])) continue;
        if (worldDist(c + 0.5, r + 0.5, 30.5, 6.5) < 3.5) continue;
        pts.push([c + 0.5, r + 0.5]);
      }
    }
    const picked = (Phaser.Utils.Array.Shuffle(pts) as typeof pts).slice(0, VILLAGER_COUNT);
    for (const [wx, wy] of picked) {
      this.villagers.push(new Villager(this, wx, wy));
    }
  }

  // ── REALM ─────────────────────────────────────────────────────────────

  private toggleRealm(): void {
    this.realmTransitioning = true;
    this.darkRealm = !this.darkRealm;
    const entering = this.darkRealm;

    getAudio(this)?.playEffect('realmShift');

    // Camera flash: purple when entering dark realm, white when returning
    this.cameras.main.flash(entering ? 700 : 500,
      entering ? 80  : 255,
      entering ? 0   : 255,
      entering ? 130 : 255,
      true
    );

    // Swap world at peak of flash
    this.time.delayedCall(entering ? 350 : 250, () => {
      for (const ref of this.tileRefs) {
        ref.img.setTexture(entering ? ref.darkTex : ref.lightTex);
      }
      for (const v of this.villagers) v.setRealm(entering);
      this.weather.suppress(entering);
      getAudio(this)?.playMusic(entering ? 'dark-realm' : 'overworld');
      this.registry.set('darkRealm', entering);
    });

    // Unlock input after transition finishes
    this.time.delayedCall(entering ? 800 : 600, () => {
      this.realmTransitioning = false;
    });
  }

  // ── COMBAT ────────────────────────────────────────────────────────────

  private checkWeaponHit(enemy: BaseEnemy): void {
    if (!this.player.isAttacking()) return;
    if (this.player.hitEnemies.has(enemy)) return;
    if (!enemy.isAlive()) return;

    if (this.player.checkSwordHit(enemy.worldX, enemy.worldY)) {
      this.player.hitEnemies.add(enemy);
      const dx  = enemy.worldX - this.player.worldX;
      const dy  = enemy.worldY - this.player.worldY;
      const len = worldDist(enemy.worldX, enemy.worldY, this.player.worldX, this.player.worldY) || 1;
      enemy.takeDamage(this.player.getAttackDamage(), dx / len, dy / len);

      this.add.particles(enemy.x, enemy.y - 10, 'blank', {
        speed: { min: 40, max: 120 }, scale: { start: 0.5, end: 0 },
        tint: [0xffdd44, 0xffffff], lifespan: 280, quantity: 6, emitting: false,
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
      const a  = Math.random() * Math.PI * 2;
      const d  = 9 + Math.random() * 5;
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
    const dx  = this.player.worldX - this.boss.worldX;
    const dy  = this.player.worldY - this.boss.worldY;
    const len = worldDist(this.player.worldX, this.player.worldY, this.boss.worldX, this.boss.worldY) || 1;
    this.player.takeDamage(this.boss.damage, dx / len, dy / len);
  }

  private checkBossProjectiles(): void {
    if (!this.boss) return;
    for (const proj of this.boss.projectiles) {
      if (!proj.active) continue;
      if (!proj.hitsPoint(this.player.worldX, this.player.worldY, this.player.radius)) continue;
      const dx  = this.player.worldX - proj.worldX;
      const dy  = this.player.worldY - proj.worldY;
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

    const dx  = this.player.worldX - enemy.worldX;
    const dy  = this.player.worldY - enemy.worldY;
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
    this.registry.set('savedHP',   this.player.hp);
    this.registry.set('darkRealm', this.darkRealm);
    this.cameras.main.fade(400, 0, 0, 0);
    this.time.delayedCall(420, () => this.scene.start('CastleScene'));
  }

  private showBlocked(sx: number, sy: number): void {
    getAudio(this)?.playEffect('blocked');
    const txt = this.add.text(sx, sy - 20, 'BLOQUEADO!', {
      fontSize: '12px', color: '#44ddff',
      fontFamily: 'monospace', stroke: '#001133', strokeThickness: 3
    }).setDepth(99).setOrigin(0.5);
    this.tweens.add({
      targets: txt, y: txt.y - 20, alpha: 0, duration: 500,
      onComplete: () => txt.destroy()
    });
  }
}
