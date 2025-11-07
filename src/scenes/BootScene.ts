import Phaser from "phaser";
import { createCharacterTextures, createEnvironmentalTextures, createTileset } from "../utils/TextureFactory";
import { soundscape } from "../audio/soundscape";

class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.tilemapTiledJSON("world", "/maps/world.json");
    this.load.tilemapTiledJSON("village", "/maps/village.json");
    this.load.tilemapTiledJSON("cave", "/maps/cave.json");
  }

  create() {
    createTileset(this);
    createCharacterTextures(this);
    createEnvironmentalTextures(this);
    soundscape.playAmbient();
    this.scene.start("WorldScene");
    this.scene.launch("UIScene");
  }
}

export default BootScene;
