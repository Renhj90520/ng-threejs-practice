import * as THREE from 'three';
export function customizeShadow(mesh, opacity) {
  const material = new THREE.ShadowMaterial({ opacity });
  const shadow = new THREE.Mesh(mesh.geometry, material);
  shadow.position.y = mesh.position.y;
  shadow.receiveShadow = true;
  this.add(shadow);
}
