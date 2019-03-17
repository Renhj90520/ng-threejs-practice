import * as THREE from 'three';
export default class TrackballControls {
  camera;
  domElement;

  enabled = true;
  screen = { left: 0, top: 0, width: 0, height: 0 };

  rotateSpeed = 1.0;
  zoomSpeed = 1.2;
  panSpeed = 0.3;

  noRotate = false;
  noZoom = false;
  noPan = false;

  staticMoving = false;
  dynamicDampingFactor = 0.2;

  minDistance = 0;
  maxDistance = Infinity;

  keys = [65, /**A */ 83, /**S */ 68 /**D */];

  private target = new THREE.Vector3();
  private EPS = 0.000001;

  private lastPosition = new THREE.Vector3();
  private state = STATE.NONE;
  private prevState = STATE.NONE;

  private eye = new THREE.Vector3();

  private movePrev = new THREE.Vector2();
  private moveCurr = new THREE.Vector2();

  private lastAxis = new THREE.Vector3();
  private lastAngle = 0;

  private zoomStart = new THREE.Vector2();
  private zoomEnd = new THREE.Vector2();

  private touchZoomDistanceStart = 0;
  private touchZoomDistanceEnd = 0;

  private panStart = new THREE.Vector2();
  private panEnd = new THREE.Vector2();

  private target0 = this.target.clone();
  private position0;
  private up0;

  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement !== undefined ? domElement : document;
    this.position0 = this.camera.position.clone();
    this.up0 = this.camera.up.clone();

    this.domElement.addEventListener(
      'contextmenu',
      this.contextmenu.bind(this),
      false
    );
    this.domElement.addEventListener(
      'mousedown',
      this.mousedown.bind(this),
      false
    );
    this.domElement.addEventListener(
      'wheel',
      this.mousewheel.bind(this),
      false
    );

    // this.domElement.addEventListener('touchstart', touchstart, false);
    // this.domElement.addEventListener('touchend', touchend, false);
    // this.domElement.addEventListener('touchmove', touchmove, false);

    window.addEventListener('keydown', this.keydown.bind(this), false);
    window.addEventListener('keyup', this.keyup.bind(this), false);

    this.handleResize();

    // force an update at start
    this.update();
  }

  handleResize() {
    if (this.domElement === document) {
      this.screen.left = 0;
      this.screen.top = 0;
      this.screen.width = window.innerWidth;
      this.screen.height = window.innerHeight;
    } else {
      const box = this.domElement.getBoundingClientRect();

      const d = this.domElement.ownerDocument.documentElement;
      this.screen.left = box.left + window.pageXOffset - d.clientLeft;
      this.screen.top = box.top + window.pageYOffset - d.clientTop;
      this.screen.width = box.width;
      this.screen.height = box.height;
    }
  }

  getMouseOnScreen(pageX, pageY) {
    const vector = new THREE.Vector2();
    vector.set(
      (pageX - this.screen.left) / this.screen.width,
      (pageY - this.screen.top) / this.screen.height
    );

    return vector;
  }

  getMouseOnCircle(pageX, pageY) {
    const vector = new THREE.Vector2();
    vector.set(
      (pageX - this.screen.width * 0.5 - this.screen.left) /
        (this.screen.width * 0.5),
      (this.screen.height + 2 * (this.screen.top - pageY)) / this.screen.width
    );

    return vector;
  }

  rotateCamera() {
    const axis = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const eyeDirection = new THREE.Vector3();
    const objectUpDirection = new THREE.Vector3();
    const objectSidewaysDirection = new THREE.Vector3();
    const moveDirection = new THREE.Vector3();
    moveDirection.set(
      this.moveCurr.x - this.movePrev.x,
      this.moveCurr.y - this.movePrev.y,
      0
    );
    let angle = moveDirection.length();

    if (angle) {
      this.eye.copy(this.camera.position).sub(this.target);

      eyeDirection.copy(this.eye).normalize();
      objectUpDirection.copy(this.camera.up).normalize();
      objectSidewaysDirection
        .crossVectors(objectUpDirection, eyeDirection)
        .normalize();

      objectUpDirection.setLength(this.moveCurr.y - this.movePrev.y);
      objectSidewaysDirection.setLength(this.moveCurr.x - this.movePrev.x);

      moveDirection.copy(objectUpDirection.add(objectSidewaysDirection));
      axis.crossVectors(moveDirection, this.eye).normalize();

      angle *= this.rotateSpeed;
      quaternion.setFromAxisAngle(axis, angle);

      this.eye.applyQuaternion(quaternion);
      this.camera.up.applyQuaternion(quaternion);

      this.lastAxis.copy(axis);
      this.lastAngle = angle;
    } else if (!this.staticMoving && this.lastAngle) {
      this.lastAngle *= Math.sqrt(1.0 - this.dynamicDampingFactor);
      this.eye.copy(this.camera.position).sub(this.target);
      quaternion.setFromAxisAngle(this.lastAxis, this.lastAngle);

      this.eye.applyQuaternion(quaternion);
      this.camera.up.applyQuaternion(quaternion);
    }

    this.movePrev.copy(this.moveCurr);
  }

  zoomCamera() {
    let factor;
    if (this.state === STATE.TOUCH_ZOOM_PAN) {
      factor = this.touchZoomDistanceStart / this.touchZoomDistanceEnd;
      this.touchZoomDistanceStart = this.touchZoomDistanceEnd;
      this.eye.multiplyScalar(factor);
    } else {
      factor = 1.0 + (this.zoomEnd.y - this.zoomStart.y) * this.zoomSpeed;
      if (factor !== 1.0 && factor > 0.0) {
        this.eye.multiplyScalar(factor);
      }
      if (this.staticMoving) {
        this.zoomStart.copy(this.zoomEnd);
      } else {
        this.zoomStart.y +=
          (this.zoomEnd.y - this.zoomStart.y) * this.dynamicDampingFactor;
      }
    }
  }

  panCamera() {
    const mouseChange = new THREE.Vector2();
    const objectUp = new THREE.Vector3();
    const pan = new THREE.Vector3();

    mouseChange.copy(this.panEnd).sub(this.panStart);
    if (mouseChange.lengthSq()) {
      mouseChange.multiplyScalar(this.eye.length() * this.panSpeed);

      pan
        .copy(this.eye)
        .cross(this.camera.up)
        .setLength(mouseChange.x);
      pan.add(objectUp.copy(this.camera.up).setLength(mouseChange.y));

      this.camera.position.add(pan);
      this.target.add(pan);

      if (this.staticMoving) {
        this.panStart.copy(this.panEnd);
      } else {
        this.panStart.add(
          mouseChange
            .subVectors(this.panEnd, this.panStart)
            .multiplyScalar(this.dynamicDampingFactor)
        );
      }
    }
  }

  checkDistance() {
    if (!this.noZoom || !this.noPan) {
      if (this.eye.lengthSq() > this.maxDistance * this.maxDistance) {
        this.camera.position.addVectors(
          this.target,
          this.eye.setLength(this.maxDistance)
        );
        this.zoomStart.copy(this.zoomEnd);
      }

      if (this.eye.lengthSq() < this.minDistance * this.minDistance) {
        this.camera.position.addVectors(
          this.target,
          this.eye.setLength(this.minDistance)
        );
        this.zoomStart.copy(this.zoomEnd);
      }
    }
  }

  update() {
    this.eye.subVectors(this.camera.position, this.target);

    if (!this.noRotate) {
      this.rotateCamera();
    }

    if (!this.noZoom) {
      this.zoomCamera();
    }

    if (!this.noPan) {
      this.panCamera();
    }

    this.camera.position.addVectors(this.target, this.eye);

    this.checkDistance();
    this.camera.lookAt(this.target);

    if (this.lastPosition.distanceToSquared(this.camera.position) > this.EPS) {
      this.lastPosition.copy(this.camera.position);
    }
  }

  reset() {
    this.state = STATE.NONE;
    this.prevState = STATE.NONE;

    this.target.copy(this.target0);
    this.camera.position.copy(this.position0);
    this.camera.up.copy(this.up0);
    this.eye.subVectors(this.camera.position, this.target);

    this.camera.lookAt(this.target);
    this.lastPosition.copy(this.camera.position);
  }

  keydown(event) {
    if (this.enabled === false) return;

    window.removeEventListener('keydown', this.keydown);

    this.prevState = this.state;
    if (this.state !== STATE.NONE) {
      return;
    } else if (event.keyCode === this.keys[STATE.ROTATE] && !this.noRotate) {
      this.state = STATE.ROTATE;
    } else if (event.keyCode === this.keys[STATE.ZOOM] && !this.noZoom) {
      this.state = STATE.ZOOM;
    } else if (event.keyCode === this.keys[STATE.PAN] && !this.noPan) {
      this.state = STATE.PAN;
    }
  }

  keyup(event) {
    if (this.enabled === false) return;
    this.state = this.prevState;
    window.addEventListener('keydown', this.keydown.bind(this), false);
  }

  mousedown(event) {
    if (this.enabled === false) return;
    event.preventDefault();
    event.stopPropagation();

    if (this.state === STATE.NONE) {
      this.state = event.button;
    }

    if (this.state === STATE.ROTATE && !this.noRotate) {
      this.moveCurr.copy(this.getMouseOnCircle(event.pageX, event.pageY));
      this.movePrev.copy(this.moveCurr);
    } else if (this.state === STATE.ZOOM && !this.noZoom) {
      this.zoomStart.copy(this.getMouseOnScreen(event.pageX, event.pageY));
      this.zoomEnd.copy(this.zoomStart);
    } else if (this.state === STATE.PAN && !this.noPan) {
      this.panStart.copy(this.getMouseOnScreen(event.pageX, event.pageY));
      this.panEnd.copy(this.panStart);
    }

    document.addEventListener('mousemove', this.mousemove.bind(this), false);
    document.addEventListener('mouseup', this.mouseup.bind(this), false);
  }

  mousemove(event) {
    if (this.enabled === false) return;
    event.preventDefault();
    event.stopPropagation();

    if (this.state === STATE.ROTATE && !this.noRotate) {
      // this.movePrev.copy(this.moveCurr);
      this.moveCurr.copy(this.getMouseOnCircle(event.pageX, event.pageY));
    } else if (this.state === STATE.ZOOM && !this.noZoom) {
      this.zoomEnd.copy(this.getMouseOnScreen(event.pageX, event.pageY));
    } else if (this.state === STATE.PAN && !this.noPan) {
      this.panEnd.copy(this.getMouseOnScreen(event.pageX, event.pageY));
    }
  }

  mouseup(event) {
    if (this.enabled === false) return;
    event.preventDefault();
    event.stopPropagation();
    this.state = STATE.NONE;
    document.removeEventListener('mousemove', this.mousemove);
    document.removeEventListener('mouseup', this.mouseup);
  }

  mousewheel(event) {
    if (this.enabled === false) return;
    if (this.noZoom) return;

    event.preventDefault();
    event.stopPropagation();

    switch (event.deltaMode) {
      case 2:
        // zoom in pages
        this.zoomStart.y -= event.deltaY * 0.025;
        break;
      case 1:
        // zoom in lines
        this.zoomStart.y -= event.deltaY * 0.01;
        break;
      default:
        this.zoomStart.y -= event.deltaY * 0.00025;
        break;
    }
  }

  contextmenu(event) {
    if (this.enabled === false) return;
    event.preventDefault();
  }

  dispose() {
    this.domElement.removeEventListener('contextmenu', this.contextmenu, false);
    this.domElement.removeEventListener('mousedown', this.mousedown, false);
    this.domElement.removeEventListener('wheel', this.mousewheel, false);

    // this.domElement.removeEventListener('touchstart', touchstart, false);
    // this.domElement.removeEventListener('touchend', touchend, false);
    // this.domElement.removeEventListener('touchmove', touchmove, false);

    document.removeEventListener('mousemove', this.mousemove, false);
    document.removeEventListener('mouseup', this.mouseup, false);

    window.removeEventListener('keydown', this.keydown, false);
    window.removeEventListener('keyup', this.keyup, false);
  }
}

enum STATE {
  NONE = -1,
  ROTATE = 0,
  ZOOM = 1,
  PAN = 2,
  TOUCH_ROTATE = 3,
  TOUCH_ZOOM_PAN = 4
}
