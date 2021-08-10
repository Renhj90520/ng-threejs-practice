import * as THREE from 'three';
import ModelBufferGeometry from './ModelBufferGeometry';
import PhongAnimationMaterial from './phong-animation-material';
import { cubicBezier, easeCubicOut, quaternionRotation } from './shader-chunks';

export default class TextAnimation {
  animationDuration: any;

  private _animationProgress: number;
  material: PhongAnimationMaterial;
  bufferGeometry: ModelBufferGeometry;
  mesh: THREE.Mesh;
  public get animationProgress(): number {
    return this._animationProgress;
  }
  public set animationProgress(v: number) {
    this._animationProgress = v;
    this.material.uniforms['uTime'].value = this.animationDuration * v;
  }

  constructor(geometry) {
    this.bufferGeometry = new ModelBufferGeometry(geometry);

    const aAnimation: any = this.bufferGeometry.createAttribute(
      'aAnimation',
      2
    );
    const aEndPosition: any = this.bufferGeometry.createAttribute(
      'aEndPosition',
      3
    );
    const aAxisAngle: any = this.bufferGeometry.createAttribute(
      'aAxisAngle',
      4
    );

    const faceCount = this.bufferGeometry.faceCount;
    let i, i2, i3, i4, v;

    const maxDelay = 0.0;
    const minDuration = 1.0;
    const maxDuration = 1.0;
    const strenth = 0.05;
    const lengthFactor = 0.001;
    const maxLength = geometry.boundingBox.max.length();

    this.animationDuration =
      maxDuration + maxDelay + strenth + lengthFactor * maxLength;

    const axis = new THREE.Vector3();

    let angle;
    for (
      i = 0, i2 = 0, i3 = 0, i4 = 0;
      i < faceCount;
      i++, i2 += 6, i3 += 9, i4 += 12
    ) {
      const face = geometry.faces[i];
      const centroid = this.bufferGeometry.computeCentroid(geometry, face);
      const centroidN = new THREE.Vector3().copy(centroid).normalize();

      const delay = (maxLength - centroid.length()) * lengthFactor;
      const duration = THREE.MathUtils.randFloat(minDuration, maxDuration);

      for (v = 0; v < 6; v += 2) {
        aAnimation.array[i2 + v] = delay + strenth * Math.random();
        aAnimation.array[i2 + v + 1] = duration;
      }

      const point = this.fibSpherePoint(i, faceCount, 200);

      for (v = 0; v < 9; v += 3) {
        aEndPosition.array[i3 + v] = point.x;
        aEndPosition.array[i3 + v + 1] = point.y;
        aEndPosition.array[i3 + v + 2] = point.z;
      }

      axis.x = centroidN.x;
      axis.y = -centroidN.y;
      axis.z = -centroidN.z;

      axis.normalize();

      angle = Math.PI * THREE.MathUtils.randFloat(0.5, 2);

      for (v = 0; v < 12; v += 4) {
        aAxisAngle.array[i4 + v] = axis.x;
        aAxisAngle.array[i4 + v + 1] = axis.y;
        aAxisAngle.array[i4 + v + 2] = axis.z;
        aAxisAngle.array[i4 + v + 3] = angle;
      }
    }

    this.material = new PhongAnimationMaterial(
      {
        flatShading: true,
        side: THREE.DoubleSide,
        transparent: true,
        vertexFunctions: [cubicBezier, easeCubicOut, quaternionRotation],
        vertexParameters: [
          'uniform float uTime;',
          'uniform vec3 uAxis;',
          'uniform float uAngle;',
          'attribute vec2 aAnimation;',
          'attribute vec3 aEndPosition;',
          'attribute vec4 aAxisAngle;',
        ],
        vertexInit: [
          'float tDelay = aAnimation.x;',
          'float tDuration = aAnimation.y;',
          'float tTime = clamp(uTime - tDelay, 0., tDuration);',
          'float tProgress = ease(tTime, 0., 1., tDuration);',
        ],
        vertexPosition: [
          'transformed = mix(transformed, aEndPosition, tProgress);',
          'float angle = aAxisAngle.w * tProgress;',
          'vec4 tQuat = quatFromAxisAngle(aAxisAngle.xyz, angle);',
          'transformed = rotateVector(tQuat, transformed);',
        ],
      },
      {
        // diffuse: 0x444444,
        // specular: 0xcccccc,
        // shininess: 4,
        uTime: { value: 0 },
      }
    );

    this.animationProgress = 0;

    this.mesh = new THREE.Mesh(this.bufferGeometry, this.material);
  }

  fibSpherePoint(i, n, radius) {
    const v = { x: 0, y: 0, z: 0 };
    const G = Math.PI * (3 - Math.sqrt(5));
    const step = 2.0 / n;
    let r, phi;

    v.y = i * step - 1 + step * 0.5;
    r = Math.sqrt(1 - v.y * v.y);
    phi = i * G;
    v.x = Math.cos(phi) * r;
    v.z = Math.sin(phi) * r;

    radius = radius || 1;

    v.x *= radius;
    v.y *= radius;
    v.z *= radius;

    return v;
  }
}
