# Arquitetura do Projeto — Illusion of Dawn

> Guia simples de como o projeto está organizado, o que cada pasta e arquivo faz, e como as peças se conectam. Escrito para qualquer pessoa — não é preciso ser programador experiente para entender.

---

## O que é este projeto?

**Illusion of Dawn** é um jogo RPG de ação com visão de cima (estilo Zelda). Ele roda no navegador e também como aplicativo de desktop (Windows/Mac). Feito com:

- **Phaser 3** — motor de jogos 2D
- **TypeScript** — JavaScript com tipos, evita erros
- **Vite** — ferramenta que compila e serve o jogo
- **Electron** — empacota o jogo como aplicativo de desktop
- **Tiled Map Editor** — editor visual de mapas e cenários

---

## Visão geral das pastas

```
illusionOfDawn/
│
├── src/              ← Todo o código do jogo
│   ├── scenes/       ← Telas e fases do jogo
│   ├── entities/     ← Personagens, inimigos, projéteis
│   ├── systems/      ← Áudio, clima, save
│   ├── utils/        ← Funções auxiliares (colisão, câmera)
│   ├── config/       ← Mapeamento de frames do tileset
│   ├── constants.ts  ← Números e configurações centrais
│   └── main.ts       ← Ponto de entrada do jogo
│
├── public/assets/    ← Imagens e mapa carregados pelo jogo
├── tiled/            ← Arquivos do Tiled Map Editor
├── electron/         ← Código do app desktop
├── scripts/          ← Ferramentas de desenvolvimento
├── docs/             ← Esta documentação
└── dist/             ← Jogo compilado (gerado automaticamente)
```

---

## Fluxo do jogo (ordem das telas)

```
Inicialização
     ↓
BootScene          ← Carrega assets e gera texturas
     ↓
CharacterSelectScene  ← Jogador escolhe Knight / Bard / Cleric
     ↓
GameScene          ← Mundo aberto principal
(+ UIScene rodando em paralelo — mostra HP, cooldowns)
     ↓
CastleScene        ← Interior do castelo (acessado pela porta)
     ↓
VictoryScene       ← Tela de vitória (após matar o boss)
     ou
GameOverScene      ← Tela de derrota (HP chega a zero)
```

---

## `src/main.ts` — Ponto de entrada

O primeiro arquivo executado. Configura e inicializa o Phaser com:
- Resolução: 1000×800 px
- Pixel art ativado (sem suavização)
- Física arcade sem gravidade (visão de cima)
- Lista de todas as cenas, na ordem em que são registradas

---

## `src/constants.ts` — Configurações centrais

Arquivo com todos os números e valores que são usados em vários lugares do código. Exemplos:
- `TILE_SIZE = 32` — tamanho de cada tile em pixels
- `MAP_COLS = 64`, `MAP_ROWS = 48` — dimensões do mapa
- `SOLID_TILES` — quais tipos de tile têm colisão (fallback quando não há layer Collision no Tiled)
- Atributos dos personagens: HP, velocidade, dano
- Posição da porta do castelo no mundo

> **Regra:** qualquer número que aparece em mais de um lugar deve estar aqui, não espalhado pelo código.

---

## `src/scenes/` — Telas e fases

Cada arquivo é uma "tela" do jogo. O Phaser carrega e descarta cenas conforme necessário.

### `BootScene.ts` *(1292 linhas)*
A primeira cena a rodar. Não mostra nada jogável — ela:
1. Carrega as imagens externas (PNGs do Tiled, spritesheet de grama, água, etc.)
2. Gera **todas as texturas procedurais** do jogo usando código (paredes, personagens, inimigos, HUD, efeitos climáticos)
3. Quando termina, passa para `CharacterSelectScene`

> Nenhum asset visual é gerado em outro lugar. Tudo o que o jogo "desenha sem arquivo externo" está aqui.

### `CharacterSelectScene.ts` *(483 linhas)*
Tela de seleção de personagem. Mostra três cards (Knight, Bard, Cleric) com atributos. Quando o jogador escolhe, salva a seleção no `registry` e inicia `GameScene`.

### `GameScene.ts` *(702 linhas)*
A cena principal — o mundo aberto onde o jogo acontece. Responsabilidades:

- **Mapa:** lê o `map.json` e monta as três layers (Ground, Decor, Collision)
- **Player:** cria o personagem escolhido e gerencia input
- **Inimigos:** spawn de 14 Slimes, 8 Skeletons, 5 Wizards e o Boss final
- **Aldeões:** NPC decorativos com diálogo
- **Combate:** detecta colisões entre ataques e entidades
- **Boss:** aparece após matar todos os 27 inimigos
- **Dark Realm:** alterna a paleta visual do mundo com a tecla R
- **Clima:** chuva e neve procedural
- **Transições:** vai para `CastleScene` pela porta, `VictoryScene` ao matar o boss

### `UIScene.ts` *(491 linhas)*
Roda em **paralelo** ao `GameScene` e `CastleScene`. Mostra o HUD:
- Corações de HP
- Barra de cooldown da habilidade especial (Q)
- Barra de HP do boss
- Overlay do Divine Realm (Cleric)
- Portrait do personagem

Comunica com `GameScene` **exclusivamente via `registry`** — nunca acessa `GameScene` diretamente.

### `CastleScene.ts` *(230 linhas)*
Interior do castelo. Mapa **hardcoded** (array 2D no próprio arquivo, 24×18 tiles). Tem:
- Piso de dungeon, paredes, tochas animadas, trono
- Porta de saída que volta para `GameScene`
- Desbloqueia o Dark Realm na primeira visita

### `GameOverScene.ts` *(95 linhas)*
Tela simples exibida quando o jogador morre. Botão para reiniciar voltando à seleção de personagem.

### `VictoryScene.ts` *(102 linhas)*
Tela de vitória após derrotar o Mind Devourer. Mostra animação e créditos.

---

## `src/entities/` — Personagens e objetos

Todos os "seres" do jogo herdam de classes base para compartilhar comportamentos comuns.

### Hierarquia de personagens jogáveis

```
BasePlayer (abstrata)
├── Player   — Knight: espada melee, sem especial
├── Bard     — velocidade alta, especial: burst de notas musicais
└── Cleric   — ataque à distância (MagicBolt), especial: Divine Realm (dano duplo por 2s)
```

**`BasePlayer.ts` *(291 linhas)*** — Classe base com tudo que é comum:
- Movimento com `moveSlide()` (desliza nas paredes)
- Invencibilidade pós-hit com flash vermelho
- Knockback ao tomar dano
- Publicação de HP no `registry` para a UIScene
- Métodos abstratos que cada personagem implementa: dano, velocidade, animação da arma

### Hierarquia de inimigos

```
BaseEnemy (abstrata)
├── Slime    — wander aleatório, persegue ao detectar o player
├── Skeleton — patrulha, alerta, charge, stun em parede
└── Wizard   — mantém distância, strafe, teleporta após atirar
```

**`BaseEnemy.ts` *(133 linhas)*** — Classe base com: knockback, flash de dano, partículas na morte.

### Boss

**`MindDevourer.ts` *(340 linhas)*** — Inimigo final. Duas fases:
- Fase 1: spread de projéteis, teleporte
- Fase 2 (50% HP): velocidade e cadência aumentadas, padrão de ataque diferente

### Projéteis

| Arquivo | Quem usa | O que é |
|---|---|---|
| `Projectile.ts` | Wizard | Orbe roxo |
| `BossProjectile.ts` | MindDevourer | Orbe psíquico maior |
| `MagicBolt.ts` | Cleric (ataque) | Raio de luz |
| `NoteProjectile.ts` | Bard (especial Q) | Nota musical |

### Outros

**`Villager.ts` *(131 linhas)*** — NPC decorativo. Wander aleatório pela vila, exibe diálogo ao interagir.

---

## `src/systems/` — Sistemas de suporte

### `AudioSystem.ts` *(332 linhas)*
Gera todo o áudio do jogo **proceduralmente** — não há arquivos de som externos. Usa a Web Audio API via Phaser para sintetizar:
- Efeitos sonoros: swing da espada, hit, morte de inimigo, dano ao player
- Música de fundo: GameScene e CastleScene têm temas distintos

### `SaveSystem.ts` *(26 linhas)*
Salva e carrega dados persistentes no `localStorage` do navegador (ou disco no Electron). Dados salvos:
- `realmUnlocked` — se o Dark Realm foi desbloqueado
- `selectedChar` — personagem escolhido

### `WeatherSystem.ts` *(153 linhas)*
Controla o clima do mundo: sol, chuva e neve. O tipo de clima muda aleatoriamente ao longo do tempo. Chuva e neve são partículas geradas proceduralmente.

---

## `src/utils/` — Funções auxiliares

### `iso.ts` *(48 linhas)*
O coração do sistema de **coordenadas e colisão**:

- `setCurrentMap(data, cols, rows, collision?)` — registra o mapa ativo para que `isWall()` saiba onde há paredes
- `isWall(wx, wy)` — retorna `true` se a posição é sólida. Usa a **layer Collision do Tiled** se existir; caso contrário, usa `SOLID_TILES` como fallback (para cenas hardcoded como o castelo)
- `moveSlide(wx, wy, dx, dy, radius)` — move uma entidade e desliza nas paredes em vez de travar
- `worldDist(ax, ay, bx, by)` — distância entre dois pontos em world coords

> Toda entidade do jogo usa `moveSlide()` para se mover. Mudar essa função afeta o movimento de tudo.

### `sceneHelpers.ts` *(51 linhas)*
Funções que toda cena usa ao inicializar:
- `createPlayer(scene, wx, wy)` — lê o `registry` para saber qual personagem foi escolhido e instancia a classe correta
- `setupSceneInput(scene)` — configura teclado (WASD, Z, X, Q, E, R, Esc) e retorna as referências de teclas
- `setupFollowCamera(scene, player, worldW, worldH)` — faz a câmera seguir o player com zoom 2.5×

---

## `src/config/TilesetGrass.ts`
Tabela de frames do arquivo `tileset-grass.png`. Define qual frame usar para cada combinação de bordas de grama (bitmask de 4 bits = 16 combinações). Usado em `GameScene.buildTileMap()` para renderizar transições suaves entre grama e água.

---

## `public/assets/` — Arquivos carregados pelo jogo

| Arquivo | O que é |
|---|---|
| `map.json` | Mapa do mundo principal (gerado por `npm run sync-map`) |
| `path-objects.png` | Spritesheet 512×512 do Tiled (16×16 tiles de 32px) — usada pela layer Decor |
| `tileset-grass.png` | Spritesheet de grama com transições |
| `tileset-map.png` | Paleta de cores dos tipos de tile (usada no Tiled para visualização) |
| `tree.png` | Sprite de árvore |
| `bush.png` | Sprite de arbusto |
| `water-foam.png` | Animação de espuma de água |
| `rock1–4.png` | Sprites de pedras decorativas |
| `water-bg.png` | Fundo de água |

---

## `tiled/` — Arquivos do editor de mapas

| Arquivo | O que é |
|---|---|
| `map.tmj` | Mapa principal editável no Tiled Map Editor (**fonte da verdade**) |
| `tileset-types.tsj` | Definição dos 14 tipos de tile de lógica (grass, wall, water, etc.) |
| `map.tsx` | Definição do tileset visual (`PathAndObjects.png`) usado na layer Decor |
| `sprite.tmx` | Arquivo auxiliar do Tiled (visualização de sprites) |

> **Fluxo:** edita `map.tmj` no Tiled → `npm run sync-map` → atualiza `public/assets/map.json` → Phaser carrega.

---

## `electron/main.js` — App desktop

Código do processo principal do Electron. Cria a janela do app, carrega o jogo compilado (`dist/`), suporta fullscreen e configura o ícone. Roda apenas quando o jogo é empacotado como app — no browser, este arquivo é ignorado.

---

## `scripts/` — Ferramentas de desenvolvimento

| Script | Comando | O que faz |
|---|---|---|
| `export-map.mjs` | `npm run export-map` | Gera o `map.tmj` e `tileset-types.tsj` a partir do código TypeScript (útil para resetar o mapa para o estado original) |
| `gen-icon.mjs` | `npm run gen-icon` | Gera o `icon.ico` para o instalador Windows |

---

## Arquivos de configuração na raiz

| Arquivo | O que configura |
|---|---|
| `package.json` | Scripts (`dev`, `build`, `sync-map`, etc.) e dependências |
| `tsconfig.json` | Regras do TypeScript (strict mode ativado) |
| `vite.config.ts` | Servidor de desenvolvimento na porta 3000, output em `dist/` |
| `index.html` | HTML base que carrega o jogo no browser |
| `.gitignore` | Arquivos ignorados pelo Git (`node_modules`, `dist`, `release`) |

### Comandos principais

```bash
npm run dev          # Inicia servidor local (http://localhost:3000)
npm run build        # Compila TypeScript + Vite → dist/
npm run sync-map     # Copia tiled/map.tmj → public/assets/map.json
npm run export-map   # Regenera os arquivos Tiled a partir do código
npm run electron:dev # Inicia o jogo como app desktop (desenvolvimento)
npm run electron:build:mac  # Gera instalador para Mac
npm run electron:build:win  # Gera instalador para Windows
```

---

## Como as peças se comunicam

```
Tiled Map Editor
  └─ salva map.tmj
       └─ npm run sync-map
            └─ public/assets/map.json
                 └─ BootScene carrega via this.load.json('map-data')
                      └─ GameScene lê as 3 layers:
                           ├─ Ground    → tipos de tile (grama, água, etc.)
                           ├─ Decor     → visuais de PathAndObjects.png
                           └─ Collision → mapa de colisão (substituiu SOLID_TILES)

GameScene ←→ UIScene
  comunicação via this.registry (chaves: playerHP, bossHP, specialReady, etc.)
  UIScene NUNCA acessa GameScene diretamente

BasePlayer / BaseEnemy
  usam moveSlide() de iso.ts para se mover
  iso.ts consulta setCurrentMap() para saber o mapa atual
  cada cena chama setCurrentMap() no seu create()
```

---

## Regras de ouro do projeto

1. **Texturas procedurais ficam em `BootScene.ts`** — todo `generateTexture()` vai lá
2. **Números mágicos ficam em `constants.ts`** — nada de `32` ou `4.5` espalhado pelo código
3. **UIScene nunca acessa GameScene** — só via `registry`
4. **Colisão vem da layer Collision do Tiled** — se não existir, usa `SOLID_TILES` como fallback
5. **Visuais de obstáculos vêm da layer Decor** — `buildTileMap()` só renderiza o chão base
6. **Nunca editar `map.json` diretamente** — sempre editar `map.tmj` e rodar `sync-map`
