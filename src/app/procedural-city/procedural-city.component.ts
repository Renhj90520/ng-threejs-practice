import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import SimplexNoise from '../simplexNoise';
import * as _ from 'lodash';
import {
  mapToRange,
  getBoxMesh,
  mergeMeshes,
  getRandInt,
  chance,
  getCoordinateFromIndex,
  getBoxMeshOpts
} from './utils';
import Building from './building';
import Tree from './tree';
@Component({
  selector: 'app-procedural-city',
  templateUrl: './procedural-city.component.html',
  styleUrls: ['./procedural-city.component.css']
})
export class ProceduralCityComponent implements OnInit {
  scene;
  camera;
  renderer;
  controls;

  width;
  height;
  noise = new SimplexNoise();

  colors = {
    BUILDING: 0xe8e8e8,
    GROUND: 0x81a377,
    TREE: 0x216e41,
    WHITE: 0xffffff,
    BLACK: 0x000000,
    DARK_BROWN: 0x545247,
    LIGHT_BROWN: 0x736b5c,
    GREY: 0x999999,
    WATER: 0x4b95de,
    TRAIN: 0x444444,
    CARS: [0xcc4e4e]
  };
  city: any = {
    //height of bedrock layer
    base: 40,
    //depth of the water and earth layers
    water_height: 20,
    //block size (w&l)
    block: 100,
    //num blocks x
    blocks_x: 10,
    //num blocks z
    blocks_z: 10,
    //road width
    road_w: 16,
    //curb height
    curb_h: 2,
    //block slices
    subdiv: 2,
    //sidewalk width
    inner_block_margin: 5,
    //max building height
    build_max_h: 300,
    //min building height
    build_min_h: 20,
    //deviation for height within block
    block_h_dev: 10,
    //exponent of height increase
    build_exp: 6,
    //chance of blocks being water
    water_threshold: 0.1,
    //chance of block containg trees
    tree_threshold: 0.2,
    //max trees per block
    tree_max: 20,
    //max bridges
    bridge_max: 1,
    //beight heaight
    bridge_h: 25,
    //max cars at one time
    car_max: 10,
    //train max
    train_max: 1,
    //maximum car speed
    car_speed_min: 2,
    //minimum car speed
    car_speed_max: 3,
    //train speed
    train_speed: 4,
    //noise factor, increase for smoother noise
    noise_frequency: 8,
    //seed for generating noise
    //seed: Math.random()
    seed: Math.random()
  };
  _city;
  watermap: any[];
  heightmap: any[];
  buildings: any[] = [];
  constructor(private el: ElementRef) {
    this.city.width = this.city.block * this.city.blocks_x;
    this.city.length = this.city.block * this.city.blocks_z;
    this._city = JSON.parse(JSON.stringify(this.city));
  }

  ngOnInit() {
    this.initThree();
    this.addLights();
    this.setupHeightmap();
    this.setupGround();
    this.setupBlocks();
    this.setupBridges();
    this.update();
  }
  setupBridges() {
    const bridges = _.shuffle(this.getEmptyRows()).splice(
      0,
      this.city.bridge_max
    );

    const parts = [];
    for (let i = 0; i < bridges.length; i++) {
      const lx = getCoordinateFromIndex(
        bridges[i].index,
        this.city.width,
        this.city.block
      );

      const lz = getCoordinateFromIndex(
        bridges[i].index,
        this.city.length,
        this.city.block
      );

      parts.push(
        getBoxMeshOpts({
          color: this.colors.BUILDING,
          w: bridges[i].axis ? this.city.width : this.city.road_w,
          l: bridges[i].axis ? this.city.road_w : this.city.length,
          h: 4,
          y: this.city.bridge_h + 2,
          x: bridges[i].axis ? 0 : lx,
          z: bridges[i].axis ? lz : 0
        })
      );

      for (
        let j = 0;
        j < bridges[i].axis ? this.city.blocks_x : this.city.blocks_z;
        j++
      ) {
        const h =
          this.city.bridge_h + this.city.curb_h * 2 + this.city.water_height;

        parts.push(
          getBoxMeshOpts({
            color: this.colors.BUILDING,
            w: 10,
            l: 10,
            h,
            y: -(this.city.curb_h * 2 + this.city.water_height) + h / 2,
            x: bridges[i].axis
              ? getCoordinateFromIndex(j, this.city.width, this.city.block)
              : lx,
            z: bridges[i].axis
              ? lz
              : getCoordinateFromIndex(j, this.city.length, this.city.block)
          })
        );
      }
    }
    if (parts.length > 0) {
      this.scene.add(mergeMeshes(parts));
    }
  }
  getEmptyRows() {
    const empty = [];
    for (let i = 0; i < this.heightmap.length; i++) {
      let row = this.heightmap[i];
      row = _.reject(row, n => n < this.city.tree_threshold);
      if (row.length <= 0) {
        empty.push({ axis: 0, index: i });
      }
    }

    for (let i = 0; i < this.heightmap[0].length; i++) {
      let col = _.map(this.heightmap, row => row[i]);
      col = _.reject(col, n => n < this.city.tree_threshold);

      if (col.length <= 0) {
        empty.push({ axis: 1, index: i });
      }
    }
    return empty;
  }
  setupBlocks() {
    for (let i = 0; i < this.city.blocks_x; i++) {
      for (let j = 0; j < this.city.blocks_z; j++) {
        if (this.watermap[i][j]) {
          const x =
            this.city.block * i + this.city.block / 2 - this.city.width / 2;
          const z =
            this.city.block * j + this.city.block / 2 - this.city.length / 2;
          const hm = this.heightmap[i][j];

          const h = mapToRange(
            hm,
            this.city.build_min_h,
            this.city.build_max_h,
            this.city.build_exp
          );

          const w = this.city.block - this.city.road_w;
          const inner = w - this.city.inner_block_margin * 2;
          const curb = getBoxMesh(this.colors.GROUND, w, this.city.curb_h, w);
          curb.position.set(x, this.city.curb_h / 2, z);

          this.scene.add(curb);

          if (hm > this.city.tree_threshold) {
            this.setupBuildings(
              x,
              z,
              inner,
              inner,
              h,
              this.city.subdiv,
              this.colors.BUILDING
            );
          } else {
            this.setupPark(x, z, inner, inner);
          }
        }
      }
    }
  }
  setupPark(x: number, z: number, w: number, l: number) {
    const trees = [];
    for (let i = 0; i < getRandInt(0, this.city.tree_max); i++) {
      const tree_x = getRandInt(x - w / 2, x + w / 2);
      const tree_z = getRandInt(z - l / 2, z + l / 2);
      trees.push(new Tree(this.colors, tree_x, tree_z, this.city).group);
    }

    if (trees.length > 0) {
      this.scene.add(mergeMeshes(trees));
    }
  }
  setupBuildings(
    x: number,
    z: number,
    w: number,
    l: number,
    h: any,
    sub: any,
    color: number,
    buildings?
  ) {
    let offset, half, between;

    this.buildings = buildings || [];
    const depth = Math.pow(2, this.city.subdiv);
    const tall = Math.round((h / this.city.build_max_h) * 100) > 90;
    const slice_deviation = 15;

    if (sub < 1 || tall) {
      const building = new Building(
        this.city,
        color,
        w,
        getRandInt(h - this.city.block_h_dev, h + this.city.block_h_dev),
        l,
        x,
        z,
        tall
      );

      this.buildings.push(building.group);

      if (this.buildings.length >= depth || tall) {
        this.scene.add(mergeMeshes(this.buildings));
      }
    } else {
      const dir = w == l ? chance(50) : w > l;
      offset = Math.abs(getRandInt(0, slice_deviation));
      between = this.city.inner_block_margin / 2;
      if (dir) {
        half = w / 2;
        const x_prime = x + offset;
        const w1 = Math.abs(x + half - x_prime) - between;
        const w2 = Math.abs(x - half - x_prime) - between;
        const x1 = x_prime + w1 / 2 + between;
        const x2 = x_prime - w2 / 2 - between;

        this.setupBuildings(x1, z, w1, l, h, sub - 1, color, this.buildings);
        this.setupBuildings(x2, z, w2, l, h, sub - 1, color, this.buildings);
      } else {
        half = l / 2;
        const z_prime = z + offset;
        const l1 = Math.abs(z + half - z_prime) - between;
        const l2 = Math.abs(z - half - z_prime) - between;
        const z1 = z_prime + l1 / 2 + between;
        const z2 = z_prime - l2 / 2 - between;

        this.setupBuildings(x, z1, w, l1, h, sub - 1, color, this.buildings);
        this.setupBuildings(x, z2, w, l2, h, sub - 1, color, this.buildings);
      }
    }
  }

  initThree() {
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.width / this.height,
      1,
      4000
    );
    this.camera.position.set(500, 500, 500);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(this.width, this.height);
    this.renderer.shadowMapType = THREE.PCFSoftShadowMap;

    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;
    this.controls.maxPolarAngle = Math.PI / 2;
  }

  addLights() {
    const light = new THREE.HemisphereLight(
      this.colors.WHITE,
      this.colors.WHITE,
      0.5
    );
    const shadowLight = new THREE.DirectionalLight(this.colors.WHITE, 0.3);
    shadowLight.position.set(this.city.width / 2, 800, this.city.length / 2);
    shadowLight.castShadow = true;

    const backLight = new THREE.DirectionalLight(this.colors.WHITE, 0.1);
    backLight.position.set(-100, 200, 50);
    this.scene.add(backLight, shadowLight, light);
  }

  // generate normalized hightmap array from simplex noise
  setupHeightmap() {
    this.heightmap = [];
    this.watermap = [];
    for (let i = 0; i < this.city.blocks_x; i++) {
      for (let j = 0; j < this.city.blocks_z; j++) {
        this.heightmap.push(this.getNoiseValue(i, j));
        this.watermap.push(this.getNoiseValue(i, j, 10));
      }
    }

    this.heightmap = this.normalizeArray(this.heightmap);
    this.heightmap = _.chunk(this.heightmap, this.city.blocks_x);

    this.watermap = this.normalizeArray(this.watermap);
    this.watermap = _.map(this.watermap, n =>
      n >= this.city.water_threshold ? 1 : 0
    );
    this.watermap = _.chunk(this.watermap, this.city.blocks_x);
  }
  // normalize array values to 0~1
  normalizeArray(array) {
    const min = Math.min.apply(null, array);
    const max = Math.max.apply(null, array);
    return array.map(num => (num - min) / (max - min));
  }

  getNoiseValue(x, z, freq?) {
    freq = freq || this.city.noise_frequency;
    const val = Math.abs(this.noise.noise(x / freq, z / freq));
    return val;
  }

  setupGround() {
    const street_h = this.city.curb_h * 2;
    const earth_meshes = [];
    const street_meshes = [];

    const bedrock = getBoxMesh(
      this.colors.LIGHT_BROWN,
      this.city.width,
      this.city.base,
      this.city.length
    );

    bedrock.position.y =
      -(this.city.base / 2) - this.city.water_height - street_h;
    bedrock.receiveShadow = false;

    const water = this.getWaterMesh(
      this.city.width - 2,
      this.city.water_height,
      this.city.length - 2
    );
    water.position.y = -(this.city.water_height / 2) - street_h;

    for (let i = 0; i < this.watermap.length; i++) {
      for (let j = 0; j < this.watermap[0].length; j++) {
        if (this.watermap[i][j]) {
          const x =
            this.city.block * i + this.city.block / 2 - this.city.width / 2;
          const z =
            this.city.block * j + this.city.block / 2 - this.city.length / 2;

          earth_meshes.push(
            getBoxMesh(
              this.colors.DARK_BROWN,
              this.city.block,
              this.city.water_height,
              this.city.block,
              x,
              -(this.city.water_height / 2) - street_h,
              z
            )
          );

          street_meshes.push(
            getBoxMesh(
              this.colors.GREY,
              this.city.block,
              street_h,
              this.city.block,
              x,
              -(street_h / 2),
              z
            )
          );
        }
      }
    }
    if (street_meshes.length > 0) {
      this.scene.add(mergeMeshes(street_meshes));
    }

    if (earth_meshes.length > 0) {
      this.scene.add(mergeMeshes(earth_meshes, false));
    }

    this.scene.add(bedrock, water);
  }

  getWaterMesh(w, h, l, x?, y?, z?) {
    const material = new THREE.MeshPhongMaterial({
      color: this.colors.WATER,
      transparent: true,
      opacity: 0.6
    });

    const geom = new THREE.BoxGeometry(w, h, l);
    const mesh = new THREE.Mesh(geom, material);
    mesh.receiveShadow = false;
    mesh.castShadow = false;
    return mesh;
  }

  update() {
    requestAnimationFrame(this.update.bind(this));
    this.renderer.render(this.scene, this.camera);
    this.controls.update();
  }
}
