import * as THREE from 'three';
export default class MTLLoader {
  manager;
  path;
  resourcePath: any;
  crossOrigin: any;
  materialOptions: any;
  constructor(manager) {
    this.manager =
      manager !== undefined ? manager : THREE.DefaultLoadingManager;
  }

  load(url, onLoad, onProgress, onError) {
    const path =
      this.path === undefined
        ? THREE.LoaderUtils.extractUrlBase(url)
        : this.path;

    const loader = new THREE.FileLoader(this.manager);
    loader.setPath(this.path);
    loader.load(
      url,
      text => onLoad(this.parse(text, path)),
      onProgress,
      onError
    );
  }

  setPath(path) {
    this.path = path;
    return this;
  }

  setResourcePath(path) {
    this.resourcePath = path;
    return this;
  }
  setCrossOrigin(value) {
    this.crossOrigin = value;
    return this;
  }

  setMaterialOptions(value) {
    this.materialOptions = value;
    return this;
  }

  parse(text, path?) {
    const lines = text.split('\n');
    let info: any = {};
    const delimiter_pattern = /\s+/;
    const materialsInfo: any = {};

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      line = line.trim();

      if (line.length === 0 || line.charAt(0) === '#') {
        continue;
      }

      const pos = line.indexOf(' ');

      let key = pos >= 0 ? line.substring(0, pos) : line;
      key = key.toLowerCase();

      let value = pos >= 0 ? line.substring(pos + 1) : '';
      value = value.trim();

      if (key === 'newmtl') {
        info = { name: value };
        materialsInfo[value] = info;
      } else {
        if (key === 'ka' || key === 'kd' || key === 'ks' || key === 'ke') {
          const ss = value.split(delimiter_pattern, 3);
          info[key] = [parseFloat(ss[0]), parseFloat(ss[1]), parseFloat(ss[2])];
        } else {
          info[key] = value;
        }
      }
    }
    const materialCreator = new MaterialCreator(
      this.resourcePath || path,
      this.materialOptions
    );

    materialCreator.setCrossOrigin(this.crossOrigin);
    materialCreator.setManager(this.manager);
    materialCreator.setMaterials(materialsInfo);

    return materialCreator;
  }
}

class MaterialCreator {
  baseUrl;
  options;
  materialsInfo: any = {};
  materials: any = {};
  materialsArray = [];
  nameLookup: any = {};
  side;
  wrap;

  crossOrigin = 'anonymous';
  manager: any;
  constructor(baseUrl, options) {
    this.baseUrl = baseUrl || '';
    this.options = options;
    this.side =
      this.options && this.options.side ? this.options.side : THREE.FrontSide;
    this.wrap =
      this.options && this.options.wrap
        ? this.options.wrap
        : THREE.RepeatWrapping;
  }

  setCrossOrigin(value) {
    this.crossOrigin = value;
    return this;
  }

  setManager(value) {
    this.manager = value;
  }

  setMaterials(materialsInfo) {
    this.materialsInfo = this.convert(materialsInfo);
    this.materials = {};
    this.materialsArray = [];
    this.nameLookup = {};
  }

  convert(materialsInfo) {
    if (!this.options) return materialsInfo;

    const converted: any = {};

    for (const mn in materialsInfo) {
      const mat = materialsInfo[mn];

      const covmat: any = {};

      for (const prop in mat) {
        let save = true;
        let value = mat[prop];
        const lprop = prop.toLowerCase();

        switch (lprop) {
          case 'kd':
          case 'ka':
          case 'ks':
            // Diffuse color (color under white light) using RGB values
            if (this.options.normalizeRGB) {
              value = [value[0] / 255, value[1] / 255, value[2] / 255];
            }

            if (this.options.ignoreZeroRGBs) {
              if (value[0] === 0 && value[1] === 0 && value[2] === 0) {
                save = false;
              }
            }

            break;

          default:
            break;
        }
        if (save) {
          covmat[lprop] = value;
        }
      }
    }

    return converted;
  }

  preload() {
    for (const mn in this.materialsInfo) {
      this.create(mn);
    }
  }

  getIndex(materialName) {
    return this.nameLookup[materialName];
  }

  getAsArray() {
    let index = 0;
    for (const mn in this.materialsInfo) {
      this.materialsArray[index] = this.create(mn);
      this.nameLookup[mn] = index;
      index++;
    }

    return this.materialsArray;
  }

  create(materialName) {
    if (this.materials[materialName] === undefined) {
      this.createMaterial(materialName);
    }

    return this.materials[materialName];
  }

  createMaterial(materialName) {
    const mat = this.materialsInfo[materialName];
    const params: any = { name: materialName, side: this.side };

    const resolveURL = (baseUrl, url) => {
      if (typeof url !== 'string' || url === '') return '';

      if (/^https?:\/\//i.test(url)) return url;

      return baseUrl + url;
    };

    const setMapForType = (mapType, value) => {
      if (params[mapType]) return;

      const texParams = this.getTextureParams(value, params);

      const map = this.loadTexture(resolveURL(this.baseUrl, texParams.url));

      map.repeat.copy(texParams.scale);
      map.offset.copy(texParams.offset);

      map.wrapS = this.wrap;
      map.wrapT = this.wrap;

      params[mapType] = map;
    };

    for (const prop in mat) {
      const value = mat[prop];
      let n;
      if (value === '') continue;

      switch (prop.toLowerCase()) {
        case 'kd':
          params.color = new THREE.Color().fromArray(value);
          break;
        case 'ks':
          params.specular = new THREE.Color().fromArray(value);
          break;
        case 'ke':
          params.emissive = new THREE.Color().fromArray(value);
          break;

        case 'map_kd':
          setMapForType('map', value);
          break;
        case 'map_ks':
          setMapForType('specularMap', value);
          break;
        case 'map_ke':
          setMapForType('emissiveMap', value);
          break;

        case 'norm':
          setMapForType('normalMap', value);
          break;

        case 'map_bump':
        case 'bump':
          setMapForType('bumpMap', value);
          break;
        case 'map_d':
          setMapForType('alphaMap', value);
          params.transparent = true;
          break;
        case 'ns':
          params.shiness = parseFloat(value);
          break;
        case 'd':
          n = parseFloat(value);
          if (n < 1) {
            params.opacity = n;
            params.transparent = true;
          }
          break;
        case 'tr':
          n = parseFloat(value);
          if (this.options && this.options.invertTrProperty) n = 1 - n;

          if (n > 0) {
            params.opacity = 1 - n;
            params.transparent = true;
          }
          break;
        default:
          break;
      }
    }

    this.materials[materialName] = new THREE.MeshPhongMaterial(params);
    return this.materials[materialName];
  }

  getTextureParams(value, matParams) {
    const texParams: any = {
      scale: new THREE.Vector2(1, 1),
      offset: new THREE.Vector2(0, 0)
    };

    const items = value.split(/\s+/);
    let pos = items.indexOf('-bm');

    if (pos >= 0) {
      matParams.bumpScale = parseFloat(items[pos + 1]);
      items.splice(pos, 2);
    }

    pos = items.indexOf('-s');

    if (pos >= 0) {
      texParams.scale.set(
        parseFloat(items[pos + 1]),
        parseFloat(items[pos + 2])
      );

      items.splice(pos, 4);
    }

    pos = items.indexOf('-o');

    if (pos >= 0) {
      texParams.offset.set(
        parseFloat(items[pos + 1]),
        parseFloat(items[pos + 2])
      );
      items.splice(pos, 4);
    }

    texParams.url = items.join(' ').trim();
    return texParams;
  }

  loadTexture(url, mapping?, onLoad?, onProgress?, onError?) {
    let texture;
    let loader: any = THREE.Loader.Handlers.get(url);
    const manager =
      this.manager !== undefined ? this.manager : THREE.DefaultLoadingManager;

    if (loader === null) {
      loader = new THREE.TextureLoader(manager);
    }

    if (loader.setCrossOrigin) {
      loader.setCrossOrigin(this.crossOrigin);
    }
    texture = loader.load(url, onLoad, onProgress, onError);
    if (mapping !== undefined) texture.mapping = mapping;
    return texture;
  }
}
