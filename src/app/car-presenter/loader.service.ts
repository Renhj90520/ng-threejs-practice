import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  files = {
    exterior: ['jfc-ext.js', 1601554],
    interior: ['jfc-int.js', 2909955],
    door: ['jfc-door.js', 374175],
    tire: ['wheels/jfc-tire.js', 42387],
    rim: ['wheels/jfc-rim.js', 237572],
    screw: ['wheels/jfc-screw.js', 5032],
    logo: ['wheels/jfc-logo.js', 5729],
    headlights: ['jfc-headlights.js', 525905],
    tunnel: ['tunnel.js', 419170],
    camera_auto: ['JFC_USP_MS_Parcours_Camera.js', 361526],
    camera_transition: ['JFC_Camera_Inter_Exter.js', 35082]
  };
  textures = {
    car: [
      ['envmap/dark/negx-blurry.jpg', 46766],
      ['envmap/dark/negx.jpg', 47092],
      ['envmap/dark/negy-blurry.jpg', 4723],
      ['envmap/dark/negy.jpg', 5722],
      ['envmap/dark/negz-blurry.jpg', 45543],
      ['envmap/dark/negz.jpg', 45637],
      ['envmap/dark/posx-blurry.jpg', 46238],
      ['envmap/dark/posx.jpg', 47092],
      ['envmap/dark/posy-blurry.jpg', 22151],
      ['envmap/dark/posy.jpg', 13622],
      ['envmap/dark/posz-blurry.jpg', 45849],
      ['envmap/dark/posz.jpg', 46363],
      ['envmap/interior/negx.jpg', 51589],
      ['envmap/interior/negy.jpg', 45672],
      ['envmap/interior/negz.jpg', 47747],
      ['envmap/interior/posx.jpg', 49853],
      ['envmap/interior/posy.jpg', 16261],
      ['envmap/interior/posz.jpg', 42222],
      ['envmap/light/negx-blurry.jpg', 21260],
      ['envmap/light/negx.jpg', 14021],
      ['envmap/light/negy-blurry.jpg', 4723],
      ['envmap/light/negy.jpg', 5722],
      ['envmap/light/negz-blurry.jpg', 20962],
      ['envmap/light/negz.jpg', 13668],
      ['envmap/light/posx-blurry.jpg', 22005],
      ['envmap/light/posx.jpg', 14070],
      ['envmap/light/posy-blurry.jpg', 22151],
      ['envmap/light/posy.jpg', 13622],
      ['envmap/light/posz-blurry.jpg', 21027],
      ['envmap/light/posz.jpg', 13696],
      ['exterior/JFC_Body.png', 594238],
      ['exterior/JFC_Body_EM.png', 24067],
      ['exterior/JFC_Body_Mask.png', 169126],
      ['exterior/JFC_Ext_Carrosserie_Mask.png', 71345],
      ['exterior/frontplate.png', 6255],
      ['exterior/rearplate.png', 7068],
      ['flare.png', 118463],
      ['headlights/JFC_Optic.png', 118484],
      ['headlights/JFC_Optic_EM.png', 41296],
      ['headlights/JFC_Optic_EM_2.png', 44694],
      ['headlights/JFC_Optic_Mask.png', 33559],
      ['headlights/JFC_Optic_NM.png', 123273],
      ['headlights/JFC_Optic_SM.png', 46243],
      ['hotspot.png', 6442],
      ['interior/JFC_Int_Back.jpg', 109199],
      ['interior/JFC_Int_Back_EM.png', 4449],
      ['interior/JFC_Int_Back_Mask.png', 29471],
      ['interior/JFC_Int_Back_SM.png', 208197],
      ['interior/JFC_Int_Carrosserie_Mask.png', 21443],
      ['interior/JFC_Int_Front.jpg', 374649],
      ['interior/JFC_Int_Front_EM.png', 44556],
      ['interior/JFC_Int_Front_Mask.png', 48882],
      ['normalmap/JFC_Body_NM.png', 75880],
      ['normalmap/JFC_Int_Back_NM.png', 1311425],
      ['normalmap/JFC_Int_Front_NM.png', 3853352],
      ['shadow/JFC_Ground_Wheel_AO.png', 9958],
      ['shadow/car-shadow.png', 31150],
      ['wheels/int/JFC_Rim_Int.jpg', 4924],
      ['wheels/int/JFC_Rim_Int_Mask.png', 17871],
      ['wheels/int/JFC_Rim_Int_NM.png', 19720],
      ['wheels/rim/JFC_Rim_01.jpg', 43414],
      ['wheels/rim/JFC_Rim_01_Mask.png', 49496],
      ['wheels/rim/JFC_Rim_01_NM.png', 342879],
      ['wheels/tire/JFC_Tire.jpg', 9554],
      ['wheels/tire/JFC_Tire_NM.png', 67321]
    ],
    env: [
      ['TARMAC2.jpg', 431627],
      ['c-glow.png', 4910],
      ['car-shadow.png', 19081],
      ['glow.png', 172646],
      ['ground-lightmap.png', 20944],
      ['particle.png', 2581],
      ['pattern.png', 252034],
      ['pattern_night.png', 162726],
      ['rearglow.png', 196750],
      ['vignetting.png', 53713]
    ],
    lensflare: [
      ['Flare_Pentagone.png', 4117],
      ['HALO_SOFT_1.png', 12045],
      ['Halo_Star_Blur.png', 29106],
      ['lensflare2.png', 2107],
      ['lensflare3_alpha.png', 3657],
      ['lensflare_1.png', 33343]
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
  constructor(private http: HttpClient) {}
  load(resources) {
    
  }
}
