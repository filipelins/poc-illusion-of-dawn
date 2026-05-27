# Illusion of Dawn — CLAUDE.md

Action RPG top-down estilo Zelda: A Link to the Past. Phaser 3.88 + TypeScript strict + Vite 5.

## Stack e configuração

- **Phaser 3** (não Phaser 4 — ainda em alpha)
- TypeScript strict mode; `noUnusedLocals: false`, `noUnusedParameters: false`
- Vite 5, dev na porta 3000
- Canvas: 1000×800, `pixelArt: true`, zoom da câmera 2.5×
- Física: Arcade, top-down sem gravidade
- Build: `tsc && vite build` → dist/

## Arquitetura de cenas

```
BootScene → CharacterSelectScene → GameScene (+ UIScene em paralelo)
```

- **BootScene** — gera todas as texturas via `Graphics.generateTexture`. Nenhum asset externo; tudo é pixel art procedural.
- **CharacterSelectScene** — tela de seleção com 3 cards (Knight/Bard/Cleric). Passa `selectedChar` via `registry`.
- **GameScene** — loop principal: tilemap, spawn de player/inimigos, combate, boss.
- **UIScene** — HUD paralela. Comunica com GameScene exclusivamente via `this.registry` (nunca acesso direto entre cenas).

## Coordenadas e movimento

- **World coords**: tile units (ex: 30.5 = centro do tile 30). MAP_COLS=64, MAP_ROWS=48.
- **Screen coords**: `isoX(wx) = wx * TILE_SIZE`, `isoY(wy) = wy * TILE_SIZE` (top-down ortogonal — "iso" é nome histórico).
- **Depth**: `isoDepth = wy` (painter's algorithm por Y).
- Colisão manual via `moveSlide()` em `utils/iso.ts` — sem physics bodies de arcade para colisão de tiles.
- `SOLID_TILES = {1,2,4,5,9,10,11}` — consultado via `isWall(wx, wy)`.

## Hierarquia de entidades

### Jogadores — `BasePlayer` (abstrata)
Subclasses: `Player` (Knight), `Bard`, `Cleric`.

Métodos abstratos obrigatórios:
```ts
getAttackDamage(): number
checkSwordHit(ewx, ewy): boolean
getAttackDuration(): number
getAttackCooldown(): number
getMaxSpeed(): number
getDefendSpeed(): number
updateWeapon(): void
syncSprite(): void
```

Métodos opcionais para override:
```ts
getSpecialProjectiles(): SpecialProjectile[]  // Bard: NoteProjectile
getAttackProjectiles(): SpecialProjectile[]   // Cleric: MagicBolt
onSpecialInput(key, delta): void              // habilidade Q
```

Mecânicas compartilhadas em BasePlayer: invincibilidade pós-hit, knockback, flash de dano, movimento diagonal normalizado, publicação no registry.

### Inimigos — `BaseEnemy` (abstrata)
Subclasses: `Slime`, `Skeleton`, `Wizard`.

Método abstrato: `updateAI(player, delta): void`

Mecânicas compartilhadas: knockback, flash de tint vermelho, partículas na morte.

## Padrão TypeScript crítico

Phaser GameObjects com herança custom precisam de cast para registrar em grupos:
```ts
scene.add.existing(this as unknown as Phaser.GameObjects.GameObject)
```

Não sobrescrever a propriedade `body` por getter em subclasses de `Arcade.Sprite` — usar método helper com cast explícito (`bd()` ou similar).

## Comunicação entre cenas (registry)

GameScene → UIScene via `this.registry.set(key, value)`. UIScene escuta `registry.events.on('changedata', ...)`.

Chaves usadas:
- `playerHP`, `playerMaxHP`, `playerDefending`, `playerAttacking`
- `specialReady`, `specialFrac` — barra de cooldown do Q
- `clericRealm` — overlay do Divine Realm
- `bossHP`, `bossMaxHP`, `bossPhase`, `bossActive`, `bossAnnouncing`
- `selectedChar` — `'knight' | 'bard' | 'cleric'`

## Personagens jogáveis

| Char   | HP | Vel | Ataque       | Especial (Q)                         |
|--------|----|-----|--------------|--------------------------------------|
| Knight | 10 | 4.5 | Espada melee | Nenhum                               |
| Bard   |  7 | 5.5 | Lute melee   | Burst de notas musicais (NoteProjectile) |
| Cleric |  8 | 4.0 | Magic bolt   | Divine Realm: 2s com dano duplo      |

## Inimigos e boss

| Entidade      | HP | Comportamento                                    |
|---------------|----|--------------------------------------------------|
| Slime         |  2 | Wander aleatório → chase ao detectar player      |
| Skeleton      |  4 | Patrulha → alerta → charge → stun em parede      |
| Wizard        |  5 | Mantém distância, strafe, teleporta após atirar  |
| MindDevourer  | 80 | Boss com 2 fases; spread/burst de projéteis, teleporte |

Boss aparece após matar todos os 27 inimigos (14 Slimes + 8 Skeletons + 5 Wizards).
Fase 2 ativa em 50% HP: velocidade e cadência de fogo aumentam.

## Mapa (MAP_DATA em constants.ts)

64×62 tiles gerado proceduralmente em `generateMap()`. Biomas:
- **Oeste** (cols 0-18): floresta com árvores
- **Centro** (cols 19-44): vila com casas, estradas, gramado
- **NE** (rows 1-21, cols 45-62): deserto com cactos
- **SE** (rows 22-46, cols 45-62): ruínas com paredes

Tipos de tile:
```
0=grass  3=path  6=sand  7=dungeon  8=forest  (walkable)
1=wall   2=bush  4=water 5=house-wall 9=tree 10=cactus 11=ruin-wall  (sólidos)
```

## Adicionando novos personagens

1. Criar classe em `src/entities/` estendendo `BasePlayer`
2. Definir constantes em `constants.ts`
3. Registrar texturas em `BootScene.ts` (seguir padrão 4 direções: `nome-down/up/left/right`)
4. Adicionar entrada no array `CHARS` em `CharacterSelectScene.ts`
5. Adicionar case no `spawnPlayer()` em `GameScene.ts`
6. Se tiver special: tratar `selectedChar` no `UIScene.ts`

## Adicionando novos inimigos

1. Criar classe em `src/entities/` estendendo `BaseEnemy`
2. Definir constantes em `constants.ts`
3. Registrar textura em `BootScene.ts`
4. Adicionar ao `spawnEnemies()` em `GameScene.ts`
5. Se tiver projéteis: adicionar loop de colisão no `update()` de `GameScene`

## Controles

| Ação    | Teclas               |
|---------|----------------------|
| Mover   | WASD / Setas         |
| Atacar  | Z / Space            |
| Defender| X / Shift            |
| Especial| Q                    |

## Deploy

- Vercel (configurar link com `vercel link` dentro de `/illusionOfDawn`)
- Build command: `npm run build` (`tsc && vite build`)
- Output dir: `dist`
- Node.js: 22.x (LTS)
- Sem variáveis de ambiente necessárias (jogo client-side puro)
