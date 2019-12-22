import * as THREE from 'three';
import { LegacyJSONLoader } from 'three/examples/jsm/loaders/deprecated/LegacyJSONLoader';
export default class AutoCamera extends THREE.Object3D {
  cinematicCamera: THREE.PerspectiveCamera;
  bone;
  animation: THREE.AnimationMixer;
  //JFC_USP_MS_Parcours_Camera
  constructor(aspect, animation, boneName) {
    super();

    this.cinematicCamera = new THREE.PerspectiveCamera(30, aspect, 0.001, 100);
    const jsonLoader = new LegacyJSONLoader();
    jsonLoader.load(`/assets/carpresenter/models/${animation}.js`, result => {
      const geometry = result.geometry;
      const bones = this.parseBones(geometry, true);
      this.add(bones);
      this.bone = bones.getObjectByName(boneName);
      this.animation = new THREE.AnimationMixer(this.bone);
    });
    this.add(this.cinematicCamera);
  }

  parseBones(geometry: THREE.Geometry, isObject) {
    let root;
    const objs = [];
    if (geometry && geometry.bones) {
      for (let idx = 0; idx < geometry.bones.length; idx++) {
        const bone: any = geometry.bones[idx];
        const pos = bone.pos;
        const rotq = bone.rotq;
        const scl = bone.scl;
        const obj = isObject ? new THREE.Object3D() : new THREE.Bone();
        objs.push(obj);
        obj.name = bone.name;
        obj.position.set(pos[0], pos[1], pos[2]);
        obj.quaternion.set(rotq[0], rotq[1], rotq[2], rotq[3]);

        scl !== undefined
          ? obj.scale.set(scl[0], scl[1], scl[2])
          : obj.scale.set(1, 1, 1);
      }

      for (let i = 0; i < geometry.bones.length; i++) {
        const bone: any = geometry.bones[i];
        if (bone.parent) {
          console.log(bone.parent);
          objs[bone.parent].add(objs[i]);
        } else {
          root = objs[i];
        }
      }

      return root;
    }
  }
}
