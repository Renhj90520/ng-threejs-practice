import * as THREE from 'three';
import BasicCustomShaderMaterial from './custom-shadermaterial';

export default class RealisticMaterial extends BasicCustomShaderMaterial {
  vertexShader = `
    #ifdef USE_COLOR
      attribute vec3 color;
      varying vec3 vColor;
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
        uniform float morphTargetInfluences[8];
      #else
        attribute vec3 morphTarget4;
        attribute vec3 morphTarget5;
        attribute vec3 morphTarget6;
        attribute vec3 morphTarget7;
        uniform float morphTargetInfluences[4];
      #endif
    #endif
    #define PHONG
    varying vec3 vViewPosition;
    #ifndef FLAT_SHADED
      varying vec3 vNormal;
    #endif
    #define PI 3.14159
    #define PI2 6.28318
    #define RECIPROCAL_PI2 0.15915494
    #define LOG2 1.442695
    #define EPSILON 1e-6

    float square(in float a) {
      return a * a;
    }
    vec2 square(in vec2 a) {
      return vec2(a.x * a.x, a.y * a.y);
    }
    vec3 square(in vec3 a) {
      return vec2(a.x * a.x, a.y * a.y, a.z * a.z);
    }
    vec4 square(in vec4 a) {
      return vec2(a.x * a.x, a.y * a.y, a.z * a.z, a.w * a.w);
    }

    float saturate(in float a) {
      return clamp(a, 0.0, 1.);
    }
    vec2 saturate(in vec2 a) {
      return clamp(a, 0.0, 1.);
    }
    vec3 saturate(in vec3 a) {
      return clamp(a, 0.0, 1.);
    }
    vec4 saturate(in vec4 a) {
      return clamp(a, 0.0, 1.);
    }

    float average(in float a) {
      return a;
    }
    float average(in vec2 a) {
      return (a.x + a.y) * .5;
    }
    float average(in vec3 a) {
      return (a.x + a.y + a.z) / 3.;
    }
    float average(in vec4 a) {
      return (a.x + a.y + a.z + a.w) * .25;
    }

    float whitecompliment(in float a) {
      return saturate(1. - a);
    }
    ve2 whitecompliment(in vec2 a) {
      return saturate(vec2(1.) - a);
    }
    vec3 whitecompliment(in vec3 a) {
      return saturate(vec3(1.) - a);
    }
    float whitecompliment(in vec4 a) {
      return saturate(vec4(1.) - a);
    }

    vec3 transformDirection(in vec3 normal, in mat4 matrix) {
      return normalize((matrix * vec4(normal, 0.0)).xyz);
    }

    vec3 inverseTransformDirection(in vec3 normal, in mat4 matrix) {
      return normalize((vec4(normal, 0.0) * matrix)).xyz);
    }
    vec3 projectOnPlane(in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal) {
      float distance = dot(planeNormal, point - pointOnPlane);
      return point - distance * planeNormal;
    }
    float sideOfPlane(in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal) {
      return sign(dot(point - pointOnPlane, planeNormal));
    }
    vec3 linePlaneInterset(in vec3 pointOnLine, in vec3 lineDirection, in vec3 pointOnPlane, in vec3 planeNormal) {
      return pointOnLine + lineDirection * (dot(planeNormal, pointOnPlane - pointOnLine) / dot(planeNormal, lineDirection));
    }

    float calcLightAttenuation(float lightDistance, float cutoffDistance, float decayExponent) {
      if(decayExponent > 0.0) {
        return pow(saturate(1. - lightDistance / cutoffDistance), decayExponent);
      }
      return 1.;
    }

    vec3 inputToLinear(in vec3 a) {
      #ifdef GAMMA_INPUT
        return pow(a, vec3(float(GAMMA_FACTOR)));
      #else
        return a;
      #endif
    }

    vec3 linearToOutput(in vec3 a) {
      #ifdef GAMMA_OUTPUT
        return pow(a, vec3(1. / float(GAMMA_FACTOR)));
      #else
        return a;
      #endif
    }

    #if defined(USE_MAP) || defined(USE_BUMPMAP) || defined(USE_NORMALMAP) || defined(USE_SPECULARMAP) || defined(USE_ALPHAMAP)
      varying vec2 vUv;
      uniform vec4 offsetRepeat;
    #endif

    #ifdef USE_LIGHTMAP
      varying vec2 vUv2;
    #endif

    #if defined(USE_ENVMAP) && !defined(USE_BUMPMAP) && !defined(USE_NORMALMAP) && !defined(PHONG)
      varying vec3 vReflect;
      uniform float refractionRatio;
    #endif

    #if MAX_SPOT_LIGHTS > 0 || defined(USE_BUMPMAP) || defined(USE_ENVMAP)
      varying vec3 vWroldPosition;
    #endif

    #ifdef USE_SKINNING
      uniform mat4 bindMatrix;
      uniform mat4 bindMatrixInverse;

      #ifdef BONE_TEXTURE
        uniform sampler2D boneTexture;
        uniform int boneTextureWidth;
        uniform int boneTextureHeight;
        mat4 getBoneMatrix(const in float i) {
          flaot j = i * 4.;
          float x = mod(j, float(boneTextureWidth));
          float y = floor(j / boneTextureWidth);
          float dx = 1. / float(boneTextureWidth);
          float dy = 1. / float(boneTextureHeight);
          y = dy * (y + .5);
          vec4 v1 = texture2D(boneTexture, vec2(dx * (x + .5), y));
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
        skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;

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
    }
  `;
  fragmentShader = ``;
  uniforms = {};
  constructor(parameters) {
    super(parameters);
  }
}
