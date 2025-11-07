import Phaser from "phaser";
import Player from "../game/entities/Player";
import NPC from "../game/entities/NPC";
import Enemy from "../game/entities/Enemy";
import { dialogueGraph } from "../data/dialogues";
import { useGameStore } from "../state/GameStore";
import { gameEvents, GAME_EVENTS } from "../game/events";
class BaseWorldScene extends Phaser.Scene {
    constructor(config) {
        super(config);
        this.portalDefinitions = {};
        this.portals = [];
        this.npcs = [];
        this.enemies = [];
        this.sceneryObjects = [];
    }
    create(data = {}) {
        const keyboard = this.input.keyboard;
        if (!keyboard) {
            throw new Error("Keyboard plugin unavailable");
        }
        this.interactKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.createLighting();
        this.createParallax();
        this.createMap();
        this.spawnPlayer(data);
        this.populateObjects();
        this.setupCamera();
        this.setupCollisions();
        this.registerHudRefresh();
    }
    update(_, delta) {
        this.player.update(this.time.now, delta);
        this.npcs.forEach((npc) => npc.update(delta));
        if (this.playerLight) {
            this.playerLight.setPosition(this.player.x, this.player.y);
        }
        this.handleInteraction();
    }
    createLighting() {
        this.lights.enable().setAmbientColor(0x8899cc);
    }
    createParallax() {
        const width = this.scale.width;
        const height = this.scale.height;
        const textureKey = "parallax-stars";
        if (!this.textures.exists(textureKey)) {
            const canvasTexture = this.textures.createCanvas(textureKey, 256, 256);
            const ctx = canvasTexture?.getContext();
            if (!ctx)
                throw new Error("Unable to create parallax texture");
            ctx.fillStyle = "#050911";
            ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = "#1a2845";
            for (let i = 0; i < 120; i += 1) {
                const x = Math.random() * 256;
                const y = Math.random() * 256;
                const size = Math.random() * 1.5 + 0.5;
                ctx.fillRect(x, y, size, size);
            }
            canvasTexture?.refresh();
        }
        const far = this.add
            .tileSprite(0, 0, width, height, textureKey)
            .setOrigin(0)
            .setScrollFactor(0);
        far.setAlpha(0.35);
        const near = this.add
            .tileSprite(0, 0, width, height, textureKey)
            .setOrigin(0)
            .setScrollFactor(0);
        near.setTint(0x335077);
        near.setAlpha(0.18);
        this.events.on("update", () => {
            far.tilePositionX = this.cameras.main.scrollX * 0.2;
            far.tilePositionY = this.cameras.main.scrollY * 0.2;
            near.tilePositionX = this.cameras.main.scrollX * 0.35;
            near.tilePositionY = this.cameras.main.scrollY * 0.35;
        });
    }
    createMap() {
        this.map = this.make.tilemap({ key: this.mapKey });
        const tileset = this.map.addTilesetImage("OverworldTiles", "tileset");
        if (!tileset)
            throw new Error("Tileset missing");
        const ground = this.map.createLayer("Ground", tileset, 0, 0);
        const decor = this.map.createLayer("Decor", tileset, 0, 0);
        const collision = this.map.createLayer("Collision", tileset, 0, 0);
        if (!ground || !decor || !collision) {
            throw new Error("Failed to create tile layers");
        }
        this.groundLayer = ground;
        this.decorLayer = decor;
        this.collisionLayer = collision;
        this.collisionLayer.setVisible(false);
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    }
    spawnPlayer(data) {
        const objectsLayer = this.map.getObjectLayer("Objects");
        if (!objectsLayer)
            throw new Error("Missing objects layer");
        const spawnObject = objectsLayer.objects.find((obj) => obj.type === "player" && obj.name === data.spawnId) ??
            objectsLayer.objects.find((obj) => obj.type === "player");
        if (!spawnObject)
            throw new Error("Spawn point missing");
        const spawnX = (data.x ?? spawnObject.x ?? 64) + this.map.tileWidth / 2;
        const spawnY = (data.y ?? spawnObject.y ?? 64) + this.map.tileHeight / 2;
        this.player = new Player(this, spawnX, spawnY, { speed: 120 });
        this.playerLight = this.lights.addLight(spawnX, spawnY, 200, 0x8adfff, 1.5);
    }
    populateObjects() {
        const objectsLayer = this.map.getObjectLayer("Objects");
        if (!objectsLayer)
            return;
        const scenery = this.physics.add.staticGroup();
        objectsLayer.objects.forEach((obj) => {
            const centerX = (obj.x ?? 0) + (obj.width ?? 0) / 2;
            const centerY = (obj.y ?? 0);
            switch (obj.type) {
                case "npc": {
                    const { spriteKey, dialogueId, displayName } = this.resolveNpcData(obj.name ?? "");
                    const npc = new NPC(this, centerX, centerY, spriteKey, dialogueId, displayName);
                    this.npcs.push(npc);
                    break;
                }
                case "portal": {
                    const transition = this.portalDefinitions[obj.name ?? ""];
                    if (!transition)
                        break;
                    this.portals.push({
                        name: obj.name ?? "",
                        x: centerX,
                        y: centerY,
                        radius: 36,
                        transition
                    });
                    break;
                }
                case "enemy": {
                    const enemy = new Enemy(this, centerX, centerY);
                    enemy.setTarget(this.player);
                    this.enemies.push(enemy);
                    break;
                }
                case "scenery": {
                    const key = this.resolveSceneryKey(obj.name ?? "");
                    const sprite = scenery
                        .get(centerX, centerY, key)
                        .setOrigin(0.5, 1)
                        .setPipeline("Light2D");
                    const body = sprite.body;
                    body?.setCircle(22, sprite.width / 2 - 22, sprite.height - 44);
                    this.sceneryObjects.push({
                        name: obj.name ?? "",
                        x: centerX,
                        y: centerY,
                        key
                    });
                    break;
                }
                default:
                    break;
            }
        });
        this.physics.add.collider(this.player, scenery);
        this.enemies.forEach((enemy) => {
            this.physics.add.collider(enemy, this.collisionLayer);
        });
    }
    setupCamera() {
        this.cameras.main.startFollow(this.player, false, 0.15, 0.15);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    }
    setupCollisions() {
        this.collisionLayer.setCollisionByExclusion([-1], true);
        this.physics.add.collider(this.player, this.collisionLayer);
    }
    handleInteraction() {
        if (!Phaser.Input.Keyboard.JustDown(this.interactKey))
            return;
        const { x, y } = this.player;
        const interactRadius = 60;
        const targetNpc = this.npcs.find((npc) => Phaser.Math.Distance.Between(npc.x, npc.y, x, y) < interactRadius);
        if (targetNpc) {
            this.openDialogue(targetNpc.dialogueId);
            return;
        }
        const portal = this.portals.find((p) => Phaser.Math.Distance.Between(p.x, p.y, x, y) < p.radius);
        if (portal) {
            this.transitionTo(portal);
            return;
        }
        this.handleEnvironmentalInteraction(x, y);
    }
    transitionTo(portal) {
        this.scene.transition({
            target: portal.transition.targetScene,
            duration: 400,
            sleep: false,
            remove: false,
            data: {
                spawnId: portal.transition.spawnId
            }
        });
    }
    openDialogue(id) {
        const node = dialogueGraph[id];
        if (!node)
            return;
        useGameStore.getState().setDialogue({
            currentId: id,
            visible: true
        });
        gameEvents.emit(GAME_EVENTS.DIALOGUE_OPEN, node);
    }
    handleEnvironmentalInteraction(x, y) {
        const scenic = this.sceneryObjects.find((object) => Phaser.Math.Distance.Between(object.x, object.y, x, y) < 64);
        if (scenic) {
            this.onSceneryInteraction(scenic);
            return;
        }
        gameEvents.emit(GAME_EVENTS.ENVIRONMENT_MESSAGE, {
            text: "The breeze rustles without response."
        });
    }
    onSceneryInteraction(_scenery) {
        gameEvents.emit(GAME_EVENTS.ENVIRONMENT_MESSAGE, {
            text: "Nothing stirs."
        });
    }
    resolveNpcData(name) {
        switch (name) {
            case "elder_lys":
                return {
                    spriteKey: "npc_sage",
                    dialogueId: "elder-lys-root",
                    displayName: "Elder Lys"
                };
            case "guardian_aeris":
                return {
                    spriteKey: "npc_guard",
                    dialogueId: "guardian-aeris-entry",
                    displayName: "Guardian Aeris"
                };
            case "lyra":
                return {
                    spriteKey: "npc_sage",
                    dialogueId: "villager-lyra",
                    displayName: "Lyra"
                };
            default:
                return {
                    spriteKey: "npc_sage",
                    dialogueId: "villager-lyra",
                    displayName: "Wanderer"
                };
        }
    }
    resolveSceneryKey(name) {
        if (name.includes("tree"))
            return "ancient_tree";
        if (name.includes("house"))
            return "village_house";
        return "crystal_cluster";
    }
    registerHudRefresh() {
        if (this.infoTimer)
            this.infoTimer.destroy();
        this.infoTimer = this.time.addEvent({
            delay: 1200,
            loop: true,
            callback: () => {
                const state = useGameStore.getState();
                gameEvents.emit(GAME_EVENTS.PLAYER_STATS, state.playerStats);
                gameEvents.emit(GAME_EVENTS.INVENTORY_UPDATE, state.inventory);
                const quests = Object.values(state.quests);
                gameEvents.emit(GAME_EVENTS.QUEST_UPDATE, quests);
            }
        });
    }
}
export default BaseWorldScene;
