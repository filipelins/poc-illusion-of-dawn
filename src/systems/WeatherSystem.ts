import Phaser from 'phaser';

export type WeatherType = 'sunny' | 'rain' | 'snow';

const DURATION_MIN = 25_000;
const DURATION_MAX = 80_000;
const FADE_DUR     = 1_500;

export class WeatherSystem {
  private scene: Phaser.Scene;
  private current: WeatherType;
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private overlay: Phaser.GameObjects.Rectangle | null = null;
  private timer = 0;
  private duration: number;
  private busy = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const pool: WeatherType[] = ['sunny', 'sunny', 'rain', 'rain', 'snow'];
    this.current = pool[Math.floor(Math.random() * pool.length)];
    this.duration = this.roll();
    this.apply(this.current, false);
  }

  update(delta: number): void {
    if (this.busy) return;
    this.timer += delta;
    if (this.timer < this.duration) return;
    this.timer = 0;
    this.duration = this.roll();
    this.transition(this.pick());
  }

  getCurrent(): WeatherType { return this.current; }

  destroy(): void {
    this.emitter?.destroy();
    this.overlay?.destroy();
  }

  private roll(): number {
    return DURATION_MIN + Math.random() * (DURATION_MAX - DURATION_MIN);
  }

  private pick(): WeatherType {
    const pool: WeatherType[] = ['sunny', 'sunny', 'rain', 'rain', 'snow'];
    const others = pool.filter(w => w !== this.current);
    return others[Math.floor(Math.random() * others.length)];
  }

  private transition(next: WeatherType): void {
    this.busy = true;
    this.emitter?.destroy();
    this.emitter = null;

    if (this.overlay) {
      this.scene.tweens.add({
        targets: this.overlay,
        alpha: 0,
        duration: FADE_DUR / 2,
        onComplete: () => {
          this.overlay!.destroy();
          this.overlay = null;
          this.current = next;
          this.apply(next, true);
          this.busy = false;
        }
      });
    } else {
      this.scene.time.delayedCall(FADE_DUR / 2, () => {
        this.current = next;
        this.apply(next, true);
        this.busy = false;
      });
    }
  }

  private apply(type: WeatherType, fade: boolean): void {
    if (type === 'rain') this.buildRain(fade);
    else if (type === 'snow') this.buildSnow(fade);
  }

  private buildRain(fade: boolean): void {
    const target = 0.32;
    this.overlay = this.scene.add
      .rectangle(500, 400, 1000, 800, 0x0a1a2e, fade ? 0 : target)
      .setScrollFactor(0)
      .setDepth(490);
    if (fade) {
      this.scene.tweens.add({ targets: this.overlay, alpha: target, duration: FADE_DUR });
    }

    this.emitter = this.scene.add.particles(500, 0, 'rain-drop', {
      x: { min: -600, max: 600 },
      y: { min: -30, max: -5 },
      speedX: { min: 10, max: 50 },
      speedY: { min: 500, max: 720 },
      lifespan: { min: 1400, max: 2000 },
      frequency: 10,
      quantity: 2,
      alpha: { min: 0.35, max: 0.65 },
      tint: 0x99bbdd,
      gravityY: 0,
    });
    this.emitter.setScrollFactor(0).setDepth(491);
  }

  private buildSnow(fade: boolean): void {
    const target = 0.13;
    this.overlay = this.scene.add
      .rectangle(500, 400, 1000, 800, 0xb0c8ee, fade ? 0 : target)
      .setScrollFactor(0)
      .setDepth(490);
    if (fade) {
      this.scene.tweens.add({ targets: this.overlay, alpha: target, duration: FADE_DUR });
    }

    this.emitter = this.scene.add.particles(500, 0, 'snow-flake', {
      x: { min: -600, max: 600 },
      y: { min: -10, max: 0 },
      speedX: { min: -45, max: 45 },
      speedY: { min: 50, max: 110 },
      lifespan: { min: 7500, max: 11000 },
      frequency: 320,
      quantity: 1,
      alpha: { min: 0.7, max: 1.0 },
      scale: { min: 0.6, max: 1.8 },
      tint: 0xddeeff,
      gravityY: 0,
    });
    this.emitter.setScrollFactor(0).setDepth(491);
  }
}
