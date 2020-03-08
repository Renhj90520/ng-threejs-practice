import * as THREE from 'three';
import { LegacyJSONLoader } from 'three/examples/jsm/loaders/deprecated/LegacyJSONLoader';
export default class SceneLoader {
  geometryBuffer;
  texturePath: any;
  manager: THREE.LoadingManager;
  constructor(manager?) {
    this.manager = manager || THREE.DefaultLoadingManager;
    this.texturePath = '';
  }
  setTexturePath(texturePath) {
    this.texturePath = texturePath;
  }

  load(path, e, onProgress, onError) {
    if (this.texturePath === '') {
      this.texturePath = path.substring(0, path.lastIndexOf('/') + 1);
    }
    new THREE.FileLoader(this.manager).load(
      path,
      (sceneJSONStr: string) => {
        const sceneJSON = JSON.parse(sceneJSONStr);
        this.parse(sceneJSON, e);
      },
      onProgress,
      onError
    );
  }
  parse(sceneInfo, e) {
    let geometries;
    if (sceneInfo.binary) {
      geometries = this.parseBinaryGeometries(sceneInfo.geometries);
    } else {
      geometries = this.parseGeometries(sceneInfo.geometries);
    }

    const images = this.parseImages(sceneInfo.images, () => {
      // TODO
      if (e !== undefined) {
        e(scene, sceneInfo);
      }
    });
    const textures = this.parseTextures(sceneInfo.textures, images);
    const materials = this.parseMaterials(sceneInfo.materials, textures);
    const scene = this.parseObject(sceneInfo.object, geometries, materials);
    if (sceneInfo.animations) {
      scene.animations = this.parseAnimations(sceneInfo.animations);
    }
    if (sceneInfo.cameras) {
      scene.cameras = this.parseCameras(scene, sceneInfo.cameras);
    }

    // TODO
    if (!(sceneInfo.images && sceneInfo.images.length !== 0)) {
      if (e !== undefined) {
        e(scene, sceneInfo);
      }
    }
    return scene;
  }
  parseCameras(scene, cameraInfos) {
    const cameras = [];
    for (let i = 0; i < cameraInfos.length; i++) {
      const cameraUUID = cameraInfos[i];
      const camera = scene.getObjectByProperty('uuid', cameraUUID);
      if (camera) {
        cameras.push(camera);
      }
    }
    return cameras;
  }
  parseAnimations(animationInfos) {
    const animationClips = [];
    for (let i = 0; i < animationInfos.length; i++) {
      const animationInfo = animationInfos[i];
      const animationClip = THREE.AnimationClip.parse(animationInfo);
      animationClips.push(animationClip);
    }

    return animationClips;
  }
  parseObject(objInfo, geometries, materials) {
    const emptyMatrix = new THREE.Matrix4();
    const getGeometry = uuid => {
      if (!geometries[uuid]) {
        console.warn('THREE.ObjectLoader: Undefined geometry', uuid);
      }
      return geometries[uuid];
    };
    const getMaterial = uuid => {
      if (!materials[uuid]) {
        console.warn('THREE.ObjectLoader: Undefined material', uuid);
      }
      return materials[uuid];
    };
    let obj;
    switch (objInfo.type) {
      case 'Scene':
        obj = new THREE.Scene();
        break;
      case 'PerspectiveCamera':
        obj = new THREE.PerspectiveCamera(
          objInfo.fov,
          objInfo.aspect,
          objInfo.near,
          objInfo.far
        );
        if (objInfo.focus !== undefined) {
          obj.focus = objInfo.focus;
        }
        if (objInfo.zoom !== undefined) {
          obj.zoom = objInfo.zoom;
        }
        if (objInfo.filmGauge !== undefined) {
          obj.filmGauge = objInfo.filmGauge;
        }
        if (objInfo.filmOffset !== undefined) {
          obj.filmOffset = objInfo.filmOffset;
        }
        if (objInfo.view !== undefined) {
          obj.view = Object.assign({}, objInfo.view);
        }
        break;
      case 'OrthographicCamera':
        obj = new THREE.OrthographicCamera(
          objInfo.left,
          objInfo.right,
          objInfo.top,
          objInfo.bottom,
          objInfo.near,
          objInfo.far
        );
        break;
      case 'AmbientLight':
        obj = new THREE.AmbientLight(objInfo.color, objInfo.intensity);
        break;
      case 'DirectionalLight':
        obj = new THREE.DirectionalLight(objInfo.color, objInfo.intensity);
        break;
      case 'PointLight':
        obj = new THREE.PointLight(
          objInfo.color,
          objInfo.intensity,
          objInfo.distance,
          objInfo.decay
        );
        break;
      case 'SpotLight':
        obj = new THREE.SpotLight(
          objInfo.color,
          objInfo.intensity,
          objInfo.distance,
          objInfo.angle,
          objInfo.penumbra, // TODO exponent
          objInfo.decay
        );
        break;
      case 'HemisphereLight':
        obj = new THREE.HemisphereLight(
          objInfo.color,
          objInfo.groundColor,
          objInfo.intensity
        );
        break;
      case 'Mesh':
        const geometry = getGeometry(objInfo.geometry);
        const material = getMaterial(objInfo.material);
        if (geometry.bones && geometry.bones.length > 0) {
          obj = new THREE.SkinnedMesh(geometry, material);
        } else {
          obj = new THREE.Mesh(geometry, material);
        }
        break;
      case 'LOD':
        obj = new THREE.LOD();
        break;
      case 'Line':
        obj = new THREE.Line(
          getGeometry(objInfo.goemetry),
          getMaterial(objInfo.material),
          objInfo.mode
        );
        break;
      case 'LineSegments':
        obj = new THREE.LineSegments(
          getGeometry(objInfo.geometry),
          getMaterial(objInfo.material)
        );
        break;
      case 'PointCloud':
      case 'Points':
        obj = new THREE.Points(
          getGeometry(objInfo.geometry),
          getMaterial(objInfo.material)
        );
        break;
      case 'Sprite':
        obj = new THREE.Sprite(getMaterial(objInfo.material));
        break;
      case 'Group':
        obj = new THREE.Group();
        break;
      default:
        obj = new THREE.Object3D();
        break;
    }

    obj.uuid = objInfo.uuid;
    if (objInfo.name) {
      obj.name = objInfo.name;
    }

    if (objInfo.matrix) {
      emptyMatrix.fromArray(objInfo.matrix);
      emptyMatrix.decompose(obj.position, obj.quaternion, obj.scale);
    } else {
      if (objInfo.position) {
        obj.position.fromArray(objInfo.position);
      }
      if (objInfo.rotation) {
        obj.rotation.fromArray(objInfo.rotation);
      }
      if (objInfo.scale) {
        obj.scale.fromArray(objInfo.scale);
      }
    }

    if (objInfo.castShadow !== undefined) {
      obj.castShadow = objInfo.castShadow;
    }
    if (objInfo.receiveShadow !== undefined) {
      obj.receiveShadow = objInfo.receiveShadow;
    }
    if (objInfo.visible !== undefined) {
      obj.visible = objInfo.visible;
    }
    if (objInfo.userData !== undefined) {
      obj.userData = objInfo.userData;
    }
    if (objInfo.children) {
      for (const child in objInfo.children) {
        this.parseObject(objInfo.children[child], geometries, materials);
      }
    }
    if (objInfo.type === 'LOD') {
      for (let i = 0; i < objInfo.levels.length; i++) {
        const level = objInfo.levels[i];
        const child = obj.getObjectByProperty('uuid', level.object);
        if (child) {
          obj.addLevel(child, level.distance);
        }
      }
    }
    if (objInfo.layers !== undefined) {
      obj.layers.mask = objInfo.layers;
    }

    return obj;
  }
  parseMaterials(materialInfos, textures) {
    const materials: any = {};
    if (materialInfos) {
      const materialLoader = new THREE.MaterialLoader();
      materialLoader.setTextures(textures);
      for (let i = 0; i < materialInfos.length; i++) {
        const material = materialLoader.parse(materialInfos[i]);
        materials[material.uuid] = material;
      }
    }

    return materials;
  }
  parseTextures(textureInfos, images) {
    const textures: any = {};
    if (textureInfos) {
      for (let i = 0; i < textureInfos.length; i++) {
        let texture;
        const textureInfo = textureInfos[i];
        if (textureInfo.images) {
          const cubeImages = [];
          for (let j = 0; j < textureInfo.images.length; j++) {
            const imageId = textureInfo.images[j];
            if (!images[imageId]) {
              console.warn('THREE.ObjectLoader: Undefined image', imageId);
            }
            cubeImages.push(images[imageId]);
          }
          texture = new THREE.CubeTexture(cubeImages);
        } else {
          if (!textureInfo.image) {
            console.warn(
              'THREE.ObjectLoader: No "image" specified for',
              textureInfo.uuid
            );
          }
          if (!images[textureInfo.image]) {
            console.warn(
              'THREE.ObjectLoader: Undefined image',
              textureInfo.image
            );
          }
          texture = new THREE.Texture(images[textureInfo.image]);
          texture.needsUpdate = true;
          texture.uuid = textureInfo.uuid;
          if (textureInfo.name) {
            texture.name = textureInfo.name;
          }
          if (textureInfo.mapping) {
            texture.mapping = this.parseConstant(textureInfo.mapping);
          }
        }
      }
    }
    return textures;
  }
  parseConstant(constant) {
    if (typeof constant !== 'number') {
      console.warn(
        'THREE.ObjectLoader.parseTexture: Constant should be in numeric form.',
        constant
      );
    }
    return THREE[constant];
  }
  parseImages(imageInfos, onLoad) {
    const images: any = {};
    if (imageInfos && imageInfos.length > 0) {
      const loadingManager = new THREE.LoadingManager(onLoad);
      const imageLoader = new THREE.ImageLoader(loadingManager);
      for (let i = 0; i < imageInfos.length; i++) {
        const imageInfo = imageInfos[i];
        const url = /^(\/\/)|([a-z]+:(\/\/)?)/i.test(imageInfo.url)
          ? imageInfo.url
          : this.texturePath + imageInfo.url;

        this.manager.itemStart(url);

        images[imageInfo.uuid] = imageLoader.load(url, () => {
          this.manager.itemEnd(url);
        });
      }
      return images;
    }
  }
  parseGeometries(geometryInfos, texturePath?) {
    const geometries: any = {};
    const jsonLoader = new LegacyJSONLoader();
    const bufferGeometryLoader = new THREE.BufferGeometryLoader();
    if (geometryInfos) {
      for (let i = 0; i < geometryInfos.length; i++) {
        const geometryInfo = geometryInfos[i];
        let geometry;
        switch (geometryInfo.type) {
          case 'PlaneGeometry':
          case 'PlaneBufferGeometry':
            geometry = new THREE[geometryInfo.type](
              geometryInfo.width,
              geometryInfo.height,
              geometryInfo.widthSegments,
              geometryInfo.heightSegments
            );
            break;
          case 'BoxGeometry':
          case 'BoxBufferGeometry':
          case 'CubeGeometry':
            geometry = new THREE[geometryInfo.type](
              geometryInfo.width,
              geometryInfo.height,
              geometryInfo.depth,
              geometryInfo.widthSegments,
              geometryInfo.heightSegments,
              geometryInfo.depthSegments
            );
            break;
          case 'CircleGeometry':
          case 'CircleBufferGeometry':
            geometry = new THREE[geometryInfo.type](
              geometryInfo.radius,
              geometryInfo.segments,
              geometryInfo.thetaStart,
              geometryInfo.thetaLength
            );
            break;
          case 'CylinderGeometry':
          case 'CylinderBufferGeometry':
            geometry = new THREE[geometryInfo.type](
              geometryInfo.radiusTop,
              geometryInfo.radiusBottom,
              geometryInfo.height,
              geometryInfo.radialSegments,
              geometryInfo.heightSegments,
              geometryInfo.openEnded,
              geometryInfo.thetaStart,
              geometryInfo.thetaLength
            );
            break;
          case 'ConeGeometry':
          case 'ConeBufferGeometry':
            geometry = new THREE[geometryInfo.type](
              geometryInfo.radius,
              geometryInfo.height,
              geometryInfo.radialSegments,
              geometryInfo.heightSegments,
              geometryInfo.openEnded,
              geometryInfo.thetaStart,
              geometryInfo.thetaLength
            );
            break;
          case 'SphereGeometry':
          case 'SphereBufferGeometry':
            geometry = new THREE[geometryInfo.type](
              geometryInfo.radius,
              geometryInfo.widthSegments,
              geometryInfo.heightSegments,
              geometryInfo.phiStart,
              geometryInfo.phiLength,
              geometryInfo.thetaStart,
              geometryInfo.thetaLength
            );
            break;

          case 'DodecahedronGeometry':
          case 'IcosahedronGeometry':
          case 'OctahedronGeometry':
          case 'TetrahedronGeometry':
            geometry = new THREE[geometryInfo.type](
              geometryInfo.radius,
              geometryInfo.detail
            );
            break;
          case 'RingGeometry':
          case 'RingBufferGeometry':
            geometry = new THREE[geometryInfo.type](
              geometryInfo.innerRadius,
              geometryInfo.outerRadius,
              geometryInfo.thetaSegments,
              geometryInfo.phiSegments,
              geometryInfo.thetaStart,
              geometryInfo.thetaLength
            );
            break;
          case 'TorusGeometry':
          case 'TorusBufferGeometry':
            geometry = new THREE[geometryInfo.type](
              geometryInfo.radius,
              geometryInfo.tube,
              geometryInfo.radialSegments,
              geometryInfo.tubularSegments,
              geometryInfo.arc
            );
            break;
          case 'TorusKnotGeometry':
          case 'TorusKnotBufferGeometry':
            geometry = new THREE[geometryInfo.type](
              geometryInfo.radius,
              geometryInfo.tube,
              geometryInfo.tubularSegments,
              geometryInfo.radialSegments,
              geometryInfo.p,
              geometryInfo.q
            );
            break;
          case 'LatheGeometry':
          case 'LatheBufferGeometry':
            geometry = new THREE[geometryInfo.type](
              geometryInfo.points,
              geometryInfo.segments,
              geometryInfo.phiStart,
              geometryInfo.phiLength
            );
            break;
          case 'BufferGeometry':
            geometry = bufferGeometryLoader.parse(geometryInfo);
            break;
          case 'Geometry':
            geometry = jsonLoader.parse(geometryInfo.data, texturePath)
              .geometry;
            break;
          default:
            console.warn(
              'THREE.ObjectLoader: Unsupported geometry type "' +
                geometryInfo.type +
                '"'
            );
            continue;
        }
        geometry.uuid = geometryInfo.uuid;
        if (geometryInfo.name) {
          geometry.name = geometryInfo.name;
        }
        geometries[geometryInfo.uuid] = geometry;
      }
    }

    return geometries;
  }
  parseBinaryGeometries(geometryInfos) {
    const geometries: any = {};
    if (geometryInfos) {
      for (let i = 0; i < geometryInfos.length; i++) {
        const geometryInfo = geometryInfos[i];
        const geometry = new THREE.BufferGeometry();
        for (const offsetKey in geometryInfo.offsets) {
          if (geometryInfo.offsets.hasOwnProperty(offsetKey)) {
            const offset = geometryInfo.offsets[offsetKey];
            const begin = offset[0];
            const end = offset[1] + 1;
            const buffer = this.geometryBuffer.slice(begin, end);
            if (offsetKey === 'index') {
              const attr = new Uint32Array(buffer);
              geometry.setIndex(new THREE.BufferAttribute(attr, 1));
            } else {
              let length;
              const attr = new Float32Array(buffer);
              switch (offsetKey) {
                case 'uv':
                case 'uv2':
                  length = 2;
                  break;
                case 'position':
                case 'normal':
                case 'color':
                  length = 2;
                  break;
                case 'tangent':
                  length = 4;
                  break;
              }
              geometry.addAttribute(
                offsetKey,
                new THREE.BufferAttribute(attr, length)
              );
            }
          }
        }
        geometry.uuid = geometryInfo.uuid;
        if (geometryInfo.name) {
          geometry.name = geometryInfo.name;
        }
        geometries[geometry.uuid] = geometry;
      }
      this.setBinaryGeometryBuffer(null);
    }
    return geometries;
  }
  setBinaryGeometryBuffer(buffer) {
    this.geometryBuffer = buffer;
  }
}
