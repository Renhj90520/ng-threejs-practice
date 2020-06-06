import * as _ from 'lodash';
import * as THREE from 'three';
import { EventMixins } from './mixin';
export default class Picker extends EventMixins {
  objects: any[];
  mouseCoords: { x: number; y: number };
  camera: any;
  checkFlag: any;
  currentObj: any;
  point: any;
  rayCaster: THREE.Raycaster;
  constructor(opts) {
    super();
    opts = opts || {};
    this.objects = [];
    this.mouseCoords = { x: 0, y: 0 };
    this.camera = opts.camera;
    this.checkFlag = opts.checkFlag !== undefined ? opts.checkFlag : false;

    this.rayCaster = new THREE.Raycaster();
  }

  add(objs) {
    if (!_.isArray(objs)) {
      objs = [objs];
    }
    _.each(objs, (obj) => {
      this.objects.push(obj);
      obj.pickable = true;
    });
  }

  remove(obj) {
    for (let i = 0; i < this.objects.length; i++) {
      const o = this.objects[i];
      if (o.id === obj.id) {
        this.objects.splice(i, 1);
        break;
      }
    }
  }

  clear() {
    this.objects = [];
  }
  clearState() {
    if (this.currentObj) {
      this.trigger('leave', this.currentObj);
      this.currentObj = null;
    }
  }

  onTap() {
    if (this.currentObj) {
      this.trigger('pick', this.currentObj, this.point);
    }
  }

  hitTest() {
    const worldPosition = new THREE.Vector3();

    this.camera.getWorldPosition(worldPosition);
    let obj;
    this.rayCaster.setFromCamera(this.mouseCoords, this.camera);
    const intersected = this.rayCaster.intersectObjects(this.objects);
    if (intersected.length > 0) {
      const pickable = _.find(intersected, (intersect: any) => {
        if (this.checkFlag) {
          return intersect.object.pickable;
        } else {
          return intersect.object;
        }
      });

      if (pickable) {
        this.point = pickable.point;
        obj = pickable.object;
      }
    }

    if (
      (obj && this.currentObj && this.currentObj !== obj) ||
      (!obj && this.currentObj)
    ) {
      this.trigger('leave', this.currentObj);
      this.currentObj = null;
    }

    if (obj && !this.currentObj) {
      this.trigger('enter', obj, this.point);
      this.currentObj = obj;
    }

    return obj;
  }

  updateMouseCoords(coords) {
    this.mouseCoords = coords;
  }

  getPoint() {
    return this.point;
  }
}
