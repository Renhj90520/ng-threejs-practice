import * as THREE from 'three';
import VignettingMaterial from './vignetting-material';
import { TweenLite } from 'gsap';
import { LoaderService } from './loader.service';

export default class Vignetting extends THREE.Mesh {
  constructor(loaderService: LoaderService) {
    super();
    const loader = new THREE.TextureLoader();
    const texture = loader.load(
      '/assets/carpresenter/textures/env/vignetting.png'
    );
    this.geometry = new THREE.PlaneGeometry(1, 1, 1);
    this.material = new VignettingMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    });

    loaderService.customMaterials.push(this.material);

    this.geometry.vertices[0].set(-1, 1, 0);
    this.geometry.vertices[1].set(1, 1, 0);
    this.geometry.vertices[2].set(-1, -1, 0);
    this.geometry.vertices[3].set(1, -1, 0);
    this.geometry.verticesNeedUpdate = true;
  }

  update(cameraDistance) {
    (this
      .material as VignettingMaterial).uniforms.cameraDistance.value = cameraDistance;
  }
  fadeIn() {
    TweenLite.to(this.material, 1, { opacity: 1 }).play();
  }
  fadeOut() {
    TweenLite.to(this.material, 1, { opacity: 0 }).play();
  }
}
