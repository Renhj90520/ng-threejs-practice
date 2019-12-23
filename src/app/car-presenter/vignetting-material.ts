import * as THREE from 'three';
import * as _ from 'lodash';
import BasicCustomShaderMaterial from './custom-shadermaterial';

export default class VignettingMaterial extends BasicCustomShaderMaterial {
  vertexShader = `
    #ifdef USE_MAP
      varying vec2 vUv;
      uniform vec4 offsetRepeat;
    #endif
    uniform float cameraDistance;
    void main() {
      #ifdef USE_MAP
        vUv = uv * offsetRepeat.zw + offsetRepeat.xy;
      #endif
      float scale = 1. + (.5 * (1. - smoothstep(3., 9., cameraDistance)));
      gl_Position = vec4(position.x * scale, position.y * scale, 0.0, 1.);
    }
  `;
  fragmentShader = `
    #ifdef USE_MAP
      varying vec2 vUv;
      uniform sampler2D map;
    #endif

    uniform vec3 fogColor;
    uniform vec3 diffuse;
    uniform float opacity;
    uniform float fogNear;
    uniform float fogFar;

    void main() {
      gl_FragColor = vec4(diffuse, opacity);
      #ifdef USE_MAP
        gl_FragColor = gl_FragColor * texture2D(map, vUv);
      #endif
      #ifdef ALPHATEST
        if(gl_FragColor.a < ALPHATEST) discard;
      #endif

      float depth = gl_FragCoord.z / gl_FragCoord.w;
      float fogFactor = clamp((depth - fogNear) / (fogFar - fogNear), 0.0, 1.);
      gl_FragColor = mix(gl_FragColor, vec4(fogColor, gl_FragColor.w), fogFactor);
    }
  `;
  uniforms = {
    diffuse: {
      type: 'c',
      value: new THREE.Color(0xeeeeee)
    },
    opacity: {
      type: 'f',
      value: 1
    },
    map: {
      type: 't',
      value: null
    },
    offsetRepeat: {
      type: 'v4',
      value: new THREE.Vector4(0, 0, 1, 1)
    },
    envMap: {
      type: 't',
      value: null
    },
    combine: {
      type: 't',
      value: 0
    },
    fogNear: {
      type: 'f',
      value: 1
    },
    fogFar: {
      type: 'f',
      value: 2e3
    },
    fogColor: {
      type: 'c',
      value: new THREE.Color(0xffffff)
    },
    cameraDistance: {
      type: 'f',
      value: 8
    }
  };
  constructor(parameters) {
    super(parameters);
    parameters = _.extend({}, parameters);
    this.setParameters(parameters);
  }
}
