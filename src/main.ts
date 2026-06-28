import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { HeavenbrockScene } from './scenes/HeavenbrockScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { CastleScene } from './scenes/CastleScene';
import { GameOverScene } from './scenes/GameOverScene';
import { VictoryScene } from './scenes/VictoryScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#050812',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.EXPAND,
    width: 1000,
    height: 800,
  },
  input: {
    gamepad: true,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false, gravity: { x: 0, y: 0 } }
  },
  scene: [BootScene, CharacterSelectScene, HeavenbrockScene, GameScene, UIScene, CastleScene, GameOverScene, VictoryScene]
};

new Phaser.Game(config);
