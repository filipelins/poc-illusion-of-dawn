import Phaser from 'phaser';

interface CharDef {
  id: string;
  name: string;
  spriteTex: string;
  desc: string;
  lore: string;
  hp: number; atk: number; spd: number;
  special: string | null;
  accentColor: number;
}

const CHARS: CharDef[] = [
  {
    id: 'knight', name: 'GUERREIRO', spriteTex: 'player-down',
    desc: 'Guerreiro veterano, espada e escudo.',
    lore: 'Ativa a Fúria para ×3 DMG e invulnerabilidade por 5 segundos.',
    hp: 10, atk: 9, spd: 6, special: 'Q — Fúria: ×3 DMG, Invulnerável (5s)',
    accentColor: 0xff6600,
  },
  {
    id: 'bard', name: 'BARDO', spriteTex: 'bard-down',
    desc: 'Música como magia destrutiva.',
    lore: 'Notas que ferem tanto quanto lâminas. A canção nunca acaba.',
    hp: 7, atk: 5, spd: 8, special: 'Q — Explosão de Notas',
    accentColor: 0xffdd44,
  },
  {
    id: 'cleric', name: 'CLÉRIGO', spriteTex: 'cleric-down',
    desc: 'Raios divinos rasgam a escuridão.',
    lore: 'Ativa o Reino Divino para dano duplo por 2 segundos.',
    hp: 8, atk: 5, spd: 4, special: 'Q — Reino Divino (x2 DMG)',
    accentColor: 0xaaddff,
  },
];

// ── Layout constants ────────────────────────────────────────────
const PNL_X = 12, PNL_Y = 66, PNL_W = 262, PNL_H = 574;
const CX = 500, CY = 340;
const GRD_X = 726, GRD_Y = 90;
const THUMB_W = 116, THUMB_H = 156, THUMB_GAP = 10;
const STAT_Y0 = PNL_Y + 78;
const STAT_RH = 64;
const STAT_DY = 20;

export class CharacterSelectScene extends Phaser.Scene {
  private selected = 0;
  private padLeft  = false;
  private padRight = false;
  private padA     = false;

  // Center display — updated on selection change
  private centerGlow!:    Phaser.GameObjects.Graphics;
  private centerSprite!:  Phaser.GameObjects.Image;
  private centerNameTxt!: Phaser.GameObjects.Text;
  private centerDescTxt!: Phaser.GameObjects.Text;

  // Left panel — updated on selection change
  private panelBg!:      Phaser.GameObjects.Graphics;
  private panelNameTxt!: Phaser.GameObjects.Text;
  private statGfx!:      Phaser.GameObjects.Graphics;
  private statPctTexts:  Phaser.GameObjects.Text[] = [];
  private specialBg!:    Phaser.GameObjects.Graphics;
  private specialTxt!:   Phaser.GameObjects.Text;
  private loreTxt!:      Phaser.GameObjects.Text;

  // Thumbnail borders — updated on selection change
  private thumbBorders: Phaser.GameObjects.Graphics[] = [];

  constructor() { super({ key: 'CharacterSelectScene' }); }

  create(): void {
    this.thumbBorders = [];
    this.statPctTexts = [];

    // Center the 1000×800 game content inside the actual EXPAND canvas
    const ox = Math.floor(Math.max(0, (this.scale.width  - 1000) / 2));
    const oy = Math.floor(Math.max(0, (this.scale.height -  800) / 2));
    if (ox || oy) this.cameras.main.setScroll(-ox, -oy);

    this.buildBackground(ox, oy);
    this.buildLeftPanel();
    this.buildCenterArea();
    this.buildRightGrid();
    this.buildStartButton();
    this.setupInput();
    this.refreshSelection();
  }

  // ── Background ─────────────────────────────────────────────────
  // ox/oy = offset so world-space content (0..1000, 0..800) appears centered.
  // Background elements use setScrollFactor(0) so they sit in screen-space and
  // cover the full EXPAND canvas regardless of monitor width.

  private buildBackground(ox: number, oy: number): void {
    const SW = this.scale.width, SH = this.scale.height;

    // Full-canvas dark gradient (screen-space)
    const bg = this.add.graphics().setScrollFactor(0);
    bg.fillGradientStyle(0x050812, 0x050812, 0x0c0a1e, 0x0c0a1e, 1, 1, 1, 1);
    bg.fillRect(0, 0, SW, SH);

    // Atmospheric blobs (screen-space, centered over game content)
    const glows = this.add.graphics().setScrollFactor(0);
    glows.fillStyle(0x0e2255, 0.07);
    glows.fillCircle(ox + CX, 0, 520);
    glows.fillStyle(0x55106a, 0.04);
    glows.fillCircle(ox + CX * 1.44, oy + 320, 360);

    // Stars spread across the real canvas
    const stars = this.add.graphics().setScrollFactor(0);
    for (let i = 0; i < 130; i++) {
      stars.fillStyle(0xffffff, 0.05 + Math.random() * 0.5);
      stars.fillRect(Phaser.Math.Between(0, SW), Phaser.Math.Between(0, SH), 1, 1);
    }

    // Watermark behind center character (screen-space)
    this.add.text(ox + CX, oy + CY - 20, 'ILLUSION\nOF DAWN', {
      fontSize: '88px', color: '#ffffff', fontFamily: 'monospace', align: 'center',
    }).setOrigin(0.5).setAlpha(0.024).setScrollFactor(0);

    // Top bar spans full screen width (screen-space)
    const topBar = this.add.graphics().setScrollFactor(0);
    topBar.fillStyle(0x050812, 0.98);
    topBar.fillRect(0, 0, SW, 60);
    topBar.lineStyle(1, 0x1b2b44, 0.9);
    topBar.lineBetween(0, 60, SW, 60);

    // Title centered over the game content area
    this.add.text(ox + 500, 20, 'ILLUSION OF DAWN', {
      fontSize: '20px', color: '#c4d2f0',
      fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#08101e', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0);

    this.add.text(ox + 500, 46, 'SELECIONAR HEROI', {
      fontSize: '9px', color: '#3a4d66',
      fontFamily: 'monospace', letterSpacing: 5,
    }).setOrigin(0.5).setScrollFactor(0);
  }

  // ── Left info panel ────────────────────────────────────────────

  private buildLeftPanel(): void {
    this.panelBg = this.add.graphics();

    this.panelNameTxt = this.add.text(PNL_X + PNL_W / 2, PNL_Y + 24, '', {
      fontSize: '17px', color: '#ffffff',
      fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000010', strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(PNL_X + 14, PNL_Y + 60, 'ATRIBUTOS', {
      fontSize: '8px', color: '#2e4060', fontFamily: 'monospace', letterSpacing: 3,
    });

    ['HP', 'ATAQUE', 'VELOC.'].forEach((lbl, i) => {
      const y = STAT_Y0 + i * STAT_RH;
      this.add.text(PNL_X + 52, y, lbl, {
        fontSize: '10px', color: '#667788', fontFamily: 'monospace',
      });
      this.statPctTexts.push(
        this.add.text(PNL_X + PNL_W - 12, y + STAT_DY, '', {
          fontSize: '10px', color: '#ffffff', fontFamily: 'monospace',
        }).setOrigin(1, 0)
      );
    });

    this.statGfx = this.add.graphics();

    this.add.text(PNL_X + 14, PNL_Y + 314, 'HABILIDADE ESPECIAL', {
      fontSize: '8px', color: '#2e4060', fontFamily: 'monospace', letterSpacing: 2,
    });

    this.specialBg  = this.add.graphics();
    this.specialTxt = this.add.text(PNL_X + 16, PNL_Y + 332, '', {
      fontSize: '10px', color: '#ffcc44', fontFamily: 'monospace',
      wordWrap: { width: PNL_W - 32 },
    });

    this.loreTxt = this.add.text(PNL_X + 16, PNL_Y + 404, '', {
      fontSize: '9px', color: '#3a5060', fontFamily: 'monospace',
      fontStyle: 'italic', wordWrap: { width: PNL_W - 32 },
    });

    this.add.text(PNL_X + PNL_W / 2, PNL_Y + PNL_H - 18, 'SETAS navegar   ENTER iniciar', {
      fontSize: '8px', color: '#1e2e40', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  // ── Center character display ───────────────────────────────────

  private buildCenterArea(): void {
    const floor = this.add.graphics();
    floor.lineStyle(1, 0x1b2d40, 0.35);
    floor.lineBetween(320, 510, 680, 510);
    floor.lineStyle(1, 0x1b2d40, 0.15);
    floor.lineBetween(350, 520, 650, 520);

    this.centerGlow   = this.add.graphics();
    this.centerSprite = this.add.image(CX, CY, 'player-down').setScale(9).setOrigin(0.5);

    const arStyle = {
      fontSize: '40px', color: '#ffffff',
      fontFamily: 'monospace', stroke: '#030610', strokeThickness: 5,
    };
    const leftArr  = this.add.text(300, CY, '<', arStyle).setOrigin(0.5).setAlpha(0.5);
    const rightArr = this.add.text(700, CY, '>', arStyle).setOrigin(0.5).setAlpha(0.5);

    leftArr.setInteractive({ useHandCursor: true })
      .on('pointerover', () => leftArr.setAlpha(1).setColor('#ffdd88'))
      .on('pointerout',  () => leftArr.setAlpha(0.5).setColor('#ffffff'))
      .on('pointerdown', () => { this.selected = Math.max(0, this.selected - 1); this.refreshSelection(); });

    rightArr.setInteractive({ useHandCursor: true })
      .on('pointerover', () => rightArr.setAlpha(1).setColor('#ffdd88'))
      .on('pointerout',  () => rightArr.setAlpha(0.5).setColor('#ffffff'))
      .on('pointerdown', () => { this.selected = Math.min(CHARS.length - 1, this.selected + 1); this.refreshSelection(); });

    this.centerNameTxt = this.add.text(CX, 516, '', {
      fontSize: '22px', color: '#ffffff',
      fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.centerDescTxt = this.add.text(CX, 548, '', {
      fontSize: '11px', color: '#445566', fontFamily: 'monospace', align: 'center',
    }).setOrigin(0.5);
  }

  // ── Right character grid ───────────────────────────────────────

  private buildRightGrid(): void {
    const panelX = GRD_X - 10, panelY = 62, panelW = 258, panelH = 686;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x050810, 0.92);
    panelBg.fillRoundedRect(panelX, panelY, panelW, panelH, 8);
    panelBg.lineStyle(1, 0x1a2840, 0.55);
    panelBg.strokeRoundedRect(panelX, panelY, panelW, panelH, 8);

    this.add.text(panelX + panelW / 2, 75, 'PERSONAGENS', {
      fontSize: '8px', color: '#2a3e55', fontFamily: 'monospace', letterSpacing: 3,
    }).setOrigin(0.5);

    for (let i = 0; i < 6; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const tx = GRD_X + col * (THUMB_W + THUMB_GAP);
      const ty = GRD_Y + row * (THUMB_H + THUMB_GAP);

      const border = this.add.graphics();
      this.thumbBorders.push(border);

      if (i < CHARS.length) {
        this.buildThumb(tx, ty, CHARS[i], i);
      } else {
        this.buildLockedThumb(tx, ty, border);
      }
    }
  }

  private buildThumb(tx: number, ty: number, char: CharDef, idx: number): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x090c1c, 1);
    bg.fillRoundedRect(tx, ty, THUMB_W, THUMB_H, 6);
    bg.fillStyle(char.accentColor, 0.16);
    bg.fillRoundedRect(tx, ty, THUMB_W, 26, { tl: 6, tr: 6, bl: 0, br: 0 });

    this.add.image(tx + THUMB_W / 2, ty + THUMB_H * 0.49, char.spriteTex)
      .setScale(4).setOrigin(0.5);

    this.add.text(tx + THUMB_W / 2, ty + THUMB_H - 11, char.name, {
      fontSize: '8px', color: '#5d7088', fontFamily: 'monospace',
    }).setOrigin(0.5);

    bg.setInteractive(
      new Phaser.Geom.Rectangle(tx, ty, THUMB_W, THUMB_H),
      Phaser.Geom.Rectangle.Contains
    );
    bg.on('pointerdown', () => { this.selected = idx; this.refreshSelection(); });
    bg.on('pointerover', () => bg.setAlpha(0.72));
    bg.on('pointerout',  () => bg.setAlpha(1));
  }

  private buildLockedThumb(tx: number, ty: number, border: Phaser.GameObjects.Graphics): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x060810, 1);
    bg.fillRoundedRect(tx, ty, THUMB_W, THUMB_H, 6);

    const lx = tx + THUMB_W / 2, ly = ty + THUMB_H / 2 - 6;
    bg.fillStyle(0x1c2a38, 0.8);
    bg.fillRoundedRect(lx - 14, ly, 28, 22, 4);
    bg.lineStyle(4.5, 0x1c2a38, 0.8);
    bg.beginPath();
    bg.moveTo(lx - 8, ly);
    bg.lineTo(lx - 8, ly - 10);
    bg.arc(lx, ly - 10, 8, Math.PI, 0, true);
    bg.lineTo(lx + 8, ly);
    bg.strokePath();

    this.add.text(tx + THUMB_W / 2, ty + THUMB_H - 12, 'EM BREVE', {
      fontSize: '7px', color: '#1e2c3a', fontFamily: 'monospace', letterSpacing: 1,
    }).setOrigin(0.5);

    border.lineStyle(1, 0x1a2638, 0.4);
    border.strokeRoundedRect(tx, ty, THUMB_W, THUMB_H, 6);
  }

  // ── START button ───────────────────────────────────────────────

  private buildStartButton(): void {
    const bx = GRD_X - 10, by = 662, bw = 258, bh = 72;

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.45);
    shadow.fillRoundedRect(bx + 4, by + 5, bw, bh, 8);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xcc8800, 1);
    btnBg.fillRoundedRect(bx, by, bw, bh, 8);
    btnBg.fillStyle(0xffcc00, 1);
    btnBg.fillRoundedRect(bx, by, bw, bh * 0.5, { tl: 8, tr: 8, bl: 0, br: 0 });
    btnBg.fillStyle(0xffffff, 0.18);
    btnBg.fillRoundedRect(bx + 12, by + 9, bw - 24, Math.floor(bh * 0.26), 3);

    const btnTxt = this.add.text(bx + bw / 2, by + bh / 2 - 1, '▶  JOGAR', {
      fontSize: '24px', color: '#1a0c00',
      fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    const zone = this.add.zone(bx, by, bw, bh).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => { btnBg.setAlpha(0.86); btnTxt.setAlpha(0.86); });
    zone.on('pointerout',  () => { btnBg.setAlpha(1);    btnTxt.setAlpha(1); });
    zone.on('pointerdown', () => this.startGame());

    this.tweens.add({
      targets: [btnBg, btnTxt],
      alpha: { from: 1, to: 0.84 },
      duration: 880, yoyo: true, repeat: -1,
    });
  }

  // ── Input ──────────────────────────────────────────────────────

  private setupInput(): void {
    const kb = this.input.keyboard!;
    kb.on('keydown-LEFT',  () => { this.selected = Math.max(0, this.selected - 1); this.refreshSelection(); });
    kb.on('keydown-RIGHT', () => { this.selected = Math.min(CHARS.length - 1, this.selected + 1); this.refreshSelection(); });
    kb.on('keydown-A',     () => { this.selected = Math.max(0, this.selected - 1); this.refreshSelection(); });
    kb.on('keydown-D',     () => { this.selected = Math.min(CHARS.length - 1, this.selected + 1); this.refreshSelection(); });
    kb.on('keydown-ENTER', () => this.startGame());
    kb.on('keydown-SPACE', () => this.startGame());
  }

  update(): void {
    const pad = (this.input.gamepad as Phaser.Input.Gamepad.GamepadPlugin)?.getPad(0);
    if (!pad) return;

    const stickX  = pad.leftStick?.x ?? 0;
    const leftDn  = pad.buttons[14]?.pressed === true || stickX < -0.5;
    const rightDn = pad.buttons[15]?.pressed === true || stickX >  0.5;
    const aDn     = pad.buttons[0]?.pressed  === true || pad.buttons[9]?.pressed === true;

    if (leftDn  && !this.padLeft)  { this.selected = Math.max(0, this.selected - 1); this.refreshSelection(); }
    if (rightDn && !this.padRight) { this.selected = Math.min(CHARS.length - 1, this.selected + 1); this.refreshSelection(); }
    if (aDn     && !this.padA)     this.startGame();

    this.padLeft  = leftDn;
    this.padRight = rightDn;
    this.padA     = aDn;
  }

  // ── Selection refresh ─────────────────────────────────────────

  private refreshSelection(): void {
    const char   = CHARS[this.selected];
    const accent = char.accentColor;
    const acHex  = `#${accent.toString(16).padStart(6, '0')}`;

    // ── Left panel ──────────────────────────────────────────────
    this.panelBg.clear();
    this.panelBg.fillStyle(0x070c1c, 0.94);
    this.panelBg.fillRoundedRect(PNL_X, PNL_Y, PNL_W, PNL_H, 8);
    this.panelBg.lineStyle(1.5, accent, 0.5);
    this.panelBg.strokeRoundedRect(PNL_X, PNL_Y, PNL_W, PNL_H, 8);
    this.panelBg.fillStyle(accent, 0.1);
    this.panelBg.fillRoundedRect(PNL_X, PNL_Y, PNL_W, 48, { tl: 8, tr: 8, bl: 0, br: 0 });
    this.panelBg.lineStyle(1.5, accent, 0.88);
    this.panelBg.lineBetween(PNL_X, PNL_Y + 48, PNL_X + PNL_W, PNL_Y + 48);

    this.panelNameTxt.setText(char.name).setColor(acHex);

    // Stat bars
    this.statGfx.clear();
    const barX = PNL_X + 52, barW = PNL_W - 68, barH = 11;
    const stats = [
      { v: char.hp,  max: 10, color: 0xdd3344, icon: 0xaa1122 },
      { v: char.atk, max: 10, color: 0xff7722, icon: 0xcc4400 },
      { v: char.spd, max: 10, color: 0x3399ff, icon: 0x1166cc },
    ];
    stats.forEach((s, i) => {
      const y   = STAT_Y0 + i * STAT_RH;
      const pct = s.v / s.max;
      const fw  = Math.max(4, Math.floor(barW * pct));

      this.statGfx.fillStyle(s.icon, 0.9);
      this.statGfx.fillRoundedRect(PNL_X + 14, y, 26, 26, 4);
      this.statGfx.fillStyle(0xffffff, 0.16);
      this.statGfx.fillRect(PNL_X + 15, y + 1, 11, 5);

      this.statGfx.fillStyle(0x0d1020, 1);
      this.statGfx.fillRoundedRect(barX, y + STAT_DY, barW, barH, 4);
      this.statGfx.fillStyle(s.color, 1);
      this.statGfx.fillRoundedRect(barX, y + STAT_DY, fw, barH, 4);
      this.statGfx.fillStyle(0xffffff, 0.2);
      this.statGfx.fillRoundedRect(barX, y + STAT_DY, Math.floor(fw * 0.5), Math.ceil(barH / 2), 2);

      this.statPctTexts[i].setText(`${Math.round(pct * 100)}%`);
    });

    // Special ability
    this.specialBg.clear();
    if (char.special) {
      this.specialBg.fillStyle(0x110d04, 1);
      this.specialBg.fillRoundedRect(PNL_X + 8, PNL_Y + 326, PNL_W - 16, 62, 6);
      this.specialBg.lineStyle(1, 0x7a5e00, 0.65);
      this.specialBg.strokeRoundedRect(PNL_X + 8, PNL_Y + 326, PNL_W - 16, 62, 6);
      this.specialTxt.setText('⚡ ' + char.special).setColor('#ffcc44');
    } else {
      this.specialTxt.setText('— Sem habilidade especial —').setColor('#2e3f50');
    }

    this.loreTxt.setText(char.lore);

    // ── Center ──────────────────────────────────────────────────
    this.centerGlow.clear();
    this.centerGlow.fillStyle(accent, 0.065);
    this.centerGlow.fillCircle(CX, CY, 180);
    this.centerGlow.fillStyle(accent, 0.035);
    this.centerGlow.fillCircle(CX, CY, 260);
    this.centerGlow.fillStyle(accent, 0.04);
    this.centerGlow.fillEllipse(CX, 508, 280, 36);

    this.centerSprite.setTexture(char.spriteTex);
    this.tweens.killTweensOf(this.centerSprite);
    this.tweens.add({
      targets: this.centerSprite,
      scaleX: { from: 7, to: 9 }, scaleY: { from: 7, to: 9 },
      duration: 200, ease: 'Back.Out',
    });

    this.centerNameTxt.setText(char.name).setColor(acHex);
    this.centerDescTxt.setText(char.desc);

    // ── Thumbnail borders ────────────────────────────────────────
    CHARS.forEach((c, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const tx = GRD_X + col * (THUMB_W + THUMB_GAP);
      const ty = GRD_Y + row * (THUMB_H + THUMB_GAP);
      const b  = this.thumbBorders[i];
      b.clear();
      if (i === this.selected) {
        b.lineStyle(3, 0xffcc00, 1);
        b.strokeRoundedRect(tx - 2, ty - 2, THUMB_W + 4, THUMB_H + 4, 8);
        b.lineStyle(1, c.accentColor, 0.55);
        b.strokeRoundedRect(tx + 2, ty + 2, THUMB_W - 4, THUMB_H - 4, 4);
      } else {
        b.lineStyle(1, c.accentColor, 0.2);
        b.strokeRoundedRect(tx, ty, THUMB_W, THUMB_H, 6);
      }
    });
  }

  // ── Start game ─────────────────────────────────────────────────

  private startGame(): void {
    this.registry.set('selectedChar', CHARS[this.selected].id);
    this.cameras.main.fade(400, 0, 0, 0);
    this.time.delayedCall(420, () => this.scene.start('HeavenbrockScene'));
  }
}
