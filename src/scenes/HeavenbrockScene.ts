import Phaser from 'phaser';
import {
  TILE_SIZE,
  HB_COLS, HB_ROWS, HB_WORLD_W, HB_WORLD_H,
  HB_PLAYER_SPAWN_WX, HB_PLAYER_SPAWN_WY,
  VILLAGER_COUNT,
} from '../constants';
import { createPlayer, setupSceneInput, setupFollowCamera } from '../utils/sceneHelpers';
import { worldDist, isWall, setCurrentMap } from '../utils/iso';
import { getAudio } from '../systems/AudioSystem';
import { Villager } from '../entities/Villager';
import type { BasePlayer } from '../entities/BasePlayer';
import { GRASS_SURFACE, CLIFF_FACE } from '../config/TilesetGrass';

export class HeavenbrockScene extends Phaser.Scene {
  private mapData:       number[][] = [];
  private decorData:     number[][] = [];
  private collisionData: number[][] = [];
  private player!: BasePlayer;
  private villagers: Villager[] = [];

  private cursors!:     Phaser.Types.Input.Keyboard.CursorKeys;
  private attackKey!:   Phaser.Input.Keyboard.Key;
  private defendKey!:   Phaser.Input.Keyboard.Key;
  private specialKey!:  Phaser.Input.Keyboard.Key;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private pauseKey!:    Phaser.Input.Keyboard.Key;
  private gamePaused = false;
  private padStartPrev = false;

  private exitPrompt!: Phaser.GameObjects.Text;
  private dialogueText: Phaser.GameObjects.Text | null = null;
  private dialogueCooldown = 0;

  constructor() { super({ key: 'HeavenbrockScene' }); }

  create(): void {
    this.villagers      = [];
    this.dialogueText   = null;
    this.dialogueCooldown = 0;
    this.gamePaused = false;

    this.mapData       = this.loadMapData();
    this.decorData     = this.loadDecorData();
    this.collisionData = this.loadCollisionData();
    setCurrentMap(this.mapData, HB_COLS, HB_ROWS, this.collisionData);
    this.buildTileMap();
    this.renderDecorLayer();

    this.player = createPlayer(this, HB_PLAYER_SPAWN_WX, HB_PLAYER_SPAWN_WY);
    this.spawnVillagers();
    setupFollowCamera(this, this.player, HB_WORLD_W, HB_WORLD_H);

    const input   = setupSceneInput(this);
    this.cursors    = input.cursors;
    this.attackKey  = input.attackKey;
    this.defendKey  = input.defendKey;
    this.specialKey = input.specialKey;
    this.interactKey = input.interactKey;
    this.pauseKey   = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P);

    if (!this.scene.isActive('UIScene')) this.scene.launch('UIScene');

    this.registry.set('playerHP',       this.player.hp);
    this.registry.set('playerMaxHP',    this.player.maxHp);
    this.registry.set('playerDefending', false);
    this.registry.set('playerAttacking', false);
    this.registry.set('specialReady',   false);
    this.registry.set('specialFrac',    0);
    this.registry.set('bossActive',     false);
    this.registry.set('bossHP',         0);
    this.registry.set('bossMaxHP',      1);
    this.registry.set('selectedChar',   this.registry.get('selectedChar') ?? 'knight');

    this.exitPrompt = this.add.text(0, 0, '[ ↓ ]  Sair de Heavenbrock', {
      fontSize: '11px', color: '#ffeeaa',
      fontFamily: 'monospace', stroke: '#221100', strokeThickness: 3,
    }).setScrollFactor(0).setDepth(200).setVisible(false);
    this.exitPrompt.setPosition(
      this.scale.width / 2 - this.exitPrompt.width / 2,
      this.scale.height - 80
    );

    getAudio(this)?.playMusic('overworld');
  }

  update(_t: number, delta: number): void {
    // Pause
    const pad0 = (this.input.gamepad as Phaser.Input.Gamepad.GamepadPlugin)?.getPad(0);
    const startDown = pad0?.buttons[9]?.pressed === true;
    const startJust = startDown && !this.padStartPrev;
    this.padStartPrev = startDown;
    if (Phaser.Input.Keyboard.JustDown(this.pauseKey) || startJust) {
      this.gamePaused = !this.gamePaused;
      this.registry.set('gamePaused', this.gamePaused);
      if (this.gamePaused) { this.scene.pause(); return; }
    }

    this.player.update(this.cursors, this.attackKey, this.defendKey, this.specialKey, delta);
    if (this.dialogueCooldown > 0) this.dialogueCooldown -= delta;

    for (let i = this.villagers.length - 1; i >= 0; i--) {
      const v = this.villagers[i];
      if (!v.active) { this.villagers.splice(i, 1); continue; }
      v.update(this.player.worldX, this.player.worldY, delta);
    }

    // Exit trigger — player walks out the south gate
    const nearGate = this.player.worldY > HB_ROWS - 2.5
      && this.player.worldX > 19.5 && this.player.worldX < 25.5;
    this.exitPrompt.setVisible(nearGate);

    if (this.player.worldY >= HB_ROWS - 0.8) {
      this.player.worldY = HB_ROWS - 0.9; // prevent drift
      this.cameras.main.fade(400, 0, 0, 0);
      this.time.delayedCall(420, () => this.scene.start('GameScene'));
    }

    // Villager dialogue (E key)
    if (Phaser.Input.Keyboard.JustDown(this.interactKey) && this.dialogueCooldown <= 0) {
      for (const v of this.villagers) {
        if (!v.isHappy()) continue;
        if (worldDist(this.player.worldX, this.player.worldY, v.worldX, v.worldY) > 1.8) continue;
        this.showDialogue(v.getDialogueLine());
        this.dialogueCooldown = 3000;
        break;
      }
    }
  }

  // ── MAP ───────────────────────────────────────────────────────────────

  private loadMapData(): number[][] {
    const json = this.cache.json.get('heavenbrock-data') as {
      layers: Array<{ data: number[]; name: string }>;
    } | null;
    if (!json) return Array.from({ length: HB_ROWS }, () => new Array(HB_COLS).fill(0));
    const layer = json.layers.find(l => l.name === 'Ground')!;
    const data: number[][] = [];
    for (let r = 0; r < HB_ROWS; r++)
      data.push(layer.data.slice(r * HB_COLS, (r + 1) * HB_COLS).map(id => id - 1));
    return data;
  }

  private loadDecorData(): number[][] {
    const empty = () => Array.from({ length: HB_ROWS }, () => new Array(HB_COLS).fill(0));
    const json = this.cache.json.get('heavenbrock-data') as {
      layers: Array<{ data: number[]; name: string }>;
      tilesets: Array<{ firstgid: number }>;
    } | null;
    if (!json) return empty();
    const layer = json.layers.find(l => l.name === 'Decor');
    if (!layer) return empty();
    const firstgid = Math.max(...json.tilesets.map(ts => ts.firstgid));
    const data: number[][] = [];
    for (let r = 0; r < HB_ROWS; r++)
      data.push(
        layer.data.slice(r * HB_COLS, (r + 1) * HB_COLS)
          .map(id => id === 0 ? 0 : id - firstgid)
      );
    return data;
  }

  private loadCollisionData(): number[][] {
    const empty = Array.from({ length: HB_ROWS }, () => new Array(HB_COLS).fill(0));
    const json = this.cache.json.get('heavenbrock-data') as {
      layers: Array<{ data: number[]; name: string }>;
    } | null;
    if (!json) return empty;
    const layer = json.layers.find(l => l.name === 'Collision');
    if (!layer) return empty;
    const data: number[][] = [];
    for (let r = 0; r < HB_ROWS; r++)
      data.push(layer.data.slice(r * HB_COLS, (r + 1) * HB_COLS));
    return data;
  }

  private getGrassBitmask(row: number, col: number): number {
    const land = (r: number, c: number) =>
      r >= 0 && r < HB_ROWS && c >= 0 && c < HB_COLS && this.mapData[r][c] !== 4;
    return (land(row - 1, col) ? 1 : 0)
         | (land(row, col + 1) ? 2 : 0)
         | (land(row + 1, col) ? 4 : 0)
         | (land(row, col - 1) ? 8 : 0);
  }

  private buildTileMap(): void {
    for (let row = 0; row < HB_ROWS; row++) {
      for (let col = 0; col < HB_COLS; col++) {
        const x     = col * TILE_SIZE;
        const y     = row * TILE_SIZE;
        const type  = this.mapData[row][col];
        const solid = !!this.collisionData[row]?.[col];
        const isBorder = row === 0 || row === HB_ROWS - 1 || col === 0 || col === HB_COLS - 1;

        // Water
        if (type === 4) {
          this.add.image(x, y, 'tile-water').setOrigin(0, 0).setDepth(0).setAlpha(0.55);
          continue;
        }

        // Solid non-border → house wall placeholder (Decor layer overrides visuals via Tiled)
        if (solid && !isBorder) {
          this.add.image(x, y, 'tile-house-wall').setOrigin(0, 0).setDepth(0);
          continue;
        }

        // Path
        if (type === 3) {
          this.add.image(x, y, 'tile-path').setOrigin(0, 0).setDepth(0);
          continue;
        }

        // Grass (type 0, -1, or anything else) — bitmask for nice water-edge transitions
        const mask  = this.getGrassBitmask(row, col);
        const frame = GRASS_SURFACE[mask] ?? GRASS_SURFACE[15];
        this.add.image(x, y, 'raw-tileset', frame)
          .setOrigin(0, 0).setDisplaySize(TILE_SIZE, TILE_SIZE).setDepth(0);

        if (!(mask & 4) && row + 1 < HB_ROWS && this.mapData[row + 1][col] === 4) {
          const cfFrame = !(mask & 8) ? CLIFF_FACE.southLeft
                        : !(mask & 2) ? CLIFF_FACE.southRight
                        : CLIFF_FACE.south;
          this.add.image(x, y + TILE_SIZE, 'raw-tileset', cfFrame)
            .setOrigin(0, 0).setDisplaySize(TILE_SIZE, TILE_SIZE).setDepth(row + 1.1);
        }
      }
    }
  }

  private renderDecorLayer(): void {
    for (let row = 0; row < HB_ROWS; row++) {
      for (let col = 0; col < HB_COLS; col++) {
        const frame = this.decorData[row][col];
        if (frame === 0) continue;
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;
        this.add.image(x, y, 'path-objects', frame)
          .setOrigin(0, 0)
          .setDisplaySize(TILE_SIZE, TILE_SIZE)
          .setDepth(row + 0.1);
      }
    }
  }

  // ── SPAWN ─────────────────────────────────────────────────────────────

  private spawnVillagers(): void {
    const px = HB_PLAYER_SPAWN_WX, py = HB_PLAYER_SPAWN_WY;
    const pts: Array<[number, number]> = [];
    for (let r = 1; r < HB_ROWS - 1; r++) {
      for (let c = 1; c < HB_COLS - 1; c++) {
        if (isWall(c + 0.5, r + 0.5)) continue;
        if (worldDist(c + 0.5, r + 0.5, px, py) < 2.5) continue;
        pts.push([c + 0.5, r + 0.5]);
      }
    }
    const picked = (Phaser.Utils.Array.Shuffle(pts) as typeof pts).slice(0, VILLAGER_COUNT);
    for (const [wx, wy] of picked) {
      this.villagers.push(new Villager(this, wx, wy));
    }
  }

  // ── UI ────────────────────────────────────────────────────────────────

  private showDialogue(line: string): void {
    this.dialogueText?.destroy();
    this.dialogueText = this.add.text(
      this.scale.width / 2, this.scale.height - 96, `"${line}"`, {
        fontSize: '11px', color: '#ffffff',
        fontFamily: 'monospace', stroke: '#000000', strokeThickness: 3,
        backgroundColor: '#00000099', padding: { x: 10, y: 6 },
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    this.time.delayedCall(2800, () => {
      if (!this.dialogueText) return;
      this.tweens.add({
        targets: this.dialogueText, alpha: 0, duration: 400,
        onComplete: () => { this.dialogueText?.destroy(); this.dialogueText = null; },
      });
    });
  }
}
