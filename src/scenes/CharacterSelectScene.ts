import Phaser from 'phaser';

interface CharDef {
  id: string;
  name: string;
  spriteTex: string;
  desc: string[];
  hp:  number;
  atk: number;
  spd: number;
  special: string | null;
  cardColor: number;
  accentColor: number;
}

const CHARS: CharDef[] = [
  {
    id: 'knight',
    name: 'KNIGHT',
    spriteTex: 'player-down',
    desc: ['Veteran warrior armed with', 'sword and shield.', '"Strike first, stand firm."'],
    hp: 10, atk: 8, spd: 5,
    special: null,
    cardColor: 0x1a2a4a,
    accentColor: 0x6699ff,
  },
  {
    id: 'bard',
    name: 'BARD',
    spriteTex: 'bard-down',
    desc: ['Melodic fighter who channels', 'music into magic.', '"The song never ends."'],
    hp: 7, atk: 5, spd: 8,
    special: 'Q — Musical Note Burst',
    cardColor: 0x2a1a3a,
    accentColor: 0xffdd44,
  },
  {
    id: 'cleric',
    name: 'CLERIC',
    spriteTex: 'cleric-down',
    desc: ['Holy mage hurling divine bolts.', 'Q tears reality open:', '"Double damage for 2 seconds."'],
    hp: 80, atk: 60, spd: 16,
    special: 'Q — Divine Realm (2s ×2 DMG)',
    cardColor: 0x1a1a30,
    accentColor: 0xaaddff,
  },
];

export class CharacterSelectScene extends Phaser.Scene {
  private selected = 0;
  private cards: Phaser.GameObjects.Container[] = [];
  private confirmBlink!: Phaser.GameObjects.Text;

  constructor() { super({ key: 'CharacterSelectScene' }); }

  create(): void {
    const W = 1000, H = 800;

    // ── Background ──────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a18, 0x0a0a18, 0x12102a, 0x12102a, 1);
    bg.fillRect(0, 0, W, H);

    // Stars
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H * 0.75);
      const alpha = 0.3 + Math.random() * 0.7;
      this.add.rectangle(x, y, 1, 1, 0xffffff, alpha);
    }

    // ── Title ───────────────────────────────────────────────────────
    this.add.text(W / 2, 36, 'ILLUSION OF DAWN', {
      fontSize: '28px', color: '#ffdd88',
      fontFamily: 'monospace', stroke: '#442200', strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(W / 2, 72, '— Choose Your Hero —', {
      fontSize: '14px', color: '#aabbcc',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    // ── Character cards ─────────────────────────────────────────────
    const cardW = 270, cardH = 400, cardY = 110;
    const gap = 16;
    const totalW = CHARS.length * cardW + (CHARS.length - 1) * gap;
    const startX = (W - totalW) / 2;
    const positions = CHARS.map((_, i) => startX + i * (cardW + gap));

    CHARS.forEach((char, idx) => {
      const cx = positions[idx];
      const container = this.add.container(cx, cardY);
      this.buildCard(container, char, cardW, cardH);
      container.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, cardW, cardH),
        Phaser.Geom.Rectangle.Contains
      );
      container.on('pointerdown', () => {
        this.selected = idx;
        this.refreshSelection();
        this.startGame();
      });
      container.on('pointerover', () => {
        if (this.selected !== idx) {
          (container.list[0] as Phaser.GameObjects.Graphics).setAlpha(0.85);
        }
      });
      container.on('pointerout', () => {
        (container.list[0] as Phaser.GameObjects.Graphics).setAlpha(1);
      });
      this.cards.push(container);
    });

    this.refreshSelection();

    // ── Confirm text ────────────────────────────────────────────────
    this.confirmBlink = this.add.text(W / 2, 570, 'ENTER or CLICK to start', {
      fontSize: '14px', color: '#ffffff',
      fontFamily: 'monospace', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: this.confirmBlink,
      alpha: { from: 1, to: 0.2 },
      duration: 600, yoyo: true, repeat: -1
    });

    this.add.text(W / 2, 598, '← → Arrow Keys to select', {
      fontSize: '11px', color: '#667788', fontFamily: 'monospace'
    }).setOrigin(0.5);

    // ── Input ───────────────────────────────────────────────────────
    const kb = this.input.keyboard!;
    kb.on('keydown-LEFT',  () => { this.selected = Math.max(0, this.selected - 1); this.refreshSelection(); });
    kb.on('keydown-RIGHT', () => { this.selected = Math.min(CHARS.length - 1, this.selected + 1); this.refreshSelection(); });
    kb.on('keydown-A',     () => { this.selected = Math.max(0, this.selected - 1); this.refreshSelection(); });
    kb.on('keydown-D',     () => { this.selected = Math.min(CHARS.length - 1, this.selected + 1); this.refreshSelection(); });
    kb.on('keydown-ENTER', () => this.startGame());
    kb.on('keydown-SPACE', () => this.startGame());
  }

  private buildCard(container: Phaser.GameObjects.Container, char: CharDef, w: number, h: number): void {
    // Card background
    const bg = this.add.graphics();
    bg.fillStyle(char.cardColor, 0.95);
    bg.fillRoundedRect(0, 0, w, h, 12);
    bg.lineStyle(2, char.accentColor, 0.5);
    bg.strokeRoundedRect(0, 0, w, h, 12);
    container.add(bg);

    // Character name
    const nameText = this.add.text(w / 2, 22, char.name, {
      fontSize: '20px', color: `#${char.accentColor.toString(16).padStart(6, '0')}`,
      fontFamily: 'monospace', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5);
    container.add(nameText);

    // Sprite portrait (scaled up)
    const portrait = this.add.image(w / 2, 90, char.spriteTex);
    portrait.setScale(5).setOrigin(0.5, 0.5);
    container.add(portrait);

    // Stats
    const statY = 160;
    const statsData = [
      { label: 'HP ', value: char.hp, max: 10, color: 0xdd3333 },
      { label: 'ATK', value: char.atk, max: 10, color: 0xff8822 },
      { label: 'SPD', value: char.spd, max: 10, color: 0x44aaff },
    ];

    statsData.forEach((stat, i) => {
      const y = statY + i * 28;
      // Label
      container.add(
        this.add.text(16, y, stat.label, {
          fontSize: '12px', color: '#aabbcc', fontFamily: 'monospace'
        })
      );
      // Bars
      for (let b = 0; b < 10; b++) {
        const filled = b < stat.value;
        const barBg = this.add.graphics();
        barBg.fillStyle(filled ? stat.color : 0x223344, filled ? 1 : 0.4);
        barBg.fillRect(46 + b * 22, y + 1, 18, 12);
        container.add(barBg);
      }
    });

    // Special ability
    if (char.special) {
      const specBg = this.add.graphics();
      specBg.fillStyle(0x332200, 0.8);
      specBg.fillRoundedRect(10, 252, w - 20, 30, 6);
      specBg.lineStyle(1, 0xffdd44, 0.6);
      specBg.strokeRoundedRect(10, 252, w - 20, 30, 6);
      container.add(specBg);

      container.add(
        this.add.text(w / 2, 267, '⚡ ' + char.special, {
          fontSize: '10px', color: '#ffdd44', fontFamily: 'monospace'
        }).setOrigin(0.5)
      );
    } else {
      container.add(
        this.add.text(w / 2, 267, '— No special ability —', {
          fontSize: '10px', color: '#445566', fontFamily: 'monospace'
        }).setOrigin(0.5)
      );
    }

    // Description
    char.desc.forEach((line, i) => {
      container.add(
        this.add.text(w / 2, 300 + i * 20, line, {
          fontSize: '11px', color: '#8899aa', fontFamily: 'monospace'
        }).setOrigin(0.5)
      );
    });

    // Bottom accent line
    const accent = this.add.graphics();
    accent.fillStyle(char.accentColor, 0.6);
    accent.fillRect(20, h - 14, w - 40, 3);
    container.add(accent);
  }

  private refreshSelection(): void {
    this.cards.forEach((card, idx) => {
      const isSelected = idx === this.selected;
      const bg = card.list[0] as Phaser.GameObjects.Graphics;
      const char = CHARS[idx];

      bg.clear();
      if (isSelected) {
        // Glowing selected border
        bg.fillStyle(char.cardColor, 1);
        bg.fillRoundedRect(0, 0, 270, 400, 12);
        bg.lineStyle(3, char.accentColor, 1);
        bg.strokeRoundedRect(0, 0, 270, 400, 12);
        // Extra outer glow
        bg.lineStyle(6, char.accentColor, 0.3);
        bg.strokeRoundedRect(-3, -3, 276, 406, 14);

        this.tweens.add({
          targets: card,
          y: 104, duration: 80, ease: 'Sine.Out'
        });
      } else {
        bg.fillStyle(char.cardColor, 0.7);
        bg.fillRoundedRect(0, 0, 270, 400, 12);
        bg.lineStyle(1, char.accentColor, 0.3);
        bg.strokeRoundedRect(0, 0, 270, 400, 12);

        this.tweens.add({
          targets: card,
          y: 114, duration: 80, ease: 'Sine.Out'
        });
      }
    });
  }

  private startGame(): void {
    this.registry.set('selectedChar', CHARS[this.selected].id);
    this.cameras.main.fade(400, 0, 0, 0);
    this.time.delayedCall(420, () => this.scene.start('GameScene'));
  }
}
