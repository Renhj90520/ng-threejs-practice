import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { data } from './data';
import * as Matter from 'matter-js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
@Component({
  selector: 'app-matter-js',
  templateUrl: './matter-js.component.html',
  styleUrls: ['./matter-js.component.css']
})
export class MatterJsComponent implements OnInit {
  scene;
  camera;
  renderer;

  DOT_SIZE = 30;
  X_START_POS = 120;
  Y_START_POS = 80;
  colorHash = {
    BK: '#f8fefd', // black
    WH: '#ffffff', // white
    BG: '#ffcccc', // beige
    BR: '#af5551', // brown
    RD: '#ff72d9', // red
    YL: '#fee965', // yellow
    GN: '#00ff00', // green
    WT: '#00ffff', // water
    BL: '#5999f1', // blue
    PR: '#800080' // purple
  };
  controls: OrbitControls;
  engine: Matter.Engine;
  bodies = [];
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.initMatter();
    this.addMeshes();
    this.addLight();
    Matter.Engine.run(this.engine);
    this.update();
  }
  addLight() {
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(-30, 50, 40);
    this.scene.add(light);
  }
  addMeshes() {
    const material = new THREE.MeshPhongMaterial({ color: 0x276a4b });
    const group = new THREE.Object3D();
    this.scene.add(group);
    let pos = 0;
    for (let j = 0; j < this.engine.world.bodies.length; j++) {
      const body: any = this.engine.world.bodies[j];

      const width = body.bounds.max.x - body.bounds.min.x;
      const height = body.bounds.max.y - body.bounds.min.y;
      let mesh;
      if (body.isStatic) {
        const geometry = new THREE.BoxGeometry(width, height, 170);
        mesh = new THREE.Mesh(geometry, material);
      } else {
        const color = this.getRgbColor(data[pos]);
        const boxMaterial = new THREE.MeshPhongMaterial({ color });
        const boxGeometry = new THREE.CylinderGeometry(
          width / 2,
          width / 2,
          150
        );

        mesh = new THREE.Mesh(boxGeometry, boxMaterial);
        mesh.rotation.x = Math.PI / 2;
        pos++;
      }

      group.add(mesh);
      this.bodies.push(mesh);
    }

    const backMesh = new THREE.Mesh(
      new THREE.BoxGeometry(800, 600, 10),
      material
    );
    backMesh.position.z = -40;
    group.add(backMesh);
  }
  initMatter() {
    this.engine = Matter.Engine.create();
    const circles = [];
    for (let i = 0; i < data.length; i++) {
      const x = this.X_START_POS + (i % 16) * (this.DOT_SIZE + 5);
      const y = this.Y_START_POS + Math.floor(i / 16) * (this.DOT_SIZE + 5);
      const s = this.DOT_SIZE;
      circles.push(
        Matter.Bodies.circle(x, y, this.DOT_SIZE * 0.5, {
          friction: 0.00001,
          restitution: 0.5,
          density: 0.001
        })
      );
    }

    const ground = Matter.Bodies.rectangle(400, 610, 810, 60, {
      isStatic: true
    });
    const WallA = Matter.Bodies.rectangle(0, 305, 60, 670, {
      isStatic: true
    });
    const WallB = Matter.Bodies.rectangle(800, 305, 60, 670, {
      isStatic: true
    });
    const ceiling = Matter.Bodies.rectangle(400, 0, 810, 60, {
      isStatic: true
    });

    Matter.World.add(this.engine.world, circles);
    Matter.World.add(this.engine.world, [ground, WallA, WallB, ceiling]);
  }

  initTHREE() {
    this.scene = new THREE.Scene();
    const width = this.el.nativeElement.clientWidth;

    const height = this.el.nativeElement.clientHeight;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);

    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(50, width / height, 1, 3000);
    this.camera.position.set(-600, 200, 800);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  update() {
    this.renderer.render(this.scene, this.camera);
    this.controls.update();

    for (let i = 0; i < this.engine.world.bodies.length; i++) {
      const b = this.engine.world.bodies[i].position;
      this.bodies[i].position.set(b.x - 405, -(b.y - 305), 0);
    }

    requestAnimationFrame(this.update.bind(this));
  }

  getRgbColor(colorType) {
    return this.colorHash[colorType];
  }
}
