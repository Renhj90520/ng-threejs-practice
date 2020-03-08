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
    'textures/flare.png'
  ];
  cubemaps = ['room/cubemap.bin'];
  environmentPath = '/assets/showroom/environments';
  geometryPath = '/assets/showroom/scenes/data/';
  loadingManager;
  sceneLoader;

  private _texturePath: string;
  textureCache: Cacher;
  cubemapCache: Cacher;
  imageCache: Cacher;
  customFileLoader: CustomFileLoader;
  arrayBufferCache: Cacher;
  public get texturePath(): string {
    return this._texturePath;
  }
  public set texturePath(path: string) {
    this._texturePath = path;
    this.sceneLoader.setTexturePath(path);
  }

  constructor() {
    this.loadingManager = new THREE.LoadingManager();
    this.sceneLoader = new SceneLoader(this.loadingManager);
    const textures = {};
    this.textureCache = new Cacher(
      new THREE.TextureLoader(this.loadingManager),
      textures
    );
    this.cubemapCache = new Cacher(
      new CompressedTextureLoader(256, false, this.loadingManager)
    );

    this.imageCache = new Cacher(new THREE.ImageLoader());

    const shes = {};
    this.customFileLoader = new CustomFileLoader(this.loadingManager);
    const arrayBuffer = {};
    this.arrayBufferCache = new Cacher(
      new ArrayBufferLoader(this.loadingManager),
      arrayBuffer
    );
  }

  loadScene(path, fileName, cache, onLoad) {
    cache.load(
      path,
      result => {
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

  loadAll(filePaths, assetPath, cache, load) {
    filePaths = filePaths || [];
    _.map(filePaths, filePath => {
      if (load) {
        load(`${assetPath}/${filePath}`, filePath, cache, result => {
          console.log(result);
        });
      }
    });
  }
}
