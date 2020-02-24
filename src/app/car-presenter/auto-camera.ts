import * as THREE from 'three';
import { LegacyJSONLoader } from 'three/examples/jsm/loaders/deprecated/LegacyJSONLoader';
export default class AutoCamera extends THREE.Object3D {
  cinematicCamera: THREE.PerspectiveCamera;
  bone;
  mixer: THREE.AnimationMixer;
  action: THREE.AnimationAction;
  clock = new THREE.Clock();
  //JFC_USP_MS_Parcours_Camera
  constructor(aspect, loaderService) {
    super();

    this.cinematicCamera = new THREE.PerspectiveCamera(30, aspect, 0.001, 100);

    const meshInfo = loaderService.meshes.find(m => m.key === 'camera_auto');
    if (meshInfo) {
      const geometry = meshInfo.mesh.geometry;
      const mesh = new THREE.SkinnedMesh(
        new THREE.BufferGeometry().fromGeometry(geometry)
      );
      const skeleton = new THREE.Skeleton(
        loaderService.parseBones(geometry, false)
      );
      const rootBone = skeleton.bones[0];
      console.log(skeleton);
      mesh.add(rootBone);
      mesh.bind(skeleton);
      this.mixer = new THREE.AnimationMixer(mesh);
      const clips = geometry.animations;

      clips.forEach(clip => {
        this.action = this.mixer.clipAction(clip);
        this.action.play();
      });
    }
  }

  update() {
    if (this.mixer) {
      this.mixer.update(this.clock.getDelta());
    }
  }
}
