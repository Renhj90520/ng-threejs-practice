import * as THREE from 'three';
import * as _ from 'lodash';
import BasicCustomShaderMaterial from './custom-shadermaterial';

export default class GroundMaterial extends BasicCustomShaderMaterial {
  vertexShader = `
    #ifdef USE_MAP
        varying vec2 vUv;
        uniform vec4 offsetRepeat;
    #endif
    #ifdef LIGHTMAP_ENABLED
        varying vec2 vUv2;
    #endif

    varying vec3 vWorldPos;
    varying float vDistance;

    void main() {
        vDistance = length(position);
        vWorldPos = (modelMatrix * vec4(position, 1.)).xyz;

        #ifdef USE_MAP
            vUv = uv * offsetRepeat.zw + offsetRepeat.xy;
        #endif
        #ifdef LIGHTMAP_ENABLED
            vUv2 = uv;
        #endif

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    }
  `;

  fragmentShader = `
    #ifdef USE_MAP
        varying vec2 vUv;
        uniform sampler2D map;
    #endif

    #ifdef LIGHTMAP_ENABLED
        varying vec2 vUv2;
        uniform sampler2D lightMap;
        uniform float lightMapOpacity;
    #endif

    uniform vec3 fogColor;
    uniform vec3 diffuse;
    uniform float opacity;
    uniform float fogNear;
    uniform float fogFar;
    varying vec3 vWorldPos;
    varying float vDistance;
    uniform vec3 colorStep1;
    uniform vec3 colorStep2;
    uniform vec3 colorStep3;

    void main() {
        gl_FragColor = vec4(diffuse, opacity);
        #ifdef USE_MAP
            gl_FragColor = gl_FragColor * texture2D(map, vUv);
        #endif

        #ifdef LIGHTMAP_ENABLED
            gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * texture2D(lightMap, vUv2).rgb, lightMapOpacity);
        #endif

        #ifdef ALPHATEST
            if (gl_FragColor.a < ALPHATEST) discard;
        #endif

        float depth = gl_FragCoord.z / gl_FragCoord.w;
        float fogFactor = clamp((depth - fogNear) / (fogFar - fogNear), 0.0, 1.0);

        gl_FragColor = mix(gl_FragColor, vec4(fogColor, gl_FragColor.w), fogFactor);

        float m = smoothstep(4.0, 9.0, vDistance);
        vec3 color = mix(gl_FragColor.rgb, colorStep1, m);
        gl_FragColor = vec4(color, 1.0);
        m = smoothstep(15., 25., vDistance);
        color = mix(gl_FragColor.rgb, colorStep2, m);
        gl_FragColor = vec4(color, 1.);
        m = smoothstep(22.0, 25.0, max(vWorldPos.z - (vWorldPos.x * .45), abs(vWorldPos.x * .75)));
        color = mix(gl_FragColor.rgb, colorStep3, m);
        gl_FragColor = vec4(color, 1.);
    }
  `;

  uniforms = {
    diffuse: { type: 'c', value: new THREE.Color(0xeeeeee) },
    opacity: { type: 'f', value: 1 },
    map: { type: 't', value: null },
    offsetRepeat: { type: 'v4', value: new THREE.Vector4(0, 0, 1, 1) },
    lightMap: { type: 't', value: null },
    lightMapOpacity: { type: 'f', value: 0 },
    envMap: { type: 't', value: null },
    combine: { type: 't', value: 0 },
    fogNear: { type: 'f', value: 1 },
    fogFar: { type: 'f', value: 2000 },
    fogColor: { type: 'c', value: new THREE.Color(0xffffff) },
    colorStep1: { type: 'c', value: new THREE.Color(0xff0000) },
    colorStep2: { type: 'c', value: new THREE.Color(0xff00ff) },
    colorStep3: { type: 'c', value: new THREE.Color(0x0000ff) },
    lightIntensity: { type: 'f', value: 1 }
  };
  lightIntensity: any;
  lightMap: any;
  lightMapOpacity: any;
  colorStep1: any;
  colorStep2: any;
  colorStep3: any;

  constructor(parameters) {
    super(parameters);
    parameters = _.extend(
      {
        vertexShader: this.vertexShader,
        fragmentShader: this.fragmentShader,
        uniforms: this.uniforms,
        defines: {
          USE_AOMAP: false,
          LIGHTMAP_ENABLED: parameters.lightMap !== undefined
        }
      },
      parameters
    );
    // super(parameters);
    this.setParameters(parameters);

    this.onPropertyChange('colorStep1', val => {
      this.uniforms.colorStep1.value = val;
    });
    this.onPropertyChange('colorStep2', val => {
      this.uniforms.colorStep2.value = val;
    });
    this.onPropertyChange('colorStep3', val => {
      this.uniforms.colorStep3.value = val;
    });
    this.onPropertyChange('lightIntensity', val => {
      this.uniforms.lightIntensity.value = val;
    });
    this.onPropertyChange('lightMap', val => {
      if (val) this.uniforms.lightMap.value = val;
    });
    this.onPropertyChange('lightMapOpacity', val => {
      this.uniforms.lightMapOpacity.value = val;
    });
    this.lightIntensity = parameters.lightIntensity || 1;
    this.lightMap = parameters.lightMap || null;
    this.lightMapOpacity = parameters.lightMapOpacity || 1;
    this.colorStep1 = parameters.colorStep1 || new THREE.Color(0xffffff);
    this.colorStep2 = parameters.colorStep2 || new THREE.Color(0xffffff);
    this.colorStep3 = parameters.colorStep3 || new THREE.Color(0xffffff);
  }

  update(e, mapOffset, mapRepeat) {
    console.log('ground material');
    console.log(e);
    this.uniforms.offsetRepeat.value.set(
      mapOffset.x,
      mapOffset.y,
      mapRepeat.x,
      mapRepeat.y
    );
  }
}
