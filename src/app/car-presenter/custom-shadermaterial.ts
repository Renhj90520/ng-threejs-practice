import * as THREE from 'three';
import * as _ from 'lodash';
import { lights } from './glsl-fragments';
class CustomShaderMaterial extends THREE.ShaderMaterial {
  constructor(parameters?) {
    super(parameters);
    // this.setParameters(parameters);
  }

  protected setParameters(parameters: any) {
    for (const key in parameters) {
      const parameter = parameters[key];
      if (parameter) {
        this[key] = parameter;
      }
    }
  }

  onPropertyChange(propertyName, callback) {
    Object.defineProperty(this, propertyName, {
      get: function () {
        return this['_' + propertyName];
      },
      set: function (value) {
        this['_' + propertyName] = value;
        callback.call(this, value);
      },
      configurable: true,
    });
  }

  refreshLightUniforms(lightUniforms) {}
}

export default class BasicCustomShaderMaterial extends CustomShaderMaterial {
  vertexShader = `
  ${lights}
  #ifdef USE_MAP
    varying vec2 vUv;
    uniform vec4 offsetRepeat;
  #endif

  void main() {
    #ifdef USE_MAP
      vUv = uv * offsetRepeat.zw + offsetRepeat.xy;
    #endif

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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
      float fogFactor = clamp((depth - fogNear) / (fogFar - fogNear), 0.0, 1.0);
      gl_FragColor = mix(gl_FragColor, vec4(fogColor, gl_FragCoord.w), fogFactor);
    }
  `;
  uniforms: any = {
    diffuse: {  value: new THREE.Color(0xeeeeee) },
    opacity: { value: 1 },
    map: {  value: null },
    offsetRepeat: { type: 'v4', value: new THREE.Vector4(0, 0, 1, 1) },
    envMap: {  value: null },
    combine: { value: 0 },
    fogNear: { value: 1 },
    fogFar: { value: 2000 },
    fogColor: {  value: new THREE.Color(0xffffff) },
  };
  color: THREE.Color;
  map: any;
  envMap: any;
  combine: any;
  constructor(parameters) {
    super(parameters);
    parameters = _.extend({
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      uniforms: this.uniforms,
    });
    // this.setParameters(parameters);
    this.onPropertyChange('color', (val) => {
      this.uniforms.diffuse.value = val;
    });
    this.onPropertyChange('map', (val) => {
      this.uniforms.map.value = val;
      if (val) {
        this.uniforms.offsetRepeat.value.set(
          val.offset.x,
          val.offset.y,
          val.repeat.x,
          val.repeat.y
        );
      }
    });
    this.onPropertyChange('opacity', (val) => {
      this.uniforms.opacity.value = val;
    });
    this.onPropertyChange('combine', (val) => {
      if (this.uniforms.combine) {
        this.uniforms.combine.value = val;
      }
    });
    this.onPropertyChange('envMap', (val) => {
      if (val) this.uniforms.envMap.value = val;
    });
    this.fog = parameters.fog;
    this.opacity =
      parameters.opacity === undefined || parameters.opacity === null
        ? 1
        : parameters.opacity;
    this.color =
      parameters.color !== undefined
        ? parameters.color
        : new THREE.Color(0xffffff);
    this.map = parameters.map || null;
    this.envMap = parameters.envMap || null;
    this.combine = parameters.combine || null;
  }
}
