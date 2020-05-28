import * as THREE from 'three';
export default class LookControls {
  camera: any;
  phi: number;
  theta: number;
  rotateStart: THREE.Vector2;
  rotateEnd: THREE.Vector2;
  rotateDelta: THREE.Vector2;
  isDragging: boolean;
  isRotating: boolean;
  enableDamping: boolean;
  dampingFactor: number;
  isMouseDown: boolean;
  pointerX: any;
  pointerY: any;
  enabled: any;
  domElement: any;
  constructor(camera, domElement) {
    domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    domElement.addEventListener('mousedown', this.onMosueDown.bind(this));
    domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.camera = camera;
    this.domElement = domElement;
    this.phi = 0;
    this.theta = 0;
    this.rotateStart = new THREE.Vector2();
    this.rotateEnd = new THREE.Vector2();
    this.rotateDelta = new THREE.Vector2();
    this.isDragging = false;
    this.isRotating = false;
    this.enableDamping = false;
    this.dampingFactor = 0.25;
  }

  update() {
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    const quaternion = new THREE.Quaternion();
    euler.set(this.phi, this.theta, 0);
    quaternion.setFromEuler(euler);
    if (this.enableDamping) {
      this.camera.quaternion.slerp(quaternion, this.dampingFactor);
    } else {
      this.camera.quaternion.copy(quaternion);
    }
    return this;
  }

  setOrientationFromCamera() {
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.setFromQuaternion(this.camera.quaternion);
    this.phi = euler.x;
    this.theta = euler.y;

    return this;
  }

  reset() {
    this.phi = 0;
    this.theta = 0;
    this.update();
    return this;
  }
  notMove(evt) {
    const notmove =
      evt.clientX === this.pointerX && evt.clientY === this.pointerY;

    this.pointerX = evt.clientX;
    this.pointerY = evt.clientY;
    return notmove;
  }

  onMouseMove(evt) {
    if (
      !this.notMove(evt) &&
      (this.isMouseDown || this.isPointerLocked()) &&
      this.enabled
    ) {
      this.isRotating = true;
      if (this.isPointerLocked()) {
        const movementX = evt.movementX || 0;
        const movementY = evt.movementY || 0;
        this.rotateEnd.set(
          this.rotateStart.x - movementX,
          this.rotateStart.y - movementY
        );
      } else {
        this.rotateEnd.set(evt.clientX, evt.clientY);
      }
      
      this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);
      this.rotateStart.copy(this.rotateEnd);
      this.phi +=
        ((2 * Math.PI * this.rotateDelta.y) / this.domElement.clientHeight) *
        0.3;
      this.theta +=
        ((2 * Math.PI * this.rotateDelta.x) / this.domElement.clientWidth) *
        0.5;

      this.phi = THREE.Math.clamp(this.phi, -Math.PI / 2, Math.PI / 2);
    }
  }
  isPointerLocked(): boolean {
    return (
      document.pointerLockElement !== undefined &&
      document.pointerLockElement !== null
    );
  }
  onMosueDown(evt) {
    this.rotateStart.set(evt.clientX, evt.clientY);
    this.isMouseDown = true;
    this.pointerX = evt.clientX;
    this.pointerY = evt.clientY;
  }
  onMouseUp() {
    this.isMouseDown = false;
    this.isRotating = false;
  }
}
