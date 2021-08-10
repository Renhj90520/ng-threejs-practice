import * as THREE from 'three';
import * as Hammer from 'hammerjs';
import { TweenLite, Power2 } from 'gsap';
import { Observable } from 'rxjs';

export default class CustomControls extends THREE.EventDispatcher {
  enabled = true;
  camera: THREE.PerspectiveCamera;
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
  minDistance;
  reverse;
  autoRotate = false;
  autoRotationSpeed = -0.002;
  locked = false;
  lockRotation = new THREE.Vector2();
  overRenderer: boolean;
  autoRotateNeedsResume: boolean;
  autoRotateTween: any;
  started: any;
  resetting: boolean;

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
    this.zoomEnabled =
      options.zoomEnabled !== undefined ? options.zoomEnabled : true;
    this.hammer = new Hammer(this.container);
    this.hammer.get('pinch').set({ enable: false });
    this.maxDistance = options.maxDistance || 10;
    this.minDistance = options.minDistance || 4;
    this.hammer.on('pinchstart', (e) => {
      const distanceOrigin = this.distance;
      this.hammer.on('pinchmove', (evt) => {
        this.distance = distanceOrigin / evt.scale;
        this.distance =
          this.distance > this.maxDistance ? this.maxDistance : this.distance;
        this.distance =
          this.distance < this.minDistance ? this.minDistance : this.distance;
      });
    });
  }
  enablePinch() {
    this.hammer.get('pinch').set({ enable: true });
  }
  disablePinch() {
    this.hammer.get('pinch').set({ enable: false });
  }

  setupEvents() {
    this.container.addEventListener('mousedown', (evt) => {
      this.container.addEventListener('mousemove', this.onMove);
      this.container.addEventListener('mouseup', this.onMoveEnd);
      this.container.addEventListener('mouseout', this.onMouseOut);

      this.mouseOnDown.x = evt.clientX;
      this.mouseOnDown.y = -evt.clientY;

      if (this.reverse) {
        this.mouseOnDown.y *= -1;
      }
      this.targetOnDown.copy(this.target);
    });
    this.container.addEventListener('touchstart', (evt) => {
      this.container.addEventListener('touchmove', this.onMove);
      this.container.addEventListener('touchend', this.onMoveEnd);
      this.container.addEventListener('mouseout', this.onMouseOut);

      this.mouseOnDown.x = evt.originalEvent.touches[0].clientX;
      this.mouseOnDown.y = -evt.originalEvent.touches[0].clientY;
      if (this.reverse) {
        this.mouseOnDown.y *= -1;
      }
      this.targetOnDown.copy(this.target);
    });
    this.container.addEventListener('mousewheel', (evt) => {
      if (this.enabled && this.zoomEnabled) {
        evt.preventDefault();
        const delta = evt.originalEvent.deltaY
          ? 0.025 * -evt.originalEvent.deltaY
          : 0.025 * -evt.originalEvent.detail;
        this.zoom(delta);
      }
    });
  }
  onMove = (evt) => {
    const moveVector = new THREE.Vector2();

    if (!this.horizontalOnly) {
      evt.preventDefault();
    }
    if (this.autoRotate) {
      this.autoRotate = false;
      this.autoRotateNeedsResume = true;
    }
    if (this.autoRotateTween) {
      clearTimeout(this.autoRotateTween);
    }
    if (!(evt.type === 'touchmove' && evt.originalEvent.touches.length > 1)) {
      if (evt.type === 'touchmove') {
        this.mouse.x = evt.originalEvent.touches[0].clientX;
        this.mouse.y = -evt.originalEvent.touches[0].clientY;
      } else {
        this.mouse.x = evt.clientX;
        this.mouse.y = -evt.clientY;
      }

      if (this.reverse) {
        this.mouse.y *= -1;
      }
      const damp = this.distance / this.dampFactor;
      moveVector.subVectors(this.mouse, this.mouseOnDown).multiplyScalar(damp);
      this.target.addVectors(this.targetOnDown, moveVector);
      this.dispatchEvent({ type: 'move' });
    }
  };
  onMoveEnd = (evt) => {
    this.container.removeEventListener('mousemove', this.onMove, false);
    this.container.removeEventListener('touchmove', this.onMove, false);
    this.container.removeEventListener('mouseup', this.onMoveEnd, false);
    this.container.removeEventListener('touchend', this.onMoveEnd, false);
    this.container.removeEventListener('mouseout', this.onMouseOut, false);
    if (this.autoRotateNeedsResume) {
      this.autoRotateTween = setTimeout(() => {
        this.autoRotate = true;
      }, 2000);
    }
    if (this.locked) {
      this.setTargetRotation(this.lockRotation);
    }

    this.dispatchEvent({ type: 'moveEnd' });
  };
  onMouseOut = (evt) => {
    this.container.removeEventListener('mousemove', this.onMove, false);
    this.container.removeEventListener('mouseout', this.onMouseOut, false);
  };
  zoom(delta) {
    if (this.zoomEnabled) {
      this.distance -= delta;
      this.distance =
        this.distance > this.maxDistance ? this.maxDistance : this.distance;
      this.distance =
        this.distance < this.minDistance ? this.minDistance : this.distance;
    }
  }

  setRotation(rotation) {
    this.rotation.copy(rotation);
    this.setTargetRotation(rotation);
  }
  setTargetRotation(rotation) {
    this.target.copy(rotation);
  }

  start() {
    if (!this.started) {
      throw new Error('Method not implemented.');
    }
  }

  orbitTo(target, duration, easing) {
    const move = new THREE.Vector3();
    const origin = new THREE.Vector3(0, 0, 0);
    const xAxis = new THREE.Vector3(1, 0, 0);
    const yAxis = new THREE.Vector3(0, 1, 0);
    const zAxis = new THREE.Vector3();
    easing = easing || Power2.easeOut;
    move.subVectors(target, this.origin).normalize;
    const rotationCopy = new THREE.Vector2().copy(this.rotation);
    const angleToY = yAxis.angleTo(move);
    zAxis.crossVectors(yAxis, move).normalize();
    move.applyAxisAngle(zAxis, Math.PI / 2 - angleToY);
    let angleToX = xAxis.angleTo(move);
    if (move.z < 0) {
      angleToX = Math.PI * 2 - angleToX;
    }
    const rotation = { x: angleToX, y: angleToY };
    if (duration > 0) {
      if (!this.fixedDistance) {
        TweenLite.to(this, duration, {
          distance: target.distanceTo(origin),
          ease: easing,
        }).play();
      }
      return new Observable((subscriber) => {
        let obj = { val: 0 };
        const v = new THREE.Vector2();

        const tl = TweenLite.to(obj, duration, {
          val: 1,
          ease: easing,
          onUpdate: () => {
            const progress = tl.progress();
            v.x = this.lerpRadian(rotationCopy.x, this.rotation.x, progress);
            v.y = this.lerp(rotationCopy.y, this.rotation.y, progress);
            this.setRotation(v);
          },
          onComplete: () => {
            subscriber.next();
            subscriber.complete();
          },
        }).play();
      });
    } else {
      this.setRotation(rotation);
      if (!this.fixedDistance) {
        this.distance = target.distanceTO(origin);
      }
      return new Observable();
    }
  }

  lookAt(target, duration) {
    TweenLite.to(this.origin, duration, {
      x: target.x,
      y: target.y,
      z: target.z,
      ease: Power2.easeOut,
    }).play();
  }

  lock() {
    this.locked = true;
    this.lockRotation.copy(this.rotation);
    this.dampFactor *= 8;
  }
  unlock() {
    this.locked = false;
    this.dampFactor /= 8;
  }
  reset() {
    this.resetting = true;
    setTimeout(() => {
      this.resetting = false;
    }, 1000);
  }

  tweenDistance(newDistance) {
    TweenLite.to(this, 1.2, {
      distance: newDistance,
      ease: Power2.easeOut,
    }).play();
  }

  update() {
    if (this.autoRotate) {
      this.target.x += this.autoRotationSpeed;
    }
    if (this.target.x > Math.PI * 2) {
      this.target.x -= Math.PI * 2;
    } else if (this.target.x < 0) {
      this.target.x += Math.PI * 2;
    }
    this.target.y = THREE.MathUtils.clamp(this.target.y, 0, this.clampY);
    if (this.horizontalOnly) {
      this.target.y = 1.5;
    }
    if (this.resetting) {
      this.target.x = 0.9828;
      this.target.y = 1.5;
    }
    this.rotation.x = this.lerpRadian(this.rotation.x, this.target.x, 0.1);
    this.rotation.y = this.lerp(this.rotation.y, this.target.y, 0.1);

    const rotationX = this.rotation.x;
    const rotationY = this.rotation.y;
    const yFactor = Math.sin(rotationY);
    this.camera.position.x = Math.cos(rotationX) * yFactor;
    this.camera.position.y = Math.cos(rotationY);
    this.camera.position.z = Math.sin(rotationX) * yFactor;
    this.camera.position.setLength(this.distance);
    if (this.reverse) {
      const position = new THREE.Vector3()
        .copy(this.camera.position)
        .setLength(0.1);
      this.lookAtTarget
        .copy(this.camera.position)
        .add(position)
        .add(this.origin);
      this.camera.position.add(this.origin);
    } else {
      this.camera.position.add(this.origin);
      this.lookAtTarget.copy(this.origin);
    }

    this.camera.lookAt(this.lookAtTarget);
  }

  /**
   * linear interpolation
   * t===0 return a
   * t===1 return b
   * t===.5 return middle
   */
  lerp(a, b, t) {
    return a + (b - a) * t; // or (1 - t) * a + t * b
  }

  lerpRadian(r1, r2, t) {
    let a, b;
    const TWOPI = Math.PI * 2;
    if (r1 > r2) {
      const diff2PI = r2 + TWOPI - r1; // TWOPI - (r1 - r2)
      const diff = r1 - r2;
      if (diff2PI > diff) {
        // r1 - r2 < PI
        a = r1;
        b = r2;
      } else {
        // r1 - r2 >= PI
        a = r1;
        b = r2 + TWOPI;
      }
    } else {
      const diff = r2 - r1;
      const diff2PI = r1 + TWOPI - r2; // TWOPI - (r2 - r1)
      if (diff > diff2PI) {
        a = r1 + TWOPI;
        b = r2;
      } else {
        a = r1;
        b = r2;
      }
    }

    return this.lerp(a, b, t) % TWOPI;
  }
}
