import * as THREE from 'three';
import { TweenLite, Power1 } from 'gsap';
export default class PalettePanel extends THREE.Object3D {
  data: any;
  showGradient: any;
  gradientMap: any;

  materialTextures: any[];
  innerContainer: THREE.Object3D;
  nameObj: any;
  lineObj: any;
  dimensionsObj: any;
  materialObj: any;
  gradient: any;
  materialTween: any;
  constructor(opts) {
    super();

    this.data = opts.data;
    this.showGradient = opts.showGradient;
    this.gradientMap = opts.gradientMap;
    this.initLayout(opts.referenceObject, opts.hudSize);
    this.materialTextures = [];

    const nameTexture = this.getPanelTexture('name', this.data.type);
    const dimensionsTexture = this.getPanelTexture(
      'dimensions',
      this.data.dimensions
    );

    this.data.materials.forEach((material) => {
      const texture = this.getPanelTexture('material', material);
      this.materialTextures.push(texture);
    });

    this.updateMap(nameTexture, this.nameObj);
    this.updateMap(dimensionsTexture, this.dimensionsObj);
    this.updateMap(this.materialTextures[0], this.materialObj);
  }
  getPanelTexture(type, text) {
    const panel = new Panel();
    const canvas = panel.canvas;
    panel.resize(512, 512);
    switch (type) {
      case 'name':
        panel.draw(text, '96px "AlternateGothic3"', 'white', 2);
        break;
      case 'dimensions':
        panel.draw(text, '24px "Work Sans"', 'white', 2);
        break;
      case 'material':
        panel.draw(text, '36px "Work Sans"', 'white', 2);
        break;
    }

    return new THREE.Texture(canvas);
  }
  initLayout(obj, hudSize) {
    const name = obj.getObjectByName('name');
    const line = obj.getObjectByName('line');
    const dimensions = obj.getObjectByName('dimensions');
    const material = obj.getObjectByName('material');

    this.innerContainer = new THREE.Object3D();
    const size = this.setSize(hudSize);
    this.add(this.innerContainer);
    this.nameObj = this.addElement(name, 0, 0);
    this.lineObj = this.addElement(line, -205, 100);
    this.dimensionsObj = this.addElement(dimensions, 0, 110);
    this.materialObj = this.addElement(material, 0, 110);
    if (this.showGradient) {
      this.initGradient(size);
    }
    line.children[0].material.polygonOffset = true;
    line.children[0].material.polygonOffsetFactor = -0.1;
  }
  private setSize(hudSize: any) {
    const wider = hudSize.width > hudSize.height;
    const size = wider ? 0.075 * hudSize.height : 0.08 * hudSize.width;
    const scale = wider ? hudSize.width / 1880 : hudSize.height / 1400;
    this.innerContainer.position.set(
      -0.5 * hudSize.width + size,
      0.5 * hudSize.height - size,
      0
    );
    this.innerContainer.scale.setScalar(scale);
    return size;
  }

  addElement(obj, offsetX, offsetY) {
    const box = new THREE.Box3();
    this.add(obj);
    box.setFromObject(obj);
    this.innerContainer.add(obj);
    obj.height = box.max.y - box.min.y;
    obj.width = box.max.x - box.min.x;

    const x = obj.width / this.scale.x / 2 + offsetX;
    const y = -obj.height / this.scale.y / 2 - offsetY;
    obj.position.set(x, y, 0);
    if (obj.material) {
      obj.material = obj.material.clone();
      obj.material.depthTest = false;
    }

    obj.traverse((child) => {
      child.renderOrder = 1;
    });

    return obj;
  }
  initGradient(size) {
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      map: this.gradientMap,
      opacity: 0,
    });
    const gradient = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(512, 512, 1, 1),
      material
    );

    this.innerContainer.add(gradient);
    gradient.scale.setScalar((512 + size) / 512);
    gradient.position.set(256 - size / 2, size / 2 - 256, 0);
    gradient.renderOrder = 0;
    this.gradient = gradient;
    this.gradient.maxOpacity = 0.1;
  }

  resize(hudSize) {
    const size = this.setSize(hudSize);
    this.gradient.scale.setScalar((512 + size) / 512);
    this.gradient.position.set(256 - size / 2, size / 2 - 256, 0);
  }

  show(animate?) {
    animate = animate === undefined || animate;
    this.visible = true;
    this.innerContainer.visible = true;
    if (animate) {
      this.nameObj.visible = false;
      this.materialObj.visible = false;
      this.dimensionsObj.visible = false;
      this.animateLine();
      setTimeout(() => {
        this.animateUpperElement();
      }, 300);
      setTimeout(() => {
        this.animateBottomElement();
      }, 500);
    }
    if (this.showGradient) {
      this.fadeInGradient();
    }
  }
  animateLine() {
    const scaleX = this.lineObj.scale.x;
    this.lineObj.scale.setX(10e-5);
    const animObj = { val: 10e-5 };
    const tl = TweenLite.to(animObj, 3, {
      val: scaleX,
      ease: Power1.easeInOut,
      onUpdate: () => {
        this.lineObj.scale.setX(tl.progress() * (scaleX - 10e-5) + 10e-5);
      },
    }).play();
  }
  animateUpperElement() {
    const map = this.nameObj.material.map;
    const offset = map.offset.y;
    this.nameObj.visible = true;
    TweenLite.fromTo(
      this.nameObj.material,
      1,
      { opacity: 0 },
      {
        opacity: 1,
        ease: Power1.easeInOut,
        onUpdate: function () {
          map.offset.setY(this.progress() * (offset - 1) + 1);
        },
      }
    ).play();
  }
  animateBottomElement() {
    const map = this.materialObj.material.map;
    const offsetY = map.offset.y;
    const dMap = this.dimensionsObj.material.map;
    const dOffsetY = dMap.offset.y;
    this.materialObj.visible = true;
    this.dimensionsObj.visible = true;
    this.materialObj.material.opacity = 0;
    this.dimensionsObj.material.opacity = 0;
    const tl = TweenLite.to({}, 1, {
      ease: Power1.easeInOut,
      onUpdate: () => {
        const progress = tl.progress();
        map.offset.setY(progress * (offsetY - 0.73) + 0.73);
        dMap.offset.setY(progress * (dOffsetY - 0.8) + 0.8);
        this.materialObj.material.opacity = progress;
        this.dimensionsObj.material.opacity = progress;
      },
    });
  }
  fadeInGradient() {
    TweenLite.fromTo(
      this.gradient.material,
      1,
      { opacity: 0 },
      {
        opacity: this.gradient.maxOpacity,
      }
    );
  }

  fadeOutGradient() {
    TweenLite.to(this.gradient.material, 0.35, {
      opacity: 0,
    }).play();
  }

  hide() {
    this.visible = false;
  }
  fadeOut(complete?) {
    const tl = TweenLite.to({}, 0.35, {
      ease: Power1.easeOut,
      onUpdate: () => {
        const progress = tl.progress();
        const opacity = 1 - progress;
        this.traverse((mesh: any) => {
          if (mesh.material) {
            mesh.material.opacity = opacity;
          }
        });
      },
      onComplete: () => {
        this.hide();
        this.traverse((mesh: any) => {
          if (mesh.material) {
            mesh.material.opacity = 1;
          }
        });

        if (complete) {
          complete();
        }
      },
    }).play();

    if (this.materialTween) {
      this.materialTween.stop();
    }
    if (this.showGradient) {
      this.fadeOutGradient();
    }
  }

  setMaterial(idx) {
    if (this.materialTween) {
      this.innerContainer.remove(this.materialObj);
      this.materialObj = this.copy;
      this.materialTween = null;
      this.setMaterial(idx);
    } else {
      const texture = this.materialTextures[idx];
      const objClone = this.materialObj.clone();
      this.copy = objClone;
      this.innerContainer.add(objClone);
      objClone.position.copy(this.materialObj.position);
      objClone.position.x -= 200;
      if (objClone.material) {
        objClone.material = objClone.material.clone();
        objClone.material.depthTest = false;
      }
      objClone.traverse((child) => {
        child.renderOrder = 1;
      });

      if (texture) {
        this.updateMap(texture, objClone);
        objClone.material.opacity = 0;

        const x = this.materialObj.position.x;
        const cloneX = objClone.position.x;
        const onComplete = () => {
          this.innerContainer.remove(this.materialObj);
          this.materialObj = objClone;
          this.materialObj.position.setX(x + 200);
          this.materialTween = null;
        };
        this.materialTween = TweenLite.to({}, 0.5, {
          ease: Power1.easeInOut,
          onUpdate: () => {
            const progress = this.materialTween.progress();
            const offset = 200 * progress;
            this.materialObj.position.setX(x + offset);
            objClone.position.setX(cloneX + offset);
            this.materialObj.material.opacity = 1 - progress;
            objClone.material.opacity = progress;
          },
          onComplete,
        }).play();
      } else {
        console.error(
          'Missing material texture. Panel cannot display current material name.'
        );
      }
    }
  }
  updateMap(texture, obj) {
    texture.offset.copy(obj.material.map.offset);
    texture.repeat.copy(obj.material.map.repeat);

    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    obj.material.map = texture;
    obj.material.needsUpdate = true;
  }
}

class Panel {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  draw(text, font, fillStyle, maxWidth) {
    if (text.length > 0) {
      this.ctx.font = font;
      this.ctx.fillStyle = fillStyle;
      this.ctx.textBaseline = 'hanging';
      this.ctx.fillText(text, 0, maxWidth + 1);
    }
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.reset();
  }
  reset() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = 'rgba(255,255,255,.001)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
