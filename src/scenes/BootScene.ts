import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload(): void {
    this.load.json('map-data', 'assets/map.json');
    this.load.spritesheet('raw-tileset', 'assets/tileset-grass.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('raw-tree',    'assets/tree.png',           { frameWidth: 192, frameHeight: 256 });
    this.load.spritesheet('raw-bush',    'assets/bush.png',           { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('raw-wfoam',   'assets/water-foam.png',     { frameWidth: 192, frameHeight: 192 });
    this.load.image('raw-rock1', 'assets/rock1.png');
    this.load.image('raw-rock2', 'assets/rock2.png');
    this.load.image('raw-rock3', 'assets/rock3.png');
    this.load.image('raw-rock4', 'assets/rock4.png');
  }

  create(): void {
    this.makeFloor();
    this.makePath();
    this.makeSand();
    this.makeDungeon();
    this.makeForestFloor();
    this.makeWater();
    this.makeWall();
    this.makeHouseWall();
    this.makeBush();
    this.makeTree();
    this.makeCactus();
    this.makePlayerSprites();
    this.makeBardSprites();
    this.makeLutes();
    this.makeClericSprites();
    this.makeStaff();
    this.makeSlime();
    this.makeSkeleton();
    this.makeWizard();
    this.makeMindDevourer();
    this.makeProjectile();
    this.makeBossProjectile();
    this.makeSwords();
    this.makeHearts();
    this.makeBlank();
    this.makeRainDrop();
    this.makeSnowFlake();
    this.makeCastleWall();
    this.makeCastleDoor();
    // Dark realm tile variants
    this.makeDarkWall();
    this.makeDarkHouseWall();
    this.makeDarkBush();
    this.makeDarkPath();
    // NPC sprites
    this.makeVillagerSprites();
    this.scene.start('CharacterSelectScene');
  }

  private g(): Phaser.GameObjects.Graphics {
    return this.make.graphics({} as Phaser.Types.GameObjects.Graphics.Options);
  }

  // ── Grass floor tile 32×32 — Tiny Swords colour palette ─────────

  private makeFloor(): void {
    const gr = this.g();
    gr.fillStyle(0x5a9c3a); gr.fillRect(0, 0, 32, 32);
    gr.fillStyle(0x6aac48);
    gr.fillRect(2, 3, 7, 3); gr.fillRect(17, 2, 7, 3);
    gr.fillRect(10, 13, 7, 3); gr.fillRect(24, 16, 6, 4);
    gr.fillRect(4, 23, 8, 4); gr.fillRect(20, 26, 9, 4);
    gr.fillStyle(0x4a8c2a);
    gr.fillRect(7, 9, 2, 2); gr.fillRect(23, 11, 2, 2);
    gr.fillRect(15, 21, 2, 2); gr.fillRect(29, 25, 2, 2);
    gr.fillStyle(0x78bc50);
    gr.fillRect(3, 4, 1, 1); gr.fillRect(18, 3, 1, 1);
    gr.fillRect(11, 14, 1, 1); gr.fillRect(25, 17, 1, 1);
    gr.generateTexture('tile-floor', 32, 32);
    gr.destroy();
  }

  // ── Dirt path tile 32×32 ─────────────────────────────────────────

  private makePath(): void {
    const gr = this.g();
    gr.fillStyle(0xa07848); gr.fillRect(0, 0, 32, 32);
    // Lighter ruts
    gr.fillStyle(0xb88c5c);
    gr.fillRect(2, 2, 10, 5); gr.fillRect(18, 6, 8, 4);
    gr.fillRect(5, 14, 12, 4); gr.fillRect(20, 18, 8, 5);
    gr.fillRect(2, 24, 9, 5);  gr.fillRect(14, 26, 10, 4);
    // Darker ruts / wheel marks
    gr.fillStyle(0x7a5a30);
    gr.fillRect(0, 8, 32, 2); gr.fillRect(0, 20, 32, 2);
    // Pebbles
    gr.fillStyle(0xc8a870);
    gr.fillRect(4, 5, 2, 2); gr.fillRect(22, 3, 2, 2);
    gr.fillRect(10, 16, 2, 2); gr.fillRect(26, 14, 2, 2);
    gr.fillRect(7, 27, 2, 2);  gr.fillRect(19, 25, 2, 2);
    gr.generateTexture('tile-path', 32, 32);
    gr.destroy();
  }

  // ── Sand floor tile 32×32 ─────────────────────────────────────────

  private makeSand(): void {
    const gr = this.g();
    gr.fillStyle(0xd4b060); gr.fillRect(0, 0, 32, 32);
    // Lighter dunes
    gr.fillStyle(0xe0c070);
    gr.fillRect(3, 2, 12, 6); gr.fillRect(20, 8, 9, 5);
    gr.fillRect(6, 18, 10, 6); gr.fillRect(22, 22, 8, 7);
    // Darker shadows
    gr.fillStyle(0xb89040);
    gr.fillRect(0, 10, 32, 2); gr.fillRect(0, 24, 32, 1);
    // Sand grain dots
    gr.fillStyle(0xf0d888);
    gr.fillRect(2, 4, 1, 1); gr.fillRect(14, 2, 1, 1); gr.fillRect(28, 6, 1, 1);
    gr.fillRect(8, 14, 1, 1); gr.fillRect(22, 16, 1, 1);
    gr.fillRect(4, 26, 1, 1); gr.fillRect(18, 28, 1, 1); gr.fillRect(30, 24, 1, 1);
    gr.generateTexture('tile-sand', 32, 32);
    gr.destroy();
  }

  // ── Dungeon stone floor 32×32 ─────────────────────────────────────

  private makeDungeon(): void {
    const gr = this.g();
    gr.fillStyle(0x404040); gr.fillRect(0, 0, 32, 32);
    // Stone slab seams
    gr.fillStyle(0x303030);
    gr.fillRect(0, 16, 32, 2); gr.fillRect(16, 0, 2, 16); gr.fillRect(0, 0, 2, 16);
    gr.fillRect(8, 18, 2, 14); gr.fillRect(24, 18, 2, 14);
    // Slab face highlights
    gr.fillStyle(0x505050);
    gr.fillRect(3, 1, 12, 3); gr.fillRect(19, 1, 11, 3);
    gr.fillRect(1, 19, 6, 3); gr.fillRect(11, 19, 12, 3); gr.fillRect(27, 19, 3, 3);
    // Crack
    gr.fillStyle(0x282828);
    gr.fillRect(20, 4, 1, 8); gr.fillRect(5, 22, 2, 7);
    gr.generateTexture('tile-dungeon', 32, 32);
    gr.destroy();
  }

  // ── Forest floor tile 32×32 — darker Tiny Swords grass ──────────

  private makeForestFloor(): void {
    const gr = this.g();
    gr.fillStyle(0x3a7a24); gr.fillRect(0, 0, 32, 32);
    gr.fillStyle(0x4a8a30);
    gr.fillRect(2, 3, 7, 3); gr.fillRect(17, 2, 7, 3);
    gr.fillRect(10, 13, 7, 3); gr.fillRect(24, 16, 6, 4);
    gr.fillRect(4, 23, 8, 4); gr.fillRect(20, 26, 9, 4);
    gr.fillStyle(0x2a6018);
    gr.fillRect(7, 9, 2, 2); gr.fillRect(23, 11, 2, 2);
    gr.fillRect(15, 21, 2, 2);
    gr.fillStyle(0x5a9c3a, 0.4);
    gr.fillRect(3, 5, 1, 1); gr.fillRect(18, 4, 1, 1);
    gr.fillRect(25, 18, 1, 1);
    gr.generateTexture('tile-forest', 32, 32);
    gr.destroy();
  }

  // ── Water tile 32×32 — same teal as background (seamless) ────────

  private makeWater(): void {
    const foam = this.make.sprite({ x: 0, y: 0, key: 'raw-wfoam', frame: 0 }, false);
    foam.setOrigin(0, 0).setScale(32 / 192);
    const rt = this.add.renderTexture(0, 0, 32, 32);
    rt.fill(0x2ec0c0, 1); // matches main.ts backgroundColor
    rt.draw(foam, 0, 0);
    rt.saveTexture('tile-water');
    rt.destroy();
    foam.destroy();
  }

  // ── Stone wall tile 32×40 (8px south-face overhang) ──────────────

  private makeWall(): void {
    const gr = this.g();

    // Top face — Tiny Swords grass (matches floor tile)
    gr.fillStyle(0x5a9c3a); gr.fillRect(0, 0, 32, 32);
    gr.fillStyle(0x6aac48);
    gr.fillRect(2, 4, 6, 3); gr.fillRect(16, 3, 7, 3);
    gr.fillRect(22, 19, 6, 4); gr.fillRect(4, 24, 7, 4);
    gr.fillStyle(0x4a8c2a);
    gr.fillRect(8, 10, 2, 2); gr.fillRect(25, 14, 2, 2);

    // Edge shadow at south rim (grass-to-cliff transition)
    gr.fillStyle(0x2a5018); gr.fillRect(0, 30, 32, 2);

    // South cliff face — Tiny Swords blue-gray stone (#748c95)
    gr.fillStyle(0x7a9098); gr.fillRect(0, 32, 32, 8);
    // Stone highlight row at top of cliff
    gr.fillStyle(0x9ab0b8); gr.fillRect(0, 32, 32, 2);
    // Stone shading band at base
    gr.fillStyle(0x506878); gr.fillRect(0, 37, 32, 3);
    // Horizontal stone block lines
    gr.fillStyle(0x607888);
    gr.fillRect(0, 34, 9, 1); gr.fillRect(14, 34, 12, 1); gr.fillRect(28, 34, 4, 1);
    // Vertical mortar joints
    gr.fillStyle(0x405868);
    gr.fillRect(9, 32, 1, 8); gr.fillRect(22, 32, 1, 8);
    // Inner block highlights
    gr.fillStyle(0x8aa8b0);
    gr.fillRect(1, 33, 7, 1); gr.fillRect(15, 33, 6, 1);

    gr.generateTexture('tile-wall', 32, 40);
    gr.destroy();
  }

  // ── Bush obstacle tile 32×32 — Tiny Swords bush frame 0 ─────────

  private makeBush(): void {
    const spr = this.make.sprite({ x: 0, y: 0, key: 'raw-bush', frame: 0 }, false);
    spr.setOrigin(0, 0).setScale(0.25); // 128 * 0.25 = 32
    const rt = this.add.renderTexture(0, 0, 32, 32);
    rt.draw(spr, 0, 0);
    rt.saveTexture('tile-bush');
    rt.destroy();
    spr.destroy();
  }

  // ── Brick house wall 32×40 ───────────────────────────────────────

  private makeHouseWall(): void {
    const gr = this.g();
    // Top face — brick red
    gr.fillStyle(0x9a5848); gr.fillRect(0, 0, 32, 32);
    // Brick rows (horizontal mortar)
    gr.fillStyle(0x6a3830);
    gr.fillRect(0, 8, 32, 2); gr.fillRect(0, 18, 32, 2); gr.fillRect(0, 28, 32, 2);
    // Brick vertical joints (offset per row)
    gr.fillRect(10, 0, 2, 8);  gr.fillRect(24, 0, 2, 8);
    gr.fillRect(4, 10, 2, 8);  gr.fillRect(18, 10, 2, 8);
    gr.fillRect(10, 20, 2, 8); gr.fillRect(26, 20, 2, 8);
    // Brick highlights
    gr.fillStyle(0xb86860);
    gr.fillRect(1, 1, 8, 2); gr.fillRect(13, 1, 10, 2); gr.fillRect(27, 1, 3, 2);
    gr.fillRect(5, 11, 12, 2); gr.fillRect(21, 11, 5, 2);
    gr.fillRect(1, 21, 8, 2);  gr.fillRect(13, 21, 12, 2);
    // South face (darker brick)
    gr.fillStyle(0x4a2820); gr.fillRect(0, 32, 32, 8);
    gr.fillStyle(0x5a3828); gr.fillRect(0, 32, 32, 2);
    gr.fillStyle(0x3a2018); gr.fillRect(10, 33, 2, 7); gr.fillRect(22, 33, 2, 7);
    gr.generateTexture('tile-house-wall', 32, 40);
    gr.destroy();
  }

  // ── Forest tree 48×72 — Tiny Swords pine tree, larger for impact ─

  private makeTree(): void {
    // Tree1.png: 8 frames of 192×256; scale to 48 wide × 64 tall
    const spr = this.make.sprite({ x: 0, y: 0, key: 'raw-tree', frame: 0 }, false);
    spr.setOrigin(0, 0).setScale(0.25); // 192×256 × 0.25 = 48×64
    const rt = this.add.renderTexture(0, 0, 48, 64);
    rt.draw(spr, 0, 0);
    rt.saveTexture('tile-tree');
    rt.destroy();
    spr.destroy();
  }

  // ── Desert cactus 32×40 ──────────────────────────────────────────

  private makeCactus(): void {
    const gr = this.g();
    // Sand floor base
    gr.fillStyle(0xd4b060); gr.fillRect(0, 0, 32, 32);
    // Shadow
    gr.fillStyle(0x000000, 0.2); gr.fillEllipse(16, 30, 18, 5);
    // Main trunk
    gr.fillStyle(0x286a20); gr.fillRect(13, 4, 6, 28);
    gr.fillStyle(0x40882e); gr.fillRect(14, 5, 4, 26);
    gr.fillStyle(0x206018); gr.fillRect(13, 4, 2, 28);
    // Left arm
    gr.fillStyle(0x286a20); gr.fillRect(6, 10, 7, 4); gr.fillRect(6, 10, 4, 10);
    gr.fillStyle(0x40882e); gr.fillRect(7, 11, 5, 2); gr.fillRect(7, 11, 2, 8);
    // Right arm
    gr.fillStyle(0x286a20); gr.fillRect(19, 14, 7, 4); gr.fillRect(23, 14, 4, 8);
    gr.fillStyle(0x40882e); gr.fillRect(20, 15, 5, 2); gr.fillRect(25, 15, 2, 6);
    // Spine tips
    gr.fillStyle(0xd8c888);
    gr.fillRect(12, 6, 1, 1); gr.fillRect(19, 6, 1, 1);
    gr.fillRect(5, 9, 1, 1); gr.fillRect(10, 9, 1, 1);
    gr.fillRect(5, 19, 1, 1); gr.fillRect(18, 13, 1, 1);
    gr.fillRect(22, 13, 1, 1); gr.fillRect(27, 22, 1, 1);
    gr.generateTexture('tile-cactus', 32, 40);
    gr.destroy();
  }

  // ── Player sprites: 4 directions, 18×26 ──────────────────────────

  private makePlayerSprites(): void {
    this.makePlayerDown();
    this.makePlayerUp();
    this.makePlayerLeft();
    this.makePlayerRight();
  }

  private makePlayerDown(): void {
    const gr = this.g();
    // Shadow
    gr.fillStyle(0x000000, 0.3); gr.fillEllipse(9, 25, 16, 4);
    // Boots
    gr.fillStyle(0x5a3010); gr.fillRect(3, 19, 5, 5); gr.fillRect(10, 19, 5, 5);
    // Legs (tan)
    gr.fillStyle(0xd4a060); gr.fillRect(3, 14, 5, 6); gr.fillRect(10, 14, 5, 6);
    // Tunic body
    gr.fillStyle(0x2e8a2e); gr.fillRect(1, 8, 16, 8);
    // Belt
    gr.fillStyle(0x7a4a18); gr.fillRect(1, 14, 16, 2);
    // Arms
    gr.fillStyle(0x2e8a2e); gr.fillRect(0, 8, 2, 7); gr.fillRect(16, 8, 2, 7);
    // Hands
    gr.fillStyle(0xf0c878); gr.fillRect(0, 14, 2, 4); gr.fillRect(16, 14, 2, 4);
    // Neck/face
    gr.fillStyle(0xf0c878); gr.fillRect(6, 4, 6, 6);
    // Eyes
    gr.fillStyle(0x282828); gr.fillRect(6, 7, 2, 2); gr.fillRect(10, 7, 2, 2);
    gr.fillStyle(0xffffff); gr.fillRect(6, 6, 1, 1); gr.fillRect(10, 6, 1, 1);
    // Hat brim
    gr.fillStyle(0x267026); gr.fillRect(3, 4, 12, 3);
    // Hat cone
    gr.fillStyle(0x1e5c1e); gr.fillTriangle(5, 4, 13, 4, 9, -2);
    // Hat band
    gr.fillStyle(0xddaa00); gr.fillRect(3, 4, 12, 2);
    gr.generateTexture('player-down', 18, 26);
    gr.destroy();
  }

  private makePlayerUp(): void {
    const gr = this.g();
    // Shadow
    gr.fillStyle(0x000000, 0.3); gr.fillEllipse(9, 25, 16, 4);
    // Boots
    gr.fillStyle(0x5a3010); gr.fillRect(3, 19, 5, 5); gr.fillRect(10, 19, 5, 5);
    // Legs
    gr.fillStyle(0xd4a060); gr.fillRect(3, 14, 5, 6); gr.fillRect(10, 14, 5, 6);
    // Tunic body
    gr.fillStyle(0x2e8a2e); gr.fillRect(1, 8, 16, 8);
    // Belt
    gr.fillStyle(0x7a4a18); gr.fillRect(1, 14, 16, 2);
    // Arms
    gr.fillStyle(0x2e8a2e); gr.fillRect(0, 8, 2, 7); gr.fillRect(16, 8, 2, 7);
    gr.fillStyle(0xf0c878); gr.fillRect(0, 14, 2, 4); gr.fillRect(16, 14, 2, 4);
    // Back of head (hair visible)
    gr.fillStyle(0xf0c878); gr.fillRect(5, 3, 8, 6);
    gr.fillStyle(0xa05820); gr.fillRect(4, 3, 10, 3);
    // Hat (seen from back)
    gr.fillStyle(0x267026); gr.fillRect(3, 0, 12, 4);
    gr.fillStyle(0x1e5c1e); gr.fillRect(5, -2, 8, 3);
    gr.fillStyle(0xddaa00); gr.fillRect(3, 3, 12, 1);
    gr.generateTexture('player-up', 18, 26);
    gr.destroy();
  }

  private makePlayerLeft(): void {
    const gr = this.g();
    // Shadow
    gr.fillStyle(0x000000, 0.3); gr.fillEllipse(9, 25, 16, 4);
    // Boot (one visible from side)
    gr.fillStyle(0x5a3010); gr.fillRect(4, 19, 7, 5);
    // Leg
    gr.fillStyle(0xd4a060); gr.fillRect(4, 14, 7, 6);
    // Tunic
    gr.fillStyle(0x2e8a2e); gr.fillRect(2, 8, 14, 8);
    // Belt
    gr.fillStyle(0x7a4a18); gr.fillRect(2, 14, 14, 2);
    // Arm (far side — thinner)
    gr.fillStyle(0x2e8a2e); gr.fillRect(14, 9, 3, 6);
    // Hand (left arm reaching out)
    gr.fillStyle(0xf0c878); gr.fillRect(14, 14, 3, 4);
    // Head (side profile)
    gr.fillStyle(0xf0c878); gr.fillRect(3, 3, 10, 6);
    // Ear
    gr.fillStyle(0xe0b868); gr.fillRect(2, 6, 2, 3);
    // Eye (left profile — one eye)
    gr.fillStyle(0x282828); gr.fillRect(4, 6, 2, 2);
    gr.fillStyle(0xffffff); gr.fillRect(4, 5, 1, 1);
    // Hat
    gr.fillStyle(0x267026); gr.fillRect(2, 2, 12, 3);
    gr.fillStyle(0x1e5c1e); gr.fillTriangle(4, 2, 12, 2, 14, -3);
    gr.fillStyle(0xddaa00); gr.fillRect(2, 2, 12, 1);
    gr.generateTexture('player-left', 18, 26);
    gr.destroy();
  }

  private makePlayerRight(): void {
    const gr = this.g();
    // Shadow
    gr.fillStyle(0x000000, 0.3); gr.fillEllipse(9, 25, 16, 4);
    // Boot
    gr.fillStyle(0x5a3010); gr.fillRect(7, 19, 7, 5);
    // Leg
    gr.fillStyle(0xd4a060); gr.fillRect(7, 14, 7, 6);
    // Tunic
    gr.fillStyle(0x2e8a2e); gr.fillRect(2, 8, 14, 8);
    // Belt
    gr.fillStyle(0x7a4a18); gr.fillRect(2, 14, 14, 2);
    // Arm (right side)
    gr.fillStyle(0x2e8a2e); gr.fillRect(1, 9, 3, 6);
    // Hand
    gr.fillStyle(0xf0c878); gr.fillRect(1, 14, 3, 4);
    // Head (right profile)
    gr.fillStyle(0xf0c878); gr.fillRect(5, 3, 10, 6);
    // Ear
    gr.fillStyle(0xe0b868); gr.fillRect(14, 6, 2, 3);
    // Eye
    gr.fillStyle(0x282828); gr.fillRect(12, 6, 2, 2);
    gr.fillStyle(0xffffff); gr.fillRect(13, 5, 1, 1);
    // Hat
    gr.fillStyle(0x267026); gr.fillRect(4, 2, 12, 3);
    gr.fillStyle(0x1e5c1e); gr.fillTriangle(4, 2, 14, 2, 4, -3);
    gr.fillStyle(0xddaa00); gr.fillRect(4, 2, 12, 1);
    gr.generateTexture('player-right', 18, 26);
    gr.destroy();
  }

  // ── Bard sprites: 4 directions, 18×26 ───────────────────────────

  private makeBardSprites(): void {
    this.makeBardDown();
    this.makeBardUp();
    this.makeBardLeft();
    this.makeBardRight();
  }

  private makeBardDown(): void {
    const gr = this.g();
    gr.fillStyle(0x000000, 0.3); gr.fillEllipse(9, 25, 16, 4);
    // Boots (dark)
    gr.fillStyle(0x3a2008); gr.fillRect(3, 19, 5, 5); gr.fillRect(10, 19, 5, 5);
    // Legs (gold)
    gr.fillStyle(0xc89030); gr.fillRect(3, 14, 5, 6); gr.fillRect(10, 14, 5, 6);
    // Vest/tunic (red with gold trim)
    gr.fillStyle(0xaa2222); gr.fillRect(1, 8, 16, 8);
    gr.fillStyle(0xdd8800); gr.fillRect(1, 8, 16, 2); gr.fillRect(1, 14, 16, 2);
    // Belt
    gr.fillStyle(0x8a5010); gr.fillRect(1, 14, 16, 2);
    // Arms
    gr.fillStyle(0xaa2222); gr.fillRect(0, 8, 2, 7); gr.fillRect(16, 8, 2, 7);
    gr.fillStyle(0xf0c878); gr.fillRect(0, 14, 2, 4); gr.fillRect(16, 14, 2, 4);
    // Lute peek on back (gold oval)
    gr.fillStyle(0xc87020, 0.7); gr.fillEllipse(14, 12, 6, 9);
    // Face
    gr.fillStyle(0xf0c878); gr.fillRect(6, 4, 6, 6);
    // Eyes
    gr.fillStyle(0x282828); gr.fillRect(6, 7, 2, 2); gr.fillRect(10, 7, 2, 2);
    gr.fillStyle(0xffffff); gr.fillRect(6, 6, 1, 1); gr.fillRect(10, 6, 1, 1);
    // Jester/bard hat (red with yellow feather)
    gr.fillStyle(0xcc2222); gr.fillRect(3, 0, 12, 5);
    gr.fillStyle(0xaa1818); gr.fillTriangle(5, 0, 13, 0, 9, -5);
    gr.fillStyle(0xffee00); gr.fillRect(5, -3, 2, 8); // feather
    gr.fillStyle(0xffaa00); gr.fillRect(4, -2, 3, 3);
    gr.generateTexture('bard-down', 18, 26);
    gr.destroy();
  }

  private makeBardUp(): void {
    const gr = this.g();
    gr.fillStyle(0x000000, 0.3); gr.fillEllipse(9, 25, 16, 4);
    gr.fillStyle(0x3a2008); gr.fillRect(3, 19, 5, 5); gr.fillRect(10, 19, 5, 5);
    gr.fillStyle(0xc89030); gr.fillRect(3, 14, 5, 6); gr.fillRect(10, 14, 5, 6);
    gr.fillStyle(0xaa2222); gr.fillRect(1, 8, 16, 8);
    gr.fillStyle(0xdd8800); gr.fillRect(1, 8, 16, 2); gr.fillRect(1, 14, 16, 2);
    gr.fillStyle(0xaa2222); gr.fillRect(0, 8, 2, 7); gr.fillRect(16, 8, 2, 7);
    gr.fillStyle(0xf0c878); gr.fillRect(0, 14, 2, 4); gr.fillRect(16, 14, 2, 4);
    // Lute (prominent on back when facing up)
    gr.fillStyle(0x7a4010); gr.fillEllipse(13, 13, 7, 10);
    gr.fillStyle(0xc07020); gr.fillEllipse(13, 13, 5, 8);
    gr.fillStyle(0x5a3008); gr.fillRect(12, 6, 2, 7);
    // Head back
    gr.fillStyle(0xf0c878); gr.fillRect(5, 3, 8, 6);
    gr.fillStyle(0x804020); gr.fillRect(4, 3, 10, 3);
    // Hat from back
    gr.fillStyle(0xcc2222); gr.fillRect(3, 0, 12, 4);
    gr.fillStyle(0xaa1818); gr.fillRect(5, -3, 8, 4);
    gr.fillStyle(0xffee00); gr.fillRect(15, -2, 2, 7);
    gr.generateTexture('bard-up', 18, 26);
    gr.destroy();
  }

  private makeBardLeft(): void {
    const gr = this.g();
    gr.fillStyle(0x000000, 0.3); gr.fillEllipse(9, 25, 16, 4);
    gr.fillStyle(0x3a2008); gr.fillRect(4, 19, 7, 5);
    gr.fillStyle(0xc89030); gr.fillRect(4, 14, 7, 6);
    gr.fillStyle(0xaa2222); gr.fillRect(2, 8, 14, 8);
    gr.fillStyle(0xdd8800); gr.fillRect(2, 8, 14, 2); gr.fillRect(2, 14, 14, 2);
    gr.fillStyle(0xaa2222); gr.fillRect(14, 9, 3, 6);
    gr.fillStyle(0xf0c878); gr.fillRect(14, 14, 3, 4);
    // Lute hanging on left
    gr.fillStyle(0x7a4010); gr.fillEllipse(2, 13, 6, 9);
    gr.fillStyle(0xc07020); gr.fillEllipse(2, 13, 4, 7);
    // Head
    gr.fillStyle(0xf0c878); gr.fillRect(3, 3, 10, 6);
    gr.fillStyle(0xe0b868); gr.fillRect(2, 6, 2, 3);
    gr.fillStyle(0x282828); gr.fillRect(4, 6, 2, 2);
    gr.fillStyle(0xffffff); gr.fillRect(4, 5, 1, 1);
    // Hat
    gr.fillStyle(0xcc2222); gr.fillRect(2, 0, 12, 4);
    gr.fillStyle(0xaa1818); gr.fillTriangle(3, 0, 12, 0, 14, -4);
    gr.fillStyle(0xffee00); gr.fillRect(12, -3, 2, 6);
    gr.generateTexture('bard-left', 18, 26);
    gr.destroy();
  }

  private makeBardRight(): void {
    const gr = this.g();
    gr.fillStyle(0x000000, 0.3); gr.fillEllipse(9, 25, 16, 4);
    gr.fillStyle(0x3a2008); gr.fillRect(7, 19, 7, 5);
    gr.fillStyle(0xc89030); gr.fillRect(7, 14, 7, 6);
    gr.fillStyle(0xaa2222); gr.fillRect(2, 8, 14, 8);
    gr.fillStyle(0xdd8800); gr.fillRect(2, 8, 14, 2); gr.fillRect(2, 14, 14, 2);
    gr.fillStyle(0xaa2222); gr.fillRect(1, 9, 3, 6);
    gr.fillStyle(0xf0c878); gr.fillRect(1, 14, 3, 4);
    // Lute on right
    gr.fillStyle(0x7a4010); gr.fillEllipse(16, 13, 6, 9);
    gr.fillStyle(0xc07020); gr.fillEllipse(16, 13, 4, 7);
    gr.fillStyle(0x5a3008); gr.fillRect(15, 7, 2, 6);
    // Head
    gr.fillStyle(0xf0c878); gr.fillRect(5, 3, 10, 6);
    gr.fillStyle(0xe0b868); gr.fillRect(14, 6, 2, 3);
    gr.fillStyle(0x282828); gr.fillRect(12, 6, 2, 2);
    gr.fillStyle(0xffffff); gr.fillRect(13, 5, 1, 1);
    // Hat
    gr.fillStyle(0xcc2222); gr.fillRect(4, 0, 12, 4);
    gr.fillStyle(0xaa1818); gr.fillTriangle(4, 0, 14, 0, 4, -4);
    gr.fillStyle(0xffee00); gr.fillRect(4, -3, 2, 6);
    gr.generateTexture('bard-right', 18, 26);
    gr.destroy();
  }

  // ── Lute weapon 26×12 / 12×26 ────────────────────────────────────

  private makeLutes(): void {
    // Horizontal lute
    const gh = this.g();
    // Body (oval)
    gh.fillStyle(0x7a4010); gh.fillEllipse(10, 6, 18, 12);
    gh.fillStyle(0xc07020); gh.fillEllipse(9, 6, 14, 10);
    gh.fillStyle(0x5a3008, 0.5); gh.fillCircle(9, 6, 4); // sound hole
    gh.fillStyle(0x3a2006); gh.fillCircle(9, 6, 3);
    // Neck/fretboard
    gh.fillStyle(0x5a3008); gh.fillRect(18, 3, 8, 6);
    gh.fillStyle(0x7a4818); gh.fillRect(19, 4, 6, 4);
    gh.lineStyle(1, 0xc09040); gh.lineBetween(20, 4, 20, 8);
    gh.lineBetween(22, 4, 22, 8); gh.lineBetween(24, 4, 24, 8);
    gh.generateTexture('lute-h', 26, 12);
    gh.destroy();

    // Vertical lute
    const gv = this.g();
    gv.fillStyle(0x7a4010); gv.fillEllipse(6, 10, 12, 18);
    gv.fillStyle(0xc07020); gv.fillEllipse(6, 10, 10, 14);
    gv.fillStyle(0x3a2006); gv.fillCircle(6, 9, 3);
    gv.fillStyle(0x5a3008); gv.fillRect(3, 18, 6, 8);
    gv.fillStyle(0x7a4818); gv.fillRect(4, 19, 4, 6);
    gv.lineStyle(1, 0xc09040);
    gv.lineBetween(4, 20, 8, 20); gv.lineBetween(4, 22, 8, 22); gv.lineBetween(4, 24, 8, 24);
    gv.generateTexture('lute-v', 12, 26);
    gv.destroy();
  }

  // ── Cleric sprites: 4 directions, 18×26 ─────────────────────────

  private makeClericSprites(): void {
    this.makeClericDown();
    this.makeClericUp();
    this.makeClericLeft();
    this.makeClericRight();
  }

  private makeClericDown(): void {
    const gr = this.g();
    gr.fillStyle(0x000000, 0.3); gr.fillEllipse(9, 25, 16, 4);
    // Sandals
    gr.fillStyle(0x7a4818); gr.fillRect(3, 22, 5, 3); gr.fillRect(10, 22, 5, 3);
    // Robe body (long, cream white)
    gr.fillStyle(0xf0e8d0); gr.fillRect(2, 10, 14, 14);
    gr.fillStyle(0xe0d8c0); gr.fillRect(2, 20, 14, 4); // lower shading
    // Robe arms
    gr.fillStyle(0xf0e8d0); gr.fillRect(0, 10, 3, 12); gr.fillRect(15, 10, 3, 12);
    gr.fillStyle(0xf0c878); gr.fillRect(0, 19, 3, 4); gr.fillRect(15, 19, 3, 4);
    // Gold trim at hem
    gr.fillStyle(0xddaa33); gr.fillRect(2, 22, 14, 2);
    // Cross on chest (gold)
    gr.fillStyle(0xddaa33);
    gr.fillRect(8, 12, 2, 7);
    gr.fillRect(6, 15, 6, 2);
    // Neck + face
    gr.fillStyle(0xf0c878); gr.fillRect(6, 7, 6, 3);
    gr.fillStyle(0xf0c878); gr.fillRect(5, 2, 8, 6);
    // Eyes
    gr.fillStyle(0x282828); gr.fillRect(6, 4, 2, 2); gr.fillRect(10, 4, 2, 2);
    gr.fillStyle(0xffffff); gr.fillRect(6, 3, 1, 1); gr.fillRect(10, 3, 1, 1);
    // Hood (white, slightly different shade)
    gr.fillStyle(0xf8f0e0); gr.fillRect(3, 0, 12, 5);
    gr.fillStyle(0xe8e0cc); gr.fillRect(2, 4, 14, 3);
    gr.fillStyle(0xddaa33); gr.fillRect(2, 6, 14, 1);
    gr.generateTexture('cleric-down', 18, 26);
    gr.destroy();
  }

  private makeClericUp(): void {
    const gr = this.g();
    gr.fillStyle(0x000000, 0.3); gr.fillEllipse(9, 25, 16, 4);
    gr.fillStyle(0x7a4818); gr.fillRect(3, 22, 5, 3); gr.fillRect(10, 22, 5, 3);
    // Robe back
    gr.fillStyle(0xf0e8d0); gr.fillRect(2, 10, 14, 14);
    gr.fillStyle(0xe0d8c0); gr.fillRect(2, 20, 14, 4);
    gr.fillStyle(0xf0e8d0); gr.fillRect(0, 10, 3, 12); gr.fillRect(15, 10, 3, 12);
    gr.fillStyle(0xf0c878); gr.fillRect(0, 19, 3, 4); gr.fillRect(15, 19, 3, 4);
    gr.fillStyle(0xddaa33); gr.fillRect(2, 22, 14, 2);
    // Back of head / hair visible under hood
    gr.fillStyle(0xf0c878); gr.fillRect(5, 3, 8, 6);
    gr.fillStyle(0x905020); gr.fillRect(4, 3, 10, 3);
    // Hood back
    gr.fillStyle(0xf8f0e0); gr.fillRect(3, 0, 12, 4);
    gr.fillStyle(0xe8e0cc); gr.fillRect(2, 3, 14, 3);
    gr.fillStyle(0xddaa33); gr.fillRect(2, 5, 14, 1);
    gr.generateTexture('cleric-up', 18, 26);
    gr.destroy();
  }

  private makeClericLeft(): void {
    const gr = this.g();
    gr.fillStyle(0x000000, 0.3); gr.fillEllipse(9, 25, 16, 4);
    gr.fillStyle(0x7a4818); gr.fillRect(4, 22, 7, 3);
    // Robe side
    gr.fillStyle(0xf0e8d0); gr.fillRect(2, 10, 14, 14);
    gr.fillStyle(0xe0d8c0); gr.fillRect(2, 20, 14, 4);
    gr.fillStyle(0xf0e8d0); gr.fillRect(14, 11, 3, 10);
    gr.fillStyle(0xf0c878); gr.fillRect(14, 19, 3, 4);
    gr.fillStyle(0xddaa33); gr.fillRect(2, 22, 14, 2);
    // Cross (side, partially visible)
    gr.fillStyle(0xddaa33); gr.fillRect(8, 12, 2, 7); gr.fillRect(6, 15, 4, 2);
    // Head side profile
    gr.fillStyle(0xf0c878); gr.fillRect(3, 2, 10, 6);
    gr.fillStyle(0xe0b868); gr.fillRect(2, 5, 2, 3);
    gr.fillStyle(0x282828); gr.fillRect(4, 5, 2, 2);
    gr.fillStyle(0xffffff); gr.fillRect(4, 4, 1, 1);
    // Hood side
    gr.fillStyle(0xf8f0e0); gr.fillRect(2, 0, 12, 4);
    gr.fillStyle(0xe8e0cc); gr.fillRect(1, 3, 13, 3);
    gr.fillStyle(0xddaa33); gr.fillRect(1, 5, 13, 1);
    gr.generateTexture('cleric-left', 18, 26);
    gr.destroy();
  }

  private makeClericRight(): void {
    const gr = this.g();
    gr.fillStyle(0x000000, 0.3); gr.fillEllipse(9, 25, 16, 4);
    gr.fillStyle(0x7a4818); gr.fillRect(7, 22, 7, 3);
    gr.fillStyle(0xf0e8d0); gr.fillRect(2, 10, 14, 14);
    gr.fillStyle(0xe0d8c0); gr.fillRect(2, 20, 14, 4);
    gr.fillStyle(0xf0e8d0); gr.fillRect(1, 11, 3, 10);
    gr.fillStyle(0xf0c878); gr.fillRect(1, 19, 3, 4);
    gr.fillStyle(0xddaa33); gr.fillRect(2, 22, 14, 2);
    gr.fillStyle(0xddaa33); gr.fillRect(8, 12, 2, 7); gr.fillRect(8, 15, 4, 2);
    // Head right profile
    gr.fillStyle(0xf0c878); gr.fillRect(5, 2, 10, 6);
    gr.fillStyle(0xe0b868); gr.fillRect(14, 5, 2, 3);
    gr.fillStyle(0x282828); gr.fillRect(12, 5, 2, 2);
    gr.fillStyle(0xffffff); gr.fillRect(13, 4, 1, 1);
    // Hood right
    gr.fillStyle(0xf8f0e0); gr.fillRect(4, 0, 12, 4);
    gr.fillStyle(0xe8e0cc); gr.fillRect(4, 3, 13, 3);
    gr.fillStyle(0xddaa33); gr.fillRect(4, 5, 13, 1);
    gr.generateTexture('cleric-right', 18, 26);
    gr.destroy();
  }

  // ── Staff weapon 26×12 / 12×26 ────────────────────────────────────

  private makeStaff(): void {
    // Horizontal staff (orb tip on right)
    const gh = this.g();
    gh.fillStyle(0x6a4018); gh.fillRect(0, 4, 21, 4);
    gh.fillStyle(0x9a6030); gh.fillRect(1, 5, 19, 2);
    // Binding wrap
    gh.fillStyle(0xddaa33); gh.fillRect(17, 3, 3, 6);
    gh.fillStyle(0xccaa55); gh.fillRect(17, 4, 3, 4);
    // Orb
    gh.fillStyle(0x1133bb, 0.4); gh.fillCircle(24, 6, 5);
    gh.fillStyle(0x4477ee); gh.fillCircle(24, 6, 4);
    gh.fillStyle(0x88bbff); gh.fillCircle(24, 6, 2);
    gh.fillStyle(0xffffff); gh.fillCircle(23, 5, 1);
    gh.generateTexture('staff-h', 26, 12);
    gh.destroy();

    // Vertical staff (orb tip at bottom)
    const gv = this.g();
    gv.fillStyle(0x6a4018); gv.fillRect(4, 0, 4, 21);
    gv.fillStyle(0x9a6030); gv.fillRect(5, 1, 2, 19);
    gv.fillStyle(0xddaa33); gv.fillRect(3, 17, 6, 3);
    gv.fillStyle(0xccaa55); gv.fillRect(4, 17, 4, 3);
    // Orb
    gv.fillStyle(0x1133bb, 0.4); gv.fillCircle(6, 24, 5);
    gv.fillStyle(0x4477ee); gv.fillCircle(6, 24, 4);
    gv.fillStyle(0x88bbff); gv.fillCircle(6, 24, 2);
    gv.fillStyle(0xffffff); gv.fillCircle(5, 23, 1);
    gv.generateTexture('staff-v', 12, 26);
    gv.destroy();
  }

  // ── Slime 28×22 ───────────────────────────────────────────────────

  private makeSlime(): void {
    const gr = this.g();
    // Shadow
    gr.fillStyle(0x000000, 0.25); gr.fillEllipse(14, 20, 24, 6);
    // Body
    gr.fillStyle(0x22cc44); gr.fillEllipse(14, 13, 26, 20);
    // Highlight sheen
    gr.fillStyle(0x55ee77, 0.6); gr.fillEllipse(9, 8, 10, 7);
    // Eyes
    gr.fillStyle(0xffffff); gr.fillEllipse(9, 13, 7, 9);
    gr.fillStyle(0xffffff); gr.fillEllipse(19, 13, 7, 9);
    gr.fillStyle(0x111111); gr.fillEllipse(10, 14, 4, 5);
    gr.fillStyle(0x111111); gr.fillEllipse(20, 14, 4, 5);
    gr.fillStyle(0x44ff88); gr.fillRect(10, 13, 1, 1); gr.fillRect(20, 13, 1, 1);
    gr.generateTexture('slime', 28, 22);
    gr.destroy();
  }

  // ── Skeleton 18×26 ────────────────────────────────────────────────

  private makeSkeleton(): void {
    const gr = this.g();
    // Shadow
    gr.fillStyle(0x000000, 0.2); gr.fillEllipse(9, 25, 14, 4);
    // Legs
    gr.fillStyle(0xe8e0c0); gr.fillRect(3, 18, 4, 6); gr.fillRect(11, 18, 4, 6);
    // Pelvis
    gr.fillStyle(0xd8d0b0); gr.fillRect(2, 15, 14, 4);
    // Ribcage / torso spine
    gr.fillStyle(0xe8e0c0); gr.fillRect(6, 8, 6, 8);
    gr.fillStyle(0xd0c8a8);
    gr.fillRect(2, 9, 4, 2); gr.fillRect(12, 9, 4, 2);
    gr.fillRect(2, 12, 4, 2); gr.fillRect(12, 12, 4, 2);
    // Arms
    gr.fillStyle(0xe8e0c0); gr.fillRect(0, 8, 3, 9); gr.fillRect(15, 8, 3, 9);
    // Skull
    gr.fillStyle(0xf0e8cc); gr.fillEllipse(9, 5, 14, 12);
    // Eye sockets
    gr.fillStyle(0x111111); gr.fillEllipse(6, 4, 4, 5);
    gr.fillStyle(0x111111); gr.fillEllipse(12, 4, 4, 5);
    gr.fillStyle(0xff3333, 0.8); gr.fillCircle(6, 4, 1); gr.fillCircle(12, 4, 1);
    // Teeth
    gr.fillStyle(0xe0d8b0); gr.fillRect(6, 9, 6, 2);
    gr.fillStyle(0x111111); gr.fillRect(7, 9, 1, 2); gr.fillRect(9, 9, 1, 2); gr.fillRect(11, 9, 1, 2);
    gr.generateTexture('skeleton', 18, 26);
    gr.destroy();
  }

  // ── Wizard 18×28 ─────────────────────────────────────────────────

  private makeWizard(): void {
    const gr = this.g();
    // Shadow
    gr.fillStyle(0x000000, 0.2); gr.fillEllipse(9, 27, 16, 4);
    // Robe base
    gr.fillStyle(0x5500bb); gr.fillTriangle(2, 27, 16, 27, 9, 12);
    gr.fillStyle(0x6600dd); gr.fillRect(3, 12, 12, 16);
    // Robe stars
    gr.fillStyle(0xffdd00); gr.fillRect(5, 15, 2, 2); gr.fillRect(11, 20, 2, 2);
    // Arms
    gr.fillStyle(0x5500bb); gr.fillRect(0, 12, 4, 12); gr.fillRect(14, 12, 4, 12);
    // Glowing hands
    gr.fillStyle(0x8844ff); gr.fillCircle(2, 24, 4); gr.fillCircle(16, 24, 4);
    gr.fillStyle(0xddaaff, 0.5); gr.fillCircle(2, 24, 2); gr.fillCircle(16, 24, 2);
    // Head
    gr.fillStyle(0xddcc99); gr.fillEllipse(9, 8, 12, 12);
    // Eyes glow
    gr.fillStyle(0xaa55ff); gr.fillEllipse(6, 7, 4, 4); gr.fillEllipse(12, 7, 4, 4);
    gr.fillStyle(0xffffff); gr.fillEllipse(6, 7, 2, 2); gr.fillEllipse(12, 7, 2, 2);
    // Hat
    gr.fillStyle(0x3a0088); gr.fillTriangle(3, 3, 15, 3, 9, -6);
    gr.fillStyle(0x4400aa); gr.fillRect(1, 2, 16, 4);
    gr.fillStyle(0xffdd00); gr.fillRect(1, 2, 16, 1);
    gr.fillStyle(0xffee44); gr.fillCircle(9, -1, 2);
    gr.generateTexture('wizard', 18, 28);
    gr.destroy();
  }

  // ── Mind Devourer Boss 40×40 ─────────────────────────────────────

  private makeMindDevourer(): void {
    const gr = this.g();

    // Shadow / dark aura
    gr.fillStyle(0x220044, 0.3); gr.fillEllipse(20, 26, 44, 22);
    // Main body (dark void)
    gr.fillStyle(0x0e0020); gr.fillEllipse(20, 20, 38, 33);
    // Brain mass — left lobe
    gr.fillStyle(0x6a1058); gr.fillEllipse(13, 14, 18, 13);
    // Brain mass — right lobe
    gr.fillStyle(0x6a1058); gr.fillEllipse(27, 14, 18, 13);
    // Brain surface folds
    gr.fillStyle(0x8a1870);
    gr.fillEllipse(10, 11, 9, 6); gr.fillEllipse(17, 9, 11, 7);
    gr.fillEllipse(23, 9, 11, 7); gr.fillEllipse(30, 11, 9, 6);
    gr.fillEllipse(20, 7, 9, 6); // top
    // Dark center void
    gr.fillStyle(0x060010); gr.fillEllipse(20, 18, 18, 15);
    // Central eye — large orange/red
    gr.fillStyle(0xdd2200); gr.fillEllipse(20, 18, 14, 11);
    gr.fillStyle(0xff5500); gr.fillEllipse(20, 18, 9,  7);
    gr.fillStyle(0xffcc00); gr.fillEllipse(20, 18, 5,  4);
    gr.fillStyle(0xffffff); gr.fillEllipse(18, 16, 2,  2);
    // Left small eye
    gr.fillStyle(0x7700cc); gr.fillEllipse(9, 22, 8, 6);
    gr.fillStyle(0xaa44ff); gr.fillEllipse(9, 22, 4, 3);
    gr.fillStyle(0xffffff); gr.fillEllipse(8, 21, 1, 1);
    // Right small eye
    gr.fillStyle(0x7700cc); gr.fillEllipse(31, 22, 8, 6);
    gr.fillStyle(0xaa44ff); gr.fillEllipse(31, 22, 4, 3);
    gr.fillStyle(0xffffff); gr.fillEllipse(32, 21, 1, 1);
    // Lower left mini eye
    gr.fillStyle(0x6600aa); gr.fillEllipse(14, 28, 5, 4);
    gr.fillStyle(0x9933dd); gr.fillEllipse(14, 28, 2, 2);
    // Lower right mini eye
    gr.fillStyle(0x6600aa); gr.fillEllipse(26, 28, 5, 4);
    gr.fillStyle(0x9933dd); gr.fillEllipse(26, 28, 2, 2);
    // Tentacles (bottom)
    gr.fillStyle(0x1a0030);
    gr.fillTriangle(11, 29, 8,  40, 14, 38);
    gr.fillTriangle(17, 31, 14, 40, 20, 40);
    gr.fillTriangle(23, 31, 20, 40, 26, 40);
    gr.fillTriangle(30, 29, 26, 38, 32, 40);
    // Tentacles (sides)
    gr.fillTriangle(3,  19, 0,  10, 5,  17);
    gr.fillTriangle(37, 19, 35, 11, 40, 17);
    // Tentacle tips
    gr.fillStyle(0x08000e);
    gr.fillTriangle(9,  36, 7,  40, 13, 40);
    gr.fillTriangle(15, 38, 13, 40, 19, 40);
    gr.fillTriangle(21, 38, 19, 40, 25, 40);
    gr.fillTriangle(28, 36, 26, 40, 32, 40);

    gr.generateTexture('mind-devourer', 40, 40);
    gr.destroy();
  }

  // ── Projectile 14×14 ─────────────────────────────────────────────

  private makeProjectile(): void {
    const gr = this.g();
    gr.fillStyle(0x6633ff); gr.fillCircle(7, 7, 7);
    gr.fillStyle(0x9966ff); gr.fillCircle(7, 7, 5);
    gr.fillStyle(0xccaaff); gr.fillCircle(7, 7, 3);
    gr.fillStyle(0xffffff); gr.fillCircle(6, 6, 2);
    gr.generateTexture('projectile', 14, 14);
    gr.destroy();
  }

  // ── Boss psychic orb 18×18 ───────────────────────────────────────

  private makeBossProjectile(): void {
    const gr = this.g();
    gr.fillStyle(0x330055, 0.3); gr.fillCircle(9, 9, 9);
    gr.fillStyle(0x8800cc);      gr.fillCircle(9, 9, 7);
    gr.fillStyle(0xcc44ff);      gr.fillCircle(9, 9, 4);
    gr.fillStyle(0xff88ff);      gr.fillCircle(9, 9, 2);
    gr.fillStyle(0xffffff);      gr.fillCircle(8, 8, 1);
    gr.generateTexture('boss-projectile', 18, 18);
    gr.destroy();
  }

  // ── Sword textures ────────────────────────────────────────────────

  private makeSwords(): void {
    // Horizontal
    const gh = this.g();
    gh.fillStyle(0xccccdd); gh.fillRect(0, 3, 22, 5);
    gh.fillStyle(0xeeeeff); gh.fillRect(0, 4, 22, 2);
    gh.fillStyle(0x887730); gh.fillRect(18, 0, 6, 11);
    gh.fillStyle(0x664422); gh.fillRect(20, -1, 4, 13);
    gh.generateTexture('sword-h', 26, 12);
    gh.destroy();

    // Vertical
    const gv = this.g();
    gv.fillStyle(0xccccdd); gv.fillRect(3, 0, 5, 22);
    gv.fillStyle(0xeeeeff); gv.fillRect(4, 0, 2, 22);
    gv.fillStyle(0x887730); gv.fillRect(0, 18, 11, 6);
    gv.fillStyle(0x664422); gv.fillRect(-1, 20, 13, 4);
    gv.generateTexture('sword-v', 12, 26);
    gv.destroy();

    // Diagonal 1 (up-right)
    const gd1 = this.g();
    gd1.lineStyle(5, 0xccccdd); gd1.lineBetween(0, 22, 22, 0);
    gd1.lineStyle(2, 0xeeeeff); gd1.lineBetween(2, 20, 20, 2);
    gd1.fillStyle(0x887730); gd1.fillRect(14, 0, 8, 8);
    gd1.generateTexture('sword-d1', 26, 26);
    gd1.destroy();

    // Diagonal 2 (down-right)
    const gd2 = this.g();
    gd2.lineStyle(5, 0xccccdd); gd2.lineBetween(0, 0, 22, 22);
    gd2.lineStyle(2, 0xeeeeff); gd2.lineBetween(2, 2, 20, 20);
    gd2.fillStyle(0x887730); gd2.fillRect(14, 14, 8, 8);
    gd2.generateTexture('sword-d2', 26, 26);
    gd2.destroy();
  }

  // ── Hearts ────────────────────────────────────────────────────────

  private makeHearts(): void {
    const drawHeart = (gr: Phaser.GameObjects.Graphics, color: number) => {
      gr.fillStyle(color);
      gr.fillRect(2, 4, 4, 4); gr.fillRect(10, 4, 4, 4);
      gr.fillRect(0, 6, 16, 6); gr.fillRect(2, 12, 12, 4);
      gr.fillRect(4, 14, 8, 2); gr.fillRect(6, 15, 4, 1);
    };
    const gf = this.g(); drawHeart(gf, 0xdd2222);
    gf.fillStyle(0xff5555); gf.fillRect(3, 5, 2, 2);
    gf.generateTexture('heart-full', 16, 16); gf.destroy();

    const ge = this.g(); drawHeart(ge, 0x553333);
    ge.generateTexture('heart-empty', 16, 16); ge.destroy();
  }

  // ── Blank particle ────────────────────────────────────────────────

  private makeBlank(): void {
    const gr = this.g();
    gr.fillStyle(0xffffff, 1); gr.fillRect(0, 0, 4, 4);
    gr.generateTexture('blank', 4, 4);
    gr.destroy();
  }

  // ── Rain drop 2×8 ────────────────────────────────────────────────────

  private makeRainDrop(): void {
    const gr = this.g();
    gr.fillStyle(0xffffff, 1);
    gr.fillRect(0, 0, 2, 8);
    gr.generateTexture('rain-drop', 2, 8);
    gr.destroy();
  }

  // ── Snow flake 3×3 (cross shape) ──────────────────────────────────────

  private makeSnowFlake(): void {
    const gr = this.g();
    gr.fillStyle(0xffffff, 1);
    gr.fillRect(1, 0, 1, 3);
    gr.fillRect(0, 1, 3, 1);
    gr.generateTexture('snow-flake', 3, 3);
    gr.destroy();
  }

  // ── Castle wall 32×40 — Tiny Swords dark cliff with crenellations ─

  private makeCastleWall(): void {
    const gr = this.g();
    // Top face — dark stone (castle interior)
    gr.fillStyle(0x4a5060); gr.fillRect(0, 0, 32, 32);
    gr.fillStyle(0x5a6070); gr.fillRect(1, 1, 6, 2); gr.fillRect(11, 1, 9, 2); gr.fillRect(24, 1, 5, 2);
    gr.fillRect(4, 12, 8, 2); gr.fillRect(17, 12, 11, 2);
    gr.fillStyle(0x3a404e);
    gr.fillRect(0, 10, 32, 1); gr.fillRect(0, 22, 32, 1);
    gr.fillRect(10, 0, 1, 10); gr.fillRect(23, 0, 1, 10);
    // Crenellations
    gr.fillStyle(0x3a404e); gr.fillRect(0, 0, 7, 6); gr.fillRect(12, 0, 8, 6); gr.fillRect(25, 0, 7, 6);
    gr.fillStyle(0x5a6070); gr.fillRect(7, 0, 5, 7); gr.fillRect(20, 0, 5, 7);
    // Shadow at edge
    gr.fillStyle(0x1a2028); gr.fillRect(0, 30, 32, 2);
    // South face — dark Tiny Swords stone
    gr.fillStyle(0x506070); gr.fillRect(0, 32, 32, 8);
    gr.fillStyle(0x6a8090); gr.fillRect(0, 32, 32, 2);
    gr.fillStyle(0x304050); gr.fillRect(0, 37, 32, 3);
    gr.fillStyle(0x405060);
    gr.fillRect(0, 34, 9, 1); gr.fillRect(14, 34, 12, 1);
    gr.fillRect(10, 32, 1, 8); gr.fillRect(23, 32, 1, 8);
    gr.generateTexture('tile-castle-wall', 32, 40);
    gr.destroy();
  }

  // ── Dark realm tile variants ──────────────────────────────────────────

  private makeDarkWall(): void {
    const gr = this.g();
    // Top face — dark purple-gray stone
    gr.fillStyle(0x2a1e32); gr.fillRect(0, 0, 32, 32);
    gr.fillStyle(0x3a2a42);
    gr.fillRect(2, 4, 6, 3); gr.fillRect(16, 3, 7, 3); gr.fillRect(22, 19, 6, 4);
    // Cracks
    gr.fillStyle(0x140c1a);
    gr.fillRect(5, 8, 1, 10); gr.fillRect(18, 5, 1, 14);
    gr.fillRect(10, 18, 8, 1); gr.fillRect(2, 25, 6, 1);
    // Shadow rim
    gr.fillStyle(0x0e0814); gr.fillRect(0, 30, 32, 2);
    // South face — deep purple-black cliff
    gr.fillStyle(0x261830); gr.fillRect(0, 32, 32, 8);
    gr.fillStyle(0x382248); gr.fillRect(0, 32, 32, 2);
    gr.fillStyle(0x140c1e); gr.fillRect(0, 37, 32, 3);
    gr.fillStyle(0x2a1a3a);
    gr.fillRect(0, 34, 9, 1); gr.fillRect(14, 34, 12, 1);
    gr.fillRect(9, 32, 1, 8); gr.fillRect(22, 32, 1, 8);
    gr.generateTexture('tile-wall-dark', 32, 40);
    gr.destroy();
  }

  private makeDarkHouseWall(): void {
    const gr = this.g();
    // Top face — crumbled dark stone
    gr.fillStyle(0x2e1e28); gr.fillRect(0, 0, 32, 32);
    // Remaining brick fragments
    gr.fillStyle(0x3e2a38);
    gr.fillRect(0, 6, 10, 4); gr.fillRect(14, 2, 8, 5);
    gr.fillRect(24, 10, 7, 4); gr.fillRect(2, 18, 9, 4);
    gr.fillRect(16, 20, 10, 4); gr.fillRect(4, 27, 7, 3);
    // Mortar cracks (dark)
    gr.fillStyle(0x12080e);
    gr.fillRect(0, 10, 32, 1); gr.fillRect(0, 22, 32, 1);
    gr.fillRect(10, 0, 1, 10); gr.fillRect(22, 0, 1, 10);
    gr.fillRect(6, 11, 1, 11); gr.fillRect(20, 11, 1, 11);
    // Holes (complete breaks in the wall)
    gr.fillStyle(0x060408);
    gr.fillRect(11, 3, 3, 7); gr.fillRect(25, 13, 5, 8); gr.fillRect(0, 23, 4, 8);
    // South face — near-black ruin
    gr.fillStyle(0x180e18); gr.fillRect(0, 32, 32, 8);
    gr.fillStyle(0x2a1828); gr.fillRect(0, 32, 32, 2);
    gr.fillStyle(0x100808); gr.fillRect(10, 33, 1, 7); gr.fillRect(22, 33, 1, 7);
    gr.generateTexture('tile-house-wall-dark', 32, 40);
    gr.destroy();
  }

  private makeDarkBush(): void {
    const gr = this.g();
    // Dark dead ground
    gr.fillStyle(0x1a1210); gr.fillRect(0, 0, 32, 32);
    // Withered twigs
    gr.fillStyle(0x2e1e14);
    gr.fillRect(8, 12, 16, 3); gr.fillRect(13, 6, 3, 18);
    gr.fillRect(6, 16, 4, 2); gr.fillRect(22, 14, 4, 2);
    gr.fillRect(9, 8, 4, 2); gr.fillRect(19, 8, 4, 2);
    gr.fillStyle(0x221610);
    gr.fillRect(10, 13, 12, 1); gr.fillRect(14, 7, 1, 11);
    // Dead leaves (sparse purple-gray dots)
    gr.fillStyle(0x3a2844, 0.7);
    gr.fillRect(7, 10, 3, 3); gr.fillRect(22, 12, 3, 3);
    gr.fillRect(14, 6, 3, 3); gr.fillRect(18, 18, 3, 3);
    gr.fillRect(9, 20, 3, 3); gr.fillRect(23, 7, 2, 2);
    gr.generateTexture('tile-bush-dark', 32, 32);
    gr.destroy();
  }

  private makeDarkPath(): void {
    const gr = this.g();
    // Very dark earth
    gr.fillStyle(0x1a1008); gr.fillRect(0, 0, 32, 32);
    // Dark patches
    gr.fillStyle(0x241808);
    gr.fillRect(2, 2, 10, 5); gr.fillRect(18, 6, 8, 4);
    gr.fillRect(5, 14, 12, 4); gr.fillRect(20, 18, 8, 5);
    gr.fillRect(2, 24, 9, 5); gr.fillRect(14, 26, 10, 4);
    // Cracks (near-black lines)
    gr.fillStyle(0x060402);
    gr.fillRect(0, 7, 32, 1); gr.fillRect(0, 19, 32, 1);
    gr.fillRect(7, 0, 1, 7); gr.fillRect(20, 7, 1, 12); gr.fillRect(13, 19, 1, 13);
    gr.fillRect(25, 0, 1, 19);
    // Purple mist speckles
    gr.fillStyle(0x2a1a38, 0.6);
    gr.fillRect(4, 4, 2, 2); gr.fillRect(22, 2, 2, 2);
    gr.fillRect(10, 15, 2, 2); gr.fillRect(26, 13, 2, 2);
    gr.fillRect(6, 27, 2, 2); gr.fillRect(18, 25, 2, 2);
    gr.generateTexture('tile-path-dark', 32, 32);
    gr.destroy();
  }

  // ── Villager NPC sprites — 18×26 ──────────────────────────────────────

  private makeVillagerSprites(): void {
    // Happy: colorful peasant (blue tunic, dark pants)
    const gh = this.g();
    gh.fillStyle(0x000000, 0.25); gh.fillEllipse(9, 25, 14, 4); // shadow
    gh.fillStyle(0x5a3820); gh.fillRect(3, 20, 5, 5); gh.fillRect(10, 20, 5, 5); // boots
    gh.fillStyle(0x6a4a2a); gh.fillRect(3, 14, 5, 7); gh.fillRect(10, 14, 5, 7); // pants
    gh.fillStyle(0x2a5a9a); gh.fillRect(1, 8, 16, 8); // tunic
    gh.fillStyle(0x1a4a8a); gh.fillRect(1, 13, 16, 2); // belt line
    gh.fillStyle(0x2a5a9a); gh.fillRect(0, 8, 2, 7); gh.fillRect(16, 8, 2, 7); // arms
    gh.fillStyle(0xf0c878); gh.fillRect(0, 14, 2, 4); gh.fillRect(16, 14, 2, 4); // hands
    gh.fillStyle(0xf0c878); gh.fillRect(6, 3, 6, 6); // face
    gh.fillStyle(0x282828); gh.fillRect(7, 6, 1, 1); gh.fillRect(10, 6, 1, 1); // eyes
    gh.fillStyle(0x884422); gh.fillRect(5, 0, 8, 4); // hair
    gh.fillStyle(0x9a5530); gh.fillRect(5, 0, 8, 2);
    gh.generateTexture('npc-happy', 18, 26);
    gh.destroy();

    // Desperate: same person, desaturated / slumped
    const gd = this.g();
    gd.fillStyle(0x000000, 0.3); gd.fillEllipse(9, 25, 14, 4);
    gd.fillStyle(0x3a2818); gd.fillRect(3, 20, 5, 5); gd.fillRect(10, 20, 5, 5);
    gd.fillStyle(0x484038); gd.fillRect(3, 14, 5, 7); gd.fillRect(10, 14, 5, 7);
    gd.fillStyle(0x384458); gd.fillRect(1, 8, 16, 8); // desaturated blue-gray
    gd.fillStyle(0x283448); gd.fillRect(1, 13, 16, 2);
    gd.fillStyle(0x384458); gd.fillRect(0, 8, 2, 7); gd.fillRect(16, 8, 2, 7);
    gd.fillStyle(0xb09060); gd.fillRect(0, 14, 2, 4); gd.fillRect(16, 14, 2, 4);
    gd.fillStyle(0xb09060); gd.fillRect(6, 4, 6, 6); // face, shifted down (slumped)
    gd.fillStyle(0x181818); gd.fillRect(7, 7, 1, 1); gd.fillRect(10, 7, 1, 1); // dim eyes
    gd.fillStyle(0x482818); gd.fillRect(5, 0, 8, 5); // hair, dull
    // Tear mark
    gd.fillStyle(0x6688aa, 0.8); gd.fillRect(7, 8, 1, 3);
    gd.generateTexture('npc-desperate', 18, 26);
    gd.destroy();

    // Aggro: corrupted, dark clothes, glowing red eyes
    const ga = this.g();
    ga.fillStyle(0x000000, 0.4); ga.fillEllipse(9, 25, 14, 4);
    ga.fillStyle(0x1a0a0a); ga.fillRect(3, 20, 5, 5); ga.fillRect(10, 20, 5, 5);
    ga.fillStyle(0x120808); ga.fillRect(3, 14, 5, 7); ga.fillRect(10, 14, 5, 7);
    ga.fillStyle(0x2a1020); ga.fillRect(1, 8, 16, 8); // dark corrupted tunic
    ga.fillStyle(0x1a0814); ga.fillRect(1, 13, 16, 2);
    ga.fillStyle(0x2a1020); ga.fillRect(0, 8, 2, 7); ga.fillRect(16, 8, 2, 7);
    ga.fillStyle(0x8a6040); ga.fillRect(0, 14, 2, 4); ga.fillRect(16, 14, 2, 4);
    // Dark aura glow
    ga.fillStyle(0x440022, 0.4); ga.fillEllipse(9, 12, 20, 22);
    ga.fillStyle(0x6a3840); ga.fillRect(6, 3, 6, 6); // face
    // Glowing red eyes
    ga.fillStyle(0xff0000); ga.fillRect(7, 5, 2, 2); ga.fillRect(10, 5, 2, 2);
    ga.fillStyle(0xff6666); ga.fillRect(7, 5, 1, 1); ga.fillRect(10, 5, 1, 1);
    ga.fillStyle(0x1a0814); ga.fillRect(5, 0, 8, 4); // dark hair
    ga.generateTexture('npc-aggro', 18, 26);
    ga.destroy();
  }

  // ── Castle door floor 32×32 (shadowed threshold) ─────────────────────

  private makeCastleDoor(): void {
    const gr = this.g();
    // Dark stone floor
    gr.fillStyle(0x2c2838); gr.fillRect(0, 0, 32, 32);
    // Center worn-path strip
    gr.fillStyle(0x3a3448);
    gr.fillRect(9, 0, 14, 32);
    // Shadow edges from arch overhead
    gr.fillStyle(0x16121e, 0.8);
    gr.fillRect(0, 0, 32, 5); gr.fillRect(0, 27, 32, 5);
    // Portcullis bar shadows (subtle)
    gr.fillStyle(0x100e1a, 0.6);
    gr.fillRect(11, 0, 3, 32); gr.fillRect(18, 0, 3, 32);
    gr.fillRect(0, 9, 32, 2); gr.fillRect(0, 18, 32, 2);
    // Iron ring bolt
    gr.fillStyle(0x605868); gr.fillRect(14, 15, 4, 2);
    gr.generateTexture('tile-castle-door', 32, 32);
    gr.destroy();
  }
}
