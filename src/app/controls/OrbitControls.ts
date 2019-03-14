import * as THREE from 'three';
export default class OrbitControls {
  camera;
  domElement;
  enabled = true;
  target; // sets the location of focus, where the camera orbits around.

  // How far you can zoom in and out (OrthographicCamera only)
  minDistance = 0;
  maxDistance = Infinity;

  minZoom = 0;
  maxZoom = Infinity;

  // How far you can orbit vertically, upper and lower limits, Range is 0 to Math.PI radians.
  minPolarAngle = 0;
  maxPolarAngle = Math.PI;

  // How far you can orbit horizontally, upper and lower limits, If set, must be a sub-interval of the intercal [-Math.PI,Math.PI]
  minAzimuthAngle = -Infinity;
  maxAzimuthAngle = Infinity;

  enableDamping = false;
  dampingFactor = 0.25;

  enableZoom = true;
  zoomSpeed = 1.0;

  enableRotate = true;
  rotateSpeed = 1.0;

  enablePan = true;
  panSpeed = 1.0;
  screenSpacePanning = false;
  keyPanSpeed = 7.0;

  autoRotate = false;
  autoRotateSpeed = 2.0;

  enableKeys = true;

  keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

  mouseButtons = {
    LEFT: THREE.MOUSE.LEFT,
    MIDDLE: THREE.MOUSE.MIDDLE,
    RIGHT: THREE.MOUSE.RIGHT
  };

  // for reset;
  target0;
  position0;
  zoom0;

  // internals

  private changeEvent = { type: 'change' };
  private startEvent = { type: 'start' };
  private endEvent = { type: 'end' };

  private state = STATE.NONE;
  private EPS = 0.000001;

  private spherical = new THREE.Spherical();
  private sphericalDelta = new THREE.Spherical();

  private scale = 1;
  private panOffset = new THREE.Vector3();
  private zoomChanged = false;

  private rotateStart = new THREE.Vector2();
  private rotateEnd = new THREE.Vector2();
  private rotateDelta = new THREE.Vector2();

  private panStart = new THREE.Vector2();
  private panEnd = new THREE.Vector2();
  private panDelta = new THREE.Vector2();

  private dollyStart = new THREE.Vector2();
  private dollyEnd = new THREE.Vector2();
  private dollyDelta = new THREE.Vector2();

  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement !== undefined ? domElement : document;
    this.target = new THREE.Vector3();
    this.target0 = this.target.clone();
    this.position0 = this.camera.position.clone();
    this.zoom0 = this.camera.zoom;

    this.domElement.addEventListener(
      'contextmenu',
      this.onContextMenu.bind(this),
      false
    );

    this.domElement.addEventListener(
      'mousedown',
      this.onMouseDown.bind(this),
      false
    );
    this.domElement.addEventListener(
      'wheel',
      this.onMouseWheel.bind(this),
      false
    );

    this.domElement.addEventListener(
      'touchstart',
      this.onTouchStart.bind(this),
      false
    );
    this.domElement.addEventListener(
      'touchend',
      this.onTouchEnd.bind(this),
      false
    );
    this.domElement.addEventListener(
      'touchmove',
      this.onTouchMove.bind(this),
      false
    );

    window.addEventListener('keydown', this.onKeyDown.bind(this), false);

    // force an update at start

    this.update();
  }

  // public methods
  getPolarAngle() {
    return this.spherical.phi;
  }
  getAzimuthalAngle() {
    return this.spherical.theta;
  }
  saveState() {
    this.target0.copy(this.target);
    this.position0.copy(this.camera.position);
    this.zoom0 = this.camera.zoom;
  }

  reset() {
    this.target.copy(this.target0);
    this.camera.position.copy(this.position0);
    this.camera.zoom = this.zoom0;

    this.camera.updateProjectionMatrix();
    // this.dispatchEvent(this.changeEvent);
    this.update();

    this.state = STATE.NONE;
  }

  update() {
    const offset = new THREE.Vector3();

    // so camera.up is the orbit axis
    const quat = new THREE.Quaternion().setFromUnitVectors(
      this.camera.up,
      new THREE.Vector3(0, 1, 0)
    );
    const quatInverse = quat.clone().inverse();

    const lastPosition = new THREE.Vector3();
    const lastQuaternion = new THREE.Quaternion();

    const position = this.camera.position;
    offset.copy(position).sub(this.target);

    // rotate offset to "y-axis-is-up" space
    offset.applyQuaternion(quat);

    // angle from z-axis around y-axis
    this.spherical.setFromVector3(offset);

    if (this.autoRotate && this.state === STATE.NONE) {
      this.rotateLeft(this.getAutoRotationAngle());
    }

    this.spherical.theta += this.sphericalDelta.theta;
    this.spherical.phi += this.sphericalDelta.phi;

    // restrict theta and phi to be between desired limits
    this.spherical.theta = Math.max(
      this.minAzimuthAngle,
      Math.min(this.maxAzimuthAngle, this.spherical.theta)
    );
    this.spherical.phi = Math.max(
      this.minPolarAngle,
      Math.min(this.maxPolarAngle, this.spherical.phi)
    );

    this.spherical.makeSafe();

    this.spherical.radius *= this.scale;

    // restrict
    this.spherical.radius = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.spherical.radius)
    );

    this.target.add(this.panOffset);

    offset.setFromSpherical(this.spherical);

    // rotate offset back to camera-up-vector-is-up space
    offset.applyQuaternion(quatInverse);

    position.copy(this.target).add(offset);

    this.camera.lookAt(this.target);

    if (this.enableDamping === true) {
      this.sphericalDelta.theta *= 1 - this.dampingFactor;
      this.sphericalDelta.phi *= 1 - this.dampingFactor;
      this.panOffset.multiplyScalar(1 - this.dampingFactor);
    } else {
      this.sphericalDelta.set(0, 0, 0);
      this.panOffset.set(0, 0, 0);
    }

    this.scale = 1;
    if (
      this.zoomChanged ||
      lastPosition.distanceToSquared(this.camera.position) > this.EPS ||
      8 * (1 - lastQuaternion.dot(this.camera.quaternion)) > this.EPS
    ) {
      // this.dispatchEvent(this.changeEvent);
      lastPosition.copy(this.camera.position);
      lastQuaternion.copy(this.camera.quaternion);
      this.zoomChanged = false;
      return true;
    }
    return false;
  }
  dispose() {
    this.domElement.removeEventListener(
      'contextmenu',
      this.onContextMenu,
      false
    );
    this.domElement.removeEventListener('mousedown', this.onMouseDown, false);
    this.domElement.removeEventListener('wheel', this.onMouseWheel, false);

    this.domElement.removeEventListener('touchstart', this.onTouchStart, false);
    this.domElement.removeEventListener('touchend', this.onTouchEnd, false);
    this.domElement.removeEventListener('touchmove', this.onTouchMove, false);

    document.removeEventListener('mousemove', this.onMouseMove, false);
    document.removeEventListener('mouseup', this.onMouseUp, false);

    window.removeEventListener('keydown', this.onKeyDown, false);
  }

  private getAutoRotationAngle() {
    return ((2 * Math.PI) / 60 / 60) * this.autoRotateSpeed;
  }
  private getZoomScale() {
    return Math.pow(0.95, this.zoomSpeed);
  }
  private rotateLeft(angle) {
    this.sphericalDelta.theta -= angle;
  }
  private rotateUp(angle) {
    this.sphericalDelta.phi -= angle;
  }
  private panLeft(distance, objectMatrix) {
    const v = new THREE.Vector3();
    v.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix
    v.multiplyScalar(-distance);
    this.panOffset.add(v);
  }

  private panUp(distance, objectMatrix) {
    const v = new THREE.Vector3();
    if (this.screenSpacePanning === true) {
      v.setFromMatrixColumn(objectMatrix, 1);
    } else {
      v.setFromMatrixColumn(objectMatrix, 0);
      v.crossVectors(this.camera.up, v);
    }
    v.multiplyScalar(distance);
    this.panOffset.add(v);
  }

  private pan(deltaX, deltaY) {
    const offset = new THREE.Vector3();
    const element =
      this.domElement === document ? this.domElement.body : this.domElement;
    if (this.camera.isPerspectiveCamera) {
      const position = this.camera.position;
      offset.copy(position).sub(this.target);
      let targetDistance = offset.length();

      // half of the fov is center to top of screen
      targetDistance *= Math.tan(((this.camera.fov / 2) * Math.PI) / 180);

      this.panLeft(
        (2 * deltaX * targetDistance) / element.clientHeight,
        this.camera.matrix
      );
      this.panUp(
        (2 * deltaY * targetDistance) / element.clientHeight,
        this.camera.matrix
      );
    } else if (this.camera.isOrthographicCamera) {
      this.panLeft(
        (deltaX * (this.camera.right - this.camera.left)) /
          this.camera.zoom /
          element.clientHeight,
        this.camera.matrix
      );
      this.panUp(
        (deltaY * (this.camera.top - this.camera.bottom)) /
          this.camera.zoom /
          element.clientHeight,
        this.camera.matrix
      );
    } else {
      this.enablePan = false;
    }
  }

  dollyIn(dollyScale) {
    if (this.camera.isPerspectiveCamera) {
      this.scale /= dollyScale;
    } else if (this.camera.isOrthographicCamera) {
      this.camera.zoom = Math.max(
        this.minZoom,
        Math.min(this.maxZoom, this.camera.zoom * dollyScale)
      );
      this.camera.updateProjectionMatrix();
      this.zoomChanged = true;
    } else {
      this.enableZoom = false;
    }
  }
  dollyOut(dollyScale) {
    if (this.camera.isPerspectiveCamera) {
      this.scale *= dollyScale;
    } else if (this.camera.isOrthographicCamera) {
      this.camera.zoom = Math.max(
        this.minZoom,
        Math.min(this.maxZoom, this.camera.zoom / dollyScale)
      );
      this.camera.updateProjectionMatrix();
      this.zoomChanged = true;
    } else {
      this.enableZoom = false;
    }
  }

  handleMouseDownRotate(event) {
    this.rotateStart.set(event.offsetX, event.offsetY);
  }
  handleMouseDownDolly(event) {
    this.dollyStart.set(event.offsetX, event.offsetY);
  }
  handleMouseDownPan(event) {
    this.panStart.set(event.offsetX, event.offsetY);
  }
  handleMouseMoveRotate(event) {
    this.rotateEnd.set(event.offsetX, event.offsetY);
    this.rotateDelta
      .subVectors(this.rotateEnd, this.rotateStart)
      .multiplyScalar(this.rotateSpeed);
    const element =
      this.domElement === document ? this.domElement.body : this.domElement;
    this.rotateLeft((2 * Math.PI * this.rotateDelta.x) / element.clientHeight);
    this.rotateUp((2 * Math.PI * this.rotateDelta.y) / element.clientHeight);
    this.rotateStart.copy(this.rotateEnd);
    this.update();
  }

  handleMouseMoveDolly(event) {
    this.dollyEnd.set(event.offsetX, event.offsetY);

    this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);
    if (this.dollyDelta.y > 0) {
      this.dollyIn(this.getZoomScale());
    } else if (this.dollyDelta.y < 0) {
      this.dollyOut(this.getZoomScale());
    }
    this.dollyStart.copy(this.dollyEnd);
    this.update();
  }

  handleMouseMovePan(event) {
    this.panEnd.set(event.offsetX, event.offsetY);
    this.panDelta
      .subVectors(this.panEnd, this.panStart)
      .multiplyScalar(this.panSpeed);
    this.pan(this.panDelta.x, -this.panDelta.y);
    this.panStart.copy(this.panEnd);
    this.update();
  }

  handleMouseUp(event) {}
  handleMouseWheel(event) {
    if (event.deltaY < 0) {
      this.dollyOut(this.getZoomScale());
    } else if (event.deltaY > 0) {
      this.dollyIn(this.getZoomScale());
    }
    this.update();
  }

  handleKeyDown(event) {
    let needsUpdate = false;
    switch (event.keyCode) {
      case this.keys.UP:
        this.pan(0, this.keyPanSpeed);
        needsUpdate = true;
        break;
      case this.keys.BOTTOM:
        this.pan(0, -this.keyPanSpeed);
        needsUpdate = true;
        break;
      case this.keys.LEFT:
        this.pan(this.keyPanSpeed, 0);
        needsUpdate = true;
        break;
      case this.keys.RIGHT:
        this.pan(-this.keyPanSpeed, 0);
        needsUpdate = true;
        break;
    }
    if (needsUpdate) {
      event.preventDefault();
      this.update();
    }
  }

  handleTouchStartRotate(event) {
    this.rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
  }

  handleTouchStartDollyPan(event) {
    if (this.enableZoom) {
      const dx = event.touches[0].pageX - event.touches[1].pageX;
      const dy = event.touches[0].pageY - event.touches[1].pageY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      this.dollyStart.set(0, distance);
    }

    if (this.enablePan) {
      const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
      const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
      this.panStart.set(x, y);
    }
  }

  handleTouchMoveRotate(event) {
    this.rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
    this.rotateDelta
      .subVectors(this.rotateEnd, this.rotateStart)
      .multiplyScalar(this.rotateSpeed);
    const element =
      this.domElement === document ? this.domElement.body : this.domElement;
    this.rotateLeft((2 * Math.PI * this.rotateDelta.x) / element.clientHeight);
    this.rotateUp((2 * Math.PI * this.rotateDelta.y) / element.clientHeight);
    this.rotateStart.copy(this.rotateEnd);
    this.update();
  }

  handleTouchMoveDollyPan(event) {
    if (this.enableZoom) {
      const dx = event.touches[0].pageX - event.touches[1].pageX;
      const dy = event.touches[0].pageY - event.touches[1].pageY;

      const distance = Math.sqrt(dx * dx + dy * dy);

      this.dollyEnd.set(0, distance);
      this.dollyDelta.set(
        0,
        Math.pow(this.dollyEnd.y / this.dollyStart.y, this.zoomSpeed)
      );

      this.dollyIn(this.dollyDelta.y);
      this.dollyStart.copy(this.dollyEnd);
    }

    if (this.enablePan) {
      const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
      const y = 0.5 * (event.touches[1].pageY + event.touches[1].pageY);

      this.panEnd.set(x, y);

      this.panDelta
        .subVectors(this.panEnd, this.panStart)
        .multiplyScalar(this.panSpeed);

      this.pan(this.panDelta.x, this.panDelta.y);

      this.panStart.copy(this.panEnd);
    }

    this.update();
  }

  handleTouchEnd(event) {}

  onMouseDown(event) {
    if (this.enabled === false) return;

    event.preventDefault();
    // Manually set the focus since calling preventDefault above prevents the browser from setting it automatically
    this.domElement.focus ? this.domElement.focus() : window.focus();

    switch (event.button) {
      case this.mouseButtons.LEFT:
        if (event.ctrlKey || event.metaKey || event.shiftKey) {
          if (this.enablePan) {
            this.handleMouseDownPan(event);
            this.state = STATE.PAN;
          }
        } else {
          if (this.enableRotate) {
            this.handleMouseDownRotate(event);
            this.state = STATE.ROTATE;
          }
        }
        break;
      case this.mouseButtons.MIDDLE:
        if (this.enableZoom) {
          this.handleMouseDownDolly(event);
          this.state = STATE.DOLLY;
        }
        break;
      case this.mouseButtons.RIGHT:
        if (this.enablePan) {
          this.handleMouseDownPan(event);
          this.state = STATE.PAN;
        }
        break;
    }

    if (this.state !== STATE.NONE) {
      document.addEventListener(
        'mousemove',
        this.onMouseMove.bind(this),
        false
      );
      document.addEventListener('mouseup', this.onMouseUp.bind(this), false);

      // this.dispatchEvent(this.startEvent);
    }
  }

  onMouseMove(event) {
    if (this.enabled === false) return;
    event.preventDefault();
    switch (this.state) {
      case STATE.ROTATE:
        if (this.enableRotate) {
          this.handleMouseMoveRotate(event);
        }
        break;
      case STATE.DOLLY:
        if (this.enableZoom) {
          this.handleMouseMoveDolly(event);
        }
        break;
      case STATE.PAN:
        if (this.enablePan) {
          this.handleMouseMovePan(event);
        }
        break;
    }
  }

  onMouseUp(event) {
    if (this.enabled === false) return;

    this.handleMouseUp(event);
    document.removeEventListener(
      'mousemove',
      this.onMouseMove.bind(this),
      false
    );
    document.removeEventListener('mouseup', this.onMouseUp.bind(this), false);

    // this.dispatchEvent(this.endEvent);
    this.state = STATE.NONE;
  }

  onMouseWheel(event) {
    if (
      this.enabled === false ||
      this.enableZoom === false ||
      (this.state !== STATE.NONE && this.state !== STATE.ROTATE)
    )
      return;

    event.preventDefault();
    event.stopPropagation();

    // this.dispatchEvent(this.startEvent);
    this.handleMouseWheel(event);
    // this.dispatchEvent(this.endEvent);
  }

  onKeyDown(event) {
    if (
      this.enabled === false ||
      this.enableKeys === false ||
      this.enablePan === false
    )
      return;

    this.handleKeyDown(event);
  }

  onTouchStart(event) {
    if (this.enabled === false) return;

    event.preventDefault();
    switch (event.touches.length) {
      case 1:
        if (this.enableRotate) {
          this.handleTouchStartRotate(event);
          this.state = STATE.TOUCH_ROTATE;
        }
        break;
      case 2:
        if (this.enableZoom || this.enablePan) {
          this.handleTouchStartDollyPan(event);
          this.state = STATE.TOUCH_DOLLY_PAN;
        }
        break;
      default:
        this.state = STATE.NONE;
        break;
    }
    if (this.state !== STATE.NONE) {
      // this.dispatchEvent(this.startEvent);
    }
  }

  onTouchMove(event) {
    if (this.enabled === false) return;

    event.preventDefault();
    event.stopPropagation();

    switch (event.touches.length) {
      case 1:
        if (this.enableRotate && this.state === STATE.TOUCH_ROTATE) {
          this.handleTouchMoveRotate(event);
        }
        break;
      case 2:
        if (
          (this.enableZoom || this.enablePan) &&
          this.state === STATE.TOUCH_DOLLY_PAN
        ) {
          this.handleTouchMoveDollyPan(event);
        }
        break;
      default:
        this.state = STATE.NONE;
        break;
    }
  }

  onTouchEnd(event) {
    if (this.enabled === false) return;

    this.handleTouchEnd(event);

    // this.dispatchEvent(this.endEvent);
    this.state = STATE.NONE;
  }

  onContextMenu(event) {
    if (this.enabled === false) return;
    event.preventDefault();
  }
}

enum STATE {
  NONE = -1,
  ROTATE = 0,
  DOLLY = 1,
  PAN = 2,
  TOUCH_ROTATE = 3,
  TOUCH_DOLLY_PAN = 4
}
