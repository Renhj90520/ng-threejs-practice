import * as THREE from 'three';
import CustomMesh from './custom-mesh';
import { LoaderService } from './loader.service';

export default class Door extends THREE.SkinnedMesh {
  mixer: THREE.AnimationMixer;
  constructor(materials, loaderService: LoaderService) {
    super();

    // const doorMesh = loaderService.meshes.find(m => m.key === 'door').mesh;
    // new CustomMesh(
    //   'door',
    //   loaderService,
    //   [
    //     materials.glass,
    //     materials.body,
    //     materials.bodyFlip,
    //     materials.interiorBack,
    //     materials.interiorFront
    //   ],
    //   mesh => {
    //     debugger;
    //     mesh.geometry.skinIndices = [];
    //     mesh.geometry.skinWeights = [];
    //   }
    // );

    // door.setMaterial('JFC_Body', materials.body);
    // door.setMaterial('JFC_Body_Flip', materials.bodyFlip);
    // door.setMaterial('JFC_Glass', materials.glass);
    // door.setMaterial('JFC_Others', materials.body);
    // door.setMaterial('JFC_Int_Front', materials.interiorFront);
    // door.setMaterial('JFC_Int_Back', materials.interiorBack);
    // const doorGeo = new THREE.BufferGeometry().fromGeometry(doorMesh.geometry);
    // doorGeo.addAttribute(
    //   'skinIndex',
    //   new THREE.Uint16BufferAttribute(doorMesh.geometry.skinIndex, 4)
    // );
    // doorGeo.addAttribute(
    //   'skinWeight',
    //   new THREE.Float32BufferAttribute(doorMesh.geometry.skinWeight, 4)
    // );
    // const door = new THREE.SkinnedMesh(doorGeo, [
    //   materials.glass,
    //   materials.body,
    //   materials.bodyFlip,
    //   materials.interiorBack,
    //   materials.interiorFront
    // ]);
    // const bones = [];
    // doorMesh.geometry.bones.forEach(b => {
    //   const bone = new THREE.Bone();
    //   bone.name = b.name;
    //   bone.position.set(b.pos[0], b.pos[1], b.pos[2]);
    //   bone.rotation.set(b.rotq[0], b.rotq[1], b.rotq[2], b.rotq[3]);
    //   bone.scale.set(b.scl[0], b.scl[1], b.scl[2]);
    //   bones.push(bone);
    // });
    // const skeleton = new THREE.Skeleton(bones);
    // const rootBone = skeleton.bones[0];
    // door.add(rootBone);
    // door.bind(skeleton);
    // this.add(door);
    const door = loaderService.meshes.find(m => m.key === 'door').mesh;
    const root: THREE.Object3D = loaderService.parseBones(door.geometry, true);
    root.rotation.set(-1.5707969456925415, 0, 0);
    root.quaternion.set(-0.707107, 0, 0, 0.707107);
    this.add(root);
    this.rotation.x = Math.PI / 2;
    this.addToBone(
      new THREE.Mesh(door.geometry, [
        materials.glass,
        materials.body,
        materials.bodyFlip,
        materials.interiorBack,
        materials.interiorFront
      ]),
      'Bone_01'
    );
    const bones = [];
    door.geometry.bones.forEach(b => {
      const bone = new THREE.Bone();
      bone.name = b.name;
      bone.position.set(b.pos[0], b.pos[1], b.pos[2]);
      bone.rotation.set(b.rotq[0], b.rotq[1], b.rotq[2], b.rotq[3]);
      bone.scale.set(b.scl[0], b.scl[1], b.scl[2]);
      bones.push(bone);
    });
    const skeleton = new THREE.Skeleton(bones);
    const rootBone = skeleton.bones[0];
    // this.add(rootBone);
    this.bind(skeleton);
    this.mixer = new THREE.AnimationMixer(this);
    const action = this.mixer.clipAction(door.geometry.animations[0]);
    action.play();
    console.log(action);
  }
  addToBone(door, key) {
    const obj = this.getObjectByName(key);
    if (obj) {
      obj.add(door);
    }
  }

  update() {}
}
