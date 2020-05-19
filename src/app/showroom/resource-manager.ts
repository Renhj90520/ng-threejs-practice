import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as THREE from 'three';
import SceneLoader from './scene-loader';
import * as _ from 'lodash';
import Cacher from './cacher';
import CompressedTextureLoader from './compressed-texture-loader';
import CustomFileLoader from './custom-file-loader';
import ArrayBufferLoader from './array-buffer-loader';
@Injectable()
export class ResourceManager {
  geometries = ['interior2', 'exterior2', 'start'];
  sh = ['room', 'studio'];
  textures = [
    'textures/white.png',
    'textures/normal.png',
    'textures/waternormals.jpg',
    'textures/marker.png',
    'textures/circle.png',
    'textures/corner-gradient.png',
    'textures/flare.png',
  ];
  cubemaps = ['room/cubemap.bin'];
  basePath = '/assets/showroom';
  environmentPath = '/assets/showroom/environments';
  geometryPath = '/assets/showroom/scenes/data';
  scenePath = this.basePath + '/scenes';
  loadingManager;
  sceneLoader;

  private _texturePath: string;
  textureCache: Cacher;
  cubemapCache: Cacher;
  imageCache: Cacher;
  customFileLoader: CustomFileLoader;
  arrayBufferCache: Cacher;
  shes = {};
  public get texturePath(): string {
    return this._texturePath;
  }
  public set texturePath(path: string) {
    this._texturePath = path;
    this.sceneLoader.setTexturePath(path);
  }

  constructor() {
    this.loadingManager = new THREE.LoadingManager();
    this.sceneLoader = new SceneLoader(this, this.loadingManager);
    const textures = {};
    this.textureCache = new Cacher(
      new THREE.TextureLoader(this.loadingManager),
      textures
    );
    this.cubemapCache = new Cacher(
      new CompressedTextureLoader(256, false, this.loadingManager)
    );

    this.imageCache = new Cacher(new THREE.ImageLoader());

    this.customFileLoader = new CustomFileLoader(this.loadingManager);
    const arrayBuffer = {};
    this.arrayBufferCache = new Cacher(
      new ArrayBufferLoader(this.loadingManager),
      arrayBuffer
    );
  }

  loadSingle(path, fileName, cache, onLoad) {
    cache.load(
      path,
      function (result) {
        result.fileName = fileName;
        onLoad(arguments.length > 1 ? _.toArray(arguments) : result);
      },
      () => {},
      () => {
        throw new Error('Resource was not found: ' + path);
      },
      fileName
    );
  }
  loadAll(filePaths, assetPath, cache, onComplete?) {
    filePaths = filePaths || [];
    let loaded = 0;
    _.map(filePaths, (filePath) => {
      this.loadSingle(`${assetPath}/${filePath}`, filePath, cache, (result) => {
        loaded++;
        if (loaded === filePaths.length && onComplete) {
          onComplete();
        }
      });
    });
  }
  loadScene(sceneName, stage, onLoad) {
    this.texturePath = this.basePath + '/' + sceneName + '/';
    const binaryGeometryBuffer = this.getBinaryGeometryBuffer(sceneName);
    if (binaryGeometryBuffer) {
      this.sceneLoader.setBinaryGeometryBuffer(binaryGeometryBuffer);
      this.loadSingle(
        `${this.scenePath}/${sceneName}.js`,
        null,
        this.sceneLoader,
        (results) => {
          const scene = results[0];
          let camera;
          scene.materials = {};
          if (scene.cameras) {
            if (scene.cameras.length > 0) {
              camera = scene.cameras[0];
            }
          }
          if (camera) {
            camera.aspect = stage.width / stage.height;
            camera.updateProjectionMatrix();
          } else {
            camera = new THREE.PerspectiveCamera(
              50,
              stage.width / stage.height,
              0.01,
              2000
            );
            camera.position.set(-3.5, 2, 3);
          }
          scene.traverse((e) => {
            if (e.material) {
              if (e.material.materials) {
                e.material.materials.forEach((material) => {
                  scene.materials[material.uuid] = material;
                });
              } else {
                scene.materials[e.material.uuid] = e.material;
              }
            }
            if (e instanceof THREE.DirectionalLight) {
              e.position.set(0, 0, 1);
              e.quaternion.normalize();
              e.position.applyQuaternion(e.quaternion);
              e.quaternion.set(0, 0, 0, 0);
              e.scale.set(0, 0, 0);
            }
          });

          stage.scene = scene;
          stage.scenes.push(scene);
          stage.camera = camera;
          onLoad(scene);
        }
      );
    }
  }

  loadTextures(assetPath?, onComplete?) {
    this.loadAll(
      this.textures,
      assetPath || this.texturePath || this.basePath,
      this.textureCache,
      onComplete
    );
  }

  loadSpecularCubemaps(assetPath?, onComplete?) {
    this.loadAll(
      this.cubemaps,
      assetPath || this.environmentPath,
      this.cubemapCache,
      onComplete
    );
  }

  loadSH(onComplete?) {
    let count = 0;
    this.sh.forEach((shpath) => {
      const path = `${this.environmentPath}/${shpath}/irradiance.json`;
      this.customFileLoader.load(
        path,
        (sh) => {
          this.shes[shpath] = sh;
          count++;
          if (count === this.sh.length && onComplete) {
            onComplete();
          }
        },
        () => {},
        () => {
          console.error('Resource was not found: ' + path);
        }
      );
    });
  }

  loadBinaryGeometryBuffer(path?, onComplete?) {
    const filePaths = this.geometries.map((p) => p + '.bin');
    this.loadAll(
      filePaths,
      path || this.geometryPath,
      this.arrayBufferCache,
      onComplete
    );
  }

  getTexture(path) {
    return this.textureCache.get(path);
  }

  getCubemap(path) {
    return this.cubemapCache.get(path + '/cubemap.bin');
  }

  getSH(path) {
    return this.shes[path];
  }

  getBinaryGeometryBuffer(path) {
    return this.arrayBufferCache.get(path + '.bin');
  }

  load(onComplete) {
    let count = 0;
    const loaded = () => {
      count++;
      if (count === 4) {
        onComplete();
      }
    };
    this.loadSpecularCubemaps(null, loaded);
    this.loadSH(loaded);
    this.loadTextures(null, loaded);
    this.loadBinaryGeometryBuffer(null, loaded);
  }
}
