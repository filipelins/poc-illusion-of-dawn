import Phaser from 'phaser';

export class VictoryScene extends Phaser.Scene {
  private readyTimer    = 0;
  private transitioning = false;
  private padPrev       = false;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  constructor() { super({ key: 'VictoryScene' }); }

  create(): void {
    // Stop parallel scenes that may still be running
    if (this.scene.isActive('UIScene'))   this.scene.stop('UIScene');
    if (this.scene.isActive('GameScene')) this.scene.stop('GameScene');

    this.readyTimer    = 0;
    this.transitioning = false;
    this.padPrev       = false;

    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    const W = this.scale.width, H = this.scale.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x04001a);

    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      this.add.rectangle(x, y, 1, 1, 0xffffff, 0.2 + Math.random() * 0.8);
    }

    const burst = this.add.particles(W / 2, H / 2 - 50, 'blank', {
      speed: { min: 60, max: 200 },
      scale: { start: 0.8, end: 0 },
      tint: [0xffdd44, 0xcc88ff, 0xffffff, 0x44aaff],
      lifespan: 900, quantity: 35, emitting: false,
    });
    burst.explode(35);

    this.add.text(W / 2, H / 2 - 110, '✦ VITÓRIA ✦', {
      fontSize: '38px', color: '#ffdd44',
      fontFamily: 'monospace', stroke: '#221100', strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 55, 'O Devorador de Mentes foi derrotado.', {
      fontSize: '13px', color: '#ccbbdd', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 30, 'A ilusão foi dissipada. Heavenbrook está salva.', {
      fontSize: '12px', color: '#8899aa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const kills = this.registry.get('kills') as number ?? 0;
    this.add.text(W / 2, H / 2 + 10, `Inimigos derrotados: ${kills}`, {
      fontSize: '12px', color: '#667788', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const playTxt = this.add.text(W / 2, H / 2 + 70, '[ ENTER / A ]  Jogar Novamente', {
      fontSize: '16px', color: '#ffffff',
      fontFamily: 'monospace', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: playTxt,
      alpha: { from: 1, to: 0.2 },
      duration: 700, yoyo: true, repeat: -1,
    });

    this.cameras.main.fadeIn(800);
  }

  update(_t: number, delta: number): void {
    if (this.transitioning) return;

    // Wait 800 ms before accepting input
    if (this.readyTimer < 800) {
      this.readyTimer += delta;
      return;
    }

    const pad     = (this.input.gamepad as Phaser.Input.Gamepad.GamepadPlugin)?.getPad(0);
    const padDown = pad?.buttons[0]?.pressed === true || pad?.buttons[9]?.pressed === true;
    const padJust = padDown && !this.padPrev;
    this.padPrev  = padDown;

    if (Phaser.Input.Keyboard.JustDown(this.enterKey)
     || Phaser.Input.Keyboard.JustDown(this.spaceKey)
     || padJust) {
      this.startTransition();
    }
  }

  private startTransition(): void {
    this.transitioning = true;
    this.registry.set('darkRealm', false);
    this.registry.set('kills', 0);
    this.cameras.main.fade(500, 0, 0, 0);
    this.time.delayedCall(520, () => this.scene.start('CharacterSelectScene'));
  }
}
