import {
  Bone,
  BoneData,
  Physics,
  Skeleton,
  SkeletonData,
  Skin
} from "@esotericsoftware/spine-core";
import Phaser from "phaser";

type HeroPose = "idle" | "run" | "attack";

const deg = Phaser.Math.RadToDeg;
const rad = Phaser.Math.DegToRad;

class HeroRig {
  private skeleton: Skeleton;

  private bones: Record<string, Bone>;

  private container: Phaser.GameObjects.Container;

  private coreSprite: Phaser.GameObjects.Sprite;

  private leftArm: Phaser.GameObjects.Rectangle;

  private rightArm: Phaser.GameObjects.Rectangle;

  private leftLeg: Phaser.GameObjects.Rectangle;

  private rightLeg: Phaser.GameObjects.Rectangle;

  private elapsed = 0;

  private pose: HeroPose = "idle";

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const data = this.buildSkeletonData();
    this.skeleton = new Skeleton(data);
    this.skeleton.updateWorldTransform(Physics.pose);
    this.bones = {
      root: this.requireBone("root"),
      torso: this.requireBone("torso"),
      head: this.requireBone("head"),
      leftArm: this.requireBone("leftArm"),
      rightArm: this.requireBone("rightArm"),
      leftLeg: this.requireBone("leftLeg"),
      rightLeg: this.requireBone("rightLeg")
    };

    this.container = scene.add.container(x, y);
    this.coreSprite = scene.add.sprite(0, -16, "hero_idle").setOrigin(0.5, 0.5);
    this.coreSprite.setScale(0.5);

    this.leftArm = scene.add
      .rectangle(-6, -8, 4, 18, 0x4a6fb0)
      .setOrigin(0.5, 0);
    this.rightArm = scene.add.rectangle(6, -8, 4, 18, 0x4a6fb0).setOrigin(0.5, 0);
    this.leftLeg = scene.add.rectangle(-4, 12, 4, 18, 0x1f2640).setOrigin(0.5, 0);
    this.rightLeg = scene.add.rectangle(4, 12, 4, 18, 0x1f2640).setOrigin(0.5, 0);

    this.container.add([
      this.leftLeg,
      this.rightLeg,
      this.coreSprite,
      this.leftArm,
      this.rightArm
    ]);
  }

  private requireBone(name: string): Bone {
    const bone = this.skeleton.findBone(name);
    if (!bone) throw new Error(`Missing bone ${name}`);
    return bone;
  }

  private buildSkeletonData(): SkeletonData {
    const root = new BoneData(0, "root", null);
    root.x = 0;
    root.y = 0;

    const torso = new BoneData(1, "torso", root);
    torso.length = 20;
    torso.y = 24;

    const head = new BoneData(2, "head", torso);
    head.length = 12;
    head.y = 16;

    const leftArm = new BoneData(3, "leftArm", torso);
    leftArm.length = 18;
    leftArm.x = -8;
    leftArm.y = 12;

    const rightArm = new BoneData(4, "rightArm", torso);
    rightArm.length = 18;
    rightArm.x = 8;
    rightArm.y = 12;

    const leftLeg = new BoneData(5, "leftLeg", root);
    leftLeg.length = 18;
    leftLeg.x = -4;
    leftLeg.y = 0;

    const rightLeg = new BoneData(6, "rightLeg", root);
    rightLeg.length = 18;
    rightLeg.x = 4;
    rightLeg.y = 0;

    const skeletonData = new SkeletonData();
    skeletonData.name = "hero-rig";
    skeletonData.bones = [root, torso, head, leftArm, rightArm, leftLeg, rightLeg];
    const skin = new Skin("default");
    skeletonData.skins = [skin];
    skeletonData.defaultSkin = skin;
    return skeletonData;
  }

  setPose(pose: HeroPose) {
    if (this.pose === pose) return;
    this.pose = pose;
    if (pose === "attack") {
      this.coreSprite.setTexture("hero_attack");
    } else {
      this.coreSprite.setTexture("hero_idle");
    }
  }

  setPosition(x: number, y: number) {
    this.container.setPosition(x, y);
  }

  setFlipX(value: boolean) {
    this.container.setScale(value ? -1 : 1, 1);
  }

  killPose() {
    this.leftArm.fillColor = 0x2b2e4b;
    this.rightArm.fillColor = 0x2b2e4b;
    this.leftLeg.fillColor = 0x2b2e4b;
    this.rightLeg.fillColor = 0x2b2e4b;
    this.coreSprite.setTint(0xa1102a);
  }

  update(delta: number) {
    this.elapsed += delta / 1000;
    const wave = Math.sin(this.elapsed * 6);
    const step = Math.sin(this.elapsed * 9);

    switch (this.pose) {
      case "run":
        this.bones.leftArm.rotation = deg(wave * 0.4);
        this.bones.rightArm.rotation = deg(-wave * 0.4);
        this.bones.leftLeg.rotation = deg(-step * 0.6);
        this.bones.rightLeg.rotation = deg(step * 0.6);
        break;
      case "attack":
        this.bones.leftArm.rotation = -90;
        this.bones.rightArm.rotation = -30 + deg(wave * 0.2);
        this.bones.leftLeg.rotation = -10;
        this.bones.rightLeg.rotation = 10;
        break;
      case "idle":
      default:
        this.bones.leftArm.rotation = deg(Math.sin(this.elapsed * 2) * 0.1);
        this.bones.rightArm.rotation = deg(Math.sin(this.elapsed * 2 + Math.PI) * 0.1);
        this.bones.leftLeg.rotation = -4;
        this.bones.rightLeg.rotation = 4;
        break;
    }

    this.bones.torso.rotation = deg(Math.sin(this.elapsed * 1.5) * 0.05);
    this.bones.head.rotation = deg(Math.sin(this.elapsed) * 0.03);

    this.skeleton.updateWorldTransform(Physics.pose);
    this.applyTransforms();
  }

  private applyTransforms() {
    const apply = (
      display: Phaser.GameObjects.Rectangle,
      bone: Bone,
      offsetY = 0
    ) => {
      display.setPosition(bone.worldX, -bone.worldY + offsetY);
      display.setRotation(rad(bone.getWorldRotationX()));
    };
    apply(this.leftArm, this.bones.leftArm, -20);
    apply(this.rightArm, this.bones.rightArm, -20);
    apply(this.leftLeg, this.bones.leftLeg, -4);
    apply(this.rightLeg, this.bones.rightLeg, -4);
  }
}

export default HeroRig;
