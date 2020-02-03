import * as THREE from 'three';
import * as _ from 'lodash';
import RealisticMaterial from './realistic-material';
import {
  square,
  saturate,
  average,
  whiteCompliment,
  transformDirection,
  inverseTransformDirection,
  projectOnPlane,
  sideOfPlane,
  linePlaneIntersect,
  calcLightAttenuation,
  inputToLinear,
  linearToOutput,
  dHdxy_fwd,
  perturbNormalArb,
  perturbNormal2Arb
} from './glsl-fragments';

export default class RimMaterial extends RealisticMaterial {
  vertexShader = `
    varying vec3 vWorldPos;
    #ifdef USE_COLOR
      attribute vec3 color;
    #endif
    #ifdef USE_MORPHTARGETS
      attribute vec3 morphTarget0;
      attribute vec3 morphTarget1;
      attribute vec3 morphTarget2;
      attribute vec3 morphTarget3;

      #ifdef USE_MORPHNORMALS
        attribute vec3 morphNormal0;
        attribute vec3 morphNormal1;
        attribute vec3 morphNormal2;
        attribute vec3 morphNormal3;
      #else
        attribute vec3 morphTarget4;
        attribute vec3 morphTarget5;
        attribute vec3 morphTarget6;
        attribute vec3 morphTarget7;
      #endif
    #endif
    #define PHONG

    varying vec3 vViewPosition;
    #ifdef FLAT_SHADED
      varying vec3 vNormal;
    #endif
    
    #define PI 3.14159
    #define PI2 6.28318
    #define RECIPROCAL_PI2 0.15915494
    #define LOG2 1.442695
    #define EPSILON 1e-6

    ${square}
    ${saturate}
    ${average}
    ${whiteCompliment}
    ${transformDirection}
    ${inverseTransformDirection}
    ${projectOnPlane}
    ${sideOfPlane}
    ${linePlaneIntersect}
    ${calcLightAttenuation}
    ${inputToLinear}
    ${linearToOutput}
    #if defined(USE_MAP) || defined(USE_BUMPMAP) || defined(USE_NORMALMAP) || defined(USE_SPECULARMAP) || defined(USE_ALPHAMAP)
      varying vec2 vUv;
      uniform vec4 offsetRepeat;
    #endif
    #ifdef USE_LIGHTMAP
      varying vec2 vUv2;
    #endif
    #if defined(USE_ENVMAP) && ! defined(USE_BUMPMAP) && ! defined(USE_NORMALMAP) && ! defined(PHONG)
      varying vec3 vReflect;
      uniform float refractionRatio;
    #endif
    #if MAX_SPOT_LIGHTS > 0 || defined(USE_BUMPMAP) || defined(USE_ENVMAP)
      varying vec3 vWorldPosition;
    #endif
    #ifdef USE_COLOR
      varying vec3 vColor;
    #endif
    #ifdef USE_MORPHTARGETS
      #ifndef USE_MORPHNORMALS
        uniform float morphTargetInfluences[8];
      #else
        uniform float morphTargetInfluences[4];
      #endif
    #endif
    #ifdef USE_SKINNING
      uniform mat4 bindMatrix;
      uniform mat4 bindMatrixInverse;
      #ifdef BONE_TEXTURE
        uniform sampler2D boneTexture;
        uniform int boneTextureWidth;
        uniform int boneTextureHeight;
        mat4 getBoneMatrix(const in float i) {
          float j = i * 4.0;
          float x = mod(j, float(boneTextureWidth));
          float y = floor(j / float(boneTextureWidth));
          float dx = 1.0 / float(boneTextureWidth);
          float dy = 1.0 / float(boneTextureHeight);
          y = dy * (y + 0.5);
          vec4 v1 = texture2D(boneTexture, vec2(dx * (x + 0.5), y));
          vec4 v2 = texture2D(boneTexture, vec2(dx * (x + 1.5), y));
          vec4 v3 = texture2D(boneTexture, vec2(dx * (x + 2.5), y));
          vec4 v4 = texture2D(boneTexture, vec2(dx * (x + 3.5), y));
          mat4 bone = mat4(v1, v2, v3, v4);
          return bone;
        }
      #else
        uniform mat4 boneGlobalMatrices[MAX_BONES];
        mat4 getBoneMatrix(const in float i) {
          mat4 bone = boneGlobalMatrices[int(i)];
          return bone;
        }
      #endif
    #endif
    #ifdef USE_SHADOWMAP
      varying vec4 vShadowCoord[MAX_SHADOWS];
      uniform mat4 shadowMatrix[MAX_SHADOWS];
    #endif
    #ifdef USE_LOGDEPTHBUF
      #ifdef USE_LOGDEPTHBUF_EXT
          varying float vFragDepth;
      #endif
      uniform float logDepthBufFC;
    #endif
    void main() {
      vWorldPos = (modelMatrix * vec4(position, 1.)).xyz;
      #if defined(USE_MAP) || defined(USE_BUMPMAP) || defined(USE_NORMALMAP) || defined(USE_SPECULARMAP) || defined(USE_ALPHAMAP)
        vUv = uv * offsetRepeat.zw + offsetRepeat.xy;
      #endif
      #ifdef USE_LIGHTMAP
        vUv2 = uv2;
      #endif
      #ifdef USE_COLOR
        vColor.xyz = inputToLinear(color.xyz);
      #endif

      #ifdef USE_MORPHNORMALS
        vec3 morphedNormal = vec3(0.0);
        morphedNormal += (morphNormal0 - normal) * morphTargetInfluences[0];
        morphedNormal += (morphNormal1 - normal) * morphTargetInfluences[1];
        morphedNormal += (morphNormal2 - normal) * morphTargetInfluences[2];
        morphedNormal += (morphNormal3 - normal) * morphTargetInfluences[3];
        morphedNormal += normal;
      #endif
      #ifdef USE_SKINNING
        mat4 boneMatX = getBoneMatrix(skinIndex.x);
        mat4 boneMatY = getBoneMatrix(skinIndex.y);
        mat4 boneMatZ = getBoneMatrix(skinIndex.z);
        mat4 boneMatW = getBoneMatrix(skinIndex.w);
      #endif
      #ifdef USE_SKINNING
        mat4 skinMatrix = mat4(0.0);
        skinMatrix += skinWeight.x * boneMatX;
        skinMatrix += skinWeight.y * boneMatY;
        skinMatrix += skinWeight.z * boneMatZ;
        skinMatrix += skinWeight.w * boneMatW;
        skinMatrix  = bindMatrixInverse * skinMatrix * bindMatrix;
        #ifdef USE_MORPHNORMALS
          vec4 skinnedNormal = skinMatrix * vec4(morphedNormal, 0.0);
        #else
          vec4 skinnedNormal = skinMatrix * vec4(normal, 0.0);
        #endif
      #endif
      #ifdef USE_SKINNING
        vec3 objectNormal = skinnedNormal.xyz;
      #elif defined(USE_MORPHNORMALS)
        vec3 objectNormal = morphedNormal;
      #else
        vec3 objectNormal = normal;
      #endif
      #ifdef FLIP_SIDED
        objectNormal = -objectNormal;
      #endif

      vec3 transformedNormal = normalMatrix * objectNormal;
      #ifdef FLAT_SHADED
        vNormal = normalize(transformedNormal)
      #endif

      #ifdef USE_MORPHTARGETS
        vec3 morphed = vec3(0.0);
        morphed += (morphTarget0 - position) * morphTargetInfluences[0];
        morphed += (morphTarget1 - position) * morphTargetInfluences[1];
        morphed += (morphTarget2 - position) * morphTargetInfluences[2];
        morphed += (morphTarget3 - position) * morphTargetInfluences[3];
        #ifndef USE_MORPHNORMALS
          morphed += (morphTarget4 - position) * morphTargetInfluences[4];
          morphed += (morphTarget5 - position) * morphTargetInfluences[5];
          morphed += (morphTarget6 - position) * morphTargetInfluences[6];
          morphed += (morphTarget7 - position) * morphTargetInfluences[7];
        #endif
        morphed += position;
      #endif

      #ifdef USE_SKINNING
        #ifdef USE_MORPHTARGETS
          vec4 skinVertex = bindMatrix * vec4(morphed, 1.0);
        #else
          vec4 skinVertex = bindMatrix * vec4(position, 1.0);
        #endif
        vec4 skinned = vec4(0.0);
        skinned += boneMatX * skinVertex * skinWeight.x;
        skinned += boneMatY * skinVertex * skinWeight.y;
        skinned += boneMatZ * skinVertex * skinWeight.z;
        skinned += boneMatW * skinVertex * skinWeight.w;
        skinned  = bindMatrixInverse * skinned;
      #endif

      #ifdef USE_SKINNING
        vec4 mvPosition = modelViewMatrix * skinned;
      #elif defined(USE_MORPHTARGETS)
        vec4 mvPosition = modelViewMatrix * vec4(morphed, 1.0);
      #else
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      #endif

      gl_Position = projectionMatrix * mvPosition;

      #ifdef USE_LOGDEPTHBUF
        gl_Position.z = log2(max(EPSILON, gl_Position.w + 1.)) * logDepthBufFC;
        #ifdef USE_LOGDEPTHBUF_EXT
          vFragDepth = 1. + gl_Position.w;
        #else
          gl_Position.z = (gl_Position - 1.) * gl_Position.w;
        #endif
      #endif

      vViewPosition = -mvPosition.xyz;

      #if defined(USE_ENVMAP) || defined(PHONG) || defined(LAMBERT) || defined(USE_SHADOWMAP)
        #ifdef USE_SKINNING
          vec4 worldPosition = modelMatrix * skinned;
        #elif defined(USE_MORPHTARGETS)
          vec4 worldPosition = modelMatrix * vec4(morphed, 1.);
        #else
          vec4 worldPosition = modelMatrix * vec4(position, 1.);
        #endif
      #endif

      #if defined(USE_ENVMAP) && ! defined(USE_BUMPMAP) && ! defined(USE_NORMALMAP) && ! defined(PHONG)
        vec3 worldNormal = transformDirection(objectNormal, modelMatrix);
        vec3 cameraToVertex = normalize(worldPosition.xyz - cameraPosition);
        #ifdef ENVMAP_MODE_REFLECTION
          vReflect = reflect(cameraToVertex, worldNormal);
        #else
          vReflect = refract(cameraToVertex, worldNormal, refractionRatio);
        #endif
      #endif
      #if MAX_SPOT_LIGHTS > 0 || defined(USE_BUMPMAP) || defined(USE_ENVMAP)
        vWorldPosition = worldPosition.xyz;
      #endif
      #ifdef USE_SHADOWMAP
        for(int i = 0; i < MAX_SHADOWS; i++) {
          vShadowCoord[i] = shadowMatrix[i] * worldPosition;
        }
      #endif
    }
  `;
  fragmentShader = `
    varying vec3 vWorldPos;
    uniform float envMapOffset;
    uniform float flipWorldPos;
    #ifdef USE_REFLECTIONMASK
        uniform sampler2D reflectionMask;
    #endif
    #define PHONG
    uniform vec3 diffuse;
    varying vec3 vPosition;
    uniform vec3 emissive;
    uniform vec3 specular;
    uniform float shininess;
    uniform float opacity;
    #define PI 3.14159
    #define PI2 6.28318
    #define RECIPROCAL_PI2 0.15915494
    #define LOG2 1.442695
    #define EPSILON 1e-6

    ${square}
    ${saturate}
    ${average}
    ${whiteCompliment}
    ${transformDirection}
    ${inverseTransformDirection}
    ${projectOnPlane}
    ${sideOfPlane}
    ${linePlaneIntersect}
    ${calcLightAttenuation}
    ${inputToLinear}
    ${linearToOutput}

    #ifdef USE_COLOR
      varying vec3 vColor;
    #endif
    #if defined(USE_MAP) || defined(USE_BUMPMAP) || defined(USE_NORMALMAP) || defined(USE_SPECULARMAP) || defined(USE_ALPHAMAP)
      varying vec2 vUv;
    #endif
    #ifdef USE_MAP
      uniform sampler2D map;
    #endif
    #ifdef USE_ALPHAMAP
      uniform sampler2D alphaMap;
    #endif
    #ifdef USE_LIGHTMAP
      varying vec2 vUv2;
      uniform sampler2D lightMap;
    #endif
    #ifdef USE_EMISSIVEMAP
      uniform sampler2D emissiveMap;
      uniform float emissiveIntensity;
      #ifdef USE_EMISSIVECOLOR
        uniform vec3 emissiveColor;
      #endif
    #endif
    #ifdef USE_ENVMAP
      uniform float reflectivity;
      #ifdef ENVMAP_TYPE_CUBE
        uniform samplerCube envMap;
      #else
        uniform sampler2D envMap;
      #endif
      uniform float flipEnvMap;
      #if defined(USE_BUMPMAP) || defined(USE_NORMALMAP) || defined(PHONG)
        uniform float refractionRatio;
      #else
        varying vec3 vReflect;
      #endif
    #endif
    #ifdef USE_FOG
      uniform vec3 fogColor;
      #ifdef FOG_EXP2
        uniform float fogDensity;
      #else
        uniform float fogNear;
        uniform float fogFar;
      #endif
    #endif
    uniform vec3 ambientLightColor;
    #if MAX_DIR_LIGHTS > 0
      uniform vec3 directionalLightColor[MAX_DIR_LIGHTS];
      uniform vec3 directionalLightDirection[MAX_DIR_LIGHTS];
    #endif
    #if MAX_HEMI_LIGHTS > 0
      uniform vec3 hemisphereLightSkyColor[MAX_HEMI_LIGHTS];
      uniform vec3 hemisphereLightGroundColor[MAX_HEMI_LIGHTS];
      uniform vec3 hemisphereLightDirection[MAX_HEMI_LIGHTS];
    #endif
    #if MAX_POINT_LIGHTS > 0
      uniform vec3 pointLightColor[MAX_POINT_LIGHTS];
      uniform vec3 pointLightPosition[MAX_POINT_LIGHTS];
      uniform float pointLightDistance[MAX_POINT_LIGHTS];
      uniform float pointLightDecay[MAX_POINT_LIGHTS];
    #endif
    #if MAX_SPOT_LIGHTS > 0
      uniform vec3 spotLightColor[MAX_SPOT_LIGHTS];
      uniform vec3 spotLightPosition[MAX_SPOT_LIGHTS];
      uniform vec3 spotLightDirection[MAX_SPOT_LIGHTS];
      uniform float spotLightAngleCos[MAX_SPOT_LIGHTS];
      uniform float spotLightExponent[MAX_SPOT_LIGHTS];
      uniform float spotLightDistance[MAX_SPOT_LIGHTS];
      uniform float spotLightDecay[MAX_SPOT_LIGHTS];
    #endif
    #if MAX_SPOT_LIGHTS > 0 || defined(USE_BUMPMAP) || defined(USE_ENVMAP)
      varying vec3 vWorldPosition;
    #endif
    #ifdef WRAP_AROUND
      uniform vec3 wrapRGB;
    #endif
    varying vec3 vViewPosition;
    #ifndef FLAT_SHADED
      varying vec3 vNormal;
    #endif
    #ifdef USE_SHADOWMAP
      uniform sampler2D shadowMap[MAX_SHADOWS];
      uniform vec2 shadowMapSize[MAX_SHADOWS];
      uniform float shadowDarkness[MAX_SHADOWS];
      uniform float shadowBias[MAX_SHADOWS];
      varying vec4 vShadowCoord[MAX_SHADOWS];
      float unpackDepth(const in vec4 rgba_depth) {
        const vec4 bit_shift = vec4(1.0 / (256.0 * 256.0 * 256.0), 1.0 / (256.0 * 256.0), 1.0 / 256.0, 1.0);
        float depth = dot(rgba_depth, bit_shift);
        return depth;
      }
    #endif

    #ifdef USE_BUMPMAP
      uniform sampler2D bumpMap;
      uniform float bumpScale;
      // Derivative maps - bump mapping unparametrized surfaces by Morten Mikkelsen
      // http://mmikkelsen3d.blogspot.sk/2011/07/derivative-maps.html
      // Evaluate the derivative of the height w.r.t. screen-space using forward differencing (listing 2)
      ${dHdxy_fwd}
      ${perturbNormalArb}
    #endif

    #ifdef USE_NORMALMAP
      uniform sampler2D normalMap;
      uniform vec2 normalScale;
      // Per-Pixel Tangent Space Normal Mapping
      // http://hacksoflife.blogspot.ch/2009/11/per-pixel-tangent-space-normal-mapping.html
      ${perturbNormal2Arb}
    #endif
    #ifdef USE_SPECULARMAP
      uniform sampler2D specularMap;
    #endif
    #ifdef USE_LOGDEPTHBUF
      uniform float logDepthBufFC;
      #ifdef USE_LOGDEPTHBUF_EXT
        #extension GL_EXT_frag_depth : enable
        varying float vFragDepth;
      #endif
    #endif
    void main() {
      vec3 outgoingLight = vec3(0.0);
      vec4 diffuseColor = vec4(diffuse, opacity);
      #if defined(USE_LOGDEPTHBUF) && defined(USE_LOGDEPTHBUF_EXT)
        gl_FragDepthEXT = log2(vFragDepth) * logDepthBufFC * .5;
      #endif
      #ifdef USE_MAP
        vec4 texelColor = texture2D(map, vUv);
        texelColor.xyz = inputToLinear(texelColor.xyz);
        diffuseColor *= texelColor;
      #endif

      #ifdef USE_COLOR
        diffuseColor * = vColor;
      #endif

      #ifdef USE_ALPHAMAP
        diffuseColor.a *= texture2D(alphaMap, vUv).g;
      #endif

      #ifdef ALPHATEST
        if(diffuseColor.a < ALPHATEST) discard;
      #endif
      float specularStrength;
      ifdef USE_SPECULARMAP
        vec4 texelSpecular = texture2D(specularMap, vUv);
        specularStrength = texelSpecular.r;
      #else
        specularStrength = 1.;
      #endif

      #ifdef FLAT_SHADED
        vec3 normal = normalize(vNormal);
        #ifdef DOUBLE_SIDED
          normal = normal * (-1. + 2. * float(fl_FrontFacing));
        #endif
      #else
        vec3 fdx = dFdx(vViewPosition);
        vec3 fdy = dFdy(vViewPosition);
        vec3 normal = normalize(cross(fdx, fdy));
      #endif
      vec3 viewPosition = normalize(vViewPosition);
      #ifdef USE_NORMALMAP
        normal = perturbNormal2Arb(-vViewPosition, normal);
      #elif defined(USE_BUMPMAP)
        normal = perturbNormalArb(-vViewPosition, normal, dHdxy_fwd());
      #endif
      vec3 totalDiffuseLight = vec3(0.0);
      vec3 totalSpecularLight = vec3(0.0);

      #if MAX_POINT_LIGHTS > 0
        for(int i = 0; i < MAX_POINTLIGHT; i++) {
          
        }
      #endif

    }
  `;
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
