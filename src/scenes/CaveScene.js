import BaseWorldScene from "./BaseWorldScene";
import { soundscape } from "../audio/soundscape";
import { useGameStore } from "../state/GameStore";
import { gameEvents, GAME_EVENTS } from "../game/events";
class CaveScene extends BaseWorldScene {
    constructor() {
        super({ key: "CaveScene" });
        this.mapKey = "cave";
        this.hitCooldowns = new WeakMap();
    }
    create(data = {}) {
        this.portalDefinitions = {
            to_world: {
                targetScene: "WorldScene",
                spawnId: "from_cave"
            }
        };
        soundscape.stopAll();
        soundscape.playCombat();
        super.create(data);
        this.lights.setAmbientColor(0x442222);
        this.groundLayer.setPipeline("Light2D");
        this.decorLayer.setPipeline("Light2D");
        this.collisionLayer.setPipeline("Light2D");
        this.enemies.forEach((enemy) => enemy.setPipeline("Light2D"));
    }
    update(time, delta) {
        super.update(time, delta);
        this.enemies.forEach((enemy) => {
            const current = this.hitCooldowns.get(enemy) ?? 0;
            this.hitCooldowns.set(enemy, Math.max(0, current - delta));
            if (!enemy.active)
                return;
            if (this.player.isAttackActive()) {
                const attackArc = this.player.getAttackArc();
                if (this.hitCooldowns.get(enemy) === 0 &&
                    Phaser.Math.Distance.Between(enemy.x, enemy.y, attackArc.x, attackArc.y) <
                        attackArc.radius) {
                    enemy.takeDamage(25);
                    this.hitCooldowns.set(enemy, 400);
                }
            }
            if (Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) < 18) {
                this.player.killPose();
            }
        });
    }
    onSceneryInteraction(scenery) {
        const store = useGameStore.getState();
        if (!store.flags.shadeDefeated) {
            gameEvents.emit(GAME_EVENTS.ENVIRONMENT_MESSAGE, {
                text: "Crystalline echoes tremble. The shade still lingers deeper within."
            });
        }
        else {
            if (scenery.key === "crystal_cluster") {
                store.addItem({
                    id: "ancient_relic",
                    name: "Rune of Quiet Tides",
                    description: "A relic resonating with calm, blessing the vale.",
                    quantity: 1,
                    icon: "crystal_cluster"
                });
                gameEvents.emit(GAME_EVENTS.ENVIRONMENT_MESSAGE, {
                    text: "You harvest a resonant rune. The cavern hums with gratitude."
                });
            }
            else {
                gameEvents.emit(GAME_EVENTS.ENVIRONMENT_MESSAGE, {
                    text: "The cavern walls pulse in restful silence."
                });
            }
        }
    }
}
export default CaveScene;
