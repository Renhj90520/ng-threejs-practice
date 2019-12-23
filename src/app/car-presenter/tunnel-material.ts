import * as THREE from 'three';
import * as _ from 'lodash';
import BasicCustomShaderMaterial from './custom-shadermaterial';

export default class TunnelMaterial extends BasicCustomShaderMaterial {
  vertexShader = `
    varying vec3 vWorldPos;
    #ifdef USE_MAP
        varying vec2 vUv;
        uniform vec4 offsetRepeat;
    #endif
    void main() {
        #ifdef USE_MAP
            vUv = uv * offsetRepeat.zw + offsetRepeat.xy;
        #endif
        vWorldPos = (modelMatrix * vec4(position,1.)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    }
  `;
  fragmentShader = `
    varying vec3 vWorldPos;
    uniform vec3 glowPosition;
    uniform vec3 baseColor;
    uniform vec3 glowColor;
    uniform vec3 bgColor;
    uniform float gradientHeight;
    uniform float brightness;
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
        gl_FragColor = vec4(diffuse * brightness, opacity);
        #ifdef USE_MAP
            gl_FragColor = gl_FragColor * texture2D(map, vUv);
        #endif
        #ifdef ALPHATEST
            if(gl_FragColor.a < ALPHATEST) discard;
        #endif
        float depth = gl_FragCoord.z / gl_FragCoord.w;
        float fogFactor = clamp((depth - fogNear) / (fogFar - fogNear), 0.0, 1.);

        gl_FragColor = mix(gl_FragColor, vec4(fogColor, gl_FragColor.w), fogFactor);
        // vertical gradient
        float m = 1. - (smoothstep(0.0, gradientHeight, vWorldPos.y));
        gl_FragColor.rgb = mix(gl_FragColor.rgb, baseColor, m * brightness);
        // white light
        float d = distance(vWorldPos, glowPosition);
        m = 1. - (smoothstep(10., 15., d));
        gl_FragColor.rgb = mix(gl_FragColor.rgb, glowColor, m * brightness);
        // gray gradient
        m = smoothstep(5., 20., vWorldPos.z - (vWorldPos.x * .3));
        gl_FragColor.rgb = mix(gl_FragColor.rgb, baseColor, m * brightness);
        // fade to bgColor
        m = smoothstep(23., 25., vWorldPos.z - (vWorldPos.x * .45));
        gl_FragColor.rgb = mix(gl_FragColor.rgb, bgColor, m * brightness);
        // fade to white
        m = smoothstep(30., 35., abs(vWorldPos.x));
        gl_FragColor.rgb = mix(gl_FragColor.rgb, bgColor, m * brightness);
    }
  `;
  uniforms = {
    diffuse: { type: 'c', value: new THREE.Color(0xeeeeee) },
    opacity: { type: 'f', value: 1 },
    map: { type: 't', value: null },
    offsetRepeat: { type: 'v4', value: new THREE.Vector4(0, 0, 1, 1) },
    envMap: { type: 't', value: null },
    combine: { type: 't', value: 0 },
    fogNear: { type: 'f', value: 1 },
    fogFar: { type: 'f', value: 2000 },
    fogColor: { type: 'c', value: new THREE.Color(0xffffff) },
    baseColor: { type: 'c', value: new THREE.Color(0xffffff) },
    bgColor: { type: 'c', value: new THREE.Color(0xffffff) },
    glowColor: { type: 'c', value: new THREE.Color(0xffffff) },
    gradientHeight: { type: 'f', value: 5 },
    glowPosition: { type: 'v3', value: new THREE.Vector3(5, 5, 5) },
    brightness: { type: 'f', value: 1 }
  };
  bgColor: any;
  baseColor: any;
  glowColor: any;
  gradientHeight: any;
  glowPosition: any;
  brightness: any;
  constructor(parameters) {
    super(parameters);

    parameters = _.extend(
      {
        vertexShader: this.vertexShader,
        fragmentShader: this.fragmentShader,
        uniforms: this.uniforms
      },
      parameters
    );
    this.setParameters(parameters);
    this.onPropertyChange('glowPosition', val => {
      this.uniforms.glowPosition.value = val;
    });
    this.onPropertyChange('baseColor', val => {
      this.uniforms.baseColor.value = val;
    });
    this.onPropertyChange('glowColor', val => {
      this.uniforms.glowColor.value = val;
    });
    this.onPropertyChange('bgColor', val => {
      this.uniforms.bgColor.value = val;
    });
    this.onPropertyChange('gradientHeight', val => {
      this.uniforms.gradientHeight.value = val;
    });
    this.onPropertyChange('brightness', val => {
      this.uniforms.brightness.value = val;
    });
    this.bgColor = parameters.bgColor || new THREE.Color(0xeeeeee);
    this.baseColor = parameters.baseColor || new THREE.Color(0xffffff);
    this.glowColor = parameters.glowColor || new THREE.Color(0xffffff);
    this.gradientHeight =
      parameters.gradientHeight != undefined ? parameters.gradientHeight : 5;
    this.glowPosition = parameters.glowPosition || new THREE.Vector3(5, 5, 5);
    this.brightness = parameters.brightness || 1;
  }
}
