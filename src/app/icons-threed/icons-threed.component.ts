import {
  Component,
  OnInit,
  ElementRef,
  HostListener,
  ViewChild
} from "@angular/core";
import * as THREE from "three";
import * as createjs from "createjs-module";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TimelineMax, Power2, Expo, Power3, TweenMax } from "gsap";
import * as WebFont from "webfontloader";
@Component({
  selector: "app-icons-threed",
  templateUrl: "./icons-threed.component.html",
  styleUrls: ["./icons-threed.component.css"]
})
export class IconsThreedComponent implements OnInit {
  @ViewChild("stage") stageEl;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  width;
  height;

  SIZE = 256;
  matrixLength = 8;
  CANVAS_W = 160;
  CANVAS_H = 40;
  WORD_LIST = ["WebGL", "HTML5", "three.js"];
  particleList = [];
  wordIndex = 0;

  hue = 0.6;
  controls: OrbitControls;
  wrapper: THREE.Object3D;
  bg: THREE.Mesh;
  constructor() {}

  ngOnInit() {
    this.preLoad();
  }
  preLoad() {
    WebFont.load({
      custom: {
        families: ["Source Code Pro", "FontAwesome"],
        urls: [
          "https://fonts.googleapis.com/css?family=Source+Code+Pro:600",
          "https://netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css"
        ],
        testStrings: {
          FontAwesome: "\uf001"
        }
      },
      active: () => {
        this.initTHREE();
        this.addLights();
        this.addBackground();
        this.addWords();
        this.addParticleCloud();
        this.addLogo();
        this.update();
      }
    });
  }
  addLogo() {
    const canvas = document.createElement("canvas");
    canvas.setAttribute("width", this.CANVAS_W + "px");
    canvas.setAttribute("height", this.CANVAS_H + "px");

    const stage = new createjs.Stage(canvas);
    const text1 = new createjs.Text(
      this.WORD_LIST[this.wordIndex],
      "30px Source Code Pro",
      "#fff"
    );
    this.wordIndex++;
    if (this.wordIndex >= this.WORD_LIST.length) {
      this.wordIndex = 0;
    }
    text1.textAlign = "center";
    text1.x = this.CANVAS_W / 2;
    stage.addChild(text1);
    stage.update();

    const timeline = new TimelineMax({
      onComplete: () => {
        const tl = new TimelineMax();
        tl.to(".coverBlack", 1, {
          css: { opacity: 1 }
        });
        tl.call(() => {
          this.addLogo();
        });
      }
    });
    const ctx = canvas.getContext("2d");
    for (let i = 0; i < this.particleList.length; i++) {
      this.particleList[i].visible = false;
    }

    const pixcelColors = ctx.getImageData(0, 0, this.CANVAS_W, this.CANVAS_H)
      .data;

    const existDotList = [];
    for (let i = 0; i < this.CANVAS_W; i++) {
      existDotList[i] = [];
      for (let j = 0; j < this.CANVAS_H; j++) {
        const flag = pixcelColors[(i + j * this.CANVAS_W) * 4 + 3] === 0;
        existDotList[i][j] = flag;
      }
    }

    let cnt = 0;
    const max = this.CANVAS_W * this.CANVAS_H;
    for (let i = 0; i < this.CANVAS_W; i++) {
      for (let j = 0; j < this.CANVAS_H; j++) {
        if (existDotList[i][j]) continue;

        const word = this.particleList[cnt];
        if (word) {
          word.material.color.setHSL(
            this.hue + ((i * canvas.height) / max - 0.5) * 0.2,
            0.5,
            0.6 + 0.4 * Math.random()
          );

          word.material.blending = THREE.AdditiveBlending;
          this.wrapper.add(word);

          const toObj = {
            x: (i - canvas.width / 2) * 30,
            y: (canvas.height / 2 - j) * 30,
            z: 0
          };

          const fromObj = {
            x: 2000 * (Math.random() - 0.5) - 500,
            y: 1000 * (Math.random() - 0.5),
            z: 10000
          };

          word.position.set(fromObj.x, fromObj.y, fromObj.z);
          const toRotationObj = {
            z: 0
          };
          const fromRotationObj = {
            z: 10 * Math.PI * (Math.random() - 0.5)
          };
          word.rotation.z = fromRotationObj.z;
          const delay =
            Power2.easeInOut.getRatio(cnt / 1600) * 3.0 + 1.5 * Math.random();

          timeline.to(
            word.rotation,
            6,
            {
              z: toRotationObj.z,
              ease: Power2.easeInOut
            },
            delay
          );

          word.visible = false;
          timeline.set(word, { visible: true }, delay);
          timeline.to(
            word.position,
            7,
            {
              bezier: [
                fromObj,
                {
                  x: toObj.x / 2 + 300,
                  y: (fromObj.y + toObj.y) / 2 + 500 * Math.random(),
                  z: (fromObj.z + toObj.z) / 2
                },
                toObj
              ],
              delay: delay,
              ease: Expo.easeInOut
            },
            0
          );
        }

        cnt++;
      }
    }

    this.wrapper.position.z = -5000;
    timeline.to(
      this.wrapper.position,
      12,
      {
        z: 6000,
        ease: Power3.easeIn
      },
      0
    );

    if (Math.random() < 0.3) {
      timeline.set(this.camera.position, { x: 200, y: -1200, z: 1000 }, 0);
      timeline.to(
        this.camera.position,
        14,
        {
          x: 0,
          y: 0,
          z: 5000,
          ease: Power3.easeInOut
        },
        0
      );

      timeline.set(this.camera, { fov: 90 }, 0);
      timeline.to(this.camera, 14, { fov: 45, ease: Power3.easeInOut }, 0);
    } else if (Math.random() < 0.5) {
      timeline.set(this.camera.position, { x: 100, y: 1000, z: 1000 }, 0);
      timeline.to(
        this.camera.position,
        14,
        {
          x: 0,
          y: 0,
          z: 5000,
          ease: Power3.easeInOut
        },
        0
      );
    } else {
      timeline.set(this.camera.position, { x: -3000, y: 3000, z: 0 }, 0);
      timeline.to(
        this.camera.position,
        15,
        {
          x: 0,
          y: 0,
          z: 5000,
          ease: Power3.easeInOut
        },
        0
      );
    }

    timeline.to(".coverBlack", 1, { css: { opacity: 0 } }, 0);

    if (Math.random() < 0.3) {
      timeline.timeScale(3);
      timeline.addCallback(() => {
        TweenMax.to(timeline, 1.0, { timeScale: 0.05, ease: Power2.easeInOut });
        TweenMax.to(timeline, 0.5, {
          timeScale: 3.0,
          delay: 3.5,
          ease: Power2.easeInOut
        });
        TweenMax.to(timeline, 0.5, {
          timeScale: 0.05,
          delay: 4,
          ease: Power2.easeInOut
        });
        TweenMax.to(timeline, 2, {
          timeScale: 5,
          delay: 9,
          ease: Power2.easeIn
        });
      }, 3.5);
    } else if (Math.random() < 0.5) {
      timeline.timeScale(6);
      TweenMax.to(timeline, 4.0, {
        timeScale: 0.005,
        ease: Power2.easeOut
      });
      TweenMax.to(timeline, 4, {
        timeScale: 2,
        ease: Power2.easeIn,
        delay: 5
      });
    } else {
      timeline.timeScale(1);
    }

    (this.bg.material as THREE.MeshBasicMaterial).color.setHSL(
      this.hue,
      1,
      0.5
    );
    this.hue += 0.2;
    if (this.hue >= 1.0) {
      this.hue = 0.0;
    }
  }
  addParticleCloud() {
    const geometry = new THREE.BufferGeometry();
    const numParticles = 50000;
    const Size = 10000;

    const positions = new Float32Array(numParticles * 3);
    for (let i = 0; i < numParticles; i++) {
      positions[i * 3] = Size * (Math.random() - 0.5);
      positions[i * 3 + 1] = Size * (Math.random() - 0.5);
      positions[i * 3 + 2] = Size * (Math.random() - 0.5);
    }
    geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));

    const texture = new THREE.TextureLoader().load(
      "/assets/images/fire_particle.png"
    );
    const material = new THREE.PointsMaterial({
      size: 30,
      color: 0x444444,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: false,
      map: texture
    });
    const mesh = new THREE.Points(geometry, material);
    mesh.position.set(0, 0, 0);
    this.scene.add(mesh);
  }
  addWords() {
    this.wrapper = new THREE.Object3D();
    this.scene.add(this.wrapper);

    const container = new createjs.Container();
    for (let i = 0; i < this.matrixLength * this.matrixLength; i++) {
      const char = String.fromCharCode(61730 + i);
      const text2 = new createjs.Text(char, "200px FontAwesome", "#fff");
      text2.textBaseline = "middle";
      text2.textAlign = "center";
      text2.x = this.SIZE * (i % this.matrixLength) + this.SIZE / 2;
      text2.y = this.SIZE * Math.floor(i / this.matrixLength) + this.SIZE / 2;
      container.addChild(text2);
    }
    container.cache(
      0,
      0,
      this.SIZE * this.matrixLength,
      this.SIZE * this.matrixLength
    );

    const cacheUrl = container.getCacheDataURL();
    const image = new Image();
    image.src = cacheUrl;
    const texture = new THREE.Texture(image);
    texture.needsUpdate = true;

    // ------------------------------
    // パーティクルの作成
    // ------------------------------
    const ux = 1 / this.matrixLength;
    const uy = 1 / this.matrixLength;
    this.particleList = [];
    for (let i = 0; i < this.CANVAS_W; i++) {
      for (let j = 0; j < this.CANVAS_H; j++) {
        const ox = (this.matrixLength * Math.random()) >> 0;
        const oy = (this.matrixLength * Math.random()) >> 0;

        const geometry = new THREE.PlaneGeometry(40, 40, 1, 1);
        this.change_uvs(geometry, ux, uy, ox, oy);
        const material = new THREE.MeshLambertMaterial({
          color: 0xffffff,
          map: texture,
          transparent: true,
          side: THREE.DoubleSide
        });
        material.blending = THREE.AdditiveBlending;

        const word = new THREE.Mesh(geometry, material);
        this.wrapper.add(word);
        this.particleList.push(word);
      }
    }
  }
  change_uvs(
    geometry: THREE.PlaneGeometry,
    unitx: number,
    unity: number,
    offsetX: number,
    offsetY: number
  ) {
    const faceVertexUvs = geometry.faceVertexUvs[0];
    for (let i = 0; i < faceVertexUvs.length; i++) {
      const uvs = faceVertexUvs[i];
      for (let j = 0; j < uvs.length; j++) {
        const uv = uvs[j];
        uv.x = (uv.x + offsetX) * unitx;
        uv.y = (uv.y + offsetY) * unity;
      }
    }
  }
  addBackground() {
    const plane = new THREE.PlaneBufferGeometry(50000, 50000, 1, 1);
    const bgTexture = new THREE.TextureLoader().load("/assets/images/bg.png");
    const mat = new THREE.MeshBasicMaterial({
      map: bgTexture
    });
    this.bg = new THREE.Mesh(plane, mat);
    this.bg.position.z = -10000;
    this.scene.add(this.bg);
  }
  addLights() {
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 1, 1).normalize();
    this.scene.add(light);
  }
  initTHREE() {
    this.width = this.stageEl.nativeElement.clientWidth;
    this.height = this.stageEl.nativeElement.clientHeight;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      1,
      100000
    );

    this.camera.position.z = 5000;
    this.camera.lookAt(this.scene.position);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });

    this.renderer.setClearColor(0x0);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.stageEl.nativeElement.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }
  update() {
    this.renderer.render(this.scene, this.camera);
    this.controls.update();

    this.camera.lookAt(this.scene.position);
    const vec = this.camera.position.clone();
    vec.negate();
    vec.normalize();
    vec.multiplyScalar(10000);
    this.bg.position.copy(vec);
    this.bg.lookAt(this.camera.position);
    requestAnimationFrame(this.update.bind(this));
  }

  @HostListener("window:resize")
  resize() {
    this.width = this.stageEl.nativeElement.clientWidth;
    this.height = this.stageEl.nativeElement.clientHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }
}
