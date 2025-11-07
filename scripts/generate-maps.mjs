import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TILE_SIZE = 16;
const TILESET_NAME = "OverworldTiles";
const TILESET_IMAGE = "tileset.png";

const ensureDir = (path) => {
  mkdirSync(path, { recursive: true });
};

const createLayer = (name, width, height, data) => ({
  name,
  type: "tilelayer",
  width,
  height,
  x: 0,
  y: 0,
  visible: true,
  opacity: 1,
  data
});

const createMapTemplate = (width, height, layers, objects = []) => ({
  width,
  height,
  tilewidth: TILE_SIZE,
  tileheight: TILE_SIZE,
  infinite: false,
  orientation: "orthogonal",
  renderorder: "right-down",
  version: "1.10",
  tiledversion: "1.10.0",
  nextlayerid: layers.length + 2,
  nextobjectid: objects.length + 1,
  layers,
  tilesets: [
    {
      firstgid: 1,
      source: null,
      name: TILESET_NAME,
      tilewidth: TILE_SIZE,
      tileheight: TILE_SIZE,
      spacing: 0,
      margin: 0,
      columns: 8,
      tilecount: 64,
      image: TILESET_IMAGE,
      imagewidth: 128,
      imageheight: 128
    }
  ],
  properties: [],
  class: ""
});

const setTile = (data, width, x, y, tileIndex) => {
  if (x < 0 || y < 0 || x >= width) return;
  data[y * width + x] = tileIndex + 1;
};

const paintRect = (data, width, x, y, w, h, tileIndex) => {
  for (let iy = 0; iy < h; iy += 1) {
    for (let ix = 0; ix < w; ix += 1) {
      setTile(data, width, x + ix, y + iy, tileIndex);
    }
  }
};

const carvePath = (data, width, points, tileIndex) => {
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const dx = Math.sign(x2 - x1);
    const dy = Math.sign(y2 - y1);
    let cx = x1;
    let cy = y1;
    while (cx !== x2 || cy !== y2) {
      setTile(data, width, cx, cy, tileIndex);
      setTile(data, width, cx + 1, cy, tileIndex);
      setTile(data, width, cx, cy + 1, tileIndex);
      cx += dx;
      cy += dy;
    }
    setTile(data, width, x2, y2, tileIndex);
  }
};

const generateWorld = () => {
  const width = 70;
  const height = 70;
  const ground = new Array(width * height).fill(1); // start with dirt
  const decor = new Array(width * height).fill(0);
  const collision = new Array(width * height).fill(0);

  // Lush grassland base
  paintRect(ground, width, 0, 0, width, height, 0);

  // River slicing map horizontally
  for (let x = 0; x < width; x += 1) {
    for (let y = 30; y < 36; y += 1) {
      const tile = y === 32 || y === 33 ? 3 : 2;
      setTile(ground, width, x, y, tile);
      if (tile === 3) setTile(collision, width, x, y, tile);
    }
  }

  // Bridge segments
  paintRect(ground, width, 32, 31, 6, 4, 4);

  // Village plateau in southwest
  paintRect(ground, width, 6, 42, 18, 18, 5);
  paintRect(ground, width, 8, 44, 14, 14, 1);

  // Northern ruins made of stone and rune tiles
  paintRect(ground, width, 24, 8, 22, 12, 2);
  paintRect(ground, width, 26, 10, 18, 8, 9);

  // Eastern forest canopy
  paintRect(ground, width, 48, 12, 18, 46, 6);
  paintRect(ground, width, 50, 18, 14, 38, 0);

  // Western glade
  paintRect(ground, width, 8, 12, 12, 20, 0);
  paintRect(ground, width, 10, 16, 8, 14, 6);

  // Carve central road
  carvePath(
    ground,
    width,
    [
      [34, 60],
      [34, 36],
      [34, 20],
      [26, 12]
    ],
    1
  );

  // Decor placements
  for (let i = 0; i < 36; i += 1) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    if (ground[y * width + x] === 0) {
      setTile(decor, width, x, y, 6);
    }
  }

  // Rune circle in ruins
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
    const x = Math.floor(34 + Math.cos(angle) * 6);
    const y = Math.floor(12 + Math.sin(angle) * 4);
    setTile(decor, width, x, y, 9);
  }

  // Collision for dense forest and ruins walls
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const tile = ground[y * width + x] - 1;
      if ([3, 6, 7].includes(tile)) {
        setTile(collision, width, x, y, tile);
      }
    }
  }

  const objectsLayer = {
    name: "Objects",
    type: "objectgroup",
    draworder: "topdown",
    x: 0,
    y: 0,
    visible: true,
    opacity: 1,
    objects: [
      { id: 1, name: "spawn", type: "player", x: 34 * TILE_SIZE, y: 58 * TILE_SIZE },
      { id: 7, name: "from_village", type: "player", x: 18 * TILE_SIZE, y: 50 * TILE_SIZE },
      { id: 8, name: "from_cave", type: "player", x: 50 * TILE_SIZE, y: 26 * TILE_SIZE },
      { id: 2, name: "elder_lys", type: "npc", x: 26 * TILE_SIZE, y: 14 * TILE_SIZE },
      { id: 3, name: "to_village", type: "portal", x: 16 * TILE_SIZE, y: 52 * TILE_SIZE },
      { id: 4, name: "to_cave", type: "portal", x: 54 * TILE_SIZE, y: 22 * TILE_SIZE },
      { id: 5, name: "glade_tree", type: "scenery", x: 14 * TILE_SIZE, y: 22 * TILE_SIZE },
      { id: 6, name: "orb_crystal", type: "scenery", x: 32 * TILE_SIZE, y: 12 * TILE_SIZE }
    ]
  };

  return createMapTemplate(
    width,
    height,
    [
      createLayer("Ground", width, height, ground),
      createLayer("Decor", width, height, decor),
      createLayer("Collision", width, height, collision),
      objectsLayer
    ]
  );
};

const generateVillage = () => {
  const width = 40;
  const height = 40;
  const ground = new Array(width * height).fill(5);
  const decor = new Array(width * height).fill(0);
  const collision = new Array(width * height).fill(0);

  paintRect(ground, width, 2, 2, width - 4, height - 4, 0);
  paintRect(ground, width, 4, 4, width - 8, height - 8, 5);

  carvePath(
    ground,
    width,
    [
      [20, 36],
      [20, 10],
      [30, 10]
    ],
    1
  );

  paintRect(ground, width, 10, 12, 8, 6, 4);
  paintRect(ground, width, 26, 20, 8, 6, 4);

  for (let i = 0; i < 16; i += 1) {
    const x = 6 + (i % 4) * 4;
    const y = 8 + Math.floor(i / 4) * 6;
    setTile(decor, width, x, y, 6);
  }

  const objectsLayer = {
    name: "Objects",
    type: "objectgroup",
    draworder: "topdown",
    x: 0,
    y: 0,
    visible: true,
    opacity: 1,
    objects: [
      { id: 1, name: "spawn", type: "player", x: 20 * TILE_SIZE, y: 34 * TILE_SIZE },
      { id: 6, name: "from_world", type: "player", x: 20 * TILE_SIZE, y: 34 * TILE_SIZE },
      { id: 2, name: "guardian_aeris", type: "npc", x: 18 * TILE_SIZE, y: 18 * TILE_SIZE },
      { id: 3, name: "lyra", type: "npc", x: 26 * TILE_SIZE, y: 12 * TILE_SIZE },
      { id: 4, name: "to_world", type: "portal", x: 20 * TILE_SIZE, y: 38 * TILE_SIZE },
      { id: 5, name: "house_1", type: "scenery", x: 10 * TILE_SIZE, y: 12 * TILE_SIZE },
      { id: 6, name: "house_2", type: "scenery", x: 26 * TILE_SIZE, y: 20 * TILE_SIZE }
    ]
  };

  return createMapTemplate(
    width,
    height,
    [
      createLayer("Ground", width, height, ground),
      createLayer("Decor", width, height, decor),
      createLayer("Collision", width, height, collision),
      objectsLayer
    ]
  );
};

const generateCave = () => {
  const width = 50;
  const height = 50;
  const ground = new Array(width * height).fill(8); // cave rock
  const decor = new Array(width * height).fill(0);
  const collision = new Array(width * height).fill(0);

  paintRect(ground, width, 6, 6, width - 12, height - 12, 8);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const distance =
        Math.hypot(x - width / 2, y - height / 2) + Math.sin((x * y) / 18) * 2;
      if (distance < 12) setTile(ground, width, x, y, 9);
      if (distance > 20 && Math.random() > 0.85) setTile(decor, width, x, y, 6);
    }
  }

  // Lava pools
  paintRect(ground, width, 14, 14, 10, 10, 7);
  paintRect(ground, width, 26, 28, 12, 6, 7);

  // Collision for lava pools
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const tile = ground[y * width + x] - 1;
      if (tile === 7) setTile(collision, width, x, y, tile);
    }
  }

  const objectsLayer = {
    name: "Objects",
    type: "objectgroup",
    draworder: "topdown",
    x: 0,
    y: 0,
    visible: true,
    opacity: 1,
    objects: [
      { id: 1, name: "spawn", type: "player", x: 24 * TILE_SIZE, y: 42 * TILE_SIZE },
      { id: 6, name: "from_world", type: "player", x: 24 * TILE_SIZE, y: 42 * TILE_SIZE },
      { id: 2, name: "shade", type: "enemy", x: 24 * TILE_SIZE, y: 20 * TILE_SIZE },
      { id: 3, name: "to_world", type: "portal", x: 24 * TILE_SIZE, y: 46 * TILE_SIZE },
      { id: 4, name: "crystal_1", type: "scenery", x: 20 * TILE_SIZE, y: 18 * TILE_SIZE },
      { id: 5, name: "crystal_2", type: "scenery", x: 28 * TILE_SIZE, y: 24 * TILE_SIZE }
    ]
  };

  return createMapTemplate(
    width,
    height,
    [
      createLayer("Ground", width, height, ground),
      createLayer("Decor", width, height, decor),
      createLayer("Collision", width, height, collision),
      objectsLayer
    ]
  );
};

const outputDir = join(__dirname, "..", "public", "maps");
ensureDir(outputDir);

const maps = {
  world: generateWorld(),
  village: generateVillage(),
  cave: generateCave()
};

for (const [name, map] of Object.entries(maps)) {
  writeFileSync(join(outputDir, `${name}.json`), JSON.stringify(map, null, 2), "utf8");
}

console.log("Maps generated:", Object.keys(maps));
