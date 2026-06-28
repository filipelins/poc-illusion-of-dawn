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
  private furyOverlay!: Phaser.GameObjects.Rectangle;
  private furyText!: Phaser.GameObjects.Text;
  private darkVignette!: Phaser.GameObjects.Rectangle;
  private darkBanner!: Phaser.GameObjects.Text;
  private darkBannerTimer: ReturnType<typeof setTimeout> | null = null;
  private bossBar!: Phaser.GameObjects.Graphics;
  private bossNameTxt!: Phaser.GameObjects.Text;
  private bossPhaseTxt!: Phaser.GameObjects.Text;
  private bossVignette!: Phaser.GameObjects.Rectangle;
  private bossAnnounce!: Phaser.GameObjects.Text;
  private bossBarLeft = 0;

  // Portrait HUD
  private portraitImg!: Phaser.GameObjects.Image;
  private hpBarGfx!: Phaser.GameObjects.Graphics;

  // Pause
  private pauseOverlay!: Phaser.GameObjects.Rectangle;
  private pauseText!: Phaser.GameObjects.Text;
  private pauseKey!: Phaser.Input.Keyboard.Key;
  private padStartPrev = false;

  // Kills counter
  private killsTxt!: Phaser.GameObjects.Text;

  // Mini-map
  private mapGfx!: Phaser.GameObjects.Graphics;
  private readonly MAP_DISPLAY_W = 100;
  private readonly MAP_DISPLAY_H = 76;

  constructor() { super({ key: 'UIScene' }); }

  create(): void {
    // Keep heart objects for legacy compat — hidden, replaced by bar HUD
    for (let i = 0; i < 10; i++) {
      const heart = this.add.image(16 + i * 22, 16, 'heart-full')
        .setScrollFactor(0).setDepth(100).setScale(1.4).setVisible(false);
      this.hearts.push(heart);
    }

    // ── Portrait + HP/SP bar HUD (top-left) ──────────────────────────
    const hudChar  = this.registry.get('selectedChar') as string ?? 'knight';
    const portKey  = hudChar === 'bard' ? 'portrait-bard'
      : hudChar === 'cleric' ? 'portrait-cleric' : 'portrait-knight';
    const accentCol = hudChar === 'knight' ? 0xff8833
      : hudChar === 'bard' ? 0xffdd44 : 0xaaddff;

    // Dark panel background
    const hudBg = this.add.graphics().setScrollFactor(0).setDepth(98);
    hudBg.fillStyle(0x000000, 0.62);
    hudBg.fillRect(6, 6, 228, 58);
    hudBg.lineStyle(1, accentCol, 0.22);
    hudBg.strokeRect(7, 7, 226, 56);

    // Portrait image — center at (32, 35)
    this.portraitImg = this.add.image(32, 35, portKey).setScrollFactor(0).setDepth(101);
    // Circular crop mask
    const pMask = this.make.graphics({});
    pMask.fillStyle(0xffffff);
    pMask.fillCircle(32, 35, 22);
    this.portraitImg.setMask(pMask.createGeometryMask());
    // Border ring
    const portBorder = this.add.graphics().setScrollFactor(0).setDepth(102);
    portBorder.lineStyle(3, accentCol, 1);
    portBorder.strokeCircle(32, 35, 23);
    portBorder.lineStyle(1, 0x000000, 0.45);
    portBorder.strokeCircle(32, 35, 26);

    // HP bar (content drawn in syncHp)
    this.hpBarGfx = this.add.graphics().setScrollFactor(0).setDepth(100);

    // Status labels (below HUD panel)
    this.defendText = this.add.text(8, 70, '🛡 DEFENDENDO', {
      fontSize: '11px', color: '#44ddff',
      fontFamily: 'monospace', stroke: '#003355', strokeThickness: 3
    }).setScrollFactor(0).setDepth(100).setVisible(false);

    this.attackText = this.add.text(8, 70, '⚔ ATACANDO', {
      fontSize: '11px', color: '#ffdd44',
      fontFamily: 'monospace', stroke: '#553300', strokeThickness: 3
    }).setScrollFactor(0).setDepth(100).setVisible(false);

    // Special bar (Knight / Bard / Cleric — hidden by default)
    const selectedChar = this.registry.get('selectedChar') as string;
    const isCleric = selectedChar === 'cleric';
    const isKnight = selectedChar === 'knight';
    const labelText  = isKnight ? 'Q FURIA' : isCleric ? 'Q REINO' : 'Q ESPECIAL';
    const readyText  = isKnight ? '⚔ FURIA!' : isCleric ? '⚡ Q PRONTO!' : '✦ Q PRONTO!';
    const readyColor = isKnight ? '#ff8833' : isCleric ? '#aaddff' : '#ffdd44';
    const readyStroke = isKnight ? '#331100' : isCleric ? '#001133' : '#332200';

    this.specialLabel = this.add.text(62, 43, labelText, {
      fontSize: '9px', color: isKnight ? '#ff8833' : isCleric ? '#aaddff' : '#ffdd44', fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(100).setVisible(false);

    this.specialBar = this.add.graphics().setScrollFactor(0).setDepth(100);

    this.specialReady = this.add.text(62, 31, readyText, {
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

    // Knight Fúria overlay (orange vignette + text, depth 94)
    this.furyOverlay = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x220800)
      .setScrollFactor(0).setDepth(94).setAlpha(0);

    this.furyText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 20, '✦ FÚRIA ✦', {
      fontSize: '22px', color: '#ff6600',
      fontFamily: 'monospace', stroke: '#330000', strokeThickness: 5
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setVisible(false);

    this.tweens.add({
      targets: this.furyText,
      alpha: { from: 1, to: 0.25 }, duration: 260, yoyo: true, repeat: -1
    });

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

    // ── Mini-map ──────────────────────────────────────────────────────
    const mx = this.scale.width - this.MAP_DISPLAY_W - 8, my = 8;
    this.add.rectangle(mx + this.MAP_DISPLAY_W / 2, my + this.MAP_DISPLAY_H / 2,
      this.MAP_DISPLAY_W, this.MAP_DISPLAY_H, 0x000000, 0.55)
      .setScrollFactor(0).setDepth(98);
    const mapBorder = this.add.graphics().setScrollFactor(0).setDepth(98);
    mapBorder.lineStyle(1, 0x553388, 0.8);
    mapBorder.strokeRect(mx, my, this.MAP_DISPLAY_W, this.MAP_DISPLAY_H);
    this.mapGfx = this.add.graphics().setScrollFactor(0).setDepth(99);

    // ── Kills counter ─────────────────────────────────────────────────
    this.killsTxt = this.add.text(mx, my + this.MAP_DISPLAY_H + 4, '0 / 27', {
      fontSize: '9px', color: '#888899', fontFamily: 'monospace',
    }).setScrollFactor(0).setDepth(100);

    // ── Pause overlay (above everything, depth 210) ───────────────────
    this.pauseOverlay = this.add.rectangle(this.scale.width / 2, this.scale.height / 2,
      this.scale.width, this.scale.height, 0x000000, 0)
      .setScrollFactor(0).setDepth(210);

    this.pauseText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 16,
      'PAUSADO\n[ P / Start ]  Continuar', {
        fontSize: '22px', color: '#ffffff',
        fontFamily: 'monospace', stroke: '#000000', strokeThickness: 4,
        align: 'center',
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(211).setVisible(false);

    this.pauseKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P);

    // Listen to registry changes
    this.registry.events.on('changedata', this.onRegistryChange, this);
    const maxHp = this.registry.get('playerMaxHP') as number ?? 10;
    this.syncHp(maxHp, maxHp);

    const char = this.registry.get('selectedChar') as string;
    const hasSpecial = char === 'knight' || char === 'bard' || char === 'cleric';
    this.specialLabel.setVisible(hasSpecial);
    this.specialBar.setVisible(hasSpecial);
    this.specialReady.setVisible(false);
  }

  update(): void {
    this.drawMiniMap();

    // Resume from pause (UIScene stays active while GameScene is paused)
    const pad = (this.input.gamepad as Phaser.Input.Gamepad.GamepadPlugin)?.getPad(0);
    const startDown = pad?.buttons[9]?.pressed === true;
    const startJust = startDown && !this.padStartPrev;
    this.padStartPrev = startDown;

    if (this.registry.get('gamePaused') && (Phaser.Input.Keyboard.JustDown(this.pauseKey) || startJust)) {
      this.registry.set('gamePaused', false);
      this.pauseOverlay.setAlpha(0);
      this.pauseText.setVisible(false);
      this.scene.resume('GameScene');
    }
  }

  private drawMiniMap(): void {
    const mx = this.scale.width - this.MAP_DISPLAY_W - 8, my = 8;
    const scx = this.MAP_DISPLAY_W / 64;
    const scy = this.MAP_DISPLAY_H / 48;
    const wx = this.registry.get('playerWX') as number ?? 30;
    const wy = this.registry.get('playerWY') as number ?? 30;

    this.mapGfx.clear();
    // Player dot
    this.mapGfx.fillStyle(0xffffff, 1);
    this.mapGfx.fillCircle(mx + wx * scx, my + wy * scy, 2.5);
    // Boss dot
    if (this.registry.get('bossActive')) {
      this.mapGfx.fillStyle(0xff44ff, 0.9);
      // Boss spawns roughly center-map
      const bx = this.registry.get('playerWX') as number ?? 32;
      const by = this.registry.get('playerWY') as number ?? 32;
      this.mapGfx.fillCircle(mx + bx * scx, my + by * scy + 12, 3);
    }
  }

  private onRegistryChange(_parent: unknown, key: string, value: unknown): void {
    if (key === 'gamePaused') {
      const paused = value === true;
      this.tweens.killTweensOf(this.pauseOverlay);
      this.tweens.add({ targets: this.pauseOverlay, alpha: paused ? 0.65 : 0, duration: 200 });
      this.pauseText.setVisible(paused);
    }
    if (key === 'kills') {
      const max = this.registry.get('killsMax') as number ?? 27;
      this.killsTxt.setText(`${value as number} / ${max}`);
      if ((value as number) >= max) this.killsTxt.setColor('#ffdd44');
    }
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
      const hasSpecial = char === 'knight' || char === 'bard' || char === 'cleric';
      const inRealm = this.registry.get('clericRealm') as boolean;
      const inFury  = this.registry.get('furyActive') as boolean;
      if (hasSpecial && !inRealm && !inFury) {
        this.specialReady.setVisible(value === true);
        this.specialLabel.setVisible(!value);
        this.specialBar.setVisible(!value);
      }
    }
    if (key === 'specialFrac') {
      const char = this.registry.get('selectedChar') as string;
      const hasSpecial = char === 'knight' || char === 'bard' || char === 'cleric';
      const ready   = this.registry.get('specialReady') as boolean;
      const inRealm = this.registry.get('clericRealm') as boolean;
      const inFury  = this.registry.get('furyActive') as boolean;
      const isCleric = char === 'cleric';
      const isKnight = char === 'knight';
      if (hasSpecial && !ready && !inRealm && !inFury) {
        const frac = value as number;
        const trackColor  = isKnight ? 0x331100 : isCleric ? 0x001133 : 0x332200;
        const fillColor   = isKnight ? 0xff6600 : isCleric ? 0x4488ff : 0xffdd44;
        const borderColor = isKnight ? 0xff3300 : isCleric ? 0x0055aa : 0xffaa00;
        this.specialBar.clear();
        this.specialBar.fillStyle(trackColor, 0.8);    this.specialBar.fillRect(62, 31, 160, 9);
        this.specialBar.fillStyle(fillColor, 1);        this.specialBar.fillRect(62, 31, Math.floor(frac * 160), 9);
        this.specialBar.lineStyle(1, borderColor, 0.8); this.specialBar.strokeRect(62, 31, 160, 9);
      }
    }
    if (key === 'furyActive') {
      const entering = value === true;
      this.tweens.killTweensOf(this.furyOverlay);
      this.tweens.add({ targets: this.furyOverlay, alpha: entering ? 0.22 : 0, duration: entering ? 180 : 400 });
      this.furyText.setVisible(entering);
      if (entering) {
        this.specialReady.setVisible(false);
        this.specialLabel.setVisible(false);
        this.specialBar.setVisible(false);
      } else {
        this.specialLabel.setVisible(true);
        this.specialBar.setVisible(true);
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
    const BX = 62, BY = 14, BW = 160, BH = 13;
    const frac = max > 0 ? Math.max(0, Math.min(1, hp / max)) : 0;
    const fillW = Math.floor(frac * BW);

    const fillColor  = hp <= 2 ? 0xff2222 : hp <= Math.ceil(max * 0.4) ? 0xdd4422 : 0xcc2222;
    const shineColor = hp <= 2 ? 0xff7766 : 0xff5555;

    this.hpBarGfx.clear();
    // Track
    this.hpBarGfx.fillStyle(0x1a0000, 0.9);
    this.hpBarGfx.fillRect(BX, BY, BW, BH);
    // Fill
    if (fillW > 0) {
      this.hpBarGfx.fillStyle(fillColor, 1);
      this.hpBarGfx.fillRect(BX, BY, fillW, BH);
      // Shine stripe
      this.hpBarGfx.fillStyle(shineColor, 0.35);
      this.hpBarGfx.fillRect(BX, BY, fillW, 3);
    }
    // Segment marks (every 2 HP)
    this.hpBarGfx.lineStyle(1, 0x660000, 0.5);
    for (let i = 1; i < max; i += 2) {
      const sx = BX + Math.floor(BW * i / max);
      this.hpBarGfx.lineBetween(sx, BY, sx, BY + BH);
    }
    // Border
    this.hpBarGfx.lineStyle(1, 0x880000, 0.9);
    this.hpBarGfx.strokeRect(BX, BY, BW, BH);

    // HP numeric label
    this.hpBarGfx.fillStyle(0xffffff, 0); // no-op; text handled separately below

    // Pulse portrait on low HP
    if (hp <= 2 && hp > 0) {
      this.tweens.killTweensOf(this.portraitImg);
      this.tweens.add({
        targets: this.portraitImg,
        alpha: { from: 1, to: 0.5 }, duration: 280, yoyo: true, repeat: 0
      });
    }
  }
}
