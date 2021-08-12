import { Component, ElementRef, OnInit } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

@Component({
  selector: 'app-duo',
  templateUrl: './duo.component.html',
  styleUrls: ['./duo.component.css'],
})
// https://ycwhk.blogspot.com/2020/09/threejs-lenticular.html
export class DuoComponent implements OnInit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;

  controls;

  width;
  height;

  W = 10;
  H = 10;
  SW = this.W * 20;
  SH = this.H * 20;

  IMG_URLS = ['/assets/images/portrait1.jfif', '/assets/images/portrait2.jfif'];

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.initTHREE();
    this.addLights();
    this.addPictures();
  }
  addLights() {
    for (const { color, intensity, x, y, z } of [
      { color: 'white', intensity: 1, x: -this.W, y: 0, z: 0 },
      { color: 'white', intensity: 1, x: this.W, y: 0, z: 0 },
    ]) {
      const L = new THREE.SpotLight(
        color,
        intensity,
        this.W,
        Math.PI / 2,
        0,
        0
      );
      L.position.set(x, y, z);
      const spotlightHelper = new THREE.SpotLightHelper(L);
      this.scene.add(L);
      // this.scene.add(spotlightHelper);
    }
  }
  addPictures() {
    const vs = [];

    for (let i = 0; i < this.SH; i++) {
      vs[i] = [];

      const nY = i / (this.SH - 1);
      for (let j = 0; j < this.SW; j++) {
        const nX = j / (this.SW - 1);

        vs[i][j] = {
          uv: [nX, nY],
          xyz: [
            (nX - 0.5) * this.W,
            (nY - 0.5) * this.H,
            ((i + 1) % 2) * (j % 2) * 0.5 - 0.25, //-0.25 or 0.25
          ],
        };
      }
    }

    const geoms = [];

    for (let k = 0; k <= 1; k++) {
      const geom = new THREE.BufferGeometry();
      const N = ((this.SW - k) >> 1) * (this.SH - 1); // 100 or 99 * 199
      const pos = new Float32Array(N * 3 * 6); // six(x, y, z)
      const uv = new Float32Array(N * 3 * 6); // six(u, v)

      let n = 0;

      for (let i = 0; i < this.SH - 1; i++) {
        for (let j = k; j < this.SW - 1; j += 2) {
          let v = vs[i][j];
          pos.set(v.xyz, n * 3);
          uv.set(v.uv, n * 2);
          ++n;

          v = vs[i][j + 1];
          pos.set(v.xyz, n * 3);
          uv.set(v.uv, n * 2);
          ++n;

          v = vs[i + 1][j];
          pos.set(v.xyz, n * 3);
          uv.set(v.uv, n * 2);
          ++n;

          v = vs[i][j + 1];
          pos.set(v.xyz, n * 3);
          uv.set(v.uv, n * 2);
          ++n;

          v = vs[i + 1][j + 1];
          pos.set(v.xyz, n * 3);
          uv.set(v.uv, n * 2);
          ++n;

          v = vs[i + 1][j];
          pos.set(v.xyz, n * 3);
          uv.set(v.uv, n * 2);
          ++n;
        }
      }

      geom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geom.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      geom.computeVertexNormals();

      geoms.push(geom);
    }

    const g = new THREE.Group();
    for (const [i, geom] of geoms.entries()) {
      const map = new THREE.TextureLoader().load(this.IMG_URLS[i]);
      const mat = new THREE.MeshLambertMaterial({
        map,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geoms[i], mat);

      g.add(mesh);
    }

    this.scene.add(g);
  }
  initTHREE() {
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.renderer.setAnimationLoop(() => {
      this.renderer.render(this.scene, this.camera);
      this.controls.update();
    });
  }
}
