import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { realdata } from './data';
@Component({
  selector: 'app-cascade-graph',
  templateUrl: './cascade-graph.component.html',
  styleUrls: ['./cascade-graph.component.css']
})
export class CascadeGraphComponent implements OnInit {
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

  axes = {
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
        '2019-09-09 12:00:00',
        '2019-09-09 12:00:00',
        '2019-09-09 12:00:00',
        '2019-09-09 12:00:00',
        '2019-09-09 12:00:00',
        '2019-09-09 12:00:00',
        '2019-09-09 12:00:00',
        '2019-09-09 12:00:00',
        '2019-09-09 12:00:00',
        '2019-09-09 12:00:00',
        '2019-09-09 12:00:00'
      ]
    }
  };
  depth: number;
  width: number;
  height: number;
  a: number;
  b: number;
  c: number;
  extrusionSettings = {
    size: 0,
    height: 0,
    curveSegments: 0,
    depth: 0.16,
    bevelThickness: 0,
    bevelSize: 0,
    bevelEnabled: false,
    material: 0,
    extrudeMaterial: 1
  };
  planes = [];

  raycaster = new THREE.Raycaster();
  currHoverMesh: any;
  currSelectedMesh: any;
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.addAxes();
    this.addAxisLabels();
    this.addGraph();
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

    this.camera.position.set(0, 0, 2400);
    this.camera.lookAt(this.scene.position);
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    console.log(window.devicePixelRatio);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.containerW, this.containerH);
    this.renderer.setClearColor(0x000000, 0);
    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }
  addAxes() {
    const boundingGrid = new THREE.Object3D();
    this.depth = this.graphDimensions.w / 2;
    this.width = this.graphDimensions.d / 2;
    this.height = this.graphDimensions.h / 2;

    this.a = this.axes.labels.y.length;
    this.b = this.axes.labels.x.length;
    this.c = this.axes.labels.z.length;

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
    const labelsW = this.labelAxis(this.width, this.axes.labels.x, 'x');
    labelsW.position.x = this.width;
    labelsW.position.y = -this.height - 40;
    labelsW.position.z = this.depth;
    this.scene.add(labelsW);
    const nameW = this.makeTextSprite('f[Hz]');
    nameW.position.y = -this.height - 40;
    nameW.position.z = this.depth + 60;
    this.scene.add(nameW);

    const labelsH = this.labelAxis(this.height, this.axes.labels.y, 'y');
    labelsH.position.x = -this.width - 60;
    labelsH.position.y = -this.height + (2 * this.height) / this.a - 20;
    labelsH.position.z = this.depth;
    this.scene.add(labelsH);
    const nameH = this.makeTextSprite('Z');
    nameH.position.x = -this.width - 100;
    nameH.position.z = this.depth;
    this.scene.add(nameH);

    const labelsD = this.labelAxis(this.depth, this.axes.labels.z, 'z');
    labelsD.position.x = this.width + 140;
    labelsD.position.y = -this.height - 40;
    labelsD.position.z = this.depth - 40;
    this.scene.add(labelsD);
    const nameD = this.makeTextSprite('t[Day]');
    nameD.position.x = this.width + 360;
    nameD.position.y = -this.height - 40;
    this.scene.add(nameD);
  }
  addGraph() {
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    const floorGeo = new THREE.PlaneGeometry(
      this.graphDimensions.w,
      this.graphDimensions.d,
      10,
      2405
    );

    const lines = {};
    const planes: any = {};

    for (let i = 0; i < floorGeo.vertices.length; i++) {
      const vertice: any = floorGeo.vertices[i];

      if (realdata[i][2] == null) {
        vertice.z = 'null';
      } else {
        vertice.z = realdata[i][2] * 100;
        if (!lines[vertice.x]) {
          lines[vertice.x] = new THREE.Geometry();
        }

        if (!planes[vertice.x]) {
          planes[vertice.x] = { vertices: [] };
        }

        lines[vertice.x].vertices.push(
          new THREE.Vector3(vertice.x, vertice.y, realdata[i][2] * 100)
        );

        planes[vertice.x].vertices.push({ x: vertice.y, y: vertice.z });
      }
    }
    for (const plane in planes) {
      planes[plane].vertices.sort((prev, next) => prev.x - next.x);
    }

    const planeContainer = new THREE.Object3D();
    // grid lines
    for (const line in lines) {
      const graphline: any = new THREE.Line(lines[line], lineMat);

      graphline.rotation.x = -Math.PI / 2;
      graphline.position.y = -this.graphDimensions.h / 2;
      graphline.rotation.z = Math.PI / 2;

      this.scene.add(graphline);

      const shapeVectors = [];
      for (let i = 0; i < planes[line].vertices.length; i++) {
        const vertice = planes[line].vertices[i];

        shapeVectors.push(new THREE.Vector2(vertice.x, vertice.y));
      }
      for (let i = planes[line].vertices.length - 1; i >= 0; i--) {
        const vertice = planes[line].vertices[i];

        shapeVectors.push(new THREE.Vector2(vertice.x, 0));
      }
      const shape = new THREE.Shape(shapeVectors);

      const planeGeo = new THREE.ExtrudeGeometry(shape, this.extrusionSettings);
      const plane: any = new THREE.Mesh(
        planeGeo,
        new THREE.MeshBasicMaterial({
          color: 0xff0000,
          transparent: true,
          opacity: 0
        })
      );

      plane.position.z = line;
      planeContainer.add(plane);
      this.planes.push(plane);
    }

    planeContainer.position.y = -this.graphDimensions.h / 2;
    planeContainer.rotation.y = Math.PI;
    this.scene.add(planeContainer);
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
    canvas.width = 256;
    canvas.height = 51.2;
    const ctx = canvas.getContext('2d');
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText(text, canvas.width / 2, 20);

    const texture = new THREE.Texture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;

    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(400, 80, 1.0);
    return sprite;
  }
  createAGrid(opts) {
    const material = new THREE.LineBasicMaterial({
      color: opts.color,
      opacity: 0.2,
      transparent: true
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

  @HostListener('mousemove', ['$event'])
  mousemove(evt) {
    const intersect: any = this.getIntersect(evt);

    if (intersect) {
      if (this.currHoverMesh && this.currHoverMesh !== intersect) {
        if (this.currSelectedMesh !== this.currHoverMesh) {
          this.currHoverMesh.material.opacity = 0;
        }
      }
      this.currHoverMesh = intersect;
      intersect.material.opacity = 0.3;
    } else {
      if (this.currHoverMesh && this.currHoverMesh !== this.currSelectedMesh) {
        this.currHoverMesh.material.opacity = 0;
      }
      this.currHoverMesh = null;
    }
  }
  private getIntersect(evt) {
    let vector = new THREE.Vector2(
      (evt.offsetX / this.el.nativeElement.clientWidth) * 2 - 1,
      (-evt.offsetY / this.el.nativeElement.clientHeight) * 2 + 1
    );
    this.raycaster.setFromCamera(vector, this.camera);
    const intersects = this.raycaster.intersectObjects(this.planes);
    if (intersects.length > 0) {
      return intersects[0].object;
    } else {
      return null;
    }
  }

  @HostListener('mousedown', ['$event'])
  mousedown(evt) {
    const interset: any = this.getIntersect(evt);
    if (interset) {
      if (this.currSelectedMesh && this.currSelectedMesh !== interset) {
        this.currSelectedMesh.material.opacity = 0;
      }

      this.currSelectedMesh = interset;
      interset.material.opacity = 0.3;
    } else {
      if (this.currSelectedMesh) {
        this.currSelectedMesh.material.opacity = 0;
      }
      this.currSelectedMesh = null;
    }
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
