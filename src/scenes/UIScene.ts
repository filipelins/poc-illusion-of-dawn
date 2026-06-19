import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  private hearts: Phaser.GameObjects.Image[] = [];
  private defendText!: Phaser.GameObjects.Text;
  private attackText!: Phaser.GameObjects.Text;
  private controlsText!: Phaser.GameObjects.Text;
  private specialBar!: Phaser.GameObjects.Graphics;
  private specialLabel!: Phaser.GameObjects.Text;
  private specialReady!: Phaser.GameObjects.Text;
  private realmOverlay!: Phaser.GameObjects.Rectangle;
  private realmActiveText!: Phaser.GameObjects.Text;
  private darkVignette!: Phaser.GameObjects.Rectangle;
  private darkBanner!: Phaser.GameObjects.Text;
  private darkBannerTimer: ReturnType<typeof setTimeout> | null = null;
  private bossBar!: Phaser.GameObjects.Graphics;
  private bossNameTxt!: Phaser.GameObjects.Text;
  private bossPhaseTxt!: Phaser.GameObjects.Text;
  private bossVignette!: Phaser.GameObjects.Rectangle;
  private bossAnnounce!: Phaser.GameObjects.Text;
  private bossBarLeft = 0;

  constructor() { super({ key: 'UIScene' }); }

  create(): void {
    // Heart row — pre-allocate for max Knight HP (10)
    for (let i = 0; i < 10; i++) {
      const heart = this.add.image(16 + i * 22, 16, 'heart-full')
        .setScrollFactor(0)
        .setDepth(100)
        .setScale(1.4);
      this.hearts.push(heart);
    }

    // Status labels
    this.defendText = this.add.text(8, 36, '🛡 DEFENDENDO', {
      fontSize: '11px', color: '#44ddff',
      fontFamily: 'monospace', stroke: '#003355', strokeThickness: 3
    }).setScrollFactor(0).setDepth(100).setVisible(false);

    this.attackText = this.add.text(8, 36, '⚔ ATACANDO', {
      fontSize: '11px', color: '#ffdd44',
      fontFamily: 'monospace', stroke: '#553300', strokeThickness: 3
    }).setScrollFactor(0).setDepth(100).setVisible(false);

    // Special bar (Bard / Cleric — hidden by default)
    const selectedChar = this.registry.get('selectedChar') as string;
    const isCleric = selectedChar === 'cleric';
    const labelText  = isCleric ? 'Q REINO'   : 'Q ESPECIAL';
    const readyText  = isCleric ? '⚡ Q PRONTO!' : '✦ Q PRONTO!';
    const readyColor = isCleric ? '#aaddff'    : '#ffdd44';
    const readyStroke = isCleric ? '#001133'   : '#332200';

    this.specialLabel = this.add.text(8, 52, labelText, {
      fontSize: '9px', color: isCleric ? '#aaddff' : '#ffdd44', fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(100).setVisible(false);

    this.specialBar = this.add.graphics().setScrollFactor(0).setDepth(100);

    this.specialReady = this.add.text(8, 52, readyText, {
      fontSize: '10px', color: readyColor,
      fontFamily: 'monospace', stroke: readyStroke, strokeThickness: 3
    }).setScrollFactor(0).setDepth(100).setVisible(false);

    this.tweens.add({
      targets: this.specialReady,
      alpha: { from: 1, to: 0.3 }, duration: 400, yoyo: true, repeat: -1
    });

    // Dark realm vignette (parallel universe — depth 92, below boss/cleric overlays)
    this.darkVignette = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x08000e)
      .setScrollFactor(0).setDepth(92).setAlpha(0);
    if (this.registry.get('darkRealm') === true) this.darkVignette.setAlpha(0.48);

    // Dark realm banner (shown briefly on toggle)
    this.darkBanner = this.add.text(this.scale.width / 2, this.scale.height / 2 + 30, '', {
      fontSize: '14px', color: '#cc88ff',
      fontFamily: 'monospace', stroke: '#110022', strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(103).setAlpha(0).setVisible(false);

    // Cleric realm overlay (full-screen purple tint, depth below UI)
    this.realmOverlay = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x6600cc)
      .setScrollFactor(0).setDepth(94).setAlpha(0);

    // Realm active label (center screen)
    this.realmActiveText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 20, '✦ REINO DIVINO ✦', {
      fontSize: '22px', color: '#ccddff',
      fontFamily: 'monospace', stroke: '#220066', strokeThickness: 5
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setVisible(false);

    this.tweens.add({
      targets: this.realmActiveText,
      alpha: { from: 1, to: 0.25 }, duration: 280, yoyo: true, repeat: -1
    });

    // Controls
    this.controlsText = this.add.text(4, this.scale.height - 18,
      'MOVER: WASD/🕹  |  ATACAR: Z/A  |  DEFENDER: X/🎮  |  ESPECIAL: Q/Y  |  REALIDADE: R/Select', {
      fontSize: '10px', color: '#888888',
      fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(100);

    // Enemy legend
    this.add.text(this.scale.width - 120, 8, 'Slime  Esq.  Mago', {
      fontSize: '9px', color: '#aaaaaa', fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(100);

    // ── Boss health bar (hidden by default) ──────────────────────────
    this.bossVignette = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x06000e)
      .setScrollFactor(0).setDepth(93).setAlpha(0);

    this.bossNameTxt = this.add.text(this.scale.width / 2, 4, 'DEVORADOR DE MENTES', {
      fontSize: '11px', color: '#dd66ff',
      fontFamily: 'monospace', stroke: '#1a0033', strokeThickness: 3
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100).setVisible(false);

    this.bossBar = this.add.graphics().setScrollFactor(0).setDepth(100);

    const bossBarW = 400;
    this.bossBarLeft = Math.floor((this.scale.width - bossBarW) / 2);
    this.bossPhaseTxt = this.add.text(this.bossBarLeft + bossBarW + 8, 16, 'FASE I', {
      fontSize: '9px', color: '#cc44ff', fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(100).setVisible(false).setOrigin(0, 0.5);

    this.bossAnnounce = this.add.text(this.scale.width / 2, this.scale.height / 2 - 40, '◈ O DEVORADOR DE MENTES DESPERTA ◈', {
      fontSize: '16px', color: '#ff44ff',
      fontFamily: 'monospace', stroke: '#1a0033', strokeThickness: 5
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102).setAlpha(0).setVisible(false);

    // Listen to registry changes
    this.registry.events.on('changedata', this.onRegistryChange, this);
    const maxHp = this.registry.get('playerMaxHP') as number ?? 10;
    this.syncHp(maxHp, maxHp);

    const char = this.registry.get('selectedChar') as string;
    const hasSpecial = char === 'bard' || char === 'cleric';
    this.specialLabel.setVisible(hasSpecial);
    this.specialBar.setVisible(hasSpecial);
    this.specialReady.setVisible(false);
  }

  private onRegistryChange(parent: unknown, key: string, value: unknown): void {
    if (key === 'playerHP' || key === 'playerMaxHP') {
      const hp = this.registry.get('playerHP') as number ?? 6;
      const max = this.registry.get('playerMaxHP') as number ?? 6;
      this.syncHp(hp, max);
    }
    if (key === 'playerDefending') {
      this.defendText.setVisible(value === true);
      if (value === true) this.attackText.setVisible(false);
    }
    if (key === 'playerAttacking') {
      this.attackText.setVisible(value === true);
      if (value === true) this.defendText.setVisible(false);
    }
    if (key === 'specialReady') {
      const char = this.registry.get('selectedChar') as string;
      const hasSpecial = char === 'bard' || char === 'cleric';
      const inRealm = this.registry.get('clericRealm') as boolean;
      if (hasSpecial && !inRealm) {
        this.specialReady.setVisible(value === true);
        this.specialLabel.setVisible(!value);
        this.specialBar.setVisible(!value);
      }
    }
    if (key === 'specialFrac') {
      const char = this.registry.get('selectedChar') as string;
      const hasSpecial = char === 'bard' || char === 'cleric';
      const ready = this.registry.get('specialReady') as boolean;
      const inRealm = this.registry.get('clericRealm') as boolean;
      const isCleric = char === 'cleric';
      if (hasSpecial && !ready && !inRealm) {
        const frac = value as number;
        const trackColor  = isCleric ? 0x001133 : 0x332200;
        const fillColor   = isCleric ? 0x4488ff : 0xffdd44;
        const borderColor = isCleric ? 0x0055aa : 0xffaa00;
        this.specialBar.clear();
        this.specialBar.fillStyle(trackColor, 0.8);   this.specialBar.fillRect(8, 63, 100, 8);
        this.specialBar.fillStyle(fillColor, 1);       this.specialBar.fillRect(8, 63, Math.floor(frac * 100), 8);
        this.specialBar.lineStyle(1, borderColor, 0.8); this.specialBar.strokeRect(8, 63, 100, 8);
      }
    }
    if (key === 'bossAnnouncing') {
      if (value === true) {
        this.bossAnnounce.setVisible(true).setAlpha(0);
        this.tweens.killTweensOf(this.bossAnnounce);
        this.tweens.add({ targets: this.bossAnnounce, alpha: 1, duration: 480 });
        // Pulse while visible
        this.tweens.add({
          targets: this.bossAnnounce,
          alpha: { from: 1, to: 0.35 }, duration: 420, yoyo: true,
          repeat: -1, delay: 480
        });
      } else {
        this.tweens.killTweensOf(this.bossAnnounce);
        this.tweens.add({
          targets: this.bossAnnounce, alpha: 0, duration: 700,
          onComplete: () => this.bossAnnounce.setVisible(false)
        });
      }
    }
    if (key === 'bossActive') {
      if (value === true) {
        this.bossNameTxt.setVisible(true);
        this.bossBar.setVisible(true);
        this.bossPhaseTxt.setVisible(true);
        this.tweens.killTweensOf(this.bossVignette);
        this.tweens.add({ targets: this.bossVignette, alpha: 0.3, duration: 1200 });
      } else {
        this.bossNameTxt.setVisible(false);
        this.bossBar.setVisible(false);
        this.bossPhaseTxt.setVisible(false);
        this.tweens.killTweensOf(this.bossVignette);
        this.tweens.add({ targets: this.bossVignette, alpha: 0, duration: 1000 });
      }
    }
    if (key === 'bossHP') {
      const hp    = value as number;
      const maxHp = this.registry.get('bossMaxHP') as number ?? 80;
      this.drawBossBar(hp, maxHp);
    }
    if (key === 'bossPhase' && value === 2) {
      this.bossPhaseTxt.setText('FASE II').setColor('#ff2255');
    }

    if (key === 'darkRealm') {
      const entering = value === true;
      this.tweens.killTweensOf(this.darkVignette);
      this.tweens.add({ targets: this.darkVignette, alpha: entering ? 0.48 : 0, duration: entering ? 700 : 500 });

      const msg = entering ? '✦ REALIDADE VERDADEIRA ✦' : '✦ ILUSÃO RESTAURADA ✦';
      this.darkBanner.setText(msg).setVisible(true).setAlpha(0);
      this.tweens.killTweensOf(this.darkBanner);
      this.tweens.add({
        targets: this.darkBanner, alpha: 1, duration: 350,
        onComplete: () => {
          this.time.delayedCall(1400, () => {
            this.tweens.add({
              targets: this.darkBanner, alpha: 0, duration: 400,
              onComplete: () => this.darkBanner.setVisible(false)
            });
          });
        }
      });
    }

    if (key === 'clericRealm') {
      const isCleric = (this.registry.get('selectedChar') as string) === 'cleric';
      if (isCleric) {
        if (value === true) {
          this.tweens.killTweensOf(this.realmOverlay);
          this.tweens.add({ targets: this.realmOverlay, alpha: 0.38, duration: 200 });
          this.realmActiveText.setVisible(true);
          this.specialReady.setVisible(false);
          this.specialLabel.setVisible(false);
          this.specialBar.setVisible(false);
        } else {
          this.tweens.killTweensOf(this.realmOverlay);
          this.tweens.add({ targets: this.realmOverlay, alpha: 0, duration: 320 });
          this.realmActiveText.setVisible(false);
          this.specialLabel.setVisible(true);
          this.specialBar.setVisible(true);
        }
      }
    }
  }

  private drawBossBar(hp: number, maxHp: number): void {
    const bx = this.bossBarLeft, by = 18, bw = 400, bh = 13;
    const frac = Math.max(0, hp / maxHp);
    const fillColor = frac > 0.5 ? 0xcc44ff : frac > 0.25 ? 0xff2288 : 0xff0000;

    this.bossBar.clear();
    // Background
    this.bossBar.fillStyle(0x110022, 0.9); this.bossBar.fillRect(bx, by, bw, bh);
    // Fill
    this.bossBar.fillStyle(fillColor, 1);
    this.bossBar.fillRect(bx, by, Math.floor(frac * bw), bh);
    // Segment dividers (10 sections)
    this.bossBar.lineStyle(1, 0x5500aa, 0.5);
    for (let i = 1; i < 10; i++) {
      const x = bx + Math.floor(bw * i / 10);
      this.bossBar.lineBetween(x, by, x, by + bh);
    }
    // Border
    this.bossBar.lineStyle(2, 0xaa22cc, 0.9); this.bossBar.strokeRect(bx, by, bw, bh);
  }

  private syncHp(hp: number, max: number): void {
    for (let i = 0; i < this.hearts.length; i++) {
      this.hearts[i].setTexture(i < hp ? 'heart-full' : 'heart-empty');
      // Pulse on low HP
      if (i < hp && hp <= 2) {
        this.tweens.add({
          targets: this.hearts[i],
          scaleX: 1.6, scaleY: 1.6,
          duration: 300, yoyo: true,
          repeat: 0
        });
      }
    }
    // Show/hide extra hearts
    for (let i = 0; i < this.hearts.length; i++) {
      this.hearts[i].setVisible(i < max);
    }
  }
}
