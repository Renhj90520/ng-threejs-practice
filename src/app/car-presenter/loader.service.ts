import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { LegacyJSONLoader } from '../LegencyJSONLoader';
import * as THREE from 'three';
@Injectable()
export class LoaderService {
  files = {
    exterior: 'jfc-ext.js',
    interior: 'jfc-int.js',
    door: 'jfc-door.js',
    tire: 'wheels/jfc-tire.js',
    rim: 'wheels/jfc-rim.js',
    screw: 'wheels/jfc-screw.js',
    logo: 'wheels/jfc-logo.js',
    headlights: 'jfc-headlights.js',
    tunnel: 'tunnel.js',
    camera_auto: 'JFC_USP_MS_Parcours_Camera.js',
    camera_transition: 'JFC_Camera_Inter_Exter.js'
  };
  textures = {
    car: [
      'envmap/dark/negx-blurry.jpg',
      'envmap/dark/negx.jpg',
      'envmap/dark/negy-blurry.jpg',
      'envmap/dark/negy.jpg',
      'envmap/dark/negz-blurry.jpg',
      'envmap/dark/negz.jpg',
      'envmap/dark/posx-blurry.jpg',
      'envmap/dark/posx.jpg',
      'envmap/dark/posy-blurry.jpg',
      'envmap/dark/posy.jpg',
      'envmap/dark/posz-blurry.jpg',
      'envmap/dark/posz.jpg',
      'envmap/interior/negx.jpg',
      'envmap/interior/negy.jpg',
      'envmap/interior/negz.jpg',
      'envmap/interior/posx.jpg',
      'envmap/interior/posy.jpg',
      'envmap/interior/posz.jpg',
      'envmap/light/negx-blurry.jpg',
      'envmap/light/negx.jpg',
      'envmap/light/negy-blurry.jpg',
      'envmap/light/negy.jpg',
      'envmap/light/negz-blurry.jpg',
      'envmap/light/negz.jpg',
      'envmap/light/posx-blurry.jpg',
      'envmap/light/posx.jpg',
      'envmap/light/posy-blurry.jpg',
      'envmap/light/posy.jpg',
      'envmap/light/posz-blurry.jpg',
      'envmap/light/posz.jpg',
      'exterior/JFC_Body.png',
      'exterior/JFC_Body_EM.png',
      'exterior/JFC_Body_Mask.png',
      'exterior/JFC_Ext_Carrosserie_Mask.png',
      'exterior/frontplate.png',
      'exterior/rearplate.png',
      'flare.png',
      'headlights/JFC_Optic.png',
      'headlights/JFC_Optic_EM.png',
      'headlights/JFC_Optic_EM_2.png',
      'headlights/JFC_Optic_Mask.png',
      'headlights/JFC_Optic_NM.png',
      'headlights/JFC_Optic_SM.png',
      'hotspot.png',
      'interior/JFC_Int_Back.jpg',
      'interior/JFC_Int_Back_EM.png',
      'interior/JFC_Int_Back_Mask.png',
      'interior/JFC_Int_Back_SM.png',
      'interior/JFC_Int_Carrosserie_Mask.png',
      'interior/JFC_Int_Front.jpg',
      'interior/JFC_Int_Front_EM.png',
      'interior/JFC_Int_Front_Mask.png',
      'normalmap/JFC_Body_NM.png',
      'normalmap/JFC_Int_Back_NM.png',
      'normalmap/JFC_Int_Front_NM.png',
      'shadow/JFC_Ground_Wheel_AO.png',
      'shadow/car-shadow.png',
      'wheels/int/JFC_Rim_Int.jpg',
      'wheels/int/JFC_Rim_Int_Mask.png',
      'wheels/int/JFC_Rim_Int_NM.png',
      'wheels/rim/JFC_Rim_01.jpg',
      'wheels/rim/JFC_Rim_01_Mask.png',
      'wheels/rim/JFC_Rim_01_NM.png',
      'wheels/tire/JFC_Tire.jpg',
      'wheels/tire/JFC_Tire_NM.png'
    ],
    env: [
      'TARMAC2.jpg',
      'c-glow.png',
      'car-shadow.png',
      'glow.png',
      'ground-lightmap.png',
      'particle.png',
      'pattern.png',
      'pattern_night.png',
      'rearglow.png',
      'vignetting.png'
    ],
    lensflare: [
      'Flare_Pentagone.png',
      'HALO_SOFT_1.png',
      'Halo_Star_Blur.png',
      'lensflare2.png',
      'lensflare3_alpha.png',
      'lensflare_1.png'
    ]
  };

  preload = {
    models: [
      'camera_auto',
      'camera_transition',
      'exterior',
      'interior',
      'door',
      'tire',
      'rim',
      'screw',
      'logo',
      'headlights',
      'tunnel'
    ],
    textureBundles: ['car', 'env']
  };
  progressReport = new BehaviorSubject('0');
  onLoadFinish = new EventEmitter();
  meshes = [];
  customMaterials = [];
  constructor(private http: HttpClient) {}
  load(resources) {
    const models = resources.models;

    const reqs = [];
    if (models) {
      _.each(this.files, (val, key) => {
        if (_.includes(models, key)) {
          const req = this.loadMesh(val);
          reqs.push({ key, req });
        }
      });
    }

    // if (textureBundles) {
    //   _.each(this.textures, (val, key) => {
    //     if (_.includes(textureBundles, key)) {
    //       const req = this.loadTextureBundles(textureBundles);
    //       reqs.push({ key, req });
    //     }
    //   });
    // }
    const jsonLoader = new LegacyJSONLoader();
    forkJoin(reqs.map(r => r.req)).subscribe((result: any) => {
      const keys = reqs.map(r => r.key);
      for (let i = 0; i < result.length; i++) {
        const meshStr: string = result[i];
        const key = keys[i];
        const meshInfo = this.meshes.find(m => m.key === key);
        const mesh = jsonLoader.parse(JSON.parse(meshStr), './textures/');
        if (meshInfo) {
          meshInfo.mesh = mesh;
        } else {
          this.meshes.push({ key, mesh });
        }
      }

      this.onLoadFinish.emit();
    });
  }

  loadMesh(filePath) {
    return this.loadResource(`/assets/carpresenter/models/${filePath}`);
  }

  loadResource(path) {
    return this.http.get(path, { reportProgress: true, responseType: 'text' });
  }

  parseBones(geometry, isObject) {
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

      // if (isObject) {
      for (let i = 0; i < geometry.bones.length; i++) {
        const bone: any = geometry.bones[i];
        if (bone.parent !== -1) {
          objs[bone.parent].add(objs[i]);
        } else {
          root = objs[i];
        }
      }

      return root;
      // } else {
      //   return objs;
      // }
    }
  }
}
