import Phaser from "phaser";

export const gameEvents = new Phaser.Events.EventEmitter();

export const GAME_EVENTS = {
  PLAYER_STATS: "player-stats",
  INVENTORY_UPDATE: "inventory-update",
  QUEST_UPDATE: "quest-update",
  DIALOGUE_OPEN: "dialogue-open",
  DIALOGUE_CLOSE: "dialogue-close",
  ENVIRONMENT_MESSAGE: "environment-message"
} as const;
