import * as THREE from 'three';
import * as Hammer from 'hammerjs';

export default class InterierControls extends THREE.EventDispatcher {
  setupEvents() {
    throw new Error('Method not implemented.');
  }
  enabled = true;
  camera;
  container;
  mouse = new THREE.Vector2();
  mouseOnDown = new THREE.Vector2();
  rotation = new THREE.Vector2();
  target = new THREE.Vector2();
  targetOnDown = new THREE.Vector2();
  distance;
  originalDistance;
  lookAtTarget = new THREE.Vector3();
  dampFactor;
  origin;
  clampY;
  fixedDistance;
  horizontalOnly = false;
  zoomSpeed = 0.5;
  zoomEnabled;
  hammer;
  maxDistance;
  reverse;
  constructor(options) {
    super();
    this.camera = options.camera;
    this.container = options.domElement;
    this.distance = options.distance || 8;
    this.originalDistance = this.distance;
    this.dampFactor = options.damp || 1000;
    this.origin = options.origin || new THREE.Vector3(0, 0, 0);
    this.clampY = options.clampY || Math.PI;
    this.reverse = options.reverse !== undefined ? options.reverse : false;
    this.fixedDistance =
      options.fixedDistance !== undefined ? options.fixedDistance : false;
    this.setupEvents();
  }
}
