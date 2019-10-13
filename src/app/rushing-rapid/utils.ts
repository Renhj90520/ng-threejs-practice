import * as THREE from 'three';
export function customizeShadow(scene, mesh, opacity) {
  const material = new THREE.ShadowMaterial({ opacity });
  const shadow = new THREE.Mesh(mesh.geometry, material);
  const { x, y, z } = mesh.position;
  shadow.position.set(x, y, z);
  shadow.receiveShadow = true;
  scene.add(shadow);
}
