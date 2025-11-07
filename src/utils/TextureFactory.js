import Phaser from "phaser";
const palette = {
    grassLight: "#5ac46d",
    grassDark: "#3a924b",
    dirt: "#a66a3a",
    stone: "#8b8a82",
    waterLight: "#3ea5d9",
    waterDark: "#1a6fa3",
    wood: "#8b5a2b",
    sand: "#ddb167",
    foliage: "#2f7145",
    lava: "#e54c2a",
    caveRock: "#4a4a55",
    rune: "#b9a0ff",
    snow: "#e5f2ff"
};
const drawTile = (ctx, index, tileSize, pattern) => {
    const columns = 8;
    const x = (index % columns) * tileSize;
    const y = Math.floor(index / columns) * tileSize;
    pattern(ctx, x, y, tileSize);
};
const tilePatterns = [
    (ctx, x, y, size) => {
        ctx.fillStyle = palette.grassDark;
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = palette.grassLight;
        for (let i = 0; i < 20; i += 1) {
            const px = x + Math.random() * size;
            const py = y + Math.random() * size;
            ctx.fillRect(Math.floor(px), Math.floor(py), 2, 2);
        }
    },
    (ctx, x, y, size) => {
        ctx.fillStyle = palette.dirt;
        ctx.fillRect(x, y, size, size);
    },
    (ctx, x, y, size) => {
        ctx.fillStyle = palette.stone;
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = "#6f6f71";
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
    },
    (ctx, x, y, size) => {
        ctx.fillStyle = palette.waterDark;
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = palette.waterLight;
        for (let i = 0; i < 3; i += 1) {
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, size / 4 + i, 0, Math.PI * 2);
            ctx.strokeStyle = palette.waterLight;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    },
    (ctx, x, y, size) => {
        ctx.fillStyle = palette.wood;
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = "#b87b3b";
        ctx.fillRect(x, y + size / 2, size, size / 2);
    },
    (ctx, x, y, size) => {
        ctx.fillStyle = palette.sand;
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = "#fce7a6";
        ctx.fillRect(x, y + size / 3, size, 2);
        ctx.fillRect(x + 3, y + (2 * size) / 3, size - 6, 2);
    },
    (ctx, x, y, size) => {
        ctx.fillStyle = palette.foliage;
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = "#4da46f";
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 3, 0, Math.PI * 2);
        ctx.fill();
    },
    (ctx, x, y, size) => {
        ctx.fillStyle = palette.lava;
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = "#fc8f3f";
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
    },
    (ctx, x, y, size) => {
        ctx.fillStyle = palette.caveRock;
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = "#6c6c78";
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
    },
    (ctx, x, y, size) => {
        ctx.fillStyle = palette.rune;
        ctx.fillRect(x, y, size, size);
        ctx.strokeStyle = "#321b5b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + size - 4);
        ctx.lineTo(x + size - 4, y + 4);
        ctx.stroke();
    },
    (ctx, x, y, size) => {
        ctx.fillStyle = palette.snow;
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = "#ccd9ff";
        ctx.fillRect(x, y + size / 2, size, 2);
    }
];
export const createTileset = (scene) => {
    if (scene.textures.exists("tileset"))
        return;
    const tileSize = 16;
    const columns = 8;
    const rows = Math.ceil(tilePatterns.length / columns);
    const width = columns * tileSize;
    const height = rows * tileSize;
    const texture = scene.textures.createCanvas("tileset", width, height);
    const canvas = texture.getCanvas();
    const ctx = canvas?.getContext("2d");
    if (!ctx) {
        throw new Error("Unable to acquire 2D context for tileset");
    }
    ctx.imageSmoothingEnabled = false;
    tilePatterns.forEach((pattern, index) => {
        drawTile(ctx, index, tileSize, pattern);
    });
    texture.refresh();
};
const makePixelSprite = (scene, key, pattern, paletteMap, pixelSize = 8) => {
    const g = scene.add.graphics({ x: 0, y: 0 });
    g.setVisible(false);
    pattern.forEach((row, y) => {
        row.split("").forEach((char, x) => {
            const color = paletteMap[char];
            if (!color || color === ".")
                return;
            g.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
            g.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        });
    });
    g.generateTexture(key, pattern[0].length * pixelSize, pattern.length * pixelSize);
    g.destroy();
};
export const createCharacterTextures = (scene) => {
    if (scene.textures.exists("hero_idle"))
        return;
    const basePalette = {
        X: "#1b2947",
        B: "#3a5ba0",
        S: "#e8f1ff",
        P: "#ef8fa6",
        H: "#5b3a24",
        ".": "."
    };
    makePixelSprite(scene, "hero_idle", [
        "..XXXX..",
        ".XBBBBX.",
        "XBBBBBBX",
        "XBBBBBBX",
        ".XBBBBX.",
        "..XBBX..",
        "..XBBX..",
        ".HSHHSH.",
        "H.HH.H.H"
    ], basePalette);
    makePixelSprite(scene, "hero_attack", [
        "..XXXX..",
        ".XBBBBX.",
        "XBBBBBBX",
        "XBBBBBBX",
        ".XBBBBX.",
        "XXBBBBXX",
        "XBBBBBBX",
        "SHPBPHSH",
        "H.HH.H.H"
    ], basePalette);
    makePixelSprite(scene, "npc_sage", [
        "..XXXX..",
        ".XSSSSX.",
        "XSSSSSSX",
        "XSSSSSSX",
        ".XSSSSX.",
        "..XSSX..",
        "..XSSX..",
        ".PSSSSP.",
        "P.PP.P.P"
    ], {
        X: "#26263a",
        S: "#ffe9a6",
        P: "#f4c27a",
        ".": "."
    });
    makePixelSprite(scene, "npc_guard", [
        "..XXXX..",
        ".XGGGGX.",
        "XGGGGGGX",
        "XGGGGGGX",
        ".XGGGGX.",
        "..XGGX..",
        ".XGGGGX.",
        ".PGBGP..",
        "P.PP.P.P"
    ], {
        X: "#2a303f",
        G: "#5b8def",
        P: "#f2c48c",
        B: "#2a2d44",
        ".": "."
    });
    makePixelSprite(scene, "enemy_shade", [
        "..XXXX..",
        ".XNNNNX.",
        "XNNNNNNX",
        "XNNNNNNX",
        ".XNNNNX.",
        "..XNNX..",
        "..XNNX..",
        ".NXXXXN.",
        "N.NN.N.N"
    ], {
        X: "#111119",
        N: "#6f58ff",
        ".": "."
    });
    makePixelSprite(scene, "item_blade", ["...LL...", "..LLLL..", "..LLL...", ".LLLLLL.", "LLLLLLLL", ".LLLLLL.", "..LLL...", "...LL..."], {
        L: "#b7f4ff",
        ".": "."
    }, 4);
    makePixelSprite(scene, "item_root", [
        "...G....",
        "..GGG...",
        ".GGGGG..",
        ".GWWWG..",
        ".GGGGG..",
        "..GGG...",
        "...G....",
        "...G...."
    ], {
        G: "#73c47c",
        W: "#4f8f59",
        ".": "."
    }, 4);
};
export const createEnvironmentalTextures = (scene) => {
    if (scene.textures.exists("ancient_tree"))
        return;
    makePixelSprite(scene, "ancient_tree", [
        "....GG....",
        "...GGGG...",
        "..GGGGGG..",
        ".GGGGGGGG.",
        ".GGGGGGGG.",
        "..GGGGGG..",
        "...GGGG...",
        "....GG....",
        "....BB....",
        "....BB....",
        "....BB...."
    ], {
        G: "#2f8f4d",
        B: "#7a4b21",
        ".": "."
    }, 8);
    makePixelSprite(scene, "crystal_cluster", [
        "....C....",
        "...CCC...",
        "..CCCCC..",
        ".CCCCCCC.",
        "..CCCCC..",
        "...CCC...",
        "....C...."
    ], {
        C: "#8ee6ff",
        ".": "."
    }, 6);
    makePixelSprite(scene, "village_house", [
        "....RRRR....",
        "...RRRRRR...",
        "..RRRRRRRR..",
        ".RRRRRRRRRR.",
        "TTTTTTTTTTTT",
        ".WWWWWWWWWW.",
        ".WWWWWWWWWW.",
        ".WWWWWWWWWW.",
        ".BBBBBBBBBB."
    ], {
        R: "#a53c2f",
        T: "#f1d6a2",
        W: "#d9eaff",
        B: "#4c2a17",
        ".": "."
    }, 6);
};
