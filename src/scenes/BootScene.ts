import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

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
    this.scene.start('CharacterSelectScene');
  }

  private g(): Phaser.GameObjects.Graphics {
    return this.make.graphics({} as Phaser.Types.GameObjects.Graphics.Options);
  }

  // ── Grass floor tile 32×32 ────────────────────────────────────────

  private makeFloor(): void {
    const gr = this.g();

    // Base green
    gr.fillStyle(0x4a9c38); gr.fillRect(0, 0, 32, 32);

    // Lighter patches for texture variation
    gr.fillStyle(0x5aac48);
    gr.fillRect(2, 2, 8, 6); gr.fillRect(18, 4, 6, 5);
    gr.fillRect(12, 14, 7, 5); gr.fillRect(4, 20, 5, 6);
    gr.fillRect(22, 18, 7, 8); gr.fillRect(10, 26, 9, 4);

    // Darker accent flecks
    gr.fillStyle(0x388028);
    gr.fillRect(6, 8, 2, 2); gr.fillRect(24, 10, 2, 2);
    gr.fillRect(14, 22, 2, 2); gr.fillRect(28, 26, 2, 2);
    gr.fillRect(2, 28, 2, 2); gr.fillRect(20, 2, 2, 2);

    // Tiny bright highlights (dew drops)
    gr.fillStyle(0x7acc5a);
    gr.fillRect(3, 5, 1, 1); gr.fillRect(16, 8, 1, 1);
    gr.fillRect(8, 18, 1, 1); gr.fillRect(26, 22, 1, 1);
    gr.fillRect(12, 30, 1, 1);

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

  // ── Forest floor tile 32×32 ───────────────────────────────────────

  private makeForestFloor(): void {
    const gr = this.g();
    gr.fillStyle(0x1a3e14); gr.fillRect(0, 0, 32, 32);
    // Fallen leaves
    gr.fillStyle(0x254c1c);
    gr.fillRect(2, 2, 7, 5); gr.fillRect(16, 4, 6, 4);
    gr.fillRect(6, 14, 9, 5); gr.fillRect(22, 20, 7, 6);
    gr.fillRect(3, 24, 8, 5);  gr.fillRect(18, 26, 9, 4);
    // Root lines
    gr.fillStyle(0x1a2e10);
    gr.fillRect(0, 10, 32, 1); gr.fillRect(0, 22, 32, 1);
    gr.fillRect(11, 0, 1, 10); gr.fillRect(22, 11, 1, 11);
    // Bright tiny spots (light through canopy)
    gr.fillStyle(0x4a7a30);
    gr.fillRect(3, 5, 1, 1); gr.fillRect(20, 2, 1, 1);
    gr.fillRect(8, 16, 1, 1); gr.fillRect(26, 18, 1, 1);
    gr.fillRect(14, 28, 1, 1);
    gr.generateTexture('tile-forest', 32, 32);
    gr.destroy();
  }

  // ── Water tile 32×32 ─────────────────────────────────────────────

  private makeWater(): void {
    const gr = this.g();
    gr.fillStyle(0x1060b0); gr.fillRect(0, 0, 32, 32);
    // Ripple lines (lighter horizontal bands)
    gr.fillStyle(0x2080d8);
    gr.fillRect(0, 3, 32, 3); gr.fillRect(0, 11, 32, 3);
    gr.fillRect(0, 19, 32, 3); gr.fillRect(0, 27, 32, 3);
    // Highlight peaks
    gr.fillStyle(0x60b8f8);
    gr.fillRect(4, 4, 6, 1); gr.fillRect(18, 4, 8, 1);
    gr.fillRect(2, 12, 4, 1); gr.fillRect(14, 12, 10, 1);
    gr.fillRect(8, 20, 7, 1);  gr.fillRect(22, 20, 5, 1);
    gr.fillRect(3, 28, 8, 1);  gr.fillRect(18, 28, 6, 1);
    // Foam at edges (subtle)
    gr.fillStyle(0xc0e8ff, 0.4);
    gr.fillRect(0, 0, 32, 1); gr.fillRect(0, 31, 32, 1);
    gr.fillRect(0, 0, 1, 32); gr.fillRect(31, 0, 1, 32);
    gr.generateTexture('tile-water', 32, 32);
    gr.destroy();
  }

  // ── Stone wall tile 32×40 (8px south-face overhang) ──────────────

  private makeWall(): void {
    const gr = this.g();

    // Top face — light stone
    gr.fillStyle(0x909080); gr.fillRect(0, 0, 32, 32);

    // Stone block mortar lines (horizontal)
    gr.fillStyle(0x6a6a5a);
    gr.fillRect(0, 10, 32, 2); gr.fillRect(0, 22, 32, 2);

    // Stone block mortar lines (vertical, offset per row)
    gr.fillRect(8, 0, 2, 10); gr.fillRect(22, 0, 2, 10);
    gr.fillRect(16, 12, 2, 10); gr.fillRect(2, 12, 2, 10);
    gr.fillRect(10, 24, 2, 8); gr.fillRect(24, 24, 2, 8);

    // Block face highlights (top-left of each stone)
    gr.fillStyle(0xb0b09a);
    gr.fillRect(1, 1, 6, 2); gr.fillRect(11, 1, 8, 2); gr.fillRect(25, 1, 5, 2);
    gr.fillRect(4, 12, 10, 2); gr.fillRect(19, 12, 11, 2);
    gr.fillRect(1, 24, 8, 2); gr.fillRect(13, 24, 9, 2); gr.fillRect(27, 24, 3, 2);

    // Block face shadow (bottom-right of stones)
    gr.fillStyle(0x787068);
    gr.fillRect(0, 8, 7, 2); gr.fillRect(10, 8, 11, 2); gr.fillRect(23, 8, 7, 2);

    // South face of wall (3D illusion) — darker band
    gr.fillStyle(0x484038); gr.fillRect(0, 32, 32, 8);
    // Highlight at top of south face
    gr.fillStyle(0x585048); gr.fillRect(0, 32, 32, 2);
    // Mortar on south face
    gr.fillStyle(0x383028);
    gr.fillRect(10, 33, 2, 7); gr.fillRect(22, 33, 2, 7);

    gr.generateTexture('tile-wall', 32, 40);
    gr.destroy();
  }

  // ── Bush obstacle tile 32×32 ──────────────────────────────────────

  private makeBush(): void {
    const gr = this.g();

    // Dark green base
    gr.fillStyle(0x2a7020); gr.fillRect(0, 0, 32, 32);

    // Rounded bush clumps
    gr.fillStyle(0x3a9030);
    gr.fillCircle(10, 10, 9); gr.fillCircle(22, 10, 9);
    gr.fillCircle(10, 22, 9); gr.fillCircle(22, 22, 9);
    gr.fillCircle(16, 16, 10);

    // Bright highlight clusters
    gr.fillStyle(0x50b840);
    gr.fillCircle(8, 7, 5); gr.fillCircle(20, 7, 5);
    gr.fillCircle(8, 20, 5); gr.fillCircle(24, 20, 5);
    gr.fillCircle(16, 12, 6);

    // Tiny light spots
    gr.fillStyle(0x70d458);
    gr.fillRect(6, 5, 3, 3); gr.fillRect(19, 5, 3, 3);
    gr.fillRect(14, 10, 3, 3); gr.fillRect(24, 18, 3, 3);

    // Dark shadow under bush edges
    gr.fillStyle(0x1a5010, 0.8);
    gr.fillRect(2, 26, 28, 4);

    gr.generateTexture('tile-bush', 32, 32);
    gr.destroy();
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

  // ── Forest tree 32×40 (taller, darker) ───────────────────────────

  private makeTree(): void {
    const gr = this.g();
    // Forest floor base
    gr.fillStyle(0x1a3e14); gr.fillRect(0, 0, 32, 32);
    // Trunk
    gr.fillStyle(0x5a3818); gr.fillRect(12, 20, 8, 12);
    gr.fillStyle(0x483010); gr.fillRect(14, 22, 4, 10);
    // Dark outer crown
    gr.fillStyle(0x1e5a18); gr.fillCircle(10, 12, 10); gr.fillCircle(22, 12, 10);
    gr.fillCircle(16, 8, 12);
    // Mid crown
    gr.fillStyle(0x2e7a28);
    gr.fillCircle(9, 10, 7); gr.fillCircle(23, 10, 7);
    gr.fillCircle(16, 6, 9);
    // Bright highlights
    gr.fillStyle(0x50a040);
    gr.fillCircle(8, 7, 4); gr.fillCircle(20, 7, 4);
    gr.fillCircle(14, 4, 5);
    // Top glint
    gr.fillStyle(0x78c860);
    gr.fillRect(7, 5, 3, 2); gr.fillRect(19, 5, 3, 2); gr.fillRect(14, 2, 4, 2);
    // Shadow under tree
    gr.fillStyle(0x0a2008, 0.6); gr.fillEllipse(16, 30, 20, 6);
    gr.generateTexture('tile-tree', 32, 40);
    gr.destroy();
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
}
