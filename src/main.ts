import Phaser from "phaser";
import BootScene from "./scenes/BootScene";
import WorldScene from "./scenes/WorldScene";
import UIScene from "./scenes/UIScene";
import CaveScene from "./scenes/CaveScene";
import VillageScene from "./scenes/VillageScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  backgroundColor: "#0a0f1c",
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [BootScene, WorldScene, VillageScene, CaveScene, UIScene]
};

void new Phaser.Game(config);
