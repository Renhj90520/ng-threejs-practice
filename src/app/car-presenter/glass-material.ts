import * as THREE from 'three';
import BasicCustomShaderMaterial from './custom-shadermaterial';
import * as _ from 'lodash';
export default class GlassMaterial extends BasicCustomShaderMaterial {
  vertexShader = ``;
  fragmentShader = ``;
  uniforms = {
    diffuse: { type: 'c', value: new THREE.Color(0xeeeeee) },
    opacity: { type: 'f', value: 1 },
    map: { type: 't', value: null },
    offsetRepeat: { type: 'v4', value: new THREE.Vector4(0, 0, 1, 1) },
    envMap: { type: 't', value: null },
    combine: { type: 'f', value: 0 },
    reflectivity: { type: 'f', value: 0.5 },
    flipEnvMap: { type: 'f', value: 1 },
    fogNear: { type: 'f', value: 1 },
    fogFar: { type: 'f', value: 2000 },
    fogColor: { type: 'c', value: new THREE.Color(0xffffff) },
    envMapOffset: { type: 'f', value: 0 }
  };
  constructor(parameters) {
    super(parameters);
    parameters = _.extend({}, parameters);
  }
}
