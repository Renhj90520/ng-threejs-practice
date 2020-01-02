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

      #ifdef FLIP_SIDED
        objectNormal = -objectNormal;
      #endif

      vec3 transformedNormal = normalMatrix * objectNormal;

      #ifdef FLAT_SHADED
        vNormal = normalize(transformedNormal);
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
        gl_Position.z = log2(max(EPSILON, gl_Position.w + 1.0)) * logDepthBufFC;
        #ifdef USE_LOGDEPTHBUF_EXT
          vFragDepth = 1.0 + gl_Position.w;
        #else
          gl_Position.z = (gl_Position.z - 1.0) * gl_Position.w;
        #endif
      #endif

      vViewPosition = -mvPosition.xyz;

      #if defined(USE_ENVMAP) || defined(PHONG) || defined(LAMBERT) || defined(USE_SHADOWMAP)
          #ifdef USE_SKINNING
              vec4 worldPosition = modelMatrix * skinned;
          #elif defined(USE_MORPHTARGETS)
              vec4 worldPosition = modelMatrix * vec4(morphed, 1.0);
          #else
              vec4 worldPosition = modelMatrix * vec4(position, 1.0);
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
      for(int i = 0; i < MAX_SHADOWS; i ++) {
        vShadowCoord[i] = shadowMatrix[i] * worldPosition;
      }
    #endif
    }
  `;
  fragmentShader = `
    varying vec3 vWorldPos;
    uniform float envMapOffset;
    uniform float flipWorldPos;
    #ifdef USE_REFLECTIONMASK;
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

    float square(in float a) { return a * a; }
    vec2  square(in vec2 a)  { return vec2(a.x*a.x, a.y*a.y); }
    vec3  square(in vec3 a)  { return vec3(a.x*a.x, a.y*a.y, a.z*a.z); }
    vec4  square(in vec4 a)  { return vec4(a.x*a.x, a.y*a.y, a.z*a.z, a.w*a.w); }
    float saturate(in float a) { return clamp(a, 0.0, 1.0); }
    vec2  saturate(in vec2 a)  { return clamp(a, 0.0, 1.0); }
    vec3  saturate(in vec3 a)  { return clamp(a, 0.0, 1.0); }
    vec4  saturate(in vec4 a)  { return clamp(a, 0.0, 1.0); }
    float average(in float a) { return a; }
    float average(in vec2 a)  { return (a.x + a.y) * 0.5; }
    float average(in vec3 a)  { return (a.x + a.y + a.z) / 3.0; }
    float average(in vec4 a)  { return (a.x + a.y + a.z + a.w) * 0.25; }
    float whiteCompliment(in float a) { return saturate(1.0 - a); }
    vec2  whiteCompliment(in vec2 a)  { return saturate(vec2(1.0) - a); }
    vec3  whiteCompliment(in vec3 a)  { return saturate(vec3(1.0) - a); }
    vec4  whiteCompliment(in vec4 a)  { return saturate(vec4(1.0) - a); }
    vec3 transformDirection(in vec3 normal, in mat4 matrix) {
      return normalize((matrix * vec4(normal, 0.0)).xyz);
    }
    vec3 inverseTransformDirection(in vec3 normal, in mat4 matrix) {
      return normalize((vec4(normal, 0.0) * matrix).xyz);
    }
    vec3 projectOnPlane(in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal) {
      float distance = dot(planeNormal, point-pointOnPlane);
      return point - distance * planeNormal;
    }
    float sideOfPlane(in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal) {
      return sign(dot(point - pointOnPlane, planeNormal));
    }
    vec3 linePlaneIntersect(in vec3 pointOnLine, in vec3 lineDirection, in vec3 pointOnPlane, in vec3 planeNormal) {
      return pointOnLine + lineDirection * (dot(planeNormal, pointOnPlane - pointOnLine) / dot(planeNormal, lineDirection));
    }
    float calcLightAttenuation(float lightDistance, float cutoffDistance, float decayExponent) {
      if (decayExponent > 0.0) {
        return pow(saturate(1.0 - lightDistance / cutoffDistance), decayExponent);
      }
      return 1.0;
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
      return pow(a, vec3(1.0 / float(GAMMA_FACTOR)));
    #else
      return a;
    #endif
    }
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
      uniform vec3 hemisphereLightDirection[MAX_HEMI_LIGHT];
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
    #ifdef FLAT_SHADED
      varying vec3 vNormal;
    #endif
    #ifdef USE_SHADOWMAP
      uniform sampler2D shadowMap[MAX_SHADOWS];
      uniform vec2 shadowMapSize[MAX_SHADOWS];
      uniform float shadowDarkness[MAX_SHDOWS];
      uniform float shadowBias[MAX_SHAODWS];
      varying vec4 vShadowCoord[MAX_SHADOWS];
      float unpackDepth(const in vec4 rgba_depth) {
        const vec4 bit_shift = vec4(1. / (256. * 256. * 256.), 1. / (256. * 256.), 1. / 256., 1.);
        float depth = dot(rgba_depth, bit_shift);
        return depth;
      }
    #endif
    #ifdef USE_BUMPMAP
      uniform sampler2D bumpMap;
      uniform float bumpScale;
      vec2 dHdxy_fwd() {
        vec2 dSTdx = dFdx(vUv);
        vec2 dSTdy = dFdy(vUv);
        float Hll = bumpScale * texture2D(bumpMap, vUv).x;
        float dBx = bumpScale * texture2D(bumpMap, vUv + dSTdx).x - Hll;
        float dBy = bumpScale * texture2D(bumpMap, vUv + dSTdy).x - Hll;

        return vec2(dBx, dBy);
      }
      vec3 perturbNormalArb(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy) {
        vec3 vSigmaX = dFdx(surf_pos);
        vec3 vSigmaY = dFdy(surf_pos);
        vec3 vN = surf_norm;
        vec3 R1 = cross(vSigmaU, vN);
        vec3 R2 = cross(vN, vSigmaX);
        float fDet = dot(vSigmaX, R1);
        vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);
        return normalize(abs(fDet) * surf_norm - vGrad);
      }
    #endif
    #ifdef USE_NORMALMAP
      uniform sampler2D normalMap;
      uniform vec2 normalScale;
      vec3 perturbNormal2Arb(vec3 eye_pos, vec3 surf_norm) {
        vec3 q0 = dFdx(eye_pos.xyz);
        vec3 q1 = dFdy(eys_pos.xyz);
        vec2 st0 = dFdx(vUv.st);
        vec2 st1 = dFdy(vUv.st);
        vec3 S = normalize(q0 * st1.t - q1 * st0.t);
        vec3 T = normalize(-q0 * st1.s + q1 * st0.s);
        vec3 N = normalize(surf_norm);
        vec3 mapN = texture2D(normalMap, vUv).xyz * 2. - 1.;
        mapN.xy = normalScale * mapN.xy;
        mat3 tsn mat3(S, T, N);
        return normalize(tsn * mapN);
      }
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
        diffuseColor.rgb *= vColor;
      #endif
      #ifdef USE_ALPHAMAP
        diffuseColor.a *= texture2D(alphaMap, vUv).g;
      #endif

      #ifdef ALPHATEST
        if(diffuseColor.a < ALPHATEST) discard;
      #endif
      float specularStrength;
      #ifdef USE_SPECULARMAP
        vec4 texelSpecular = texture2D(specularMap, vUv);
        specularStrength =texelSpecular.r;
      #else
        specularStrength = 1.;
      #endif

      #ifdef FLAT_SHADED
        vec3 normal = normalize(vNormal);
        #ifdef DOUBLE_SIDED
          normal = normal * (-1. + 2. * float(gl_FrontFacing));
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
        for(int i = 0; i < MAX_POINT_LIGHTS; i++) {
          vec4 lPosition = viewMatrix * vec4(pointLightPosition[i], 1.);
          vec3 lVector = lPosition.xyz + vViewPosition.xyz;
          float attenuation = calcLightAttenuation(length(lVector), pointLightDistance[i], pointLightDecay[i]);
          lVector = normalize(lVector);
          // diffuse
          float dotProduct = dot(normal, lVector);
          #ifdef WRAP_AROUND
            float pointDiffuseWeightFull = max(dotProduct, 0.0);
            float pointDiffuseWeightHalf = max(.5 * dotProduct + .5, 0.0);
            vec3 pointDiffuseWeight = mix(vec3(pointDiffuseWeightFull), vec3(pointDiffuseWeightHalf), wrapRGB);
          #else
            float pointDiffuseWeight = max(dotProduct, 0.0);
          #endif

          totalDiffuseLight += pointLightColor[i] * pointDiffuseWeight * attenuation;

          // specular
          vec3 pointHalfVector = normalize(lVector + viewPosition);
          float pointDotNormalHalf = max(dot(normal, pointHalfVector), 0.0);
          float pointSpecularWeight = specularStrength * max(pow(pointDotNormalHalf, shininess), 0.0);
          float specularNormalization = (shininess + 2.) / 8.;
          vec3 schlick = specular + vec3(1. - specular) * pow(max(1. - dot(lVector, pointHalfVector), 0.0), 5.);
          totalSpecularLight += schlick * pointLightColor[i] * pointSpecularWeight * pointDiffuseWeight * attenuation * specularNormalization;
        }
      #endif
      
      #if MAX_SPOT_LIGHTS > 0
        for(int i = 0; i < MAX_SPOT_LIGHTS; i++) {
          vec4 lPosition = viewMatrix * vec4(spotLightPosition[i], 1.);
          vec3 lVector = lPosition.xyz + vViewPosition.xyz;
          float attenuation = calcLightAttenuation(length(lVector), spotLightDistance[i], spotLightDecay[i]);
          lVector = normalize(lVector);
          float spotEffect = dot(spotLightDirection[i], normalize(spotLightPosition[i] - vWorldPosition));
          if(spotEffect > spotLightAngleCos[i]) {
            spotEffect = max(pow(max(spotEffect, 0.0), spotLightExponent[i]), 0.0);
            // diffuse
            float dotProduct = dot(normal, lVector);
            #ifdef WRAP_AROUND
              float spotDiffuseWeightFull = max(dotProduct, 0.0);
              float spotDiffuseWeightHalf = max(.5 * dotProduct + .5, 0.0);
              vec3 spotDiffuseWeight = mix(vec3(spotDiffuseWeightFull), vec3(spotDiffuseWeightHalf), wrapRGB);
            #else
              float spotDiffuseWeight = max(dotProduct, 0.0);
            #endif
            totalDiffuseLight += spotLightColor[i] * spotDiffuseWeight * attenuation * spotEffect;
            // specular
            vec3 spotHalfVector = normalize(lVector + viewPosition);
            float spotDotNormalHalf = max(dot(normal, spotHalfVector), 0.0);
            float spotSpecularWeight = specularStrength * max(pow(spotDotNormalHalf, shininess), 0.0);
            float specularNormalization = (shininess + 2.) / 8.;
            vec3 schlick = specular + vec3(1.0 - specular) * pow(max(1.0 - dot(lVector, spotHalfVector), 0.0), 5.0);
            totalSpecularLight += schlick * spotLightColor[i] * spotSpecularWeight * spotDiffuseWeight * attenuation * specularNormalization * spotEffect;
          }
        }
      #endif
      
    }
  `;
  uniforms = {};
  constructor(parameters) {
    super(parameters);
  }
}
