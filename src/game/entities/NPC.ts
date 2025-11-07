import Phaser from "phaser";

class NPC extends Phaser.Physics.Arcade.Sprite {
  dialogueId: string;

  name: string;

  private idleOffset = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    spriteKey: string,
    dialogueId: string,
    name: string
  ) {
    super(scene, x, y, spriteKey);
    this.dialogueId = dialogueId;
    this.name = name;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setImmovable(true);
    this.setSize(28, 32);
    this.setOffset(2, 2);
    this.setScale(1);
  }

  update(delta: number) {
    this.idleOffset += delta / 1000;
    this.setY(this.y + Math.sin(this.idleOffset * 1.5) * 0.2);
  }
}

export default NPC;
