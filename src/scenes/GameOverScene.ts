import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  private readyTimer    = 0;
  private transitioning = false;
  private padPrev       = false;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private escKey!:   Phaser.Input.Keyboard.Key;

  constructor() { super({ key: 'GameOverScene' }); }

  create(): void {
    // Stop parallel scenes that may still be running
    if (this.scene.isActive('UIScene'))   this.scene.stop('UIScene');
    if (this.scene.isActive('GameScene')) this.scene.stop('GameScene');

    this.readyTimer    = 0;
    this.transitioning = false;
    this.padPrev       = false;

    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.escKey   = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    const W = this.scale.width, H = this.scale.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000);

    const burst = this.add.particles(W / 2, H / 2 - 40, 'blank', {
      speed: { min: 40, max: 120 },
      scale: { start: 0.6, end: 0 },
      tint: [0xcc2222, 0xff4444, 0x660000],
      lifespan: 700, quantity: 20, emitting: false,
    });
    burst.explode(20);

    this.add.text(W / 2, H / 2 - 80, 'GAME OVER', {
      fontSize: '42px', color: '#cc2222',
      fontFamily: 'monospace', stroke: '#110000', strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 20, 'A ilusão te consumiu.', {
      fontSize: '14px', color: '#998899', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const retryTxt = this.add.text(W / 2, H / 2 + 60, '[ ENTER / A ]  Tentar Novamente', {
      fontSize: '16px', color: '#ffffff',
      fontFamily: 'monospace', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: retryTxt,
      alpha: { from: 1, to: 0.2 },
      duration: 600, yoyo: true, repeat: -1,
    });

    this.add.text(W / 2, H / 2 + 100, '[ ESC ]  Selecionar Personagem', {
      fontSize: '11px', color: '#555566', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(500);
  }

  update(_t: number, delta: number): void {
    if (this.transitioning) return;

    // Wait 800 ms before accepting input to prevent carry-over key presses
    if (this.readyTimer < 800) {
      this.readyTimer += delta;
      return;
    }

    const pad     = (this.input.gamepad as Phaser.Input.Gamepad.GamepadPlugin)?.getPad(0);
    const padDown = pad?.buttons[0]?.pressed === true || pad?.buttons[9]?.pressed === true;
    const padJust = padDown && !this.padPrev;
    this.padPrev  = padDown;

    const confirm = Phaser.Input.Keyboard.JustDown(this.enterKey)
                 || Phaser.Input.Keyboard.JustDown(this.spaceKey)
                 || padJust;
    const back    = Phaser.Input.Keyboard.JustDown(this.escKey);

    if (confirm || back) {
      this.startTransition();
    }
  }

  private startTransition(): void {
    this.transitioning = true;
    this.registry.set('darkRealm', false);
    this.cameras.main.fade(400, 0, 0, 0);
    this.time.delayedCall(420, () => this.scene.start('CharacterSelectScene'));
  }
}
