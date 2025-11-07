import BaseWorldScene from "./BaseWorldScene";
import { soundscape } from "../audio/soundscape";
import { useGameStore } from "../state/GameStore";
import { gameEvents, GAME_EVENTS } from "../game/events";

class VillageScene extends BaseWorldScene {
  protected mapKey = "village";

  constructor() {
    super({ key: "VillageScene" });
  }

  create(data: { spawnId?: string } = {}) {
    this.portalDefinitions = {
      to_world: {
        targetScene: "WorldScene",
        spawnId: "from_village"
      }
    };
    soundscape.stopAll();
    soundscape.playVillage();
    super.create(data);
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
    if (scenery.name === "house_1") {
      gameEvents.emit(GAME_EVENTS.ENVIRONMENT_MESSAGE, {
        text: "Warm lanterns flicker. Villagers leave offerings of sea-salt bread."
      });
      return;
    }
    if (scenery.name === "house_2") {
      if (!store.flags.guardianApproved) {
        gameEvents.emit(GAME_EVENTS.ENVIRONMENT_MESSAGE, {
          text: "The guardian's quarters are sealed. Earn his trust to enter."
        });
      } else {
        gameEvents.emit(GAME_EVENTS.ENVIRONMENT_MESSAGE, {
          text: "A polished shield rests within, gleaming with dawnlight."
        });
      }
      return;
    }
    gameEvents.emit(GAME_EVENTS.ENVIRONMENT_MESSAGE, {
      text: "Village winds carry laughter and distant lullabies."
    });
  }
}

export default VillageScene;
