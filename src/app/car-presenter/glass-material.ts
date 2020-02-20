import * as THREE from 'three';
import BasicCustomShaderMaterial from './custom-shadermaterial';
import * as _ from 'lodash';
import {
  square,
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
  lights,
  saturate
} from './glsl-fragments';
export default class GlassMaterial extends BasicCustomShaderMaterial {
  vertexShader = `
    ${lights}
    varying float vOpacity;
    #define PI 3.14159
    #define PI2 6.28318
    #define RECIPROCAL_PI2 0.15915494
    #define LOG2 1.442695
    #define EPSILON 1e-6
    ${square}
    ${average}
    ${saturate}
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
      vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      #ifdef TRANSPARENT_MODE
        vOpacity = 1.0 - smoothstep(0.5, 1.75, worldPos.y);
      #else
      vOpacity = 1.0;
      #endif
      #if defined(USE_MAP) || defined(USE_BUMPMAP) || defined(USE_NORMALMAP) || defined(USE_SPECULARMAP) || defined(USE_ALPHAMAP)
        vUv = uv * offsetRepeat.zw + offsetRepeat.xy;
      #endif
      #ifdef USE_LIGHTMAP
        vUv2 = uv2;
      #endif
      #ifdef USE_COLOR
        vColor.xyz = inputToLinear(color.xyz);
      #endif
      #ifdef USE_SKINNING
        mat4 boneMatX = getBoneMatrix(skinIndex.x);
        mat4 boneMatY = getBoneMatrix(skinIndex.y);
        mat4 boneMatZ = getBoneMatrix(skinIndex.z);
        mat4 boneMatW = getBoneMatrix(skinIndex.w);
      #endif
      #ifdef USE_ENVMAP
        #ifdef USE_MORPHNORMALS
          vec3 morphedNormal = vec3(0.0);
          morphedNormal += (morphNormal0 - normal) * morphTargetInfluences[0];
          morphedNormal += (morphNormal1 - normal) * morphTargetInfluences[1];
          morphedNormal += (morphNormal2 - normal) * morphTargetInfluences[2];
          morphedNormal += (morphNormal3 - normal) * morphTargetInfluences[3];
          morphedNormal += normal;
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
      #if defined(USE_ENVMAP) || defined(PHONG) || defined(LAMBERT) || defined (USE_SHADOWMAP)
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
      #ifdef USE_SHADOWMAP
        for(int i = 0; i < MAX_SHADOWS; i ++) {
          vShadowCoord[i] = shadowMatrix[i] * worldPosition;
        }
      #endif
    }
  `;
  fragmentShader = `
    varying float vOpacity;
    uniform vec3 diffuse;
    uniform float opacity;
    #define PI 3.14159
    #define PI2 6.28318
    #define RECIPROCAL_PI2 0.15915494
    #define LOG2 1.442695
    #define EPSILON 1e-6
    ${square}
    ${average}
    ${saturate}
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
    #ifdef USE_ENVMAP
      uniform float reflectivity;
      uniform float envMapOffset;
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
        gl_FragDepthEXT = log2(vFragDepth) * logDepthBufFC * 0.5;
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
        if (diffuseColor.a < ALPHATEST) discard;
      #endif
      float specularStrength;
      #ifdef USE_SPECULARMAP
        vec4 texelSpecular = texture2D(specularMap, vUv);
        specularStrength = texelSpecular.r;
      #else
        specularStrength = 1.0;
      #endif
      outgoingLight = diffuseColor.rgb;
      #ifdef USE_LIGHTMAP
        outgoingLight *= diffuseColor.xyz * texture2D(lightMap, vUv2).xyz;
      #endif
      #ifdef USE_ENVMAP
        vec3 reflectVec = vReflect;
        #ifdef DOUBLE_SIDED
          float flipNormal = (-1.0 + 2.0 * float(gl_FrontFacing));
        #else
          float flipNormal = 1.0;
        #endif
        #ifdef ENVMAP_TYPE_CUBE
          reflectVec.z += envMapOffset;
          vec4 envColor = textureCube(envMap, flipNormal * vec3(flipEnvMap * reflectVec.x, reflectVec.yz));
        #elif defined(ENVMAP_TYPE_EQUIREC)
          vec2 sampleUV;
          sampleUV.y = saturate(flipNormal * reflectVec.y * 0.5 + 0.5);
          sampleUV.x = atan(flipNormal * reflectVec.z, flipNormal * reflectVec.x) * RECIPROCAL_PI2 + 0.5;
          vec4 envColor = texture2D(envMap, sampleUV);
        #elif defined(ENVMAP_TYPE_SPHERE)
          vec3 reflectView = flipNormal * normalize((viewMatrix * vec4(reflectVec, 0.0)).xyz + vec3(0.0,0.0,1.0));
          vec4 envColor = texture2D(envMap, reflectView.xy * 0.5 + 0.5);
        #endif
        envColor.xyz = inputToLinear(envColor.xyz);
        float r = reflectivity;
        #ifdef DOUBLE_SIDED
          if (gl_FrontFacing == false) {
            r = 0.0;
          }
        #endif
        #ifdef ENVMAP_BLENDING_MULTIPLY
          outgoingLight = mix(outgoingLight, outgoingLight * envColor.xyz, specularStrength * r);
        #elif defined(ENVMAP_BLENDING_MIX)
          outgoingLight = mix(outgoingLight, envColor.xyz, specularStrength * r);
        #elif defined(ENVMAP_BLENDING_ADD)
          outgoingLight += envColor.xyz * specularStrength * r;
        #endif
      #endif
      #ifdef USE_SHADOWMAP
        #ifdef SHADOWMAP_DEBUG
          vec3 frustumColors[3];
          frustumColors[0] = vec3(1.0, 0.5, 0.0);
          frustumColors[1] = vec3(0.0, 1.0, 0.8);
          frustumColors[2] = vec3(0.0, 0.5, 1.0);
        #endif
        #ifdef SHADOWMAP_CASCADE
          int inFrustumCount = 0;
        #endif
        float fDepth;
        vec3 shadowColor = vec3(1.0);
        for(int i = 0; i < MAX_SHADOWS; i ++) {
          vec3 shadowCoord = vShadowCoord[i].xyz / vShadowCoord[i].w;
          bvec4 inFrustumVec = bvec4 (shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0);
          bool inFrustum = all(inFrustumVec);
          #ifdef SHADOWMAP_CASCADE
            inFrustumCount += int(inFrustum);
            bvec3 frustumTestVec = bvec3(inFrustum, inFrustumCount == 1, shadowCoord.z <= 1.0);
          #else
            bvec2 frustumTestVec = bvec2(inFrustum, shadowCoord.z <= 1.0);
          #endif
          bool frustumTest = all(frustumTestVec);
          if (frustumTest) {
            shadowCoord.z += shadowBias[i];
            #if defined(SHADOWMAP_TYPE_PCF)
              float shadow = 0.0;
              const float shadowDelta = 1.0 / 9.0;
              float xPixelOffset = 1.0 / shadowMapSize[i].x;
              float yPixelOffset = 1.0 / shadowMapSize[i].y;
              float dx0 = -1.25 * xPixelOffset;
              float dy0 = -1.25 * yPixelOffset;
              float dx1 = 1.25 * xPixelOffset;
              float dy1 = 1.25 * yPixelOffset;
              fDepth = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy + vec2(dx0, dy0)));
              if (fDepth < shadowCoord.z) shadow += shadowDelta;
              fDepth = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy + vec2(0.0, dy0)));
              if (fDepth < shadowCoord.z) shadow += shadowDelta;
              fDepth = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy + vec2(dx1, dy0)));
              if (fDepth < shadowCoord.z) shadow += shadowDelta;
              fDepth = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy + vec2(dx0, 0.0)));
              if (fDepth < shadowCoord.z) shadow += shadowDelta;
              fDepth = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy));
              if (fDepth < shadowCoord.z) shadow += shadowDelta;
              fDepth = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy + vec2(dx1, 0.0)));
              if (fDepth < shadowCoord.z) shadow += shadowDelta;
              fDepth = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy + vec2(dx0, dy1)));
              if (fDepth < shadowCoord.z) shadow += shadowDelta;
              fDepth = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy + vec2(0.0, dy1)));
              if (fDepth < shadowCoord.z) shadow += shadowDelta;
              fDepth = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy + vec2(dx1, dy1)));
              if (fDepth < shadowCoord.z) shadow += shadowDelta;
              shadowColor = shadowColor * vec3((1.0 - shadowDarkness[i] * shadow));
            #elif defined(SHADOWMAP_TYPE_PCF_SOFT)
              float shadow = 0.0;
              float xPixelOffset = 1.0 / shadowMapSize[i].x;
              float yPixelOffset = 1.0 / shadowMapSize[i].y;
              float dx0 = -1.0 * xPixelOffset;
              float dy0 = -1.0 * yPixelOffset;
              float dx1 = 1.0 * xPixelOffset;
              float dy1 = 1.0 * yPixelOffset;
              mat3 shadowKernel;
              mat3 depthKernel;
              depthKernel[0][0] = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy + vec2(dx0, dy0)));
              depthKernel[0][1] = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy + vec2(dx0, 0.0)));
              depthKernel[0][2] = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy + vec2(dx0, dy1)));
              depthKernel[1][0] = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy + vec2(0.0, dy0)));
              depthKernel[1][1] = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy));
              depthKernel[1][2] = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy + vec2(0.0, dy1)));
              depthKernel[2][0] = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy + vec2(dx1, dy0)));
              depthKernel[2][1] = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy + vec2(dx1, 0.0)));
              depthKernel[2][2] = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy + vec2(dx1, dy1)));
              vec3 shadowZ = vec3(shadowCoord.z);
              shadowKernel[0] = vec3(lessThan(depthKernel[0], shadowZ));
              shadowKernel[0] *= vec3(0.25);
              shadowKernel[1] = vec3(lessThan(depthKernel[1], shadowZ));
              shadowKernel[1] *= vec3(0.25);
              shadowKernel[2] = vec3(lessThan(depthKernel[2], shadowZ));
              shadowKernel[2] *= vec3(0.25);
              vec2 fractionalCoord = 1.0 - fract(shadowCoord.xy * shadowMapSize[i].xy);
              shadowKernel[0] = mix(shadowKernel[1], shadowKernel[0], fractionalCoord.x);
              shadowKernel[1] = mix(shadowKernel[2], shadowKernel[1], fractionalCoord.x);
              vec4 shadowValues;
              shadowValues.x = mix(shadowKernel[0][1], shadowKernel[0][0], fractionalCoord.y);
              shadowValues.y = mix(shadowKernel[0][2], shadowKernel[0][1], fractionalCoord.y);
              shadowValues.z = mix(shadowKernel[1][1], shadowKernel[1][0], fractionalCoord.y);
              shadowValues.w = mix(shadowKernel[1][2], shadowKernel[1][1], fractionalCoord.y);
              shadow = dot(shadowValues, vec4(1.0));
              shadowColor = shadowColor * vec3((1.0 - shadowDarkness[i] * shadow));
            #else
              vec4 rgbaDepth = texture2D(shadowMap[i], shadowCoord.xy);
              float fDepth = unpackDepth(rgbaDepth);
              if (fDepth < shadowCoord.z)
                shadowColor = shadowColor * vec3(1.0 - shadowDarkness[i]);
            #endif
          }

          #ifdef SHADOWMAP_DEBUG
            #ifdef SHADOWMAP_CASCADE
              if (inFrustum && inFrustumCount == 1) outgoingLight *= frustumColors[i];
            #else
              if (inFrustum) outgoingLight *= frustumColors[i];
            #endif
          #endif
        }
        // NOTE: I am unsure if this is correct in linear space.  -bhouston, Dec 29, 2014
        shadowColor = inputToLinear(shadowColor);
        outgoingLight = outgoingLight * shadowColor;
      #endif

      outgoingLight = linearToOutput(outgoingLight);
      #ifdef USE_FOG
        #ifdef USE_LOGDEPTHBUF_EXT
          float depth = gl_FragDepthEXT / gl_FragCoord.w;
        #else
          float depth = gl_FragCoord.z / gl_FragCoord.w;
        #endif
        #ifdef FOG_EXP2
          float fogFactor = exp2(- square(fogDensity) * square(depth) * LOG2);
          fogFactor = whiteCompliment(fogFactor);
        #else
          float fogFactor = smoothstep(fogNear, fogFar, depth);
        #endif
        outgoingLight = mix(outgoingLight, fogColor, fogFactor);
      #endif
      gl_FragColor = vec4(outgoingLight, diffuseColor.a * vOpacity);
    }
  `;
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
  envmapOffset: any;
  reflectivity: any;
  constructor(parameters) {
    super(parameters);
    parameters = _.extend(
      {
        vertexShader: this.vertexShader,
        fragmentShader: this.fragmentShader,
        uniforms: this.uniforms,
        defines: { TRANSPARENT_MODE: false }
      },
      parameters
    );
    this.setParameters(parameters);
    this.onPropertyChange('envMapOffset', val => {
      this.uniforms.envMapOffset.value = val;
    });
    this.onPropertyChange('reflectivity', val => {
      this.uniforms.reflectivity.value = val;
    });
    this.onPropertyChange('flipEnvMap', val => {
      this.uniforms.flipEnvMap.value = val;
    });
    this.onPropertyChange('transparentMode', val => {
      this.defines.TRANSPARENT_MODE = val;
      this.needsUpdate = true;
    });
    this.envMap = parameters.envMap || null;
    this.envmapOffset = parameters.envMapOffset || 0;
    this.reflectivity = parameters.reflectivity || 0.15;
  }
}
