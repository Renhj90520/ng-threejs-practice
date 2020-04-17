import * as THREE from 'three';
import Mirror from './mirror';

export default class WaterEffect extends Mirror {
  vertexShader = `
    uniform mat4 textureMatrix;
    varying vec4 mirroCoord;
    varying vec3 worldPosition;
    void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
        vec4 worldPos = modelMatrix * vec4(position, 1.);
        mirroCoord = textureMatrix * worldPos;
        worldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * mvPosition;
    }
  `;
  fragmentShader = `
    precision highp float;
    uniform sampler2D mirrorSampler;
    uniform float alpha;
    uniform float time;
    uniform float distortionScale;
    uniform sampler2D normalSampler;
    uniform vec3 sunColor;
    uniform vec3 sunDirection;
    uniform vec3 eye;
    uniform vec3 color;
    varying vec4 mirrorCoord;
    varying vec3 worldPosition;
    vec4 getNoise(vec2 uv) {
        float uvScale = .5;
        float t = time * uvScale;
        vec2 uv0 = (uv / 20.) + vec2(t / 17., t / 29.);
        vec2 uv1 = (uv / 30.) - vec2(t / -19., t / 31.);
        vec2 uv2 = uv / vec2(9., 18.) + vec2(t / 101., t / 97.);
        vec2 uv3 = uv / vec2(13., 20.) - vec2(t / 109., t / -113.);
        uv0 /= uvScale;
        uv1 /= uvScale;
        uv2 /= uvScale;
        uv3 /= uvScale;
        vec4 noise = texture2D(normalSampler, uv0) + texture2D(normalSampler, uv1) + texture2D(normalSampler, uv2) + texture2D(normalSampler, uv3);
        return noise * .5 - 1.;
    }

    void sunLight(const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor) {
        vec3 reflection = normalize(reflect(-sunDirection, surfaceNormal));
        float direction = max(0., dot(eyeDirection, reflection));
        specularColor += pow(direction, shiny) * sunColor * spec;
        diffuseColor += max(dot(sunDirection, surfaceNormal), 0.) * sunColor * diffuse;
    }
    ${THREE.ShaderChunk.common}
    ${THREE.ShaderChunk.fog_pars_fragment}
    float blendOverlay(float base, float blend) {
        return (base < .5 ? (2. * base * blend) : (1. - 2. * (1. - base) * (1. - blend)));
    }
    
    void main() {
        vec4 noise = getNoise(worldPosition.xyz);
        vec3 surfaceNormal = normalize(noise.xyz * vec3(1.5, 1., 1.5));
        vec3 diffuseLight = vec3(0.);
        vec3 specularLight = vec3(0.);
        vec3 worldToEye = eye - worldPosition;
        vec3 eyeDirection = normalize(worldToEye);
        sunLight(surfaceNormal, eyeDirection, 200., 1.5, .5, diffuseLight, specularLight);
        float distance = length(worldToEye);
        vec2 distortion = surfaceNormal.xz * (.0001 + 1. / distance) * distortionScale;
        vec4 mirrorDistord = mirrorCoord;
        mirrorDistord.x += distortion.x;
        mirrorDistord.w += distortion.y;
        vec3 reflectionSample = texture2DProj(mirrorSampler, mirrorDistord).rgb;
        reflectionSample = vec3(.565, .714, .831);
        float theta = max(dot(eyeDirection, surfaceNormal), 0.);
        float rf0 = .3;
        float d = 1. - clamp(distance / 1500., 0., 1.);
        float reflectance = d * clamp(rf0 + (1. - rf0) * pow((1. - theta), 5.), 0., 1.);
        reflectance = 1.;
        vec3 scatter = max(0., dot(surfaceNormal, eyeDirection)) * color;
        vec3 albedo = mix(sunColor * diffuseLight * .3 + scatter, (mix(scatter, reflectionSample, .75) + reflectionSample * specularLight), reflectance);
        vec3 outgoingLight = albedo;
        ${THREE.ShaderChunk.fog_fragment}
        gl_FragColor = vec4(outgoingLight, max(alpha, specularLight.r)); 
    }
  `;
  uniforms = {
    color: { value: new THREE.Color(0x555555) },
    mirrorSampler: { value: null },
    textureMatrix: { value: new THREE.Matrix4() },
    normalSampler: { value: null },
    alpha: { value: 1 },
    time: { value: 0 },
    distortionScale: { value: 20 },
    noiseScale: { value: 1 },
    sunColor: { value: new THREE.Color(0x7f7f7f) },
    sunDirection: { value: new THREE.Vector3(0.70707, 0.70707, 0) },
    eye: { value: new THREE.Vector3() },
  };
  clipBais: any;
  alpha: any;
  time: any;
  normalSampler: any;
  sunDirection: any;
  sunColor: THREE.Color;
  eye: any;
  distortionScale: any;
  side: any;
  fog: any;
  constructor(renderer, camera, opts) {
    super(renderer, camera, opts);
    this.init(opts, renderer, camera);
    if (opts.transparent) {
      this.material.transparent = true;
    }

    this.material.uniforms.alpha.value = this.alpha;
    this.material.uniforms.time.value = this.time;
    this.material.uniforms.normalSampler.value = this.normalSampler;
    this.material.uniforms.sunColor.value = this.sunColor;
    this.material.uniforms.sunDirection.value = this.sunDirection;
    this.material.uniforms.distortionScale.value = this.distortionScale;
    this.material.uniforms.eye.value = this.eye;
  }

  initOpts(opts: any) {
    this.clipBais = opts.clipBias || 0;
    this.alpha = opts.alpha ?? 1;
    this.time = opts.time || 0;
    this.normalSampler = opts.waterNormals || null;
    this.sunDirection = opts.sunColor ?? new THREE.Vector3(0.70707, 0.70707, 0);
    this.sunColor = new THREE.Color(opts.sunColor ?? 0xffffff);
    this.eye = opts.eye ?? new THREE.Vector3(0, 0, 0);
    this.distortionScale = opts.distortionScale ?? 10;
    this.side = opts.side ?? THREE.DoubleSide;
    this.fog = opts.fog ?? false;
  }

  initMaterial() {
    this.material = new THREE.ShaderMaterial({
      fragmentShader: this.fragmentShader,
      vertexShader: this.vertexShader,
      uniforms: this.uniforms,
      side: this.side,
      fog: this.fog,
    });
  }

  updateTextureMatrix() {
    const cameraMatrixWorld = new THREE.Vector3();
    cameraMatrixWorld.setFromMatrixPosition(this.camera.matrixWorld);
    this.eye = cameraMatrixWorld;
    this.material.uniforms.eye.value = this.eye;
  }

  update() {
    const cameraPosition = new THREE.Vector3();
    this.updateMatrixWorld();
    this.camera.updateMatrixWorld();
    cameraPosition.setFromMatrixPosition(this.camera.matrixWorld);
    this.eye = cameraPosition;
    this.material.uniforms.eys.value = this.eye;
  }
}
