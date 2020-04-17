import * as _ from 'lodash';
import * as THREE from 'three';
import { ResourceManager } from './resource-manager';
import Palette from './pallete';
import PalettePanel from './palette-panel';
import { TweenLite, Power1 } from 'gsap';
import { EventMixins } from './mixin';
export default class Hud extends EventMixins {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  width: number;
  height: number;
  size: { width: number; height: number };
  maxScale: number;
  pickables: any[];
  palettes: any;
  resourceManager: ResourceManager;
  currentPalette: any;
  visible: boolean;
  panels: any;
  currentPanel: any;
  hoveredObject: any;
  constructor(width, height, resourceManager, scene, configurables) {
    super();
    this.resourceManager = resourceManager;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      -10000,
      10000
    );
    this.width = this.camera.right - this.camera.left;
    this.height = this.camera.top - this.camera.bottom;
    this.size = { width: this.width, height: this.height };
    this.maxScale = 0.05 * this.width;
    this.scene.add(this.camera);
    this.camera.position.set(0, 0, 1000);
    this.camera.lookAt(this.scene.position);
    this.palettes = {};
    this.pickables = [];
    this.createPalettes(scene, configurables);
    this.hideAllPalettes();
    this.createPanels(scene, configurables);
    this.visible = false;
  }
  createPalettes(scene, configurables) {
    configurables.forEach((configurable) => {
      const name = configurable.name;
      const obj = scene.getObjectByName(name);
      const materials = this.getMaterialsForObject(obj);
      const palette = new Palette(
        {
          hudSize: this.size,
          maxScale: this.maxScale,
          materials,
          exposureBoost: true,
        },
        this.resourceManager
      );
      this.palettes[name] = palette;
      this.scene.add(palette);
      palette.children.forEach((child) => {
        this.pickables.push(child);
      });
      palette.name = name + '_palette';
    });
  }
  getMaterialsForObject(obj) {
    if (obj) {
      const materials = obj.getObjectByName('materials');
      if (materials) {
        return _.map(materials.children, (child) => {
          return child.material;
        });
      }
    }
  }
  showAllPalettes(animate?) {
    _.each(this.palettes, (palette) => {
      palette.show(animate);
    });
  }

  hideAllPalettes() {
    _.each(this.palettes, (palette) => {
      palette.hide();
    });
    this.currentPalette = null;
  }
  createPanels(scene, configurables) {
    const cornerGradient = this.resourceManager.getTexture(
      'textures/corner-gradient.png'
    );

    this.panels = {};
    _.each(configurables, (configurable) => {
      const uiPanel = scene.getObjectByName('ui_panel').clone();
      const palettePanel = new PalettePanel({
        referenceObject: uiPanel,
        data: configurable.panel_data,
        hudSize: { width: this.width, height: this.height },
        gradientMap: cornerGradient,
        showGradient: true,
      });

      this.scene.add(palettePanel);
      palettePanel.visible = false;
      this.panels[configurable.name] = palettePanel;
    });
  }

  showAllPanels() {
    _.each(this.panels, (panel) => {
      panel.show(false);
    });
  }
  hideAllPanels() {
    _.each(this.panels, (panel) => {
      panel.hide();
    });
  }

  setPanel(name, animate?) {
    if (this.currentPanel) {
      this.currentPanel.fadeOut();
    }
    this.currentPanel = this.panels[name];
    this.currentPanel.show(animate);
  }

  setPalette(name, timeout?) {
    if (this.currentPalette) {
      this.currentPalette.fadeOut();
    } else {
      this.hideAllPalettes();
    }
    this.currentPalette = this.palettes[name];
    const showPalette = () => {
      if (this.currentPalette) {
        this.currentPalette.show();
      }
    };
    if (timeout) {
      setTimeout(showPalette, timeout);
    } else {
      showPalette();
    }
  }

  getPickables() {
    return this.pickables;
  }

  show() {
    this.visible = true;
  }
  hide() {
    this.currentPalette.fadeOut(() => {
      this.visible = false;
      this.currentPalette = null;
    });

    this.currentPanel.fadeOut(() => {
      this.currentPanel = null;
    });
  }

  enter(obj) {
    const scaleOrign = obj.tweenValue.scale;
    const tl = TweenLite.to({}, 0.25, {
      ease: Power1.easeOut,
      onUpdate() {
        const progress = tl.progress();
        const scale =
          progress * (1.2 * this.maxScale - scaleOrign) + scaleOrign;
        obj.scale.set(scale, scale, scale);
      },
    }).play();

    this.hoveredObject = obj;
  }

  leave(obj) {
    const scaleOrign = obj.tweenValue.scale;
    const tl = TweenLite.to({}, 0.25, {
      ease: Power1.easeOut,
      onUpdate() {
        const progress = tl.progress();
        const scale = progress * (this.maxScale - scaleOrign) + scaleOrign;
        obj.scale.set(scale, scale, scale);
      },
    }).play();

    this.hoveredObject = null;
  }
  select(materialObj) {
    if (!materialObj.current) {
      if (_.includes(this.currentPalette.children, materialObj)) {
        this.trigger(
          'selectMaterial',
          this.currentPalette.children.indexOf(materialObj)
        );
      }

      const tl = TweenLite.fromTo(
        materialObj.ripple.material,
        0.4,
        { opacity: 0.35 },
        {
          opacity: 0,
          ease: Power1.easeOut,
          onUpdate: () => {
            const progress = tl.progress();
            const scale = 1 + progress * 0.3;
            materialObj.ripple.scale.set(scale);
          },
        }
      ).play();
    }
  }
  render(renderer) {
    if (this.visible) {
      renderer.render(this.scene, this.camera);
    }
  }

  update(clock) {
    if (this.hoveredObject) {
      this.hoveredObject.rotation.y += clock.delta;
    }
  }

  setCurrent(idx) {
    const palette = this.currentPalette.children[idx];
    this.currentPalette.children.forEach((child) => {
      child.current = false;
      child.stroke.visible = false;
    });

    palette.current = true;
    palette.stroke.visible = true;
    this.currentPanel.setMaterial(idx);
  }

  resize(width, height) {
    this.camera.left = width / -2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = height / -2;
    this.camera.updateProjectionMatrix();
    this.size.width = width;
    this.size.height = height;
    this.maxScale = Math.max(this.size.width, this.size.height) * 0.05;

    _.invoke(this.panels, 'resize', this.size);
    _.invoke(this.palettes, 'resize', this.size, this.maxScale);
  }
}
