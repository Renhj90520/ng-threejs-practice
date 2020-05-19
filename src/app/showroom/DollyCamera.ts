import * as THREE from 'three';
import LookControls from './lookcontrols';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { applyMixins, EventMixins } from './mixin';
import * as _ from 'lodash';
import { TweenLite, Power1 } from 'gsap';
export class DollyCamera extends THREE.PerspectiveCamera {
  states: any;

  rotating: boolean;
  moving: boolean;
  lookControls: LookControls;
  orbitControls: OrbitControls;
  private target: THREE.Object3D;
  firstMove: any;
  enabled;
  isTransitioning: boolean;
  startTimeout;
  mode: Mode;
  firstRotate: boolean;
  opts: any;
  constructor(opts) {
    super();
    this.opts = opts;
    this.fov = 50;
    this.near = 0.01;
    this.far = 1500;
    this.updateProjectionMatrix();
    this.moving = false;
    this.rotating = false;
    this.lookControls = new LookControls(this, opts.domElement);
    this.lookControls.enableDamping = true;
    this.lookControls.dampingFactor = 0.25;

    this.orbitControls = new OrbitControls(this, opts.domElement);
    this.orbitControls.enableZoom = true;
    this.orbitControls.enablePan = false;
    this.orbitControls.enabled = true;
    this.orbitControls.maxPolarAngle = Math.PI / 2;
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.065;
    this.orbitControls.rotateSpeed = 0.05;

    this.target = new THREE.Object3D();
    this.target.position.z = -1;
    this.add(this.target);
    if (opts.states) {
      this.initStates(opts.states);
      if (this.states.start) {
        this.position.copy(this.states.start[0].position);
        this.quaternion.copy(this.states.start[0].quaternion);
        this.lookControls.setOrientationFromCamera();
      } else {
        this.moveTo(-3.5, 5);
      }
    }
  }

  initStates(cameras) {
    this.states = {};
    cameras.forEach((camera) => {
      const name = camera.name.replace('_camera', '');
      if (this.states[name]) {
        this.states[name].push(camera);
      } else {
        this.states[name] = [camera];
      }
      if (camera.children.length > 0) {
        camera.target = new THREE.Vector3();
        camera.children[0].getWorldPosition(camera.target);
      }
    });
  }

  setState(name, onComplete) {
    let nearestCamera;
    this.setMode(Mode.ORBIT_MODE);
    let prevDistance = Number.POSITIVE_INFINITY;
    this.states[name].forEach((camera) => {
      const distance = this.position.distanceTo(camera.position);
      if (distance < prevDistance) {
        prevDistance = distance;
        nearestCamera = camera;
      }
    });
    this.isTransitioning = true;
    this.tweenOrbitTargetTo(nearestCamera.target, () => {
      this.isTransitioning = false;
      this.orbitControls.autoRotate = false;
      // if (autoRotateDelay === undefined) {
      //   this.autoRotate();
      // } else {
      this.startTimeout = setTimeout(() => {
        this.autoRotate();
      }, 1000);
      // }
    });

    this.tweenPositionTo(nearestCamera.position, 1, onComplete);
  }
  setMode(mode: Mode) {
    const position = new THREE.Vector3();
    switch (mode) {
      case Mode.ORBIT_MODE:
        this.target.getWorldPosition(position);
        this.orbitControls.target.copy(position);
        this.orbitControls.enabled = true;
        break;
      case Mode.LOOK_MODE:
        this.lookControls.setOrientationFromCamera();
        this.orbitControls.enabled = false;
        this.orbitControls.autoRotate = false;
        break;
    }

    this.mode = mode;
  }
  tweenPositionTo(position, duration, onComplete) {
    const tl = TweenLite.to({ x: 0, y: 0, z: 0 }, duration, {
      ease: Power1.easeInOut,
      onUpdate: () => {
        const progress = tl.progress();
        const x = position.x * progress;
        const y = position.y * progress;
        const z = position.z * progress;

        this.position.set(x, y, z);
      },
      onComplete,
    }).play();
  }
  private autoRotate() {
    this.isTransitioning = false;
    this.orbitControls.autoRotate = true;
    this.orbitControls.autoRotateSpeed = 0.1;
    this.startTimeout = null;
  }

  tweenOrbitTargetTo(position, onComplete) {
    const target = this.orbitControls.target;
    const tl = TweenLite.to({}, 1, {
      ease: Power1.easeInOut,
      onUpdate: () => {
        const progress = tl.progress();
        const x = (position.x - target.x) * progress + target.x;
        const y = (position.y - target.y) * progress + target.y;
        const z = (position.z - target.z) * progress + target.z;
        this.orbitControls.target.set(x, y, z);
      },
      onComplete,
    }).play();
  }

  moveTo(x, z, distance?) {
    const position = new THREE.Vector3();
    distance = distance || 0;
    position.set(x, 1.4, z);
    if (distance > 0) {
      this.trigger('startMove');
      this.moving = true;
    }
    if (!this.firstMove) {
      this.trigger('firstMove');
      this.firstMove = true;
    }

    this.setMode(Mode.LOOK_MODE);
  }

  enableControls() {
    this.lookControls.enabled = true;
  }

  setOrbitDistances(minDistance, maxDistance) {
    this.orbitControls.minDistance = minDistance;
    this.orbitControls.maxDistance = maxDistance;
  }

  update() {
    if (this.mode === Mode.ORBIT_MODE) {
      this.orbitControls.update();
      this.rotating = this.orbitControls.autoRotate || this.isTransitioning;
    } else {
      this.lookControls.update();
      this.rotating = this.lookControls.isRotating;
    }
    if (this.rotating && !this.firstRotate) {
      this.trigger('firstRotate');
      this.firstRotate = true;
    }
  }
  clone() {
    return _.cloneDeep(this);
  }
}

export interface DollyCamera extends EventMixins {}
applyMixins(DollyCamera, [EventMixins]);

export enum Mode {
  LOOK_MODE = 0,
  ORBIT_MODE = 1,
}
