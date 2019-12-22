import * as THREE from 'three';
import GroundMaterial from './ground-material';
import { TweenLite, Power4, Power2 } from 'gsap';
export default class Ground extends THREE.Object3D {
  dayDiffuse: THREE.Color;
  nightDiffuse: THREE.Color;
  map: THREE.Texture;
  mesh: THREE.Mesh;
  moving = false;
  speed = 0;
  constructor() {
    super();
    const loader = new THREE.TextureLoader();

    const texture = loader.load(
      '/assets/carpresenter/textures/env/TARMAC2.jpg'
    );

    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    texture.anisotropy = 16;

    const lightMapTexture = loader.load(
      '/assets/carpresenter/textures/env/ground-lightmap.png'
    );
    const geometry = new THREE.PlaneGeometry(70, 70, 20, 20);
    this.dayDiffuse = new THREE.Color(0xeeeeee);
    this.nightDiffuse = new THREE.Color(0x000000);

    geometry.faceVertexUvs[1] = geometry.faceVertexUvs[0];

    const groundMaterial = new GroundMaterial({
      color: new THREE.Color(0xcccccc),
      map: texture,
      lightMap: lightMapTexture,
      lightMapOpacity: 0,
      colorStep1: new THREE.Color(0xefefed),
      colorStep2: new THREE.Color(0xcecdcb),
      colorStep3: new THREE.Color(0xdfe9ea),
      lightIntensity: 1
    });
    groundMaterial.needsUpdate = true;

    this.map = texture;
    this.mesh = new THREE.Mesh(geometry, groundMaterial);
    this.mesh.rotation.x = -Math.PI / 2;
    this.position.y -= 0.22;
    console.log(this.mesh);
    this.add(this.mesh);
  }

  update(e) {
    console.log(e);
    (this.mesh.material as GroundMaterial).update(
      e,
      this.map.offset,
      this.map.repeat
    );
    if (this.moving) {
      this.map.offset.y -= this.speed * e.delta;
    }
  }
  updateSkyColor(color) {
    (this.mesh.material as any).colorStep3 = color;
  }
  setMode(mode, duration?) {
    duration = duration !== undefined ? duration : 0.35;
    let tn;
    const material: any = this.mesh.material;
    if (mode === 'day') {
      tn = TweenLite.to(this.mesh.material, duration, {
        lightIntensity: 1,
        lightMapOpacity: 0,
        ease: Power2.easeInOut,
        onUpdate: () => {
          const progress = tn.progress();
          material.colorStep1.lerp(new THREE.Color(0xdad9d8), progress);
          material.colorStep2.lerp(new THREE.Color(0xcecdcb), progress);
          material.colorStep3.lerp(new THREE.Color(0xdce0e1), progress);
          material.color.lerp(this.dayDiffuse, progress);
          console.log(material.uniforms);
        }
      }).play();
    } else if (mode === 'night') {
      tn = TweenLite.to({ lightIntensity: 0, lightMapOpacity: 1 }, duration, {
        ease: Power2.easeInOut,
        onUpdate: () => {
          const progress = tn.progress();
          material.colorStep1.lerp(new THREE.Color(0x000000), progress);
          material.colorStep2.lerp(new THREE.Color(0x000000), progress);
          material.colorStep3.lerp(new THREE.Color(0x000000), progress);
          material.color.lerp(this.dayDiffuse, progress);
        }
      }).play();
    } else if (mode === 'pitchblack') {
      material.color = this.nightDiffuse;
      material.colorStep1 = new THREE.Color(0x000000);
      material.colorStep2 = new THREE.Color(0x000000);
      material.colorStep3 = new THREE.Color(0x000000);
    }
  }
}
