import {
  Component,
  OnInit,
  ElementRef,
  HostListener,
  HostBinding,
} from '@angular/core';
import * as THREE from 'three';
import TextAnimation from './text-animation';
import { TimelineMax, Power1, TweenMax } from 'gsap';
@Component({
  selector: 'app-animated-text',
  templateUrl: './animated-text.component.html',
  styleUrls: ['./animated-text.component.css'],
})
export class AnimatedTextComponent implements OnInit {
  @HostBinding('class.drag') mouseDown = false;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  textAnimation: TextAnimation;
  tl: TimelineMax;
  seekSpeed = 0.001;
  _cx: any;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.addLights();
    this.addText();
    this.update();
  }
  addText() {
    const loader = new THREE.FontLoader();
    loader.load('/assets/droid_sans_bold.typeface.js', (font) => {
      const geometry = new THREE.TextGeometry('AS THE WORLD TURNS', {
        size: 40,
        height: 12,
        curveSegments: 24,
        bevelSize: 2,
        bevelThickness: 2,
        bevelEnabled: true,
        font,
      });

      geometry.computeBoundingBox();

      let size = new THREE.Vector3();
      geometry.boundingBox.getSize(size);

      const anchorX = size.x * -0.5;
      const anchorY = size.y * -0.5;
      const anchorZ = 0;

      const matrix = new THREE.Matrix4().makeTranslation(
        anchorX,
        anchorY,
        anchorZ
      );

      geometry.applyMatrix4(matrix);

      this.tessellateRepeat(geometry, 1.0, 2);

      this.separateFaces(geometry);

      this.textAnimation = new TextAnimation(geometry);
      this.scene.add(this.textAnimation.mesh);

      this.tl = new TimelineMax({ repeat: -1, repeatDelay: 0.5, yoyo: true });
      this.tl.fromTo(
        this.textAnimation,
        4,
        { animationProgress: 0.0 },
        { animationProgress: 0.6, ease: Power1.easeInOut },
        0
      );
      this.tl.fromTo(
        this.textAnimation,
        4,
        { y: 0 },
        { y: Math.PI, ease: Power1.easeInOut },
        0
      );

      this.createTweenScrubber(this.tl);
    });
  }
  createTweenScrubber(tl: TimelineMax) {}
  separateFaces(geometry: THREE.TextGeometry) {
    const vertices = [];

    for (let i = 0; i < geometry.faces.length; i++) {
      const n = vertices.length;
      const face = geometry.faces[i];

      const a = face.a;
      const b = face.b;
      const c = face.c;

      const va = geometry.vertices[a];
      const vb = geometry.vertices[b];
      const vc = geometry.vertices[c];

      vertices.push(va.clone());
      vertices.push(vb.clone());
      vertices.push(vc.clone());

      face.a = n;
      face.b = n + 1;
      face.c = n + 2;
    }
    geometry.vertices = vertices;
    // delete geometry.__tmpVertices;
  }
  tessellateRepeat(geometry: THREE.TextGeometry, maxEdgeLength, times) {
    for (let i = 0; i < times; i++) {
      this.tessellate(geometry, maxEdgeLength);
    }
  }
  tessellate(geometry: THREE.TextGeometry, maxEdgeLength) {
    let edge;
    const faces = [];
    const faceVertexUvs = [];
    const maxEdgeLengthSquared = maxEdgeLength * maxEdgeLength;

    for (let i = 0; i < geometry.faceVertexUvs.length; i++) {
      faceVertexUvs[i] = [];
    }

    for (let i = 0; i < geometry.faces.length; i++) {
      const face = geometry.faces[i];
      if (face instanceof THREE.Face3) {
        const a = face.a;
        const b = face.b;
        const c = face.c;

        const va = geometry.vertices[a];
        const vb = geometry.vertices[b];
        const vc = geometry.vertices[c];

        const dab = va.distanceToSquared(vb);
        const dac = va.distanceToSquared(vc);
        const dbc = vb.distanceToSquared(vc);

        if (
          dab > maxEdgeLengthSquared ||
          dbc > maxEdgeLengthSquared ||
          dac > maxEdgeLengthSquared
        ) {
          const m = geometry.vertices.length;

          const triA = face.clone();
          const triB = face.clone();
          let vm;

          if (dab >= dbc && dab >= dac) {
            vm = va.clone();
            vm.lerp(vb, 0.5);

            triA.a = a;
            triA.b = m;
            triA.c = c;

            triB.a = m;
            triB.b = b;
            triB.c = c;

            if (face.vertexNormals.length === 3) {
              const vnm = face.vertexNormals[0].clone();
              vnm.lerp(face.vertexNormals[1], 0.5);
              triA.vertexNormals[1].copy(vnm);
              triB.vertexNormals[0].copy(vnm);
            }

            if (face.vertexColors.length === 3) {
              const vcm = face.vertexColors[0].clone();
              vcm.lerp(face.vertexColors[1], 0.5);

              triA.vertexColors[1].copy(vcm);
              triB.vertexColors[0].copy(vcm);
            }

            edge = 0;
          } else if (dbc >= dab && dbc >= dac) {
            vm = vb.clone();
            vm.lerp(vc, 0.5);

            triA.a = a;
            triA.b = b;
            triA.c = m;

            triB.a = m;
            triB.b = c;
            triB.c = a;

            if (face.vertexNormals.length === 3) {
              const vnm = face.vertexNormals[1].clone();
              vnm.lerp(face.vertexNormals[2], 0.5);

              triA.vertexNormals[2].copy(vnm);

              triB.vertexNormals[0].copy(vnm);
              triB.vertexNormals[1].copy(face.vertexNormals[2]);
              triB.vertexNormals[2].copy(face.vertexNormals[0]);
            }

            if (face.vertexColors.length === 3) {
              const vcm = face.vertexColors[1].clone();
              vcm.lerp(face.vertexColors[2], 0.5);

              triA.vertexColors[2].copy(vcm);

              triB.vertexColors[0].copy(vcm);
              triB.vertexColors[1].copy(face.vertexColors[2]);
              triB.vertexColors[2].copy(face.vertexColors[0]);
            }
            edge = 1;
          } else {
            vm = va.clone();
            vm.lerp(vc, 0.5);

            triA.a = a;
            triA.b = b;
            triA.c = m;

            triB.a = m;
            triB.b = b;
            triB.c = c;

            if (face.vertexNormals.length === 3) {
              const vnm = face.vertexNormals[0].clone();
              vnm.lerp(face.vertexNormals[2], 0.5);

              triA.vertexNormals[2].copy(vnm);
              triA.vertexNormals[0].copy(vnm);
            }

            if (face.vertexColors.length === 3) {
              const vcm = face.vertexColors[0].clone();
              vcm.lerp(face.vertexColors[2], 0.5);

              triA.vertexColors[2].copy(vcm);
              triB.vertexColors[0].copy(vcm);
            }

            edge = 2;
          }

          faces.push(triA, triB);
          geometry.vertices.push(vm);

          for (let j = 0; j < geometry.faceVertexUvs.length; j++) {
            if (geometry.faceVertexUvs[j].length > 0) {
              const uvs = geometry.faceVertexUvs[j][i];

              const uvA = uvs[0];
              const uvB = uvs[1];
              const uvC = uvs[2];

              let uvsTriA, uvsTriB;

              //AB
              if (edge === 0) {
                const uvM = uvA.clone();
                uvM.lerp(uvB, 0.5);

                uvsTriA = [uvA.clone(), uvM.clone(), uvC.clone()];
                uvsTriB = [uvM.clone(), uvB.clone(), uvC.clone()];
              } else if (edge === 1) {
                //BC
                const uvM = uvB.clone();
                uvM.lerp(uvC, 0.5);

                uvsTriA = [uvA.clone(), uvB.clone(), uvM.clone()];
                uvsTriB = [uvM.clone(), uvC.clone(), uvA.clone()];
              } else {
                //AC
                const uvM = uvA.clone();
                uvM.lerp(uvC, 0.5);

                uvsTriA = [uvA.clone(), uvB.clone(), uvM.clone()];
                uvsTriB = [uvM.clone(), uvB.clone(), uvC.clone()];
              }

              faceVertexUvs[j].push(uvsTriA, uvsTriB);
            }
          }
        } else {
          faces.push(face);

          for (let j = 0; j < geometry.faceVertexUvs.length; j++) {
            geometry.faceVertexUvs[j].push(geometry.faceVertexUvs[j][1]);
          }
        }
      }
    }

    geometry.faces = faces;
    geometry.faceVertexUvs = faceVertexUvs;
  }

  stop() {
    TweenMax.to(this.tl, 1, { timeScale: 0 });
  }
  resume() {
    TweenMax.to(this.tl, 1, { timeScale: 1 });
  }

  seek(dx) {
    const progress = this.tl.progress();
    const p = THREE.MathUtils.clamp(progress + dx * this.seekSpeed, 0, 1);
    this.tl.progress(p);
  }
  addLights() {
    const light = new THREE.DirectionalLight();
    light.position.set(0, 0, 1);
    this.scene.add(light);
  }
  initTHREE() {
    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setClearColor(0x000000);
    this.renderer.setSize(width, height);
    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 10, 100000);
    this.camera.position.set(0, 0, 600);
  }
  update() {
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.update.bind(this));
  }

  @HostListener('mousedown', ['$event'])
  mousedown(evt) {
    this.mouseDown = true;
    this._cx = evt.clientX;
    this.stop();
  }
  @HostListener('mouseup', ['$event'])
  mouseup(evt) {
    this.mouseDown = false;
    this.resume();
  }
  @HostListener('mousemove', ['$event'])
  mouseMove(evt) {
    if (this.mouseDown) {
      const cx = evt.clientX;
      const dx = cx - this._cx;
      this._cx = cx;

      this.seek(dx);
    }
  }

  @HostListener('window:resize')
  resize() {
    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;
    this.camera.aspect = width / height;

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
