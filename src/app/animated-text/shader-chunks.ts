export const cubicBezier = `
vec3 cubicBezier(vec3 p0, vec3 c0, vec3 c1, vec3 p1, float t) {
    float tn=1.-t;
    return tn*tn*tn*p0+3.*tn*tn*t*c0+3.*tn*t*t*c1+t*t*t*p1;
}
vec2 cubicBezier(vec2 p0, vec2 c0, vec2 c1, vec2 p1, float t) {
    float tn = 1. - t;
    return tn * tn * tn * p0 + 3. * tn * tn * t * c0 + 3. * tn * t * t * c1 + t * t * t * p1; 
}
`;
export const easeCubicOut = `
float ease(float t) {
    float f = t - 1.;
    return f * f * f + 1.;
}

float ease(float t, float b, float c, float d) {
    return b + ease(t / d) * c;
}
`;

export const quaternionRotation = `
vec3 rotateVector(vec4 q, vec3 v) {
    return v + 2. * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

vec4 quatFromAxisAngle(vec3 axis, float angle) {
    float halfAngle = angle * .5;
    return vec4(axis.xyz * sin(halfAngle), cos(halfAngle));
}
`;
