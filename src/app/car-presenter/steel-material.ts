import * as THREE from 'three';
import RealisticMaterial from './realistic-material';
import * as _ from 'lodash';
import {
  square,
  saturate,
  average,
  whitecompliment,
  transformDirection,
  inverseTransformDirection,
  projectOnPlane,
  sideOfPlane,
  linePlaneIntersect,
  calcLightAttenuation,
  inputToLinear,
  linearToOutput,
  unpackDepth,
  dHdxy_fwd,
  perturbNormalArb,
  perturbNormal2Arb,
  lights
} from './glsl-fragments';

export default class SteelMaterial extends RealisticMaterial {
  vertexShader = `
    ${lights}
    varying vec3 vWorldPos;
    varying float vOpacity;
    varying float vDistance;
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
    #ifndef FLAT_SHADED
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
    ${whitecompliment}
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

    #if defined(USE_ENVMAP) && !defined(USE_BUMPMAP) && !defined(USE_NORMALMAP) && !defined(PHONG)
      varying vec3 vReflect;
      uniform float refractionRatio;
    #endif

    #if defined(USE_BUMPMAP) || defined(USE_ENVMAP) || MAX_SPOT_LIGHTS > 0
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
          float j = i * 4.;
          float x = mod(j, float(boneTextureWidth));
          float y = floor(j / float(boneTextureWidth));
          float dx = 1. / float(boneTextureWidth);
          float dy = 1. / float(boneTextureHeight);
          y = dy *(y + .5);
          vec4 v1 = texture2D(boneTexture, vec2(dx *(x + .5), y));
          vec4 v2 = texture2D(boneTexture, vec2(dx *(x + 1.5), y));
          vec4 v3 = texture2D(boneTexture, vec2(dx *(x + 2.5), y));
          vec4 v4 = texture2D(boneTexture, vec2(dx *(x + 3.5), y));
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
      vWorldPos =(modelMatrix * vec4(position, 1.)).xyz;
      #ifdef TRANSPARENT_MODE
        vOpacity = 1. - smoothstep(.5, 1.75, vWorldPos.y);
      #else
        vOpacity = 1.;
      #endif

      #if defined(USE_MAP) || defined(USE_BUMPMAP) || defined(USE_NORMALMAP) || defined(USE_SPECULARMAP) || defined(USE_ALPHAMAP)
        vUv = uv * offsetRepeat.zw + offsetRepeat.xy;
      #endif

      #ifdef USE_LIGHTMAP
        vUv2 = uv2;
      #endif

      #ifdef USE_COLOR
        vColor.xyz= inputToLinear(color.xyz);
      #endif

      #ifdef USE_MORPHNORMALS
        vec3 morphedNormal = vec3(0.0);
        morphedNormal +=(morphNormal0 - normal) * morphTargetInfluences[0];
        morphedNormal +=(morphNormal1 - normal) * morphTargetInfluences[1];
        morphedNormal +=(morphNormal2 - normal) * morphTargetInfluences[2];
        morphedNormal +=(morphNormal3 - normal) * morphTargetInfluences[3];
        morphedNormal += normal;
      #endif
      #ifdef USE_SKINNING
        mat4 boneMatX = getBoneMatrix(skinIndex.x);
        mat4 boneMatY = getBoneMatrix(skinIndex.y);
        mat4 boneMatZ = getBoneMatrix(skinIndex.z);
        mat4 boneMatW = getBoneMatrix(skinIndex.w);

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

      #ifndef FLAT_SHADED
        vNormal = normalize(transformedNormal);
      #endif

      #ifdef USE_MORPHTARGETS
        vec3 morphed = vec3(0.0);
        morphed +=(morphTarget0 - position) * morphTargetInfluences[0];
        morphed +=(morphTarget1 - position) * morphTargetInfluences[1];
        morphed +=(morphTarget2 - position) * morphTargetInfluences[2];
        morphed +=(morphTarget3 - position) * morphTargetInfluences[3];

        #ifndef USE_MORPHNORMALS
        morphed +=(morphTarget4 - position) * morphTargetInfluences[4];
        morphed +=(morphTarget5 - position) * morphTargetInfluences[5];
        morphed +=(morphTarget6 - position) * morphTargetInfluences[6];
        morphed +=(morphTarget7 - position) * morphTargetInfluences[7];
        #endif
        morphed += position;
      #endif

      #ifdef USE_SKINNING
        #ifdef USE_MORPHTARGETS
          vec4 skinVertex = bindMatrix * vec4(morphed, 1.);
        #else
          vec4 skinVertex = bindMatrix * vec4(position, 1.);
        #endif
        vec4 skinned = vec4(0.0);
        skinned += boneMatX * skinVertex * skinWeight.x;
        skinned += boneMatY * skinVertex * skinWeight.y;
        skinned += boneMatZ * skinVertex * skinWeight.z;
        skinned += boneMatW * skinVertex * skinWeight.w;
        skinned = bindMatrixInverse * skinned;

        vec4 mvPosition = modelViewMatrix * skinned;
      #elif defined(USE_MORPHTARGETS)
        vec4 mvPosition = modelViewMatrix * vec4(morphed, 1.);
      #else
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
      #endif

      vDistance = length(mvPosition.xyz);
      gl_Position = projectionMatrix * mvPosition;

      #ifdef USE_LOGDEPTHBUF
        gl_Position.z = log2(max(EPSILON, gl_Position.w + 1.)) * logDepthBufFC;
        #ifdef USE_LOGDEPTHBUF_EXT
          vFragDepth = 1. + gl_Position.w;
        #else
          gl_Position.z =(gl_Position.z - 1.) * gl_Position.w;
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
      #if defined(USE_BUMPMAP) || defined(USE_ENVMAP) || MAX_SPOT_LIGHTS > 0
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
    ${lights}
    varying vec3 vWorldPos;
    varying float vOpacity;
    varying float vDistance;
    uniform float envMapOffset;
    uniform float flipN;
    #ifdef USE_REFLECTIONMASK
      uniform sampler2D reflectionMask;
    #endif
    uniform sampler2D paintMask;
    #define PHONG
    uniform vec3 diffuse;
    uniform vec3 diffuse2;
    uniform float colorTransition;
    uniform float carLength;
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
    ${whitecompliment}
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
      ${unpackDepth}
    #endif

    #ifdef USE_BUMPMAP
      uniform sampler2D bumpMap;
      uniform float bumpScale;
      ${dHdxy_fwd}
      ${perturbNormalArb}
    #endif

    #ifdef USE_NORMALMAP
      uniform sampler2D normalMap;
      uniform vec2 normalScale;
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
      // Transition between two diffuse colors
      float smoothingLength = .5;
      float l = carLength + smoothingLength;
      float edge1 =((l / 2.) -(colorTransition * l)) +(smoothingLength / 2.);
      float edge2 =((l / 2.) -(colorTransition * l)) -(smoothingLength / 2.);
      if(vWorldPos.z > edge1) {
        diffuseColor = vec4(diffuse2, opacity);
      }
      if(vWorldPos.z < edge1 && vWorldPos.z > edge2) {
        diffuseColor = vec4(mix(diffuse, diffuse2, smoothstep(edge2, edge1, vWorldPos.z)), opacity);
      }
      #ifdef USE_PAINTMASK
        vec4 texelPaintMask = texture2D(paintMask, vUv);
        diffuseColor.rgb = mix(vec3(1.), diffuseColor.rgb, texelPaintMask.r);
      #endif
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
        specularStrength = texelSpecular.r;
      #else
        specularStrength = 1.;
      #endif
      #ifndef FLAT_SHADED
        vec3 normal = normalize(vNormal);
        #ifdef DOUBLE_SIDED
          normal = normal *(-1. + 2. * float(gl_FrontFacing));
        #endif
      #else
        vec3 fdx = dFdx(vViewPosition);
        vec3 fdy = dFdy(vViewPosition);
        vec3 normal = normalize(cross(fdx, fdy));
      #endif
      vec3 viewPosition = normalize(vViewPosition);
      #ifdef USE_NORMALMAP
        normal = perturbNormal2Arb(-vViewPosition, flipN * normal);
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
            float pointDiffuseWeightHalf = max(0.5 * dotProduct + 0.5, 0.0);
            vec3 pointDiffuseWeight = mix(vec3(pointDiffuseWeightFull), vec3(pointDiffuseWeightHalf), wrapRGB);
          #else
            float pointDiffuseWeight = max(dotProduct, 0.0);
          #endif
          totalDiffuseLight += pointLightColor[i] * pointDiffuseWeight * attenuation;
          // specular
          vec3 pointHalfVector = normalize(lVector + viewPosition);
          float pointDotNormalHalf = max(dot(normal, pointHalfVector), 0.0);
          float pointSpecularWeight = specularStrength * max(pow(pointDotNormalHalf, shininess), 0.0);
          float specularNormalization =(shininess + 2.0) / 8.0;
          vec3 schlick = specular + vec3(1.0 - specular) * pow(max(1.0 - dot(lVector, pointHalfVector), 0.0), 5.0);
          totalSpecularLight += schlick * pointLightColor[i] * pointSpecularWeight * pointDiffuseWeight * attenuation * specularNormalization;
        }
      #endif
      #if MAX_SPOT_LIGHTS > 0
        for(int i = 0; i < MAX_SPOT_LIGHTS; i++) {
          vec4 lPosition = viewMatrix * vec4(spotLightPosition[i], 1.0);
          vec3 lVector = lPosition.xyz + vViewPosition.xyz;
          float attenuation = calcLightAttenuation(length(lVector), spotLightDistance[i], spotLightDecay[i]);
          lVector = normalize(lVector);
          float spotEffect = dot(spotLightDirection[i], normalize(spotLightPosition[i] - vWorldPosition));
          if(spotEffect > spotLightAngleCos[i]) {
            spotEffect = max(pow(max(spotEffect, 0.0), spotLightExponent[i]), 0.0);
            // diffuse
            float dotProduct = dot(flipN * normal, lVector);
            #ifdef WRAP_AROUND
              float spotDiffuseWeightFull = max(dotProduct, 0.0);
              float spotDiffuseWeightHalf = max(0.5 * dotProduct + 0.5, 0.0);
              vec3 spotDiffuseWeight = mix(vec3(spotDiffuseWeightFull), vec3(spotDiffuseWeightHalf), wrapRGB);
            #else
              float spotDiffuseWeight = max(dotProduct, 0.0);
            #endif
            totalDiffuseLight += spotLightColor[i] * spotDiffuseWeight * attenuation * spotEffect;
            // specular
            vec3 spotHalfVector = normalize(lVector + viewPosition);
            float spotDotNormalHalf = max(dot(flipN * normal, spotHalfVector), 0.0);
            float spotSpecularWeight = specularStrength * max(pow(spotDotNormalHalf, shininess), 0.0);
            float specularNormalization =(shininess + 2.0) / 8.0;
            vec3 schlick = specular + vec3(1.0 - specular) * pow(max(1.0 - dot(lVector, spotHalfVector), 0.0), 5.0);
            totalSpecularLight += schlick * spotLightColor[i] * spotSpecularWeight * spotDiffuseWeight * attenuation * specularNormalization * spotEffect;
          }
        }
      #endif
      #if MAX_DIR_LIGHTS > 0
        for(int i = 0; i < MAX_DIR_LIGHTS; i++) {
          vec3 dirVector = transformDirection(directionalLightDirection[i], viewMatrix);
          // diffuse
          float dotProduct = dot(normal, dirVector);
          #ifdef WRAP_AROUND
            float dirDiffuseWeightFull = max(dotProduct, 0.0);
            float dirDiffuseWeightHalf = max(0.5 * dotProduct + 0.5, 0.0);
            vec3 dirDiffuseWeight = mix(vec3(dirDiffuseWeightFull), vec3(dirDiffuseWeightHalf), wrapRGB);
          #else
            float dirDiffuseWeight = max(dotProduct, 0.0);
          #endif
          totalDiffuseLight += directionalLightColor[i] * dirDiffuseWeight;
          // specular
          vec3 dirHalfVector = normalize(dirVector + viewPosition);
          float dirDotNormalHalf = max(dot(normal, dirHalfVector), 0.0);
          float dirSpecularWeight = specularStrength * max(pow(dirDotNormalHalf, shininess), 0.0);
          
          float specularNormalization =(shininess + 2.0) / 8.0;
          vec3 schlick = specular + vec3(1.0 - specular) * pow(max(1.0 - dot(dirVector, dirHalfVector), 0.0), 5.0);
          totalSpecularLight += schlick * directionalLightColor[i] * dirSpecularWeight * dirDiffuseWeight * specularNormalization;
        }
      #endif
      #if MAX_HEMI_LIGHTS > 0
        for(int i = 0; i < MAX_HEMI_LIGHTS; i++) {
          vec3 lVector = transformDirection(hemisphereLightDirection[i], viewMatrix);
          // diffuse
          float dotProduct = dot(flipN * normal, lVector);
          float hemiDiffuseWeight = 0.5 * dotProduct + 0.5;
          vec3 hemiColor = mix(hemisphereLightGroundColor[i], hemisphereLightSkyColor[i], hemiDiffuseWeight);
          totalDiffuseLight += hemiColor;
          // specular(sky light)
          vec3 hemiHalfVectorSky = normalize(lVector + viewPosition);
          float hemiDotNormalHalfSky = 0.5 * dot(flipN * normal, hemiHalfVectorSky) + 0.5;
          float hemiSpecularWeightSky = specularStrength * max(pow(max(hemiDotNormalHalfSky, 0.0), shininess), 0.0);
          // specular(ground light)
          vec3 lVectorGround = -lVector;
          vec3 hemiHalfVectorGround = normalize(lVectorGround + viewPosition);
          float hemiDotNormalHalfGround = 0.5 * dot(flipN * normal, hemiHalfVectorGround) + 0.5;
          float hemiSpecularWeightGround = specularStrength * max(pow(max(hemiDotNormalHalfGround, 0.0), shininess), 0.0);
          float dotProductGround = dot(flipN * normal, lVectorGround);
          float specularNormalization =(shininess + 2.0) / 8.0;
          vec3 schlickSky = specular + vec3(1.0 - specular) * pow(max(1.0 - dot(lVector, hemiHalfVectorSky), 0.0), 5.0);
          vec3 schlickGround = specular + vec3(1.0 - specular) * pow(max(1.0 - dot(lVectorGround, hemiHalfVectorGround), 0.0), 5.0);
          totalSpecularLight += hemiColor * specularNormalization *(schlickSky * hemiSpecularWeightSky * max(dotProduct, 0.0) + schlickGround * hemiSpecularWeightGround * max(dotProductGround, 0.0));
        }
      #endif
      #ifdef METAL
        outgoingLight += diffuseColor.rgb *(totalDiffuseLight + ambientLightColor) * specular + totalSpecularLight + emissive;
      #else
        outgoingLight += diffuseColor.rgb *(totalDiffuseLight + ambientLightColor) + totalSpecularLight + emissive;
      #endif
      #ifdef USE_LIGHTMAP
          outgoingLight *= diffuseColor.xyz * texture2D(lightMap, vUv2).xyz;
      #endif
      #ifdef USE_ENVMAP
        #if defined(USE_BUMPMAP) || defined(USE_NORMALMAP) || defined(PHONG)

          vec3 cameraToVertex = normalize(vWorldPosition - cameraPosition);
          // Transforming Normal Vectors with the Inverse Transformation
          vec3 worldNormal = inverseTransformDirection(flipN * normal, viewMatrix);
          #ifdef ENVMAP_MODE_REFLECTION
              vec3 reflectVec = reflect(cameraToVertex, worldNormal);
          #else
              vec3 reflectVec = refract(cameraToVertex, worldNormal, refractionRatio);
          #endif
        #else
          vec3 reflectVec = vReflect;
        #endif
        #ifdef DOUBLE_SIDED
          float flipNormal =(-1.0 + 2.0 * float(gl_FrontFacing));
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
        #ifdef USE_REFLECTIONMASK
          vec4 maskTexel = texture2D(reflectionMask, vUv);
          float chromeReflectivity = 0.75;
          float plasticReflectivity = 0.1;
          // Mix when area is chrome(red component in mask)
          outgoingLight = mix(outgoingLight, envColor.xyz, specularStrength * maskTexel.r * chromeReflectivity);
          // Add when area is shiny plastic / glass(blue component in mask)
          outgoingLight +=(envColor.xyz * specularStrength * maskTexel.b * plasticReflectivity);

          #ifdef USE_PAINTMASK
              // Mix when area is carpaint
              outgoingLight = mix(outgoingLight, envColor.xyz, specularStrength * reflectivity * texelPaintMask.r);
          #endif
        #else
          #ifdef ENVMAP_BLENDING_MULTIPLY
            outgoingLight = mix(outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity);
          #elif defined(ENVMAP_BLENDING_MIX)
            outgoingLight = mix(outgoingLight, envColor.xyz, specularStrength * reflectivity);
          #elif defined(ENVMAP_BLENDING_ADD)
            outgoingLight += envColor.xyz * specularStrength * reflectivity;
          #endif
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
        for(int i = 0; i < MAX_SHADOWS; i++) {
          vec3 shadowCoord = vShadowCoord[i].xyz / vShadowCoord[i].w;
          bvec4 inFrustumVec = bvec4(shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0);
          bool inFrustum = all(inFrustumVec);
          // don't shadow pixels outside of light frustum
          // use just first frustum(for cascades)
          // don't shadow pixels behind far plane of light frustum
          #ifdef SHADOWMAP_CASCADE
            inFrustumCount += int(inFrustum);
            bvec3 frustumTestVec = bvec3(inFrustum, inFrustumCount == 1, shadowCoord.z <= 1.0);
          #else
            bvec2 frustumTestVec = bvec2(inFrustum, shadowCoord.z <= 1.0);
          #endif
          bool frustumTest = all(frustumTestVec);
          if(frustumTest) {
            shadowCoord.z += shadowBias[i];
            #if defined(SHADOWMAP_TYPE_PCF)
              // Percentage-close filtering
              //(9 pixel kernel)
              // http://fabiensanglard.net/shadowmappingPCF/
              float shadow = 0.0;
    
              const float shadowDelta = 1.0 / 9.0;
              float xPixelOffset = 1.0 / shadowMapSize[i].x;
              float yPixelOffset = 1.0 / shadowMapSize[i].y;
              float dx0 = -1.25 * xPixelOffset;
              float dy0 = -1.25 * yPixelOffset;
              float dx1 = 1.25 * xPixelOffset;
              float dy1 = 1.25 * yPixelOffset;
              fDepth = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy + vec2(dx0, dy0)));
              if(fDepth < shadowCoord.z) shadow += shadowDelta;
              fDepth = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy + vec2(0.0, dy0)));
              if(fDepth < shadowCoord.z) shadow += shadowDelta;
              fDepth = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy + vec2(dx1, dy0)));
              if(fDepth < shadowCoord.z) shadow += shadowDelta;
              fDepth = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy + vec2(dx0, 0.0)));
              if(fDepth < shadowCoord.z) shadow += shadowDelta;
              fDepth = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy));
              if(fDepth < shadowCoord.z) shadow += shadowDelta;
              fDepth = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy + vec2(dx1, 0.0)));
              if(fDepth < shadowCoord.z) shadow += shadowDelta;
              fDepth = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy + vec2(dx0, dy1)));
              if(fDepth < shadowCoord.z) shadow += shadowDelta;
              fDepth = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy + vec2(0.0, dy1)));
              if(fDepth < shadowCoord.z) shadow += shadowDelta;
              fDepth = unpackDepth(texture2D(shadowMap[i], shadowCoord.xy + vec2(dx1, dy1)));
              if(fDepth < shadowCoord.z) shadow += shadowDelta;
              shadowColor = shadowColor * vec3((1.0 - shadowDarkness[i] * shadow));
            #elif defined(SHADOWMAP_TYPE_PCF_SOFT)
              // Percentage-close filtering
              //(9 pixel kernel)
              // http://fabiensanglard.net/shadowmappingPCF/
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
              if(fDepth < shadowCoord.z)
              // spot with multiple shadows is darker
                shadowColor = shadowColor * vec3(1.0 - shadowDarkness[i]);
              // spot with multiple shadows has the same color as single shadow spot
              //                  shadowColor = min(shadowColor, vec3(shadowDarkness[i]));
            #endif
          }

          #ifdef SHADOWMAP_DEBUG
            #ifdef SHADOWMAP_CASCADE
              if(inFrustum && inFrustumCount == 1) outgoingLight *= frustumColors[i];
            #else
              if(inFrustum) outgoingLight *= frustumColors[i];
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
        float o = smoothstep(0.15, 0.35, vDistance);
      #ifdef USE_EMISSIVEMAP
        float emissiveness = texture2D(emissiveMap, vUv).r;
        vec3 ec = vec3(1.0);
        #ifdef USE_EMISSIVECOLOR
          ec = emissiveColor;
        #endif
        gl_FragColor = vec4(mix(outgoingLight.rgb,(texelColor.rgb +(vec3(1.0) * emissiveIntensity)) * ec, emissiveness * emissiveIntensity), diffuseColor.a * vOpacity * o);
      #else
        gl_FragColor = vec4(outgoingLight, diffuseColor.a * vOpacity * o);
      #endif
    }
  `;
  uniforms: any = {
    diffuse: { type: 'c', value: new THREE.Color(0xeeeeee) },
    diffuse2: { type: 'c', value: new THREE.Color(0xffffff) },
    colorTransition: { type: 'f', value: 0 },
    opacity: { type: 'f', value: 1 },
    map: { type: 't', value: null },
    lightMap: { type: 't', value: null },
    offsetRepeat: { type: 'v4', value: new THREE.Vector4(0, 0, 1, 1) },
    fogNear: { type: 'f', value: 1 },
    fogFar: { type: 'f', value: 2000 },
    fogColor: { type: 'c', value: new THREE.Color(0xffffff) },
    emissive: { type: 'c', value: new THREE.Color(0x000000) },
    wrapRGB: { type: 'v3', value: new THREE.Vector3(1, 1, 1) },
    pointLightColor: { type: 'fv', value: [] },
    pointLightPosition: { type: 'fv', value: [] },
    pointLightDistance: { type: 'fv', value: [] },
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
    combine: { type: 'f', value: 0 },
    shininess: { type: 'f', value: 30 },
    emissiveMap: { type: 't', value: null },
    emissiveColor: { type: 'c', value: null },
    emissiveIntensity: { type: 'f', value: 1 },
    carLength: { type: 'f', value: 1 },
    reflectionMask: { type: 't', value: null },
    paintMask: { type: 't', value: null },
    envMapOffset: { type: 'f', value: 0 },
    flipN: { type: 'f', value: 1 }
  };
  color2: THREE.Color;
  carLength: any;
  paintMask: any;
  envMapOffset: any;
  constructor(parameters) {
    super(parameters);
    this.derivatives = true;
    parameters = _.extend(
      {
        vertexShader: this.vertexShader,
        fragmentShader: this.fragmentShader,
        uniforms: this.uniforms,
        defines: {
          USE_AOMAP: false,
          LIGHTMAP_ENABLED: false,
          SKINNED: false,
          USE_EMISSIVEMAP: parameters.emissiveMap !== undefined,
          USE_REFLECTIONMASK: parameters.reflectionMask !== undefined,
          USE_PAINTMASK: parameters.paintMask !== undefined,
          USE_EMISSIVECOLOR: parameters.emissiveColor !== undefined,
          TRANSPARENT_MODE: false
        }
      },
      parameters
    );
    this.setParameters(parameters);
    this.onPropertyChange('color2', val => {
      this.uniforms.diffuse2.value = val;
    });
    this.onPropertyChange('colorTransition', val => {
      this.uniforms.colorTransition.value = val;
    });
    this.onPropertyChange('carLength', val => {
      this.uniforms.carLength = val;
    });
    this.onPropertyChange('paintMask', val => {
      if (val) {
        this.uniforms.paintMask.value = val;
      }
    });
    this.onPropertyChange('envMapOffset', val => {
      this.uniforms.envMapOffset.value = val;
    });
    this.onPropertyChange('transparentMode', val => {
      this.defines.TRANSPARENT_MODE = val;
      this.needsUpdate = true;
    });
    this.color2 = new THREE.Color(parameters.color2 || 0xffffff);
    this.carLength = parameters.carLength || 5;
    this.paintMask = parameters.paintMask || null;
    this.envMapOffset = parameters.envMapOffset || 0;
    this.uniforms.flipN.value = parameters.flipN ? -1 : 1;
  }
}
