import Phaser from 'phaser';
import { TILE_SIZE } from '../constants';
import { worldDist, setCurrentMap } from '../utils/iso';
import { Player }  from '../entities/Player';
import { Bard }    from '../entities/Bard';
import { Cleric }  from '../entities/Cleric';
import type { BasePlayer } from '../entities/BasePlayer';
import { getAudio } from '../systems/AudioSystem';

// ── Interior map (24 cols × 18 rows) ──────────────────────────────────────
// Tile types: 1=wall  7=dungeon-floor  13=exit-door
const INTERIOR_COLS = 24;
const INTERIOR_ROWS = 18;
const INTERIOR_MAP: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,1],
  [1,7,1,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,1,7,1],
  [1,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,1],
  [1,7,7,7,7,7,1,7,7,7,7,7,7,7,7,7,1,7,7,7,7,7,7,1],
  [1,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,1],
  [1,1,1,7,7,1,1,1,7,7,7,7,7,7,7,1,1,1,7,7,1,1,1,1],
  [1,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,1],
  [1,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,1],
  [1,7,1,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,1,7,1],
  [1,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,1],
  [1,1,1,1,7,7,1,1,7,7,7,7,7,7,7,1,1,7,7,1,1,1,1,1],
  [1,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,1],
  [1,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,1],
  [1,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,1],
  [1,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,1],
  [1,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,1],
  [1,1,1,1,1,1,1,1,1,1,1,13,13,1,1,1,1,1,1,1,1,1,1,1],
];

const INTERIOR_W = INTERIOR_COLS * TILE_SIZE;
const INTERIOR_H = INTERIOR_ROWS * TILE_SIZE;

// Exit door world position (center of cols 11-12, row 17)
const EXIT_WX = 11.5;
const EXIT_WY = 17;

// Player entry position (one tile above exit door)
const ENTRY_WX = 11.5;
const ENTRY_WY = 15.5;

export class CastleScene extends Phaser.Scene {
  private player!: BasePlayer;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private defendKey!: Phaser.Input.Keyboard.Key;
  private specialKey!: Phaser.Input.Keyboard.Key;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private exitPrompt!: Phaser.GameObjects.Text;

  constructor() { super({ key: 'CastleScene' }); }

  create(): void {
    setCurrentMap(INTERIOR_MAP, INTERIOR_COLS, INTERIOR_ROWS);
    getAudio(this)?.playMusic('castle');

    // Ambient background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0812); bg.fillRect(0, 0, INTERIOR_W, INTERIOR_H);

    this.buildMap();
    this.spawnPlayer();
    this.setupCamera();
    this.setupInput();
    this.buildExitPrompt();

    // Ambient castle title text
    const banner = this.add.text(INTERIOR_W / 2, 20, '— Castelo —', {
      fontSize: '9px', color: '#aa88cc', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(200).setScrollFactor(0);
    this.tweens.add({ targets: banner, alpha: { from: 1, to: 0.4 }, duration: 1800, yoyo: true, repeat: -1 });

    if (!this.scene.isActive('UIScene')) this.scene.launch('UIScene');

    // Restore HP from saved state
    const savedHp = this.registry.get('savedHP') as number;
    if (savedHp !== undefined) {
      this.player.hp = savedHp;
      this.registry.set('playerHP', savedHp);
      this.registry.set('playerMaxHP', this.player.maxHp);
    }

    this.cameras.main.fadeIn(400);
  }

  update(_t: number, delta: number): void {
    this.player.update(this.cursors, this.attackKey, this.defendKey, this.specialKey, delta);

    const nearExit = worldDist(this.player.worldX, this.player.worldY, EXIT_WX, EXIT_WY) < 1.8;
    this.exitPrompt.setVisible(nearExit);
    if (nearExit && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.exitCastle();
    }
  }

  private buildMap(): void {
    for (let row = 0; row < INTERIOR_ROWS; row++) {
      for (let col = 0; col < INTERIOR_COLS; col++) {
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;
        const type = INTERIOR_MAP[row][col];

        // Floor layer
        this.add.image(x, y, 'tile-dungeon').setOrigin(0, 0).setDepth(0);

        // Overlay layer
        let topTex: string | null = null;
        if (type === 1)  topTex = 'tile-wall';
        if (type === 13) topTex = 'tile-castle-door';

        if (topTex) this.add.image(x, y, topTex).setOrigin(0, 0).setDepth(row + 0.1);
      }
    }

    // Throne (decorative wall arrangement at top-center)
    const throneX = 11 * TILE_SIZE;
    const throneY = 1 * TILE_SIZE;
    const throne = this.add.graphics();
    throne.fillStyle(0x6633aa, 0.85);
    throne.fillRect(throneX, throneY + 4, 32, 24);
    throne.fillStyle(0x9955cc);
    throne.fillRect(throneX + 8, throneY + 2, 16, 28);
    throne.fillStyle(0xddaa44);
    throne.fillRect(throneX + 12, throneY, 8, 4);
    throne.setDepth(1.6);

    // Throne room carpet
    const carpet = this.add.graphics();
    carpet.fillStyle(0x551133, 0.5);
    carpet.fillRect(9 * TILE_SIZE, 1 * TILE_SIZE, 6 * TILE_SIZE, 5 * TILE_SIZE);
    carpet.setDepth(0.5);

    // Torches (decorative orange glow blobs)
    const torchPositions: [number, number][] = [
      [2 * TILE_SIZE + 4, 2 * TILE_SIZE + 8],
      [21 * TILE_SIZE + 4, 2 * TILE_SIZE + 8],
      [2 * TILE_SIZE + 4, 9 * TILE_SIZE + 8],
      [21 * TILE_SIZE + 4, 9 * TILE_SIZE + 8],
    ];
    for (const [tx, ty] of torchPositions) {
      const torch = this.add.graphics();
      torch.fillStyle(0xff8800, 0.7); torch.fillCircle(tx, ty, 5);
      torch.fillStyle(0xffdd44, 0.5); torch.fillCircle(tx, ty, 3);
      torch.setDepth(5);
      this.tweens.add({ targets: torch, alpha: { from: 0.8, to: 0.4 }, duration: 300 + Math.random() * 200, yoyo: true, repeat: -1 });
    }
  }

  private spawnPlayer(): void {
    const charId = this.registry.get('selectedChar') as string ?? 'knight';
    if (charId === 'bard') {
      this.player = new Bard(this, ENTRY_WX, ENTRY_WY);
    } else if (charId === 'cleric') {
      this.player = new Cleric(this, ENTRY_WX, ENTRY_WY);
    } else {
      this.player = new Player(this, ENTRY_WX, ENTRY_WY);
    }
  }

  private setupCamera(): void {
    this.cameras.main.setZoom(2.5);
    this.cameras.main.setBounds(0, 0, INTERIOR_W, INTERIOR_H);
    const camTarget = this.add.rectangle(0, 0, 1, 1, 0, 0);
    this.cameras.main.startFollow(camTarget, true, 0.1, 0.1);
    this.events.on('update', () => camTarget.setPosition(this.player.x, this.player.y));
  }

  private setupInput(): void {
    const kb = this.input.keyboard!;
    this.cursors   = kb.createCursorKeys();
    this.attackKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.defendKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.specialKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.interactKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E);

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
  }

  private buildExitPrompt(): void {
    this.exitPrompt = this.add.text(0, 0, '[ E ]  Sair do Castelo', {
      fontSize: '11px', color: '#ffeeaa',
      fontFamily: 'monospace', stroke: '#221100', strokeThickness: 3
    }).setScrollFactor(0).setDepth(200).setVisible(false);
    this.exitPrompt.setPosition(500 - this.exitPrompt.width / 2, 720);
  }

  private exitCastle(): void {
    this.registry.set('savedHP', this.player.hp);
    this.registry.set('returnFromCastle', true);
    this.cameras.main.fade(400, 0, 0, 0);
    this.time.delayedCall(420, () => this.scene.start('GameScene'));
  }
}
