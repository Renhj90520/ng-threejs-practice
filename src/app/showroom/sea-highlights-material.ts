import * as THREE from 'three';
import CustomShaderMateial from './CustomShaderMaterial';

export default class SeaHighlightsMaterial extends CustomShaderMateial {
  vertexShader = `
    #ifdef USE_MAP
        varying vec2 vUv;
        uniform vec4 offsetRepeat;
    #endif

    void main() {
        #ifdef USE_MAP
            vUv = uv * offsetRepeat.zw + offsetRepeat.xy;
        #endif

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    }
  `;
  fragmentShader = `
    #ifdef USE_MAP
        varying vec2 vUv;
        uniform sampler2D map;
    #endif

    uniform sampler2D noiseMap;
    uniform vec3 diffuse;
    uniform float opacity;
    uniform float threshold;
    uniform float range;
    const vec3 white = vec3(1.);

    void main() {
        gl_FragColor = vec4(diffuse, opacity);
        #ifdef USE_MAP
            vec4 mapTexel = texture2D(map, vUv);
        #endif

        vec3 noise = texture2D(noiseMap, vUv).rgb;
        float v = fract(noise.r + threshold * .75);
        v = step(.9, v);
        float alpha = step(.5, (v * mapTexel.a));

        gl_FragColor = vec4(white, alpha);
    }
  `;
  uniforms = {
    diffuse: { type: 'c', value: new THREE.Color(0xffffff) },
    map: { type: 't', value: null },
    offsetRepeat: { type: 'v4', value: new THREE.Vector4(0, 0, 1, 1) },
    opacity: { type: 'f', value: 1 },
    threshold: { type: 'f', value: 0 },
    range: { type: 'f', value: 0.1 },
    noiseMap: { type: 't', value: null },
  };
  threshold: number;
  sign: number;
  lastUpdate: number;
  constructor(opts?) {
    super(opts);
    this.setParameters(opts);
    Object.keys(this.uniforms).forEach((uniformKey) => {
      this.onPropertyChange(uniformKey, (val) => {
        this.uniforms[uniformKey].value = val;
      });
    });
    this.threshold = 0;
    this.sign = 1;
    this.lastUpdate = 0;
  }

  updateUniforms(clock) {
    this.uniforms.threshold.value += 0.35 * clock.delta;
  }
}
