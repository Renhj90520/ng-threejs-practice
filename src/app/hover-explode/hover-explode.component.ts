import { Component, OnInit, ElementRef, HostListener } from "@angular/core";
import * as THREE from "three";

@Component({
  selector: "app-hover-explode",
  templateUrl: "./hover-explode.component.html",
  styleUrls: ["./hover-explode.component.css"]
})
export class HoverExplodeComponent implements OnInit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  bitmap = [];
  BITMAP_SKIP = 1;
  color1 = [0 / 255, 110 / 255, 255 / 255];
  color2 = [0 / 255, 255 / 255, 140 / 255];
  data =
    "#000000000000000000011110000000000000000000" +
    "#000000000000000011111111110000000000000000" +
    "#000000000000001111111111111100000000000000" +
    "#000000000000011111111111111110000000000000" +
    "#000000000000111111111111111111000000000000" +
    "#000000000001111111111111111111100000000000" +
    "#000000000011111111111111111111110000000000" +
    "#000000000011111111111111111111110000000000" +
    "#000000000111111111111111111111111000000000" +
    "#000000000111111111111111111111111000000000" +
    "#000000001111111111111111111111111100000000" +
    "#000000001111111111111111111111111100000000" +
    "#000000001111111111111111111111111100000000" +
    "#000000001111111111111111111111111100000000" +
    "#000000001111111111111111111111111100000000" +
    "#000000000111111111111111111111111000000000" +
    "#000000000111111111111111111111111000000000" +
    "#000000000111111111111111111111111000000000" +
    "#000000000011111111111111111111110000000000" +
    "#000000000011111111111111111111110000000000" +
    "#000000000001111111111111111111100000000000" +
    "#000000000001111111111111111111100000000000" +
    "#000000000000111111111111111111000000000000" +
    "#000000000000111111111111111110000000000000" +
    "#000000000000011111111111111110000000000000" +
    "#000000000000001111111111111100000000000000" +
    "#000000000000001111111111111100000000000000" +
    "#000000000000001111111111111000000000000000" +
    "#000000000000000111111111111000000000000000" +
    "#000000000000000111111111111000000000000000" +
    "#000000000000000111111111111000000000000000" +
    "#000000000000000111111111111000000000000000" +
    "#000000000000000011111111110000000000000000" +
    "#000000000000000010000000010000000000000000" +
    "#000000000000000011111111110000000000000000" +
    "#000000000000000010000000010000000000000000" +
    "#000000000000000011111111110000000000000000" +
    "#000000000000000010000000010000000000000000" +
    "#000000000000000011111111110000000000000000" +
    "#000000000000000000100001000000000000000000" +
    "#000000000000000000110011000000000000000000" +
    "#000000000000000000011110000000000000000000";
  objectArray = [];
  animationQueue = [];
  ANIMATION_FRAME_LENGTH = 30;
  mouse = new THREE.Vector3(10000, 10000, -2);
  mouseScaled = new THREE.Vector3(10000, 10000, -2);
  INTERACT_DISTANCE = 2.5;
  width: any;
  height: any;
  fov = 90;
  viewWidth;
  viewHeight;
  screenAspectRatio;
  cameraPos = [0, 0, 30];
  constructor(private el: ElementRef) {}

  ngOnInit() {
    for (let i = 0; i < this.data.length; i++) {
      const d = this.data[i];
      if (d === "#") {
        this.bitmap.push([]);
      } else {
        this.bitmap[this.bitmap.length - 1].push(+d);
      }
    }
    this.initThree();
    this.addParticle();
    this.update();
  }
  addParticle() {
    const xOffset = -this.bitmap[0].length / (this.BITMAP_SKIP * 2);
    const yOffset = this.bitmap.length / (this.BITMAP_SKIP * 2);
    for (let i = 0; i < this.bitmap.length; i += this.BITMAP_SKIP) {
      const picArr = this.bitmap[i];
      for (let j = 0; j < picArr.length; j += this.BITMAP_SKIP) {
        const pic = picArr[j];
        if (pic === 1) {
          const planeGeo = new THREE.PlaneGeometry(1, 1);
          const circleGeo = new THREE.CircleGeometry(1, 5);
          const frac = i / this.bitmap.length;

          const planeMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(
              this.color1[0] * frac + this.color2[0] * (1 - frac),
              this.color1[1] * frac + this.color2[1] * (1 - frac),
              this.color1[2] * frac + this.color2[2] * (1 - frac)
            ),
            transparent: true,
            opacity: THREE.Math.randFloat(0.4, 0.6),
            side: THREE.DoubleSide
          });

          const circleMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(1, 1, 1),
            transparent: true,
            opacity: THREE.Math.randFloat(0.8, 1),
            side: THREE.DoubleSide
          });

          const planeMesh = new THREE.Mesh(planeGeo, planeMat);
          planeMesh.position.set(
            xOffset + j / this.BITMAP_SKIP,
            yOffset - i / this.BITMAP_SKIP,
            0
          );
          const randWidth = THREE.Math.randFloat(0.6, 1.2);
          const randHeight = randWidth;
          planeMesh.scale.set(randWidth, randHeight, 1);
          this.scene.add(planeMesh);
          this.objectArray.push([planeMesh, false]);

          const circleMesh = new THREE.Mesh(circleGeo, circleMat);
          circleMesh.position.set(
            xOffset + j / this.BITMAP_SKIP + THREE.Math.randFloat(-0.5, 0.5),
            yOffset - i / this.BITMAP_SKIP + THREE.Math.randFloat(-0.5, 0.5),
            0.1
          );
          const randRadius = THREE.Math.randFloat(0.05, 0.1);
          circleMesh.scale.set(randRadius, randRadius, 1);
          this.scene.add(circleMesh);
          this.objectArray.push([circleMesh, false]);
        }
      }
    }
  }
  initThree() {
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;

    this.screenAspectRatio = this.width / this.height;
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setClearColor(0x212121, 0);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.viewHeight =
      2 * Math.tan(THREE.Math.degToRad(this.fov / 2)) * this.cameraPos[2];
    this.viewWidth = this.viewHeight * this.screenAspectRatio;
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      this.width / this.height,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 30);
    this.camera.lookAt(this.scene.position);
  }
  update() {
    this.renderer.render(this.scene, this.camera);
    this.animate();
    requestAnimationFrame(this.update.bind(this));
  }
  animate() {
    while (this.animationQueue.length > 0) {
      const obj_idx = this.animationQueue[0][0];
      const ani_frame = this.animationQueue[0][1];
      if (ani_frame > this.ANIMATION_FRAME_LENGTH) {
        this.objectArray[obj_idx][1] = false;
        this.animationQueue.shift();
      } else {
        break;
      }
    }

    for (let i = 0; i < this.objectArray.length; i++) {
      const obj = this.objectArray[i][0];
      const isAnimating = this.objectArray[i][1];
      if (!isAnimating) {
        const px = obj.position.x;
        const py = obj.position.y;
        const dist = Math.sqrt(
          Math.pow(px - this.mouseScaled.x, 2) +
            Math.pow(py - this.mouseScaled.y, 2)
        );

        if (dist < this.INTERACT_DISTANCE) {
          const startPosVector = obj.position.clone();
          const mouseRepelVector = new THREE.Vector3()
            .subVectors(startPosVector, this.mouseScaled)
            .multiplyScalar(
              THREE.Math.randFloat(
                this.INTERACT_DISTANCE + 0.5,
                this.INTERACT_DISTANCE + 2
              ) - dist
            );
          const endPosVector = new THREE.Vector3().addVectors(
            startPosVector,
            mouseRepelVector
          );

          this.animationQueue.push([i, 0, startPosVector, endPosVector]);
          this.objectArray[i][1] = true;
        }
      }
    }

    for (let i = 0; i < this.animationQueue.length; i++) {
      const obj = this.objectArray[this.animationQueue[i][0]][0];
      const ani_frame = this.animationQueue[i][1];
      const startPosVector = this.animationQueue[i][2];
      const endPosVector = this.animationQueue[i][3];
      const curPosVector = new THREE.Vector3();
      let frac =
        1 -
        Math.abs(ani_frame - this.ANIMATION_FRAME_LENGTH / 2) /
          (this.ANIMATION_FRAME_LENGTH / 2);

      frac = this.easeOutQuad(frac);
      curPosVector.lerpVectors(startPosVector, endPosVector, frac);

      obj.position.set(curPosVector.x, curPosVector.y, curPosVector.z);
      this.animationQueue[i][1] += 1;
    }
    this.mouse = new THREE.Vector3(10000, 10000, -2);
    this.mouseScaled = new THREE.Vector3(10000, 10000, -2);
  }
  easeOutQuad(frac: number): number {
    return frac * (2 - frac);
  }

  @HostListener("mousemove", ["$event"])
  mousemove(evt) {
    this.mouse.x = evt.clientX;
    this.mouse.y = evt.clientY;

    this.mouseScaled.x =
      (this.mouse.x * this.viewWidth) / this.width - this.viewWidth / 2;

    this.mouseScaled.y =
      (-this.mouse.y * this.viewHeight) / this.height + this.viewHeight / 2;
  }
}
