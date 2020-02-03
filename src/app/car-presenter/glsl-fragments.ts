export const square = `
  float square(in float a) {
    return a * a;
  }
  vec2 square(in vec2 a) {
    return vec2(a.x * a.x, a.y * a.y);
  }
  vec3 square(in vec3 a) {
    return vec3(a.x * a.x, a.y * a.y, a.z * a.z);
  }
  vec4 square(in vec4 a) {
    return vec4(a.x * a.x, a.y * a.y, a.z * a.z, a.w * a.w);
  }
`;
export const saturate = `
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
  }`;
export const average = `
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
`;
export const whiteCompliment = `
  float whiteCompliment(in float a) {
    return saturate(1. - a);
  }
  ve2 whiteCompliment(in vec2 a) {
    return saturate(vec2(1.) - a);
  }
  vec3 whiteCompliment(in vec3 a) {
    return saturate(vec3(1.) - a);
  }
  float whiteCompliment(in vec4 a) {
    return saturate(vec4(1.) - a);
  }
`;
export const transformDirection = `
  vec3 transformDirection(in vec3 normal, in mat4 matrix) {
    return normalize((matrix * vec4(normal, 0.0)).xyz);
  }`;
export const inverseTransformDirection = `
  vec3 inverseTransformDirection(in vec3 normal, in mat4 matrix) {
    return normalize((vec4(normal, 0.0) * matrix).xyz);
  }
`;
export const projectOnPlane = `
  vec3 projectOnPlane(in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal) {
    float distance = dot(planeNormal, point-pointOnPlane);
    return point - distance * planeNormal;
  }
`;
export const sideOfPlane = `
  float sideOfPlane(in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal) {
    return sign(dot(point - pointOnPlane, planeNormal));
  }
`;
export const linePlaneIntersect = `
  vec3 linePlaneIntersect(in vec3 pointOnLine, in vec3 lineDirection, in vec3 pointOnPlane, in vec3 planeNormal) {
    return pointOnLine + lineDirection * (dot(planeNormal, pointOnPlane - pointOnLine) / dot(planeNormal, lineDirection));
  }
`;
export const calcLightAttenuation = `
  float calcLightAttenuation(float lightDistance, float cutoffDistance, float decayExponent) {
    if (decayExponent > 0.0) {
        return pow(saturate(1.0 - lightDistance / cutoffDistance), decayExponent);
    }
    return 1.0;
  }
`;

export const inputToLinear = `
  vec3 inputToLinear(in vec3 a) {
    #ifdef GAMMA_INPUT
      return pow(a, vec3(float(GAMMA_FACTOR)));
    #else
      return a;
    #endif
  }
`;

export const linearToOutput = `
  vec3 linearToOutput(in vec3 a) {
    #ifdef GAMMA_OUTPUT
      return pow(a, vec3(1.0 / float(GAMMA_FACTOR)));
    #else
      return a;
    #endif
  }
`;

export const unpackDepth = `
  float unpackDepth(const in vec4 rgba_depth) {
    const vec4 bit_shift = vec4(1. / (256. * 256. * 256.), 1. / (256. * 256.), 1. / 256., 1.);
    float depth = dot(rgba_depth, bit_shift);
    return depth;
  }
`;

export const dHdxy_fwd = `
  vec2 dHdxy_fwd() {
    vec2 dSTdx = dFdx(vUv);
    vec2 dSTdy = dFdy(vUv);
    float Hll = bumpScale * texture2D(bumpMap, vUv).x;
    float dBx = bumpScale * texture2D(bumpMap, vUv + dSTdx).x - Hll;
    float dBy = bumpScale * texture2D(bumpMap, vUv + dSTdy).x - Hll;

    return vec2(dBx, dBy);
  }
`;

export const perturbNormalArb = `
  vec3 perturbNormalArb(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy) {
    vec3 vSigmaX = dFdx(surf_pos);
    vec3 vSigmaY = dFdy(surf_pos);
    vec3 vN = surf_norm;
    vec3 R1 = cross(vSigmaY, vN);
    vec3 R2 = cross(vN, vSigmaX);
    float fDet = dot(vSigmaX, R1);
    vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);
    return normalize(abs(fDet) * surf_norm - vGrad);
  }
`;

export const perturbNormal2Arb = `
  vec3 perturbNormal2Arb(vec3 eye_pos, vec3 surf_norm) {
    vec3 q0 = dFdx(eye_pos.xyz);
    vec3 q1 = dFdy(eye_pos.xyz);
    vec2 st0 = dFdx(vUv.st);
    vec2 st1 = dFdy(vUv.st);
    vec3 S = normalize(q0 * st1.t - q1 * st0.t);
    vec3 T = normalize(-q0 * st1.s + q1 * st0.s);
    vec3 N = normalize(surf_norm);
    vec3 mapN = texture2D(normalMap, vUv).xyz * 2. - 1.;
    mapN.xy = normalScale * mapN.xy;
    mat3 tsn = mat3(S, T, N);
    return normalize(tsn * mapN);
  }
`;
