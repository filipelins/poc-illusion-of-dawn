# Criação de Mundo — Tiled + Phaser

Guia prático para criar e editar cenários, fases e colisões no Illusion of Dawn.

---

## Índice

1. [Conceitos fundamentais](#1-conceitos-fundamentais)
2. [Fluxo de trabalho com o Tiled](#2-fluxo-de-trabalho-com-o-tiled)
3. [Tipos de tile e colisão](#3-tipos-de-tile-e-colisão)
4. [Layer Ground — lógica de jogo](#4-layer-ground--lógica-de-jogo)
5. [Layer Decor — visuais extras](#5-layer-decor--visuais-extras)
6. [Sistema de colisão em código](#6-sistema-de-colisão-em-código)
7. [Criando uma nova fase (cena)](#7-criando-uma-nova-fase-cena)
8. [Transitando entre cenas](#8-transitando-entre-cenas)
9. [Cenários hardcoded (sem Tiled)](#9-cenários-hardcoded-sem-tiled)
10. [Checklist rápido](#10-checklist-rápido)

---

## 1. Conceitos fundamentais

### Sistema de coordenadas

O jogo usa coordenadas de **mundo em tiles** (world coords), não pixels:

```
wx = 30.5  →  pixel X = 30.5 × 32 = 976
wy = 6.5   →  pixel Y = 6.5  × 32 = 208
```

- `TILE_SIZE = 32` px
- `MAP_COLS = 64`, `MAP_ROWS = 48`  →  mundo de 2048 × 1536 px
- Origem `(0,0)` é o canto superior esquerdo
- Depth (Z) = `wy` — painter's algorithm: tile em linha 10 fica na frente de tile em linha 9

### Duas fontes de mapa

| Arquivo | Uso |
|---|---|
| `tiled/map.tmj` | editado no Tiled Map Editor |
| `public/assets/map.json` | carregado pelo Phaser (gerado por sync) |

**Nunca edite `map.json` diretamente.** Edite o `.tmj` e rode `npm run sync-map`.

---

## 2. Fluxo de trabalho com o Tiled

### Setup inicial (já feito)

O projeto usa dois tilesets no Tiled:

| Tileset | Arquivo | Propósito |
|---|---|---|
| `tileset-types` | `tiled/tileset-types.tsj` | Lógica de jogo (colisão, tipo) |
| `map` | `tiled/map.tsx` | Visuais decorativos (PathAndObjects.png) |

### Fluxo de edição

```
1. Abrir tiled/map.tmj no Tiled Map Editor
2. Editar as layers (Ground e/ou Decor)
3. Salvar (Ctrl+S) — mantém em .tmj
4. No terminal: npm run sync-map
5. npm run dev → testar no browser
```

### Layers obrigatórias

| Layer | Tileset | Tipo Tiled | Propósito |
|---|---|---|---|
| `Ground` | `tileset-types` | Tile Layer | Tipos de tile para lógica/colisão |
| `Decor` | `map.tsx` | Tile Layer | Decoração visual com PathAndObjects.png |

> A layer `Decor` deve ficar **acima** da `Ground` no painel de layers do Tiled.

---

## 3. Tipos de tile e colisão

Definidos em `src/constants.ts`. Cada número é o **tipo** do tile (0-based):

| ID | Nome | Sólido | Visual gerado |
|---|---|---|---|
| 0 | `grass` | não | Grama com bitmask (transições suaves) |
| 1 | `wall` | **sim** | Parede de pedra com face sul |
| 2 | `bush` | **sim** | Arbusto verde |
| 3 | `path` | não | Caminho de terra |
| 4 | `water` | **sim** | Água animada |
| 5 | `house-wall` | **sim** | Parede de tijolo |
| 6 | `sand` | não | Areia |
| 7 | `dungeon` | não | Piso de pedra escura |
| 8 | `forest` | não | Chão de floresta |
| 9 | `tree` | **sim** | Árvore (pinheiro) |
| 10 | `cactus` | **sim** | Cacto |
| 11 | `ruin-wall` | **sim** | Parede de ruína |
| 12 | `castle-wall` | **sim** | Parede de castelo |
| 13 | `castle-door` | não | Porta de castelo |

**No Tiled**, o ID de cada tile no tileset `tileset-types` é `tipo + 1` (Tiled é 1-based):
- Pintar grama → selecione tile #1 do tileset
- Pintar parede → selecione tile #2
- Pintar água → selecione tile #5

### Adicionando um novo tipo de tile

1. Adicionar entrada em `SOLID_TILES` em `constants.ts` se for sólido
2. Criar textura em `BootScene.ts` (função `makeXxx()`)
3. Adicionar case em `buildTileMap()` em `GameScene.ts`
4. Adicionar ao `tileset-types.tsj` (rodar `npm run export-map` recria o tsj)

---

## 4. Layer Ground — lógica de jogo

### Como é lida

`GameScene.loadMapData()` lê a layer `Ground` e converte IDs Tiled → tipos de jogo:

```ts
// Tiled: ID 1-based → tipo 0-based
id => id - 1
// Tile #1 no Tiled = tipo 0 (grass)
// Tile #2 no Tiled = tipo 1 (wall)
```

### Renderização

`buildTileMap()` itera linha × coluna e para cada tipo:

- **Tipo 0 (grama):** usa bitmask para detectar bordas e renderiza com o spritesheet `raw-tileset` (transições suaves)
- **Tipo 4 (água):** renderiza `tile-water` com alpha 0.55
- **Demais chãos** (path, sand, dungeon, forest): renderiza textura procedural gerada no BootScene
- **Sólidos com visual** (wall, bush, tree, etc.): renderiza chão + sprite de obstáculo por cima (depth = `row + 0.1`)

### Regra importante

**A layer Ground deve conter APENAS tiles do tileset `tileset-types`.**  
Tiles do `map.tsx` nessa layer serão convertidos para IDs inválidos (≥14) e ignorados pelo renderer.

---

## 5. Layer Decor — visuais extras

Usa o tileset `map.tsx` que mapeia para `public/assets/path-objects.png`:

- Spritesheet 512×512 px, 16 colunas × 16 linhas, tiles de 32×32
- 256 tiles no total

### Como é lida

`GameScene.loadDecorData()` lê a layer `Decor` e converte IDs → frame do spritesheet:

```ts
// firstgid do map.tsx = 15 (detectado dinamicamente)
frame = id - firstgid  // frame 0-based no spritesheet
```

### Renderização

`renderDecorLayer()` renderiza cada tile com:
- `depth = row + 0.05` — acima do chão (depth 0) mas abaixo de obstáculos (depth `row + 0.1`)
- `displaySize = 32×32` — tamanho nativo do tile

### Casos de uso

- Detalhes de caminho (calçadas, pedras soltas, trilhas)
- Objetos decorativos sem colisão (barris, caixas, flores)
- Texturas de piso alternativas sobre o chão base

> **Colisão:** a layer Decor é puramente visual. A colisão vem exclusivamente da layer Ground.  
> Para um objeto decorativo ter colisão, ponha o tile sólido correspondente na Ground (ex: `wall`) e o visual decorativo na Decor na mesma posição.

---

## 6. Sistema de colisão em código

### `isWall(wx, wy)` — `src/utils/iso.ts`

Verifica se uma posição em world coords é sólida:

```ts
export function isWall(wx: number, wy: number): boolean {
  const col = Math.floor(wx);
  const row = Math.floor(wy);
  if (col < 0 || col >= cfg.cols || row < 0 || row >= cfg.rows) return true; // borda = sólida
  return SOLID_TILES.has(cfg.data[row][col]);
}
```

### `moveSlide(wx, wy, dx, dy, radius)` — `src/utils/iso.ts`

Movimenta uma entidade com slide contra paredes:

```ts
export function moveSlide(
  wx: number, wy: number,   // posição atual
  dx: number, dy: number,   // deslocamento desejado (em tiles)
  radius: number            // raio da entidade (ex: 0.35)
): { x: number; y: number }
```

O slide testa X e Y separadamente — se X colide mas Y não, o personagem desliza pela parede verticalmente.

### `setCurrentMap(data, cols, rows)` — `src/utils/iso.ts`

**Obrigatório** ao iniciar qualquer cena com mapa. Atualiza o mapa que `isWall` consulta:

```ts
// No create() de qualquer cena:
setCurrentMap(this.mapData, MAP_COLS, MAP_ROWS);
```

Se esquecer, `isWall` usará o mapa da cena anterior e as colisões estarão erradas.

### Adicionando tiles sólidos

Em `src/constants.ts`:

```ts
export const SOLID_TILES = new Set<number>([1, 2, 4, 5, 9, 10, 11, 12]);
// Adicione o novo tipo aqui para torná-lo sólido
```

---

## 7. Criando uma nova fase (cena)

### Estrutura mínima de uma cena de fase

```ts
// src/scenes/ForestScene.ts
import Phaser from 'phaser';
import { TILE_SIZE } from '../constants';
import { setCurrentMap } from '../utils/iso';
import { createPlayer, setupSceneInput, setupFollowCamera } from '../utils/sceneHelpers';

// Dimensões do mapa desta fase
const COLS = 40;
const ROWS = 30;
const WORLD_W = COLS * TILE_SIZE;
const WORLD_H = ROWS * TILE_SIZE;

// Mapa hardcoded ou lido de JSON
const MAP: number[][] = [
  // linha 0 — borda sólida
  [1,1,1,1, /* ... */ 1],
  // linha 1 — área jogável
  [1,0,0,0, /* ... */ 1],
  // ...
];

// Posição inicial do player (em world coords)
const SPAWN_X = 5.5;
const SPAWN_Y = 5.5;

export class ForestScene extends Phaser.Scene {
  private player!: BasePlayer;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private defendKey!: Phaser.Input.Keyboard.Key;
  private specialKey!: Phaser.Input.Keyboard.Key;

  constructor() { super({ key: 'ForestScene' }); }

  create(): void {
    // 1. Registrar mapa atual para isWall()
    setCurrentMap(MAP, COLS, ROWS);

    // 2. Construir visual do mapa
    this.buildMap();

    // 3. Spawnar player
    this.player = createPlayer(this, SPAWN_X, SPAWN_Y);

    // 4. Câmera
    setupFollowCamera(this, this.player, WORLD_W, WORLD_H);

    // 5. Input
    const input = setupSceneInput(this);
    this.cursors   = input.cursors;
    this.attackKey = input.attackKey;
    this.defendKey = input.defendKey;
    this.specialKey = input.specialKey;

    // 6. HUD paralela (se precisar)
    if (!this.scene.isActive('UIScene')) this.scene.launch('UIScene');

    // 7. Fade in
    this.cameras.main.fadeIn(400);
  }

  update(_t: number, delta: number): void {
    this.player.update(this.cursors, this.attackKey, this.defendKey, this.specialKey, delta);
    this.checkTransitions();
  }

  private buildMap(): void {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;
        const type = MAP[row][col];

        // Chão base sempre
        this.add.image(x, y, 'tile-forest').setOrigin(0, 0).setDepth(0);

        // Obstáculos
        if (type === 1) {
          this.add.image(x, y, 'tile-wall').setOrigin(0, 0).setDepth(row + 0.1);
        }
        if (type === 9) {
          this.add.image(x, y, 'tile-tree').setOrigin(0, 0).setDepth(row + 0.1);
        }
      }
    }
  }

  private checkTransitions(): void {
    // Exemplo: ao chegar numa posição específica, ir para outra cena
    if (this.player.worldY < 0.5) {
      this.cameras.main.fade(400, 0, 0, 0);
      this.time.delayedCall(420, () => this.scene.start('GameScene'));
    }
  }
}
```

### Registrar a cena no `main.ts`

```ts
// src/main.ts
import { ForestScene } from './scenes/ForestScene';

const config: Phaser.Types.Core.GameConfig = {
  // ...
  scene: [BootScene, CharacterSelectScene, GameScene, UIScene,
          CastleScene, ForestScene,  // ← adicionar aqui
          GameOverScene, VictoryScene]
};
```

---

## 8. Transitando entre cenas

### Padrão de transição com preservação de estado

```ts
// Saindo da cena atual → indo para nova fase
private goToForest(): void {
  // 1. Salvar estado necessário no registry
  this.registry.set('savedHP', this.player.hp);
  this.registry.set('returnFrom', 'GameScene');

  // 2. Fade out + troca de cena
  this.cameras.main.fade(400, 0, 0, 0);
  this.time.delayedCall(420, () => this.scene.start('ForestScene'));
}
```

```ts
// No create() da cena de destino — restaurar estado
create(): void {
  const savedHp = this.registry.get('savedHP') as number;
  if (savedHp !== undefined) {
    this.player.hp = savedHp;
    this.registry.set('playerHP', savedHp);
  }
}
```

### Trigger de transição por proximidade

```ts
// Constante com a posição da porta/saída
const EXIT_WX = 10.5;
const EXIT_WY = 0.5;

// No update()
const nearExit = worldDist(this.player.worldX, this.player.worldY, EXIT_WX, EXIT_WY) < 1.5;
this.exitPrompt.setVisible(nearExit);

if (nearExit && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
  this.goToNextScene();
}
```

### Trigger de transição por borda do mapa

```ts
// No update() — player saindo pela borda norte
if (this.player.worldY < 0.5) {
  this.scene.start('NorthScene');
}
```

---

## 9. Cenários hardcoded (sem Tiled)

Para cenários pequenos ou interiores (como `CastleScene`), é mais simples usar um array 2D diretamente no código:

```ts
const INTERIOR_COLS = 24;
const INTERIOR_ROWS = 18;

// 1=parede, 7=piso de dungeon, 13=porta
const INTERIOR_MAP: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,1],
  // ...
  [1,1,1,1,1,1,1,1,1,1,1,13,13,1,1,1,1,1,1,1,1,1,1,1],
];
```

Vantagens do hardcoded:
- Sem dependência de arquivo externo
- Fácil de versionar junto com a cena
- Ideal para dungeons pequenas, salas de boss, interiores

Vantagens do Tiled:
- Editor visual — muito mais fácil para mapas grandes
- Suporte à layer Decor (PathAndObjects.png)
- Fácil de iterar sem recompilar

**Regra prática:** mapas ≥ 20×20 tiles → use Tiled. Menores → hardcoded é mais simples.

---

## 10. Checklist rápido

### Editar mapa existente (GameScene)

- [ ] Abrir `tiled/map.tmj` no Tiled
- [ ] Editar layer `Ground` (só com `tileset-types`) e/ou `Decor` (só com `map.tsx`)
- [ ] Salvar no Tiled
- [ ] `npm run sync-map`
- [ ] `npm run dev` e testar

### Criar nova fase com Tiled

- [ ] Criar novo arquivo `.tmj` no Tiled com as mesmas dimensões e tilesets
- [ ] Adicionar layers `Ground` e `Decor`
- [ ] Exportar para `public/assets/nome-da-fase.json`
- [ ] Criar `src/scenes/NomeDaFaseScene.ts` usando a estrutura da seção 7
- [ ] Em `create()`, chamar `this.load.json` no preload ou usar cache já carregado
- [ ] Registrar a cena em `main.ts`
- [ ] Chamar `setCurrentMap()` **obrigatoriamente** no `create()`
- [ ] Adicionar transição na cena anterior

### Criar nova fase hardcoded (interior/dungeon)

- [ ] Criar array `MAP: number[][]` com `1`s na borda
- [ ] Criar `src/scenes/NomeDaFaseScene.ts` (ver seção 7 + exemplo CastleScene)
- [ ] Chamar `setCurrentMap(MAP, COLS, ROWS)` no `create()`
- [ ] Registrar em `main.ts`
- [ ] Adicionar transição na cena de origem

### Adicionar novo tipo de tile com colisão

- [ ] Decidir o ID (próximo número disponível após 13)
- [ ] Criar textura em `BootScene.ts` — `makeNomeTile()`
- [ ] Chamar o método no `create()` do BootScene
- [ ] Adicionar ao `SOLID_TILES` em `constants.ts` (se sólido)
- [ ] Adicionar case em `buildTileMap()` em `GameScene.ts`
- [ ] Rodar `npm run export-map` para regenerar o `tileset-types.tsj`
- [ ] Reabrir o Tiled para ver o novo tile na paleta

---

## Referência rápida de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `tiled/map.tmj` | Mapa editável no Tiled (fonte da verdade) |
| `tiled/tileset-types.tsj` | Definição do tileset de lógica |
| `tiled/map.tsx` | Definição do tileset visual (PathAndObjects) |
| `public/assets/map.json` | Mapa carregado pelo Phaser (gerado por sync) |
| `public/assets/path-objects.png` | Spritesheet visual 512×512, 32×32/tile |
| `src/constants.ts` | `SOLID_TILES`, `TILE_SIZE`, `MAP_COLS/ROWS` |
| `src/utils/iso.ts` | `isWall()`, `moveSlide()`, `setCurrentMap()` |
| `src/scenes/GameScene.ts` | Cena principal: `loadMapData()`, `loadDecorData()`, `buildTileMap()`, `renderDecorLayer()` |
| `src/scenes/CastleScene.ts` | Exemplo de cena interior hardcoded |
| `src/scenes/BootScene.ts` | Geração de todas as texturas procedurais |
