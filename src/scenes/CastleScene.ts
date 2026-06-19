import Phaser from 'phaser';
import { TILE_SIZE } from '../constants';
import { worldDist, setCurrentMap } from '../utils/iso';
import type { BasePlayer } from '../entities/BasePlayer';
import { createPlayer, setupSceneInput, setupFollowCamera } from '../utils/sceneHelpers';
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
  private padInteractPrev = false;

  constructor() { super({ key: 'CastleScene' }); }

  create(): void {
    setCurrentMap(INTERIOR_MAP, INTERIOR_COLS, INTERIOR_ROWS);
    getAudio(this)?.playMusic('castle');

    // Ambient background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0812); bg.fillRect(0, 0, INTERIOR_W, INTERIOR_H);

    this.buildMap();
    this.player = createPlayer(this, ENTRY_WX, ENTRY_WY);
    setupFollowCamera(this, this.player, INTERIOR_W, INTERIOR_H);

    const input = setupSceneInput(this);
    this.cursors     = input.cursors;
    this.attackKey   = input.attackKey;
    this.defendKey   = input.defendKey;
    this.specialKey  = input.specialKey;
    this.interactKey = input.interactKey;

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

    // Dark realm overlay when entering castle in the true reality
    if (this.registry.get('darkRealm') === true) {
      this.add.rectangle(INTERIOR_W / 2, INTERIOR_H / 2, INTERIOR_W, INTERIOR_H, 0x0a0008, 0.55)
        .setDepth(50).setScrollFactor(0);
      this.add.text(INTERIOR_W / 2, 40, '✦ REALIDADE VERDADEIRA ✦', {
        fontSize: '9px', color: '#9944bb', fontFamily: 'monospace'
      }).setOrigin(0.5).setDepth(201).setScrollFactor(0);
    }

    // Unlock parallel universe on first castle entry
    if (!this.registry.get('realmUnlocked')) {
      this.registry.set('realmUnlocked', true);
      this.time.delayedCall(800, () => this.showRevelationHint());
    }
  }

  private showRevelationHint(): void {
    const lines = [
      'A mente do Devorador pesa sobre este lugar...',
      'Algo parece ilusório aqui.',
      '[ R ]  Alternar Realidade',
    ];
    const colors = ['#cc88ff', '#aa66dd', '#ffdd44'];
    let delay = 0;
    lines.forEach((line, i) => {
      const txt = this.add.text(INTERIOR_W / 2, INTERIOR_H / 2 - 20 + i * 18, line, {
        fontSize: '10px', color: colors[i],
        fontFamily: 'monospace', stroke: '#110022', strokeThickness: 3
      }).setOrigin(0.5).setDepth(202).setScrollFactor(0).setAlpha(0);
      this.time.delayedCall(delay, () => {
        this.tweens.add({ targets: txt, alpha: 1, duration: 400 });
        this.time.delayedCall(3200, () => this.tweens.add({ targets: txt, alpha: 0, duration: 600, onComplete: () => txt.destroy() }));
      });
      delay += 700;
    });
  }

  update(_t: number, delta: number): void {
    this.player.update(this.cursors, this.attackKey, this.defendKey, this.specialKey, delta);

    const nearExit = worldDist(this.player.worldX, this.player.worldY, EXIT_WX, EXIT_WY) < 1.8;
    this.exitPrompt.setVisible(nearExit);

    const pad = (this.input.gamepad as Phaser.Input.Gamepad.GamepadPlugin)?.getPad(0);
    const bDown = pad?.buttons[1]?.pressed === true;
    const padInteract = bDown && !this.padInteractPrev;
    this.padInteractPrev = bDown;

    if (nearExit && (Phaser.Input.Keyboard.JustDown(this.interactKey) || padInteract)) {
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
