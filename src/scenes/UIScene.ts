import Phaser from "phaser";
import gsap from "gsap";
import { useGameStore, InventoryItem, Quest, PlayerStats } from "../state/GameStore";
import { dialogueGraph, DialogueNode } from "../data/dialogues";
import { gameEvents, GAME_EVENTS } from "../game/events";

class UIScene extends Phaser.Scene {
  private statusPanel!: HTMLDivElement;

  private inventoryPanel!: HTMLDivElement;

  private questPanel!: HTMLDivElement;

  private dialogueBox!: HTMLDivElement;

  private dialogueText!: HTMLDivElement;

  private dialogueChoices!: HTMLDivElement;

  private inventoryVisible = false;

  private keyInventory!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: "UIScene" });
  }

  create() {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard plugin missing for UI scene");
    }
    this.keyInventory = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.buildUi();
    this.bindEvents();
    this.refreshAll();
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keyInventory)) {
      this.toggleInventory();
    }
  }

  private buildUi() {
    const uiLayer = document.getElementById("ui-layer");
    if (!uiLayer) throw new Error("UI layer not found");

    this.statusPanel = document.createElement("div");
    this.statusPanel.id = "status-panel";
    this.statusPanel.className = "hud-panel";
    uiLayer.appendChild(this.statusPanel);

    this.inventoryPanel = document.createElement("div");
    this.inventoryPanel.id = "inventory-panel";
    this.inventoryPanel.className = "hud-panel";
    this.inventoryPanel.style.display = "none";
    uiLayer.appendChild(this.inventoryPanel);

    this.questPanel = document.createElement("div");
    this.questPanel.id = "quest-panel";
    this.questPanel.className = "hud-panel";
    uiLayer.appendChild(this.questPanel);

    this.dialogueBox = document.createElement("div");
    this.dialogueBox.id = "dialogue-box";
    this.dialogueText = document.createElement("div");
    this.dialogueText.id = "dialogue-text";
    this.dialogueChoices = document.createElement("div");
    this.dialogueChoices.id = "dialogue-choices";
    this.dialogueBox.appendChild(this.dialogueText);
    this.dialogueBox.appendChild(this.dialogueChoices);
    uiLayer.appendChild(this.dialogueBox);
  }

  private bindEvents() {
    gameEvents.on(GAME_EVENTS.PLAYER_STATS, (stats: PlayerStats) => this.renderStats(stats));
    gameEvents.on(GAME_EVENTS.INVENTORY_UPDATE, (inventory: InventoryItem[]) =>
      this.renderInventory(inventory)
    );
    gameEvents.on(GAME_EVENTS.QUEST_UPDATE, (quests: Quest[]) => this.renderQuests(quests));
    gameEvents.on(GAME_EVENTS.DIALOGUE_OPEN, (node: DialogueNode) => this.openDialogue(node));
    gameEvents.on(GAME_EVENTS.DIALOGUE_CLOSE, () => this.closeDialogue());
    gameEvents.on(
      GAME_EVENTS.ENVIRONMENT_MESSAGE,
      ({ text }: { text: string }) => this.spawnToast(text)
    );
  }

  private refreshAll() {
    const store = useGameStore.getState();
    this.renderStats(store.playerStats);
    this.renderInventory(store.inventory);
    this.renderQuests(Object.values(store.quests));
  }

  private renderStats(stats: PlayerStats) {
    this.statusPanel.innerHTML = `
      <h2>Status</h2>
      <p>HP: ${stats.health}/${stats.maxHealth}</p>
      <p>Mana: ${stats.mana}/${stats.maxMana}</p>
      <p>Level: ${stats.level}</p>
      <p>Exp: ${Math.floor(stats.experience)}</p>
    `;
  }

  private renderInventory(inventory: InventoryItem[]) {
    this.inventoryPanel.innerHTML = `
      <h2>Inventory</h2>
      <div>
        ${inventory
          .map(
            (item) => `
              <div class="inventory-slot">
                <img src="${this.getTextureDataUrl(item.icon)}" alt="${item.name}" />
                <div>
                  <strong>${item.name}</strong>
                  <p>${item.description}</p>
                  <p>Qty: ${item.quantity}</p>
                </div>
              </div>`
          )
          .join("")}
      </div>
      <p style="font-size:10px;margin-top:10px;">Press I to toggle</p>
    `;
  }

  private renderQuests(quests: Quest[]) {
    this.questPanel.innerHTML = `
      <h2>Quests</h2>
      ${quests
        .map(
          (quest) => `
            <div class="quest-item">
              <strong>${quest.title}</strong>
              <p>Given by ${quest.giver}</p>
              <ul>
                ${quest.stages
                  .map(
                    (stage) => `
                      <li>
                        ${stage.completed ? "✔️" : "⬜"} ${stage.description}
                      </li>
                    `
                  )
                  .join("")}
              </ul>
              <p>Reward: ${quest.reward}</p>
            </div>
          `
        )
        .join("")}
    `;
  }

  private openDialogue(node: DialogueNode) {
    this.dialogueText.textContent = node.text;
    this.dialogueChoices.innerHTML = "";
    node.choices
      .filter((choice) => (choice.condition ? choice.condition() : true))
      .forEach((choice) => {
        const button = document.createElement("button");
        button.className = "dialogue-choice";
        button.textContent = choice.text;
        button.onclick = () => {
          choice.action?.();
          if (choice.next) {
            const nextNode = dialogueGraph[choice.next];
            if (nextNode) {
              this.openDialogue(nextNode);
            }
          } else {
            this.closeDialogue();
          }
        };
        this.dialogueChoices.appendChild(button);
      });
    this.dialogueBox.style.display = "block";
    gsap.fromTo(
      this.dialogueBox,
      { autoAlpha: 0, y: 20 },
      { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" }
    );
  }

  private closeDialogue() {
    gsap.to(this.dialogueBox, {
      autoAlpha: 0,
      y: 20,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        this.dialogueBox.style.display = "none";
        useGameStore.getState().setDialogue({
          currentId: null,
          visible: false
        });
      }
    });
  }

  private toggleInventory() {
    this.inventoryVisible = !this.inventoryVisible;
    if (this.inventoryVisible) {
      this.inventoryPanel.style.display = "block";
      gsap.fromTo(
        this.inventoryPanel,
        { autoAlpha: 0, x: 20 },
        { autoAlpha: 1, x: 0, duration: 0.3, ease: "power2.out" }
      );
    } else {
      gsap.to(this.inventoryPanel, {
        autoAlpha: 0,
        x: 20,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
          this.inventoryPanel.style.display = "none";
        }
      });
    }
  }

  private getTextureDataUrl(key: string) {
    if (!this.game.textures.exists(key)) return "";
    const texture = this.game.textures.get(key);
    const source = texture.getSourceImage();
    if (source instanceof HTMLCanvasElement) {
      return source.toDataURL();
    }
    if (source instanceof HTMLImageElement) {
      return source.src;
    }
    return "";
  }

  private spawnToast(text: string) {
    const toast = document.createElement("div");
    toast.className = "hud-panel";
    toast.style.top = "50%";
    toast.style.left = "50%";
    toast.style.transform = "translate(-50%, -50%)";
    toast.style.maxWidth = "320px";
    toast.innerHTML = `<p>${text}</p>`;
    document.getElementById("ui-layer")?.appendChild(toast);
    gsap.fromTo(
      toast,
      { autoAlpha: 0, y: 30 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.35,
        ease: "power2.out",
        onComplete: () => {
          gsap.to(toast, {
            autoAlpha: 0,
            y: -20,
            duration: 0.4,
            delay: 2.5,
            ease: "power2.in",
            onComplete: () => toast.remove()
          });
        }
      }
    );
  }
}

export default UIScene;
