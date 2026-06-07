import Phaser from 'phaser';

export type SFX =
  | 'swing' | 'hit' | 'enemyDie'
  | 'playerHurt' | 'playerDie'
  | 'special' | 'interact'
  | 'bossRoar' | 'blocked' | 'victory';

export type MusicTheme = 'overworld' | 'boss' | 'castle';

// ── Frequency table (scientific pitch notation) ──────────────────────────────

const HZ: Record<string, number> = {
  A1: 55.00, E2: 82.41, G2: 98.00,
  A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61,
  G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23,
  G4: 392.00, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, Eb5: 622.25, E5: 659.25, G5: 783.99, A5: 880.00,
  _: 0,
};

// ── Song definitions ─────────────────────────────────────────────────────────

interface Track { steps: string[]; wave: OscillatorType; vol: number; len: number }
interface Song  { bpm: number; tracks: Track[] }

// Overworld — upbeat, C/G major, 126 BPM
const OVERWORLD: Song = {
  bpm: 126,
  tracks: [
    {
      wave: 'square', vol: 0.15, len: 0.80,
      steps: [
        'G4','_','E4','_','D4','E4','G4','_','A4','_','G4','_','E4','F4','G4','_',
        'C5','_','B4','G4','E4','_','D4','_','E4','G4','A4','_','G4','_','_','_',
      ],
    },
    {
      wave: 'triangle', vol: 0.20, len: 0.75,
      steps: ['C3','_','_','_','G2','_','_','_','A2','_','_','_','F3','_','_','_'],
    },
    {
      wave: 'square', vol: 0.07, len: 0.60,
      steps: ['E3','_','G3','_','C3','_','G3','_'],
    },
  ],
};

// Boss — intense, A minor, 158 BPM
const BOSS: Song = {
  bpm: 158,
  tracks: [
    {
      wave: 'sawtooth', vol: 0.12, len: 0.50,
      steps: [
        'A4','_','Eb5','_','A4','_','G4','Eb4','D4','_','A3','_','_','_','Eb4','_',
        'D4','_','F4','_','Eb4','_','D4','_','A3','_','Eb4','D4','_','_','_','_',
      ],
    },
    {
      wave: 'square', vol: 0.18, len: 0.40,
      steps: ['A2','A2','_','A2','_','E3','_','A2','D3','D3','_','D3','_','A2','_','D3'],
    },
    {
      wave: 'sawtooth', vol: 0.06, len: 0.90,
      steps: ['A1','_','_','_','E2','_','_','_'],
    },
  ],
};

// Castle — atmospheric, A minor, 90 BPM
const CASTLE: Song = {
  bpm: 90,
  tracks: [
    {
      wave: 'triangle', vol: 0.18, len: 0.70,
      steps: [
        'A4','_','_','_','E5','_','_','_','D5','_','_','_','C5','_','_','_',
        'B4','_','_','_','G4','_','_','_','A4','_','_','_','_','_','_','_',
      ],
    },
    {
      wave: 'triangle', vol: 0.16, len: 0.85,
      steps: ['A2','_','_','_','_','_','_','_','G2','_','_','_','A2','_','_','_'],
    },
  ],
};

const SONGS: Record<MusicTheme, Song> = { overworld: OVERWORLD, boss: BOSS, castle: CASTLE };

// ── Step sequencer ───────────────────────────────────────────────────────────

class Sequencer {
  private step     = 0;
  private nextTime = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly ctx: AudioContext,
    private readonly out: GainNode,
    private readonly song: Song,
  ) {}

  start(): void {
    this.step     = 0;
    this.nextTime = this.ctx.currentTime + 0.05;
    this.pump();
  }

  stop(): void {
    if (this.timer !== null) { clearTimeout(this.timer); this.timer = null; }
  }

  private stepSec(): number { return 60 / (this.song.bpm * 4); }

  private pump(): void {
    while (this.nextTime < this.ctx.currentTime + 0.25) {
      for (const track of this.song.tracks) {
        const key  = track.steps[this.step % track.steps.length];
        const freq = HZ[key] ?? 0;
        if (freq > 0) {
          const dur = this.stepSec() * track.len;
          const osc = this.ctx.createOscillator();
          const g   = this.ctx.createGain();
          osc.connect(g);
          g.connect(this.out);
          osc.type          = track.wave;
          osc.frequency.value = freq;
          g.gain.setValueAtTime(0, this.nextTime);
          g.gain.linearRampToValueAtTime(track.vol, this.nextTime + 0.010);
          g.gain.setValueAtTime(track.vol,          this.nextTime + dur - 0.010);
          g.gain.linearRampToValueAtTime(0,          this.nextTime + dur);
          osc.start(this.nextTime);
          osc.stop(this.nextTime + dur + 0.01);
        }
      }
      this.nextTime += this.stepSec();
      this.step++;
    }
    this.timer = setTimeout(() => this.pump(), 100);
  }
}

// ── AudioSystem singleton ─────────────────────────────────────────────────────

let _instance: AudioSystem | null = null;

export function getAudio(scene: Phaser.Scene): AudioSystem | null {
  if (_instance) return _instance;
  try {
    const ctx = (scene.sound as Phaser.Sound.WebAudioSoundManager).context as AudioContext;
    if (ctx) _instance = new AudioSystem(ctx);
  } catch { /* Web Audio not available */ }
  return _instance;
}

export class AudioSystem {
  private seq:          Sequencer    | null = null;
  private currentTheme: MusicTheme   | null = null;
  private readonly masterGain: GainNode;
  private readonly sfxGain:    GainNode;
  private readonly musicGain:  GainNode;

  constructor(private readonly ctx: AudioContext) {
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 1.0;
    this.masterGain.connect(ctx.destination);

    this.sfxGain = ctx.createGain();
    this.sfxGain.gain.value = 1.0;
    this.sfxGain.connect(this.masterGain);

    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = 0.45;
    this.musicGain.connect(this.masterGain);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  playMusic(theme: MusicTheme): void {
    if (this.currentTheme === theme) return;
    void this.ctx.resume();
    this.seq?.stop();
    this.currentTheme = theme;
    this.seq = new Sequencer(this.ctx, this.musicGain, SONGS[theme]);
    this.seq.start();
  }

  stopMusic(): void {
    this.seq?.stop();
    this.seq = null;
    this.currentTheme = null;
  }

  playEffect(sfx: SFX): void {
    void this.ctx.resume();
    const t = this.ctx.currentTime;
    switch (sfx) {
      case 'swing':      this.sfxSwing(t);      break;
      case 'hit':        this.sfxHit(t);        break;
      case 'enemyDie':   this.sfxEnemyDie(t);   break;
      case 'playerHurt': this.sfxPlayerHurt(t); break;
      case 'playerDie':  this.sfxPlayerDie(t);  break;
      case 'special':    this.sfxSpecial(t);    break;
      case 'interact':   this.sfxInteract(t);   break;
      case 'bossRoar':   this.sfxBossRoar(t);   break;
      case 'blocked':    this.sfxBlocked(t);    break;
      case 'victory':    this.sfxVictory(t);    break;
    }
  }

  // ── Primitive audio builders ──────────────────────────────────────────────

  private tone(t: number, wave: OscillatorType, f0: number, f1: number, dur: number, vol: number): void {
    const osc = this.ctx.createOscillator();
    const g   = this.ctx.createGain();
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.type = wave;
    osc.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  }

  private noise(t: number, dur: number, vol: number): void {
    const len  = Math.ceil(this.ctx.sampleRate * dur);
    const buf  = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    const g   = this.ctx.createGain();
    src.buffer = buf;
    src.connect(g);
    g.connect(this.sfxGain);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.start(t);
  }

  // ── SFX implementations ───────────────────────────────────────────────────

  private sfxSwing(t: number): void {
    this.tone(t, 'square', 380, 140, 0.12, 0.35);
  }

  private sfxHit(t: number): void {
    this.noise(t, 0.04, 0.55);
    this.tone(t, 'square', 280, 110, 0.07, 0.28);
  }

  private sfxEnemyDie(t: number): void {
    this.tone(t,       'square', 660, 55, 0.26, 0.32);
    this.noise(t+0.02, 0.06, 0.20);
  }

  private sfxPlayerHurt(t: number): void {
    this.tone(t,      'square', 240, 160, 0.08, 0.40);
    this.tone(t+0.08, 'square', 180, 120, 0.10, 0.35);
  }

  private sfxPlayerDie(t: number): void {
    [440, 330, 262, 196, 147].forEach((f, i) => {
      this.tone(t + i * 0.12, 'square', f, f * 0.75, 0.22, 0.30);
    });
  }

  private sfxSpecial(t: number): void {
    [440, 554, 659, 880].forEach((f, i) => {
      this.tone(t + i * 0.07, 'square', f, f * 1.05, 0.18, 0.25);
    });
  }

  private sfxInteract(t: number): void {
    [262, 330, 392].forEach((f, i) => {
      this.tone(t + i * 0.07, 'triangle', f, f, 0.14, 0.28);
    });
  }

  private sfxBossRoar(t: number): void {
    this.tone(t,       'sawtooth', 90,  40,  0.85, 0.55);
    this.tone(t+0.05,  'sawtooth', 70,  30,  0.80, 0.45);
    this.tone(t+0.10,  'sawtooth', 110, 50,  0.70, 0.35);
    this.noise(t, 0.35, 0.18);
  }

  private sfxBlocked(t: number): void {
    this.tone(t, 'square', 880, 580, 0.06, 0.30);
    this.noise(t, 0.04, 0.22);
  }

  private sfxVictory(t: number): void {
    [392, 494, 587, 784].forEach((f, i) => {
      this.tone(t + i * 0.16, 'square', f, f, 0.28, 0.32);
    });
    this.tone(t + 0.64, 'square', 1047, 1047, 0.50, 0.38);
  }
}
