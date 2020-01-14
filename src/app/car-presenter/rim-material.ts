import * as THREE from 'three';
import * as _ from 'lodash';
import RealisticMaterial from './realistic-material';

export default class RimMaterial extends RealisticMaterial {
  vertexShader = ``;
  fragmentShader = ``;
  uniforms: any = {
    diffuse: { type: 'c', value: new THREE.Color(0xeeeeee) },
    opacity: { type: 'f', value: 1 },
    map: { type: 't', value: null },
    lightMap: { type: 't', value: null },
    offsetRepeat: { type: 'v4', value: new THREE.Vector4(0, 0, 1, 1) },
    fogNear: { type: 'f', value: 1 },
    fogFar: { type: 'f', value: 2e3 },
    fogColor: { type: 'c', value: new THREE.Color(0xffffff) },
    emissive: { type: 'c', value: new THREE.Color(0) },
    pointLightColor: { type: 'fv', value: [] },
    pointLightPosition: { type: 'fv', value: [] },
    pointLightDistance: { type: 'fv1', value: [] },
    directionalLightDirection: { type: 'fv', value: [] },
    directionalLightColor: { type: 'fv', value: [] },
    hemisphereLightDirection: { type: 'fv', value: [] },
    hemisphereLightSkyColor: { type: 'fv', value: [] },
    hemisphereLightGroundColor: { type: 'fv', value: [] },
    spotLightColor: { type: 'fv', value: [] },
    spotLightPosition: { type: 'fv', value: [] },
    spotLightDirection: { type: 'fv', value: [] },
    spotLightDistance: { type: 'fv1', value: [] },
    spotLightAngleCos: { type: 'fv1', value: [] },
    spotLightExponent: { type: 'fv1', value: [] },
    spotLightDecay: { type: 'fv1', value: [] },
    lightVariance: { type: 'f', value: 0 },
    envMap: { type: 't', value: null },
    flipEnvMap: { type: 'f', value: -1 },
    reflectivity: { type: 'f', value: 0.15 },
    refractionRatio: { type: 'f', value: 0.98 },
    normalMap: { type: 't', value: null },
    normalScale: { type: 'v2', value: new THREE.Vector2(1, 1) },
    specular: { type: 'c', value: new THREE.Color(0x111111) },
    shininess: { type: 'f', value: 30 },
    wrapRGB: { type: 'v3', value: new THREE.Vector3(1, 1, 1) },
    emissiveMap: { type: 't', value: null },
    emissiveColor: { type: 'c', value: null },
    emissiveIntensity: { type: 'f', value: 1 },
    reflectionMask: { type: 't', value: null },
    paintMask: { type: 't', value: null },
    envMapOffset: { type: 'f', value: 0 },
    flipWorldPos: { type: 'f', value: 1 }
  };
  constructor(parameters) {
    super(parameters);
  }
}
