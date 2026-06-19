import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Bard } from '../entities/Bard';
import { Cleric } from '../entities/Cleric';
import type { BasePlayer } from '../entities/BasePlayer';

export interface SceneInput {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  attackKey: Phaser.Input.Keyboard.Key;
  defendKey: Phaser.Input.Keyboard.Key;
  specialKey: Phaser.Input.Keyboard.Key;
  interactKey: Phaser.Input.Keyboard.Key;
}

export function createPlayer(scene: Phaser.Scene, wx: number, wy: number): BasePlayer {
  const charId = scene.registry.get('selectedChar') as string ?? 'knight';
  if (charId === 'bard')   return new Bard(scene, wx, wy);
  if (charId === 'cleric') return new Cleric(scene, wx, wy);
  return new Player(scene, wx, wy);
}

export function setupSceneInput(scene: Phaser.Scene): SceneInput {
  const kb = scene.input.keyboard!;
  const cursors    = kb.createCursorKeys(); // includes cursors.space and cursors.shift
  const attackKey  = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
  const defendKey  = kb.addKey(Phaser.Input.Keyboard.KeyCodes.X);
  const specialKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
  const interactKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E);

  // Attach WASD to the cursors object so BasePlayer can read them uniformly
  const ck = cursors as unknown as Record<string, Phaser.Input.Keyboard.Key>;
  ck['W'] = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  ck['A'] = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
  ck['S'] = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S);
  ck['D'] = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);

  return { cursors, attackKey, defendKey, specialKey, interactKey };
}

export function setupFollowCamera(
  scene: Phaser.Scene,
  player: { x: number; y: number },
  worldW: number,
  worldH: number
): void {
  scene.cameras.main.setZoom(2.5);
  scene.cameras.main.setBounds(0, 0, worldW, worldH);
  const target = scene.add.rectangle(0, 0, 1, 1, 0x000000, 0);
  scene.cameras.main.startFollow(target, true, 0.1, 0.1);
  scene.events.on('update', () => target.setPosition(player.x, player.y));
}
