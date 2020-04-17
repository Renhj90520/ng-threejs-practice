import * as THREE from 'three';
import * as _ from 'lodash';
import MaterialManager from './MaterialManager';
import { configurables } from './configurables';
import { DollyCamera } from './DollyCamera';
import UI from './ui';
import Hud from './hud';
import Picker from './picker';
import Water from './water';
import Noise from './noise';
import SeaHighlightsMaterial from './sea-highlights-material';
import { points } from '../vr-sonic/points';
export default class Stage {
  renderer: THREE.WebGLRenderer;
  width: any;
  height: any;
  mouseX: number;
  mouseY: number;
  scenes = [];
  scene;
  camera: any;
  startScene: any;
  exteriorScene: any;
  interiorScene: any;
  enterRoom: boolean;
  materialManager: MaterialManager;
  ui: UI;
  resourceManager: any;
  hud: Hud;
  scenePicker: Picker;
  hudPicker: Picker;
  currentSelected: any;
  isSelecting: boolean;
  hoverScene: any;
  water: Water;
  noise: Noise;
  seaHighlights: any;
  flares: any[];
  dirLight: any;
  cameraScene: any;
  constructor(stageEl, resourceManager) {
    this.resourceManager = resourceManager;
    this.width = stageEl.nativeElement.clientWidth;
    this.height = stageEl.nativeElement.clientHeight;
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xffffff);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.domElement.addEventListener('mousemove', (evt) => {
      this.mouseX = (evt.pageX / this.width) * 2 - 1;
      this.mouseY = 1 - (evt.pageY / this.height) * 2;
    });
    stageEl.nativeElement.appendChild(this.renderer.domElement);
  }
  init() {
    this.startScene = this.scenes[0];
    this.exteriorScene = this.scenes[1];
    this.interiorScene = this.scenes[2];
    this.enterRoom = false;
    this.renderer.autoClear = false;
    this.scene.updateMatrixWorld();
    this.initMaterialManager();
    this.initCamera();
    this.initUI();
    this.initObjectPickers();
    this.initObjectsRenderOrder();
    this.initMaterialsExposure();
    this.initPool();
    this.initSeaHighlights();
    this.initFlares();
    this.initDirLight();
    this.initHoverScene();
    this.initCameraScene();
    this.handleNonVREvents();
    this.handleHudEvents();
    this.handleCameraEvents();
    this.preRenderHUD();
  }
  preRenderHUD() {
    this.renderer.clear();
    this.hud.visible = true;
    this.hud.showAllPalettes();
    this.hud.showAllPanels();
    this.hud.render(this.renderer);
    // this.hud.visible = false;
  }
  handleCameraEvents() {
    this.camera.on('startMove', () => {
      this.ui.freezeMarker();
    });

    this.camera.on('endMove', () => {
      this.ui.unfreezeMarker();
    });

    // this.camera.on('firstMove', () => {
    // });

    // this.camera.on('firstRotate', () => {});
  }
  handleHudEvents() {
    this.hud.on('selectMaterial', (idx) => {
      this.materialManager.setObjectMaterial(this.currentSelected, idx);
      this.hud.setCurrent(idx);
    });
  }
  handleNonVREvents() {
    this.renderer.domElement.addEventListener('mousemove', (evt) => {
      const canvas = this.renderer.domElement;
      const point = this.parsePoint(
        evt,
        {
          x: canvas.offsetLeft,
          y: canvas.offsetTop,
        },
        canvas.clientWidth,
        canvas.clientHeight
      );
      this.scenePicker.updateMouseCoords(point);
      this.hudPicker.updateMouseCoords(point);
    });
  }

  parsePoint(evt, containerOffset, containerWidth, containerHeight) {
    return {
      x: ((evt.pageX, -containerOffset.x) / containerWidth) * 2 - 1,
      y: 1 - ((evt.pageY - containerOffset.y) / containerHeight) * 2,
    };
  }
  initCameraScene() {
    this.cameraScene = new THREE.Scene();
    this.cameraScene.add(this.camera);
  }
  initHoverScene() {
    this.hoverScene = new THREE.Scene();
  }
  initDirLight() {
    this.dirLight = this.interiorScene.getObjectByName('Directional Light');
    _.each([this.interiorScene, this.exteriorScene], (scene) => {
      _.each(scene.materials, (material) => {
        if (material.pbr && !material.ignoreDirLight) {
          material.defines.USE_DIR_LIGHT = true;
          material.uniforms.lightColor.value.setRGB(1, 1, 1);
          material.needsUpdate = true;
        }
      });
    });
  }
  initFlares() {
    this.flares = [];
    const spots = this.interiorScene.getObjectByName('spots');
    const flareTexture = this.resourceManager.getTexture('textures/flare.png');
    if (spots) {
      spots.children.forEach((spot) => {
        const flareMaterial = new THREE.PointsMaterial({
          size: 1.5,
          map: flareTexture,
          transparent: true,
          depthWrite: false,
          depthTest: false,
          blending: THREE.AdditiveBlending,
          opacity: 0.25,
        });
        const geo = new THREE.Geometry();
        geo.vertices.push(new THREE.Vector3());
        const flare = new THREE.Points(geo, flareMaterial);
        spot.getWorldPosition(flare.position);
        this.flares.push(flare);
        this.interiorScene.add(flare);
      });
    }
  }
  initSeaHighlights() {
    const seaHighlights = this.interiorScene.getObjectByName('sea_highlights2');
    const material = seaHighlights.material;
    const map = material.map;
    this.noise = new Noise();
    seaHighlights.material = new SeaHighlightsMaterial();
    seaHighlights.material.map = map;
    seaHighlights.material.uniforms.offsetRepeat.value.set(
      map.offset.x,
      map.offset.y,
      map.repeat.x,
      map.repeat.y
    );
    seaHighlights.material.transparent = material.transparent;
    seaHighlights.material.noiseMap = this.noise.target.texture;
    this.seaHighlights = seaHighlights;
  }
  initPool() {
    this.water = new Water(
      {
        light: this.scene.getObjectByName('ocean light'),
        camera: this.camera,
        renderer: this.renderer,
        object: this.exteriorScene.getObjectByName('pool_water'),
        transparent: true,
        opacity: 0.6,
      },
      this.resourceManager
    );
    this.exteriorScene.getObjectByName('pool_water').visible = true;
    this.exteriorScene.add(this.water);
  }
  initMaterialsExposure() {
    this.scene.getObjectByName('feet').material.exposure = 0.3;
  }
  initObjectsRenderOrder() {
    const glassrail = this.interiorScene.getObjectByName('glassrail');
    if (glassrail) {
      glassrail.renderOrder = 50;
    }

    const glasses = this.interiorScene.getObjectByName('glasses');
    if (glasses) {
      glasses.renderOrder = 100;
    }
    const sea = this.interiorScene.getObjectByName('sea');
    if (sea) {
      sea.renderOrder = 100;
    }

    const sky = this.interiorScene.getObjectByName('sky');
    if (sky) {
      sky.renderOrder = 95;
      sky.visible = true;
    }

    const clouds = this.interiorScene.getObjectByName('clouds');
    if (clouds) {
      clouds.traverse((cloud) => {
        cloud.renderOrder = 98;
      });
    }
    const sun = this.interiorScene.getObjectByName('sun');
    if (sun) {
      sun.traverse((sunChild) => {
        sunChild.renderOrder = 97;
      });
    }

    const sun_and_clouds_merged = this.interiorScene.getObjectByName(
      'sun_and_clouds_merged'
    );
    if (sun_and_clouds_merged) {
      sun_and_clouds_merged.renderOrder = 97;
    }

    const sea_highlight = this.interiorScene.getObjectByName('sea_highlight');
    if (sea_highlight) {
      sea_highlight.renderOrder = 101;
    }

    const islands = this.interiorScene.getObjectByName('islands');
    if (islands) {
      islands.traverse((island) => {
        island.renderOrder = 102;
      });
    }

    const islands_merged = this.interiorScene.getObjectByName('islands_merged');
    if (islands_merged) {
      islands_merged.renderOrder = 102;
    }

    const sea_hightlight2 = this.interiorScene.getObjectByName(
      'sea_highlight2'
    );
    if (sea_hightlight2) {
      sea_hightlight2.renderOrder = 103;
    }
  }
  initObjectPickers() {
    const names = ['floor', 'walls', 'armchairs', 'colliders'];
    const pickers = [];
    configurables.forEach((configurable) => {
      names.push(configurable.name);
    });

    _.each(names, (name) => {
      const children = this.getByName(this.scene, name);
      _.each(children, (child) => {
        child.traverse((picker) => {
          pickers.push(picker);
        });
      });
    });

    _.each(this.scene.getObjectByName('colliders').children, (collider) => {
      collider.visible = true;
      collider.material.visible = false;
    });
    this.scenePicker = new Picker({ camera: this.camera, checkFlag: true });
    this.scenePicker.add(pickers);
    this.hudPicker = new Picker({ camera: this.hud.camera, checkFlag: true });
    this.hudPicker.add(this.hud.getPickables());
    this.handlePickerEvents();
  }
  handlePickerEvents() {
    this.scenePicker.on('pick', (obj, point) => {
      let selectObj;
      if (obj.name === 'floor') {
        this.camera.moveTo(point.x, point.z, 1000);
        this.ui.activateMarker();

        if (this.currentSelected) {
          this.deselectObject(this.currentSelected);
        }
      } else if (this.isConfigurable(obj)) {
        selectObj = obj;
      } else if (this.isConfigurable(obj.parent)) {
        selectObj = obj.parent;
      }

      if (selectObj && selectObj !== this.currentSelected) {
        this.selectObject(selectObj);
      }
    });

    this.scenePicker.on('enter', (obj) => {
      if (obj.name === 'floor') {
        this.ui.showMarker();
      }
      if (this.isConfigurable(obj) && obj !== this.currentSelected) {
        this.highlightObject(obj);
      } else if (
        this.isConfigurable(obj.parent) &&
        obj.parent !== this.currentSelected
      ) {
        this.highlightObject(obj.parent);
      }
    });

    this.scenePicker.on('leave', (obj) => {
      if (obj.name === 'floor') {
        this.ui.hideMarker();
      }

      if (this.isConfigurable(obj) && obj !== this.currentSelected) {
        this.clearHightlight(obj);
      } else if (
        this.isConfigurable(obj.parent) &&
        obj.parent !== this.currentSelected
      ) {
        this.clearHightlight(obj.parent);
      }
    });

    this.hudPicker.on('pick', (obj) => {
      this.hud.select(obj);
    });

    this.hudPicker.on('enter', (obj) => {
      this.hud.enter(obj);
      // this.ui.onEnterObject();
      this.ui.hideMarker();
    });
    this.hudPicker.on('leave', (obj) => {
      this.hud.leave(obj);
      // this.ui.onLeaveObject();
    });
  }
  highlightObject(obj) {
    const objGroup = obj.group ? obj.group : obj;
    if (!objGroup.worldPosition) {
      objGroup.worldPosition = new THREE.Vector3();
    }
    if (!objGroup.previousPosition) {
      objGroup.previousPosition = new THREE.Vector3();
    }
    this.ui.highlightObject(obj);
    objGroup.getWorldPosition(objGroup.worldPosition);
    objGroup.previousPosition.copy(objGroup.worldPosition);
    objGroup.previousParent = objGroup.parent;
    this.hoverScene.add(objGroup);
    objGroup.position.copy(objGroup.worldPosition);
  }
  selectObject(obj) {
    const name = obj.name;
    const getConfigurable = (configurableName) => {
      return _.find(
        configurables,
        (configurable) => configurable.name === configurableName
      );
    };

    this.isSelecting = true;
    setTimeout(() => {
      this.isSelecting = false;
    }, 1500);

    this.clearHightlight(obj);
    this.currentSelected = obj;

    this.hud.show();
    this.hud.setPanel(name);

    this.camera.setOrbitDistances(0, 1 / 0);
    this.camera.setState(name, () => {
      this.hud.setPalette(name);
      const configurable = getConfigurable(name);
      this.camera.setOrbitDistances(
        configurable.minDistance,
        configurable.maxDistance
      );
    });

    if (this.hud.currentPalette) {
      this.hud.currentPalette.fadeOut();
    }
  }
  clearHightlight(obj) {
    const objGroup = obj.group ? obj.group : obj;
    this.ui.clearHightlight();
    objGroup.previousParent.add(objGroup);
    objGroup.position.copy(objGroup.previousPosition);
  }
  isConfigurable(obj) {
    return _.includes(
      _.map(configurables, (configurable) => configurable.name),
      obj.name
    );
  }
  deselectObject(obj) {
    this.hud.hide();
    this.currentSelected = null;
    // todo
  }
  getByName(scene, name) {
    const objs = [];
    scene.traverse((child) => {
      if (child.name === name) {
        objs.push(child);
      }
    });

    return objs;
  }
  initUI() {
    this.ui = new UI(this.scene, configurables, this.resourceManager);
    this.hud = new Hud(
      this.width,
      this.height,
      this.resourceManager,
      this.scene,
      configurables
    );
  }
  initCamera() {
    const camera = new DollyCamera({
      states: this.scene.getObjectByName('cameras').children,
      domElement: this.renderer.domElement,
    });
    this.camera = camera;
    this.scene.add(camera);
    camera.enabled = true;
  }
  initMaterialManager() {
    this.materialManager = new MaterialManager({
      scenes: this.scenes,
      configurables: configurables,
    });
  }
  render() {
    if (this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  renderScene(scene, camera) {
    this.renderer.render(scene, camera);
  }

  update() {
    if (this.camera) {
      this.camera.updateMatrixWorld(true);
      this.camera.matrixWorldInverse.getInverse(this.camera.matrixWorld);
    }
    _.each(this.scenes, (scene) => {
      this.updateCustomMaterials(scene);
      if (scene.update) {
        scene.updateMatrixWorld(true);
        scene.update(this.renderer);
      }
    });
  }
  updateCustomMaterials(scene) {
    // _.each(); TODO
  }
}
