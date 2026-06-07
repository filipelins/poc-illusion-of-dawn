# Illusion of Dawn — Referência de Desenvolvimento

> Complementa o CLAUDE.md com detalhes de implementação, padrões internos e guias práticos.

---

## Índice

1. [Estrutura de arquivos](#estrutura-de-arquivos)
2. [Fluxo de cenas](#fluxo-de-cenas)
3. [Sistema de tiles e mapa](#sistema-de-tiles-e-mapa)
4. [Entidades — detalhe por classe](#entidades--detalhe-por-classe)
5. [Projéteis](#projéteis)
6. [Sistema de combate](#sistema-de-combate)
7. [UI e registry](#ui-e-registry)
8. [Sistema de clima](#sistema-de-clima)
9. [BootScene — geração de texturas](#bootscene--geração-de-texturas)
10. [Padrões e convenções](#padrões-e-convenções)
11. [Checklist — adicionar features](#checklist--adicionar-features)
12. [Gotchas conhecidos](#gotchas-conhecidos)

---

## Estrutura de arquivos

```
src/
├── main.ts                  Game config + registro de cenas
├── constants.ts             Todas as constantes: stats, mapa, tiles
├── entities/
│   ├── BasePlayer.ts        Classe abstrata para personagens jogáveis
│   ├── Player.ts            Knight (espada melee)
│   ├── Bard.ts              Bard (lute + burst de notas)
│   ├── Cleric.ts            Cleric (magic bolt + divine realm)
│   ├── BaseEnemy.ts         Classe abstrata para inimigos
│   ├── Slime.ts             Inimigo básico (wander/chase)
│   ├── Skeleton.ts          Inimigo com state machine (patrol/charge)
│   ├── Wizard.ts            Inimigo ranged (distance-based + teleport)
│   ├── MindDevourer.ts      Boss 2 fases
│   ├── Projectile.ts        Projétil do Wizard
│   ├── NoteProjectile.ts    Projétil especial do Bard
│   ├── MagicBolt.ts         Ataque ranged do Cleric
│   └── BossProjectile.ts    Projétil do boss (com homing)
├── scenes/
│   ├── BootScene.ts         Geração procedural de todas as texturas
│   ├── CharacterSelectScene.ts  Tela de seleção com 3 cards
│   ├── GameScene.ts         Overworld principal + combate + boss
│   ├── UIScene.ts           HUD overlay (corações, barras, boss bar)
│   └── CastleScene.ts       Interior do castelo (sem inimigos)
├── systems/
│   └── WeatherSystem.ts     Ciclo de clima aleatório
└── utils/
    └── iso.ts               Projeção, colisão de tiles, helpers de distância
```

---

## Fluxo de cenas

```
BootScene
  └─► CharacterSelectScene   (registry: selectedChar = 'knight'|'bard'|'cleric')
        └─► GameScene + UIScene  (paralelas, UIScene lê registry)
              ├─► CastleScene    (E na porta do castelo; HP preservado)
              └─► GameScene      (E para sair do castelo)
```

**Como iniciar cena paralela:** `this.scene.launch('UIScene')` — UIScene nunca substitui GameScene.

**Passagem de dados entre cenas:** sempre via `this.registry.set(chave, valor)`. Nunca referência direta entre instâncias de cenas.

---

## Sistema de tiles e mapa

### Constantes críticas (`constants.ts`)

| Constante    | Valor | Significado                              |
|--------------|-------|------------------------------------------|
| `TILE_SIZE`  | 32    | Pixels por tile                          |
| `MAP_COLS`   | 64    | Largura do mapa em tiles                 |
| `MAP_ROWS`   | 48    | Altura do mapa em tiles (+ 14 extras)    |
| `SOLID_TILES`| `{1,2,4,5,9,10,11}` | IDs que bloqueiam movimento  |

### IDs de tile

| ID | Tipo       | Sólido |
|----|------------|--------|
| 0  | grass      | não    |
| 1  | wall       | sim    |
| 2  | bush       | sim    |
| 3  | path       | não    |
| 4  | water      | sim    |
| 5  | house-wall | sim    |
| 6  | sand       | não    |
| 7  | dungeon    | não    |
| 8  | forest     | não    |
| 9  | tree       | sim    |
| 10 | cactus     | sim    |
| 11 | ruin-wall  | sim    |

### Biomas do mapa

| Região                  | Colunas | Linhas | Tiles predominantes |
|-------------------------|---------|--------|---------------------|
| Floresta (oeste)        | 0-18    | todas  | tree, forest, grass |
| Vila (centro)           | 19-44   | todas  | path, grass, houses |
| Deserto (nordeste)      | 45-62   | 1-21   | sand, cactus        |
| Ruínas (sudeste)        | 45-62   | 22-46  | dungeon, ruin-wall  |
| Castelo (centro)        | ~29-34  | ~20-25 | castle tiles        |

### Coordenadas

- **World coords** são em unidades de tile (float). Ex: `(30.5, 24.0)`.
- **Screen coords** = `wx * TILE_SIZE`, `wy * TILE_SIZE`.
- **Depth** (z-order) = `wy` — objetos mais ao sul ficam na frente.
- Funções em `utils/iso.ts`:
  - `isoX(wx)`, `isoY(wy)` — conversão world → screen
  - `isoDepth(wy)` — depth para painter's algorithm
  - `isWall(wx, wy, mapData)` — verifica colisão de tile
  - `moveSlide(wx, wy, dx, dy, r, mapData)` — movimento com slide em paredes
  - `worldDist(ax, ay, bx, by)` — distância euclidiana em tile units

---

## Entidades — detalhe por classe

### BasePlayer

**Estado interno:**
- `wx, wy` — posição em tile units
- `hp` — HP atual
- `invincibleTimer` — ms de invulnerabilidade restantes
- `attackTimer`, `attackCooldownTimer` — controle de animação/cooldown
- `knockbackVX, knockbackVY, knockbackTimer` — knockback em curso

**Ciclo de update:**
1. Reduz timers (knockback, invincibilidade, ataque, cooldown)
2. Se em knockback: aplica knockback via `moveSlide`, publica registry, retorna
3. Lê input (WASD/setas, Z/Space, X/Shift, Q)
4. Normaliza diagonal, aplica velocidade (normal ou defend)
5. Chama `syncSprite()` — subclasse posiciona sprites
6. Chama `updateWeapon()` — subclasse anima arma
7. Chama `onSpecialInput()` — hook para especial do Q

**Dano e knockback:**
```ts
takeDamage(dmg, fromX, fromY): void
// Ignora se invincibleTimer > 0
// Reduz HP, inicia 1100ms de invincibilidade
// Calcula knockback da direção (fromX, fromY) → player
// Publica playerHP no registry
```

**Defend (bloqueio):**
- Verifica se ataque vem da frente (dot product > 0.3)
- Se bloqueado: `knockbackTimer = 0` (sem knockback), dano reduzido para 0
- Defender reduz velocidade para `getDefendSpeed()`

### Player (Knight)

- Textura: `player-down/up/left/right` (18×26px)
- Arma: `sword-h` (30×6px) ou `sword-v` (6×30px)
- Hitbox de ataque: raio 1.1 à frente, ±1.5 lateral
- Sem special (Q não faz nada)

### Bard

- Textura: `bard-down/up/left/right`
- Arma: `lute-h` / `lute-v`
- Hitbox: mesmo alcance que Knight, ±0.7 lateral (mais estreito)
- **Special (Q):** burst de 8 `NoteProjectile` em círculo completo
  - Cooldown: 4000ms
  - Chaves registry: `specialReady`, `specialFrac`

### Cleric

- Textura: `cleric-down/up/left/right`
- Arma: `staff-h` / `staff-v`
- **Ataque:** gera `MagicBolt` na direção atual (não é melee — `checkSwordHit` retorna false)
- Dano do bolt: 1 normal, 2 durante Divine Realm
- **Special (Q) — Divine Realm:**
  - Duração: 2000ms de realm ativo
  - Cooldown total: 10000ms (8000ms cooldown + 2000ms ativo)
  - Durante realm: `clericRealm = true` no registry → UIScene mostra overlay roxo

### BaseEnemy

- `wx, wy` — posição
- `hp` — HP atual
- `knockbackVX, knockbackVY, knockbackTimer` — knockback
- `moveToward(targetX, targetY, speed)` — move em direção ao alvo com `moveSlide`
- `takeDamage(dmg, fromX, fromY)` — flash vermelho + knockback + partículas na morte
- `updateAI(player, delta)` — abstrato, implementado por subclasse

### Slime

**Estados:** `wander` | `chase`

| Estado  | Condição de entrada         | Comportamento                          |
|---------|-----------------------------|----------------------------------------|
| wander  | padrão / player > 5.5 dist  | Muda direção aleatoriamente a cada 1-3s |
| chase   | player ≤ 5.5 dist           | `moveToward(player, 1.6)`              |

- Animação: squish (scaleY oscila entre 0.85 e 1.15 via sin)

### Skeleton

**Estados:** `patrol` | `alert` | `charge` | `stunned`

| Estado   | Transição                          | Comportamento                       |
|----------|------------------------------------|-------------------------------------|
| patrol   | padrão                             | Vai e volta entre 2 pontos (2.0 vel)|
| alert    | player < 6 dist                    | Para, fica laranja por 600ms        |
| charge   | após alert                         | `moveToward(player, 6.0)` por 1.5s  |
| stunned  | bate em parede durante charge      | Para por 1000ms, gira               |

### Wizard

**Estados:** `idle` | `position` | `shoot` | `flee`

| Estado    | Condição                          | Comportamento                            |
|-----------|-----------------------------------|------------------------------------------|
| idle      | início / após shoot               | Parado, aguarda                          |
| position  | player > 7 dist                   | Aproxima até distância preferida (5.0)   |
| shoot     | player 2.5-7 dist                 | Dispara `Projectile`, teleporta para trás|
| flee      | player < 2.5 dist                 | Recua em velocidade máxima               |

- Teleporte pós-tiro: blink visual (alphaTween), move 3.0 unidades para trás
- Cooldown de tiro: 2200ms + variância aleatória

### MindDevourer (Boss)

**Fases:**

| Fase | HP         | Órbita | Spread | Burst | Homing | Teleporte |
|------|------------|--------|--------|-------|--------|-----------|
| 1    | 80 → 40    | 7.0 u  | 3 proj | 8 proj| não    | não       |
| 2    | 40 → 0     | 5.5 u  | 5 proj | 12 proj| sim   | sim       |

**Comportamento orbital:**
- O boss orbita o player em raio fixo
- Ângulo avança por delta a cada frame

**Ataques:**
- **Spread:** `N` projéteis em leque à frente
- **Burst:** `N` projéteis em círculo completo
- Intervalo de ataque: ~3s (fase 1), ~2s (fase 2)

**Eventos especiais:**
- Entrada: partícula burst + camera flash/shake
- Transição de fase: câmera shake, tint vermelho
- Morte: 3 ondas de explosão + texto "VENCIDO!"

---

## Projéteis

Todos estendem `Phaser.GameObjects.Container` ou similar. Precisam ser adicionados a um grupo para colisão.

### Projectile (Wizard)

- Textura: `projectile` (12×12px roxo)
- Movimento: direção normalizada × velocidade constante
- Destrói ao bater em parede
- Animação: scale pulsante via sin

### NoteProjectile (Bard special)

- Textura: `note-sprite` (ouro com haste e bandeira)
- Rotação contínua
- Destrói quando percorre > 5.5 unidades **ou** bate em parede
- Partículas ao explodir

### MagicBolt (Cleric attack)

- Textura: `magic-bolt` (círculos concêntricos ciano)
- Destrói quando percorre distância máxima **ou** bate em parede
- Dano variável conforme `clericRealm`

### BossProjectile

- Textura: `boss-orb` (roxo/magenta)
- **Fase 1:** direção fixa
- **Fase 2:** homing — interpola ângulo suavemente em direção ao player
- Destrói ao bater em parede ou player

---

## Sistema de combate

### Fluxo de ataque melee

1. Player pressiona Z/Space → `attackTimer` setado para `getAttackDuration()`
2. `updateWeapon()` posiciona sprite da arma na direção atual
3. `GameScene.update()` chama `player.checkSwordHit(ex, ey)` para cada inimigo
4. Se hit: `enemy.takeDamage(damage, player.wx, player.wy)`

### Colisão projétil → player

Checada em `GameScene.update()`:
```ts
for (const proj of projectiles) {
  if (worldDist(proj.wx, proj.wy, player.wx, player.wy) < HIT_RADIUS) {
    player.takeDamage(proj.damage, proj.wx, proj.wy)
    proj.destroy()
  }
}
```

### Colisão inimigo → player (contato)

Cada inimigo verifica distância ao player. Se < `ENEMY_CONTACT_RADIUS`, aplica dano e knockback.

### Defend/block

Player com defend ativo verifica se o dano vem do hemisfério frontal. Se sim, bloqueia completamente.

---

## UI e registry

### Chaves do registry (GameScene → UIScene)

| Chave           | Tipo    | Publicado por    | Usado em                     |
|-----------------|---------|------------------|------------------------------|
| `playerHP`      | number  | BasePlayer       | UIScene (corações)           |
| `playerMaxHP`   | number  | BasePlayer (init)| UIScene (total de corações)  |
| `playerDefending`| boolean| BasePlayer       | UIScene (label DEFENDING)    |
| `playerAttacking`| boolean| BasePlayer       | UIScene (label ATTACKING)    |
| `specialReady`  | boolean | Bard/Cleric      | UIScene (barra especial)     |
| `specialFrac`   | number  | Bard/Cleric      | UIScene (progresso da barra) |
| `clericRealm`   | boolean | Cleric           | UIScene (overlay roxo)       |
| `bossHP`        | number  | MindDevourer     | UIScene (boss bar)           |
| `bossMaxHP`     | number  | MindDevourer     | UIScene (boss bar total)     |
| `bossPhase`     | number  | MindDevourer     | UIScene (indicador de fase)  |
| `bossActive`    | boolean | GameScene        | UIScene (mostra boss bar)    |
| `bossAnnouncing`| boolean | GameScene        | UIScene (texto de anúncio)   |
| `selectedChar`  | string  | CharacterSelectScene | GameScene (spawn), UIScene |

### Padrão de escuta no UIScene

```ts
this.registry.events.on('changedata', (parent, key, value) => {
  if (key === 'playerHP') this.updateHearts(value)
  // ...
})
```

---

## Sistema de clima

**Arquivo:** `src/systems/WeatherSystem.ts`

**Tipos:**

| Tipo  | Probabilidade | Overlay        | Partículas               |
|-------|--------------|----------------|--------------------------|
| sunny | 2/5          | nenhum         | nenhuma                  |
| rain  | 2/5          | escuro (0.32α) | gotas diagonais (2×8px)  |
| snow  | 1/5          | claro (0.13α)  | flocos lentos (3×3px)    |

**Duração por clima:** 25-80 segundos (aleatório)

**Uso em GameScene:**
```ts
this.weather = new WeatherSystem(this)
// No update():
this.weather.update(delta)
```

---

## BootScene — geração de texturas

Todas as texturas são geradas em `BootScene.create()` via `this.make.graphics()` + `.generateTexture(key, w, h)`. Nenhum arquivo de imagem externo.

### Convenção de nomes de textura

| Padrão                  | Exemplo                  | Uso                        |
|-------------------------|--------------------------|----------------------------|
| `{char}-{dir}`          | `player-down`            | Sprite do personagem       |
| `{weapon}-h` / `-v`     | `sword-h`, `lute-v`      | Arma horizontal/vertical   |
| `{enemy}`               | `slime`, `skeleton`      | Sprite do inimigo          |
| `{type}-sprite`         | `note-sprite`            | Projéteis especiais        |
| `tile-{id}`             | `tile-0`, `tile-3`       | Tiles do mapa              |
| `heart-full`, `heart-empty` |                      | UI                         |

### Tamanhos de sprite

| Tipo          | Largura | Altura |
|---------------|---------|--------|
| Personagem    | 18px    | 26px   |
| Slime         | 20px    | 16px   |
| Skeleton      | 18px    | 28px   |
| Wizard        | 20px    | 28px   |
| MindDevourer  | 40px    | 40px   |
| Tile          | 32px    | 32px   |

---

## Padrões e convenções

### Cast obrigatório para grupos Phaser

```ts
// Em qualquer entidade que extende Phaser.Physics.Arcade.Sprite
scene.add.existing(this as unknown as Phaser.GameObjects.GameObject)
scene.physics.add.existing(this as unknown as Phaser.Physics.Arcade.Sprite)
```

### Acessar body sem sobrescrever getter

```ts
// NUNCA: get body() { ... }   ← quebra herança de Arcade.Sprite
// Use método helper:
private bd() {
  return this.body as Phaser.Physics.Arcade.Body
}
```

### Publicar no registry

```ts
// Em qualquer cena ou entidade com acesso à cena:
this.scene.registry.set('chave', valor)
// Ou, dentro de uma cena:
this.registry.set('chave', valor)
```

### Depth sorting

```ts
// Sempre definir depth pelo Y para painter's algorithm correto:
this.setDepth(isoDepth(this.wy))
// Atualizar no update() se o objeto se move
```

### Movimento com colisão de tile

```ts
// Nunca mover diretamente: this.wx += dx
// Sempre usar:
const [nx, ny] = moveSlide(this.wx, this.wy, dx, dy, RADIUS, MAP_DATA)
this.wx = nx
this.wy = ny
this.setPosition(isoX(this.wx), isoY(this.wy))
```

---

## Checklist — adicionar features

### Novo personagem

- [ ] Criar `src/entities/NomeChar.ts` estendendo `BasePlayer`
- [ ] Implementar todos os métodos abstratos
- [ ] Definir constantes em `constants.ts` (`NOME_HP`, `NOME_SPEED`, etc.)
- [ ] Gerar texturas em `BootScene.ts` (4 direções + arma H/V)
- [ ] Adicionar card em `CharacterSelectScene.ts` (array `CHARS`)
- [ ] Adicionar case em `GameScene.spawnPlayer()`
- [ ] Se tiver special: adicionar barra no `UIScene.ts` com chaves registry
- [ ] Se tiver projéteis: adicionar loop de colisão no `GameScene.update()`

### Novo inimigo

- [ ] Criar `src/entities/NomeInimigo.ts` estendendo `BaseEnemy`
- [ ] Implementar `updateAI(player, delta): void`
- [ ] Definir constantes em `constants.ts`
- [ ] Gerar textura em `BootScene.ts`
- [ ] Adicionar ao `GameScene.spawnEnemies()`
- [ ] Incrementar total de inimigos para trigger do boss (atualmente 27)
- [ ] Se tiver projéteis: adicionar loop de colisão no `GameScene.update()`

### Novo tipo de projétil

- [ ] Criar classe em `src/entities/`
- [ ] Gerar textura em `BootScene.ts`
- [ ] Manter array de instâncias na cena que dispara
- [ ] Adicionar loop de colisão em `GameScene.update()` (ou `CastleScene`)
- [ ] Limpar projéteis em `destroy()` da entidade dona

### Nova cena

- [ ] Criar `src/scenes/NovaCena.ts`
- [ ] Registrar em `main.ts` no array `scene`
- [ ] Usar `this.scene.start('NovaCena')` ou `this.scene.launch()` para paralela
- [ ] Passar dados via registry, não via referência direta

---

## Gotchas conhecidos

### 1. Boss só aparece após matar **todos** os 27 inimigos

`GameScene` verifica `enemies.length === 0` para spawnar o boss. Se adicionar novos inimigos ao `spawnEnemies()`, o boss só aparece depois que eles também forem mortos.

### 2. HP não reseta entre overworld e castelo

HP é persistido via registry. Se quiser reset ao entrar/sair do castelo, publicar `playerHP = playerMaxHP` na transição.

### 3. `SOLID_TILES` precisa ser atualizado ao criar novos tipos de tile

Se criar ID 12+ para um tile sólido, adicionar ao Set em `constants.ts` E em `isWall()` em `iso.ts`.

### 4. CastleScene tem seu próprio mapa (24×18)

Diferente do overworld (64×48). Se alterar constantes globais de mapa (`TILE_SIZE`), CastleScene herda automaticamente. Mas `MAP_COLS`/`MAP_ROWS` são do overworld — CastleScene usa valores locais.

### 5. UIScene não reinicia com o jogo

`UIScene` é lançada em paralelo e persiste. Se reiniciar `GameScene`, verificar se UIScene precisa ser reiniciada também ou se o registry reset é suficiente.

### 6. Projéteis do boss em fase 2 têm homing

`BossProjectile` com `homing = true` interpola ângulo suavemente. Não bale em paredes imediatamente — pode contornar obstáculos. Considerar isso ao desenhar arenas.

### 7. Diagonal normalizado

`BasePlayer` normaliza o vetor diagonal automaticamente (`dx /= Math.sqrt(2)`). Subclasses não precisam tratar isso, mas se sobrescreverem o movimento, precisam normalizar manualmente.

### 8. Texturas geradas — sem arquivo externo

Nenhum asset de disco. Se `BootScene` falhar, o jogo fica sem texturas. Toda textura nova precisa ser gerada ali antes de ser referenciada em outras cenas.

---

## Spawn de inimigos (GameScene)

Total: **27 inimigos** para trigger do boss.

| Tipo     | Quantidade | Distribuição              |
|----------|-----------|---------------------------|
| Slime    | 14        | Espalhados pelo mapa       |
| Skeleton | 8         | Área central e ruínas      |
| Wizard   | 5         | Deserto e floresta         |

Posições definidas em `GameScene.spawnEnemies()` como coordenadas world hardcoded.

---

## Comandos úteis

```bash
npm run dev       # Dev server em localhost:3000
npm run build     # tsc + vite build → dist/
npm run preview   # Preview do build
```

Deploy: Vercel com `npm run build`, output dir `dist`, Node 22.x.
