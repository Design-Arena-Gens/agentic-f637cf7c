import Phaser from "phaser";
import { useGameStore } from "../../state/GameStore";

type EnemyPhase = "idle" | "chasing" | "attacking" | "defeated";

class Enemy extends Phaser.Physics.Arcade.Sprite {
  private enemyState: EnemyPhase = "idle";

  private target: Phaser.Physics.Arcade.Sprite | null = null;

  private health = 80;

  private detectionRadius = 180;

  private attackCooldown = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "enemy_shade");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setOrigin(0.5, 0.5);
    this.setScale(1.1);
    this.setCircle(18, 6, 6);
  }

  setTarget(target: Phaser.Physics.Arcade.Sprite) {
    this.target = target;
  }

  takeDamage(amount: number) {
    if (this.enemyState === "defeated") return;
    this.health -= amount;
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 1, to: 0.4 },
      yoyo: true,
      duration: 120,
      repeat: 2
    });
    if (this.health <= 0) {
      this.defeat();
    }
  }

  private defeat() {
    this.enemyState = "defeated";
    this.scene.time.delayedCall(150, () => {
      this.disableBody(true, true);
      useGameStore.getState().setFlag("shadeDefeated", true);
      useGameStore.getState().setQuestStageComplete("echoes-of-vale", "cleanse-cavern");
      useGameStore.getState().awardExperience(120);
    });
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.enemyState === "defeated") return;
    if (!this.target) return;
    const distance = Phaser.Math.Distance.BetweenPoints(this, this.target);
    this.attackCooldown = Math.max(0, this.attackCooldown - delta);

    if (distance < this.detectionRadius) {
      this.enemyState = "chasing";
      const direction = new Phaser.Math.Vector2(
        this.target.x - this.x,
        this.target.y - this.y
      ).normalize();
      this.setVelocity(direction.x * 60, direction.y * 60);
      if (distance < 38 && this.attackCooldown <= 0) {
        this.enemyState = "attacking";
        this.attackCooldown = 1200;
        this.scene.time.delayedCall(200, () => {
          if (Phaser.Math.Distance.BetweenPoints(this, this.target!) < 50) {
            useGameStore.getState().damagePlayer(12);
          }
        });
      }
    } else {
      this.enemyState = "idle";
      this.setVelocity(0, 0);
    }
  }
}

export default Enemy;
