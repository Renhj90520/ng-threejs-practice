import * as THREE from 'three';
import { LegacyJSONLoader } from 'three/examples/jsm/loaders/deprecated/LegacyJSONLoader';
export default class AutoCamera extends THREE.Object3D {
  cinematicCamera: THREE.PerspectiveCamera;
  bone;
  mixer: THREE.AnimationMixer;
  action: THREE.AnimationAction;
  clock = new THREE.Clock();
  //JFC_USP_MS_Parcours_Camera
  constructor(aspect, animation) {
    super();

    this.cinematicCamera = new THREE.PerspectiveCamera(30, aspect, 0.001, 100);
    const jsonLoader = new LegacyJSONLoader();

    jsonLoader.load(
      `/assets/carpresenter/models/${animation}.js`,
      (geometry: any) => {
        const mesh = new THREE.SkinnedMesh(
          new THREE.BufferGeometry().fromGeometry(geometry)
        );
        const skeleton = new THREE.Skeleton(this.parseBones(geometry, false));
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
    );
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

      if (isObject) {
        for (let i = 0; i < geometry.bones.length; i++) {
          const bone: any = geometry.bones[i];
          if (bone.parent !== -1) {
            objs[bone.parent].add(objs[i]);
          } else {
            root = objs[i];
          }
        }

        return root;
      } else {
        return objs;
      }
    }
  }
  update() {
    if (this.mixer) {
      this.mixer.update(this.clock.getDelta());
    }
  }
}
