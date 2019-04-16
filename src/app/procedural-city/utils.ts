import * as THREE from 'three';
export function getRandInt(min, max, exp?) {
  return mapToRange(Math.random(), min, max, exp);
}
export function mapToRange(val, min, max, exp) {
  exp = exp || 1;
  let weighted = Math.pow(val, exp);

  if (val >= 0.9) {
    weighted = val;
  }

  const num = Math.floor(weighted * (max - min)) + min;
  return num;
}
export function getBoxMesh(color, w, h, l, x?, y?, z?, shadow?) {
  shadow = typeof shadow === 'undefined' ? true : shadow;
  const material = new THREE.MeshLambertMaterial({ color });
  const geom = new THREE.BoxGeometry(w, h, l);
  const mesh = new THREE.Mesh(geom, material);
  mesh.position.set(x || 0, y || 0, z || 0);
  mesh.receiveShadow = true;
  if (shadow) {
    mesh.castShadow = true;
  }
  return mesh;
}

export function chance(percent) {
  return Math.random() < percent / 100.0;
}

export function getBoxMeshOpts(options) {
  const o = options || {};
  return getBoxMesh(o.color, o.w, o.h, o.l, o.x, o.y, o.z, o.shadow);
}

export function randDir() {
  return Math.round(Math.random()) * 2 - 1;
}
export function mergeMeshes(meshes, shadows?, material?) {
  material = material || meshes[0].material;
  const combined = new THREE.Geometry();
  for (let i = 0; i < meshes.length; i++) {
    meshes[i].updateMatrix();
    combined.merge(meshes[i].geometry, meshes[i].matrix);
  }

  const mesh = new THREE.Mesh(combined, material);
  if (shadows) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }
  return mesh;
}

export function getCylinderMesh(color, rb, h, rt, x, y, z) {
  const material = new THREE.MeshLambertMaterial({ color });
  const geom = new THREE.CylinderGeometry(rt, rb, h, 4, 1);
  const mesh = new THREE.Mesh(geom, material);
  mesh.rotation.y = Math.PI / 4;
  mesh.position.set(x || 0, y || 0, z || 0);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  return mesh;
}

export function getCoordinateFromIndex(idx, offset, block) {
  return -(offset / 2) + idx * block + block / 2;
}
