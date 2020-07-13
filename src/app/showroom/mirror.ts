import * as THREE from 'three';
export default class Mirror extends THREE.Object3D {
  matrixNeedsUpdate: boolean;
  clipBias: any;
  clipPlane: THREE.Vector4;
  renderer: THREE.WebGLRenderer;
  mirrorPlane: THREE.Plane;
  normal: THREE.Vector3;
  mirrorWorldPosition: THREE.Vector3;
  cameraWorldPosition: THREE.Vector3;
  rotationMatrix: THREE.Matrix4;
  lookAtPosition: THREE.Vector3;
  camera: THREE.PerspectiveCamera;
  textureMatrix: THREE.Matrix4;
  mirrorCamera: THREE.PerspectiveCamera;
  renderTarget: THREE.WebGLRenderTarget;
  renderTarget2: THREE.WebGLRenderTarget;

  vertexShader = `
    uniform mat4 textureMatrix;
    varying vec4 mirrorCoord;
    void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
        vec4 worldPosition = modelMatrix * vec4(position, 1.);
        mirrorCoord = textureMatrix * worldPosition;
        gl_Position = projectionMatrix * mvPosition;
    }
  `;
  fragmentShader = `
    uniform vec3 color;
    uniform sampler2D mirrorSampler;
    varying vec4 mirrorCoord;
    float blendOverlay(float base, float blend) {
        return (base < .5 ? (2. * base * blend) : (1. - 2. * (1. - base) * (1. - blend)));
    }
    void main() {
        vec4 c = texture2DProj(mirrorSampler, mirrorCoord);
        c = vec4(blendOverlay(color.r, c.r), blendOverlay(color.g, c.g), blednOverlay(color.b, c.b), 1.);
        gl_FragColor = c;
    }
  `;
  uniforms: any = {
    color: { value: new THREE.Color(0x7f7f7f) },
    mirrorSampler: { value: null },
    textureMatrix: { value: new THREE.Matrix4() },
  };
  material: THREE.ShaderMaterial;

  constructor(renderer, camera, opts) {
    super();
    this.initOpts(opts);
    // TODO for inheritance do not call init, call it in child class
  }

  init(opts: any, renderer: any, camera: any) {
    this.name = 'mirror_' + this.id;
    opts = opts || {};
    this.matrixNeedsUpdate = true;
    const textureWidth =
      opts.textureWidth !== undefined ? opts.textureWidth : 512;
    const textureHeight =
      opts.textureHeight !== undefined ? opts.textureHeight : 512;
    this.clipBias = opts.clipBias !== undefined ? opts.clipBias : 0;
    const color =
      opts.color !== undefined
        ? new THREE.Color(opts.color)
        : new THREE.Color(0x7f7f7f);
    this.renderer = renderer;
    this.mirrorPlane = new THREE.Plane();
    this.normal = new THREE.Vector3(0, 0, 1);
    this.mirrorWorldPosition = new THREE.Vector3();
    this.cameraWorldPosition = new THREE.Vector3();
    this.rotationMatrix = new THREE.Matrix4();
    this.lookAtPosition = new THREE.Vector3(0, 0, -1);
    this.clipPlane = new THREE.Vector4();
    if (opts.debugMode) {
      const arrowHelper = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, 0),
        10,
        0xffff80
      );
      const lineGeo = new THREE.Geometry();
      lineGeo.vertices.push(new THREE.Vector3(-10, -10, 0));
      lineGeo.vertices.push(new THREE.Vector3(10, -10, 0));
      lineGeo.vertices.push(new THREE.Vector3(10, 10, 0));
      lineGeo.vertices.push(new THREE.Vector3(-10, 10, 0));
      lineGeo.vertices.push(lineGeo.vertices[0]);
      const line = new THREE.Line(
        lineGeo,
        new THREE.LineBasicMaterial({ color: 0xffff80 })
      );
      this.add(arrowHelper);
      this.add(line);
    }
    if (camera instanceof THREE.PerspectiveCamera) {
      this.camera = camera;
    } else {
      this.camera = new THREE.PerspectiveCamera();
    }
    this.textureMatrix = new THREE.Matrix4();
    this.mirrorCamera = this.camera; // TODO .clone()
    this.mirrorCamera.matrixAutoUpdate = true;
    const renderTargetOpts = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBFormat,
      stencilBuffer: false,
    };
    this.renderTarget = new THREE.WebGLRenderTarget(
      textureWidth,
      textureHeight,
      renderTargetOpts
    );
    this.renderTarget2 = new THREE.WebGLRenderTarget(
      textureWidth,
      textureHeight,
      renderTargetOpts
    );
    this.initMaterial();
    this.material.uniforms.mirrorSampler.value = this.renderTarget.texture;
    this.material.uniforms.color.value = color;
    this.material.uniforms.textureMatrix.value = this.textureMatrix;
    if (
      !(
        THREE.Math.isPowerOfTwo(textureWidth) &&
        THREE.Math.isPowerOfTwo(textureHeight)
      )
    ) {
      this.renderTarget.texture.generateMipmaps = false;
      this.renderTarget2.texture.generateMipmaps = false;
    }
    this.updateTextureMatrix();
    this.render();
  }

  initOpts(opts) {}
  render() {
    if (this.matrixNeedsUpdate) {
      this.updateTextureMatrix();
    }
    this.matrixNeedsUpdate = true;
    let root: any = this;
    for (; root.parent !== null; ) {
      root = root.parent;
    }
    if (root && root instanceof THREE.Scene) {
      const materialVisible = this.material.visible;
      this.material.visible = false;
      this.renderer.setRenderTarget(this.renderTarget);
      this.renderer.render(root, this.mirrorCamera);
      this.material.visible = materialVisible;
      this.renderer.setRenderTarget(null);
    }
  }
  updateTextureMatrix() {
    this.updateMatrixWorld();
    this.camera.updateMatrixWorld();
    this.mirrorWorldPosition.setFromMatrixPosition(this.matrixWorld);
    this.cameraWorldPosition.setFromMatrixPosition(this.camera.matrixWorld);
    this.rotationMatrix.extractRotation(this.matrixWorld);

    this.normal.set(0, 0, 1);
    this.normal.applyMatrix4(this.rotationMatrix);
    const mirroCameraPosition = this.mirrorWorldPosition
      .clone()
      .sub(this.cameraWorldPosition);
    mirroCameraPosition.reflect(this.normal).negate();
    mirroCameraPosition.add(this.mirrorWorldPosition);

    this.rotationMatrix.extractRotation(this.camera.matrixWorld);
    this.lookAtPosition.set(0, 0, -1);
    this.lookAtPosition.applyMatrix4(this.rotationMatrix);
    this.lookAtPosition.add(this.cameraWorldPosition);

    const lookAtPoint = this.mirrorWorldPosition
      .clone()
      .sub(this.lookAtPosition);

    lookAtPoint.reflect(this.normal).negate();
    lookAtPoint.add(this.mirrorWorldPosition);
    this.up.set(0, -1, 0);
    this.up.applyMatrix4(this.rotationMatrix);
    this.up.reflect(this.normal).negate();

    this.mirrorCamera.position.copy(mirroCameraPosition);
    this.mirrorCamera.up = this.up;
    this.mirrorCamera.lookAt(lookAtPoint);
    this.mirrorCamera.updateProjectionMatrix();
    this.mirrorCamera.updateMatrixWorld();
    this.mirrorCamera.matrixWorldInverse.getInverse(
      this.mirrorCamera.matrixWorld
    );

    this.textureMatrix.set(
      0.5,
      0,
      0,
      0.5,
      0,
      0.5,
      0,
      0.5,
      0,
      0,
      0.5,
      0.5,
      0,
      0,
      0,
      1
    );

    this.textureMatrix.multiply(this.mirrorCamera.projectionMatrix);
    this.textureMatrix.multiply(this.mirrorCamera.matrixWorldInverse);
    this.mirrorPlane.setFromNormalAndCoplanarPoint(
      this.normal,
      this.mirrorWorldPosition
    );

    this.mirrorPlane.applyMatrix4(this.mirrorCamera.matrixWorldInverse);
    this.clipPlane.set(
      this.mirrorPlane.normal.x,
      this.mirrorPlane.normal.y,
      this.mirrorPlane.normal.z,
      this.mirrorPlane.constant
    );

    const projection = new THREE.Vector4();
    const cameraProjectionMatrix = this.mirrorCamera.projectionMatrix;
    projection.x =
      (Math.sign(this.clipPlane.x) + cameraProjectionMatrix.elements[8]) /
      cameraProjectionMatrix.elements[0];
    projection.y =
      (Math.sign(this.clipPlane.y) + cameraProjectionMatrix.elements[9]) /
      cameraProjectionMatrix.elements[5];
    projection.z = -1;
    projection.w =
      (1 + cameraProjectionMatrix.elements[10]) /
      cameraProjectionMatrix.elements[14];

    let clip = new THREE.Vector4();
    clip = this.clipPlane.multiplyScalar(2 / this.clipPlane.dot(projection));
    cameraProjectionMatrix.elements[2] = clip.x;
    cameraProjectionMatrix.elements[6] = clip.y;
    cameraProjectionMatrix.elements[10] = clip.z + 1 - this.clipBias;
    cameraProjectionMatrix.elements[14] = clip.w;
  }
  initMaterial() {
    this.material = new THREE.ShaderMaterial({
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      uniforms: this.uniforms,
    });
  }
}
