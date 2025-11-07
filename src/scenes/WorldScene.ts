import BaseWorldScene from "./BaseWorldScene";
import { soundscape } from "../audio/soundscape";
import { useGameStore } from "../state/GameStore";
import { gameEvents, GAME_EVENTS } from "../game/events";

class WorldScene extends BaseWorldScene {
  protected mapKey = "world";

  constructor() {
    super({ key: "WorldScene" });
  }

  create(data: { spawnId?: string } = {}) {
    this.portalDefinitions = {
      to_village: {
        targetScene: "VillageScene",
        spawnId: "from_world"
      },
      to_cave: {
        targetScene: "CaveScene",
        spawnId: "from_world"
      }
    };
    soundscape.stopAll();
    soundscape.playAmbient();
    super.create(data);
    this.applyLightingToLayers();
  }

  private applyLightingToLayers() {
    this.groundLayer.setPipeline("Light2D");
    this.decorLayer.setPipeline("Light2D");
  }

  protected onSceneryInteraction(scenery: {
    name: string;
    x: number;
    y: number;
    key: string;
  }) {
    const store = useGameStore.getState();
    if (scenery.name === "glade_tree") {
      store.healPlayer(25);
      gameEvents.emit(GAME_EVENTS.ENVIRONMENT_MESSAGE, {
        text: "The ancient tree breathes verdant light. Your wounds knit gently."
      });
      return;
    }
    if (scenery.name === "orb_crystal") {
      if (!store.flags.metSage) {
        gameEvents.emit(GAME_EVENTS.ENVIRONMENT_MESSAGE, {
          text: "The crystal hums softly, urging you to seek Elder Lys amid the ruins."
        });
      } else if (!store.flags.guardianApproved) {
        gameEvents.emit(GAME_EVENTS.ENVIRONMENT_MESSAGE, {
          text: "The resonance points toward the village guardian's watchful path."
        });
      } else {
        gameEvents.emit(GAME_EVENTS.ENVIRONMENT_MESSAGE, {
          text: "The crystal pulse aligns with the cavern below. Destiny waits."
        });
      }
      return;
    }
    gameEvents.emit(GAME_EVENTS.ENVIRONMENT_MESSAGE, {
      text: "The Vale sways in luminous silence."
    });
  }
}

export default WorldScene;
