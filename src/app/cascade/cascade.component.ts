import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { realdata } from './data';
@Component({
  selector: 'app-cascade',
  templateUrl: './cascade.component.html',
  styleUrls: ['./cascade.component.css']
})
export class CascadeComponent implements OnInit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  containerW;
  containerH;
  graphDimensions = {
    w: 1000,
    d: 2405,
    h: 800
  };

  data = {
    labels: {
      y: ['2%', '4%', '6%', '8%'],
      x: [
        '',
        "'14",
        "'13",
        "'12",
        "'11",
        "'10",
        "'09",
        "'08",
        "'07",
        "'06",
        "'05"
      ],
      z: [
        '1-month',
        '3-month',
        '6-month',
        '1-year',
        '2-year',
        '3-year',
        '5-year',
        '7-year',
        '10-year',
        '20-year',
        '30-year'
      ]
    }
  };
  depth: number;
  width: number;
  height: number;
  a: number;
  b: number;
  c: number;
  colors = [
    '#eef4f8',
    '#ddecf4',
    '#cce5f0',
    '#bcddec',
    '#aed5e7',
    '#a0cde2',
    '#94c5dc',
    '#89bcd6',
    '#7eb4d0',
    '#74abc9',
    '#6aa2c2',
    '#619abb',
    '#5892b4',
    '#4f8aad',
    '#4781a6',
    '#3f799f',
    '#3a7195',
    '#35688c',
    '#326082',
    '#2f5877',
    '#2c506c',
    '#243d52'
  ];
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.addAxes();
    this.addAxisLabels();

    this.addWareframe();
    this.update();
  }

  initTHREE() {
    this.containerW = this.el.nativeElement.clientWidth;
    this.containerH = this.el.nativeElement.clientHeight;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      40,
      this.containerW / this.containerH,
      1,
      30000
    );

    this.camera.position.set(0, 0, 3000);
    this.camera.lookAt(this.scene.position);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(this.containerW, this.containerH);
    this.renderer.setClearColor(0x000000, 1);
    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }
  addAxes() {
    const boundingGrid = new THREE.Object3D();
    this.depth = this.graphDimensions.w / 2;
    this.width = this.graphDimensions.d / 2;
    this.height = this.graphDimensions.h / 2;

    this.a = this.data.labels.y.length;
    this.b = this.data.labels.x.length;
    this.c = this.data.labels.z.length;

    const newGridXY = this.createAGrid({
      height: this.width,
      width: this.height,
      linesHeight: this.b,
      linesWidth: this.a,
      color: 0xcccccc
    });
    newGridXY.position.z = -this.depth;
    boundingGrid.add(newGridXY);

    const newGridYZ = this.createAGrid({
      height: this.width,
      width: this.depth,
      linesHeight: this.b,
      linesWidth: this.c,
      color: 0xcccccc
    });
    newGridYZ.rotation.x = Math.PI / 2;
    newGridYZ.position.y = -this.height;
    boundingGrid.add(newGridYZ);

    const newGridXZ = this.createAGrid({
      height: this.depth,
      width: this.height,
      linesHeight: this.c,
      linesWidth: this.a,
      color: 0xcccccc
    });
    newGridXZ.position.x = -this.width;
    newGridXZ.rotation.y = Math.PI / 2;
    boundingGrid.add(newGridXZ);

    this.scene.add(boundingGrid);
  }
  addAxisLabels() {
    const labelsW = this.labelAxis(this.width, this.data.labels.x, 'x');
    labelsW.position.x = this.width + 40;
    labelsW.position.y = -this.height - 40;
    labelsW.position.z = this.depth;
    this.scene.add(labelsW);

    const labelsH = this.labelAxis(this.height, this.data.labels.y, 'y');
    labelsH.position.x = -this.width;
    labelsH.position.y = -this.height + (2 * this.height) / this.a - 20;
    labelsH.position.z = this.depth;

    const labelsD = this.labelAxis(this.depth, this.data.labels.z, 'z');
    labelsD.position.x = this.width + 80;
    labelsD.position.y = -this.height - 40;
    labelsD.position.z = this.depth - 40;
    this.scene.add(labelsD);
    this.scene.add(labelsH);
  }
  addWareframe() {
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      vertexColors: THREE.VertexColors
    });

    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    const floorGeo = new THREE.PlaneGeometry(
      this.graphDimensions.w,
      this.graphDimensions.d,
      10,
      2405
    );

    const faceColors = [];
    const lines = {};

    for (let i = 0; i < floorGeo.vertices.length; i++) {
      const vertice: any = floorGeo.vertices[i];

      faceColors.push(this.colors[Math.round(realdata[i][2] * 4)]);

      if (realdata[i][2] == null) {
        vertice.z = 'null';
      } else {
        vertice.z = realdata[i][2] * 100;
        if (!lines[vertice.x]) {
          lines[vertice.x] = new THREE.Geometry();
        }

        lines[vertice.x].vertices.push(
          new THREE.Vector3(vertice.x, vertice.y, realdata[i][2] * 100)
        );
      }
    }
    // vertextColors
    for (let x = 0; x < floorGeo.faces.length; x++) {
      const face = floorGeo.faces[x];
      face.vertexColors[0] = new THREE.Color(faceColors[face.a]);
      face.vertexColors[1] = new THREE.Color(faceColors[face.b]);
      face.vertexColors[2] = new THREE.Color(faceColors[face.c]);
    }

    // grid lines
    for (const line in lines) {
      const graphline = new THREE.Line(lines[line], lineMat);
      graphline.rotation.x = -Math.PI / 2;
      graphline.position.y = -this.graphDimensions.h / 2;
      graphline.rotation.z = Math.PI / 2;

      this.scene.add(graphline);
    }

    const floor = new THREE.Mesh(floorGeo, wireframeMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -this.graphDimensions.h / 2;
    floor.rotation.z = Math.PI / 2;
    this.scene.add(floor);
  }
  labelAxis(width, labels, direction) {
    const separator = (2 * width) / labels.length;
    const p = { x: 0, y: 0, z: 0 };
    const labelObj = new THREE.Object3D();

    for (let i = 0; i < labels.length; i++) {
      const label = this.makeTextSprite(labels[i]);
      label.position.set(p.x, p.y, p.z);

      labelObj.add(label);
      if (direction === 'y') {
        p[direction] += separator;
      } else {
        p[direction] -= separator;
      }
    }

    return labelObj;
  }
  makeTextSprite(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = '70px sans-serif';

    ctx.fillStyle = '#fff';
    ctx.fillText(text, 0, 70);

    const texture = new THREE.Texture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;

    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(100, 50, 1.0);
    return sprite;
  }
  createAGrid(opts) {
    const material = new THREE.LineBasicMaterial({
      color: opts.color,
      opacity: 0.2
    });

    const gridObject = new THREE.Object3D();
    const gridGeo = new THREE.Geometry();
    const stepw = (2 * opts.width) / opts.linesWidth;
    const steph = (2 * opts.height) / opts.linesHeight;

    for (let i = -opts.width; i <= opts.width; i += stepw) {
      gridGeo.vertices.push(new THREE.Vector3(-opts.height, i, 0));
      gridGeo.vertices.push(new THREE.Vector3(opts.height, i, 0));
    }

    for (let i = -opts.height; i <= opts.height; i += steph) {
      gridGeo.vertices.push(new THREE.Vector3(i, -opts.width, 0));
      gridGeo.vertices.push(new THREE.Vector3(i, opts.width, 0));
    }

    const line = new THREE.LineSegments(gridGeo, material, THREE.LinePieces);
    gridObject.add(line);

    return gridObject;
  }
  update() {
    this.renderer.render(this.scene, this.camera);
    this.controls.update();
    requestAnimationFrame(this.update.bind(this));
  }

  @HostListener('window:resize')
  resize() {
    this.containerW = this.el.nativeElement.clientWidth;
    this.containerH = this.el.nativeElement.clientHeight;
    this.camera.aspect = this.containerW / this.containerH;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.containerW, this.containerH);
  }
}
