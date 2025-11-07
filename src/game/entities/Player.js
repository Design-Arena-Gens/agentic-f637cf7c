import Phaser from "phaser";
import HeroRig from "../animation/HeroRig";
import { soundscape } from "../../audio/soundscape";
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, config) {
        super(scene, x, y, "hero_idle");
        this.direction = new Phaser.Math.Vector2(0, 0);
        this.attackCooldown = 0;
        this.isAttacking = false;
        this.movementSpeed = config.speed;
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setSize(24, 24);
        this.setOffset(4, 8);
        this.setVisible(false);
        this.heroRig = new HeroRig(scene, x, y);
        const keyboard = scene.input.keyboard;
        if (!keyboard) {
            throw new Error("Keyboard plugin not available");
        }
        this.keyboard = keyboard;
        this.cursors = keyboard.createCursorKeys();
        this.keyAttack = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.wasd = keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D
        });
    }
    update(time, delta) {
        this.direction.set(0, 0);
        if (this.keyboard.checkDown(this.cursors.left, 0) || this.keyboard.checkDown(this.wasd.a, 0)) {
            this.direction.x = -1;
        }
        else if (this.keyboard.checkDown(this.cursors.right, 0) || this.keyboard.checkDown(this.wasd.d, 0)) {
            this.direction.x = 1;
        }
        if (this.keyboard.checkDown(this.cursors.up, 0) || this.keyboard.checkDown(this.wasd.w, 0)) {
            this.direction.y = -1;
        }
        else if (this.keyboard.checkDown(this.cursors.down, 0) || this.keyboard.checkDown(this.wasd.s, 0)) {
            this.direction.y = 1;
        }
        this.direction.normalize();
        if (this.direction.lengthSq() > 0) {
            this.setVelocity(this.direction.x * this.movementSpeed, this.direction.y * this.movementSpeed);
            this.heroRig.setPose("run");
            this.heroRig.setFlipX(this.direction.x < 0);
            if (time % 250 < delta) {
                soundscape.playFootstep();
            }
        }
        else {
            this.setVelocity(0, 0);
            if (!this.isAttacking) {
                this.heroRig.setPose("idle");
            }
        }
        this.heroRig.setPosition(this.x, this.y);
        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }
        if (Phaser.Input.Keyboard.JustDown(this.keyAttack) && this.attackCooldown <= 0) {
            this.attackCooldown = 600;
            this.isAttacking = true;
            this.heroRig.setPose("attack");
            this.scene.time.delayedCall(400, () => {
                this.isAttacking = false;
                this.heroRig.setPose("idle");
            });
        }
        this.heroRig.update(delta);
    }
    isAttackActive() {
        return this.isAttacking;
    }
    getAttackArc() {
        const radius = 42;
        const offsetX = this.direction.x >= 0 ? radius / 2 : -radius / 2;
        return new Phaser.Geom.Circle(this.x + offsetX, this.y, radius);
    }
    killPose() {
        this.heroRig.killPose();
    }
}
export default Player;
