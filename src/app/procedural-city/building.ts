import {
  getRandInt,
  getBoxMesh,
  chance,
  getBoxMeshOpts,
  randDir,
  mergeMeshes
} from './utils';
import * as _ from 'lodash';

export default class Building {
  city;
  color;
  w;
  h;
  l;
  x;
  z;
  tall;

  rim = getRandInt(3, 5);
  inset = getRandInt(2, 4);

  rim_opts;
  parts = [];
  group: any;
  constructor(city, color, w, h, l, x, z, tall?) {
    this.city = city;
    this.color = color;
    this.w = w;
    this.h = h;
    this.l = l;
    this.x = x;
    this.z = z;
    this.tall = tall;

    this.rim_opts = {
      color: this.color,
      h: this.rim,
      y: this.h + this.rim / 2 + this.city.curb_h,
      shadow: false
    };

    this.parts.push(
      getBoxMeshOpts({
        color: this.color,
        w: this.w,
        h: this.h,
        l: this.l,
        x: this.x,
        y: this.h / 2 + this.city.curb_h,
        z: this.z,
        shadow: true
      })
    );

    if (chance(50)) {
      this.parts.push(
        getBoxMeshOpts(
          _.assign(this.rim_opts, {
            w: this.w,
            l: this.inset,
            x: this.x,
            z: this.z - (this.l / 2 - this.inset / 2)
          })
        )
      );

      this.parts.push(
        getBoxMeshOpts(
          _.assign(this.rim_opts, {
            w: this.w,
            l: this.inset,
            x: this.x,
            z: this.z + (this.l / 2 - this.inset / 2)
          })
        )
      );

      this.parts.push(
        getBoxMeshOpts(
          _.assign(this.rim_opts, {
            w: this.inset,
            l: this.l - this.inset * 2,
            x: this.x - (this.w / 2 - this.inset / 2),
            z: this.z
          })
        )
      );

      this.parts.push(
        getBoxMeshOpts(
          _.assign(this.rim_opts, {
            w: this.inset,
            l: this.l - this.inset * 2,
            x: this.x + (this.w / 2 - this.inset / 2),
            z: this.z
          })
        )
      );

      this.parts.push(
        getBoxMeshOpts(
          _.assign(this.rim_opts, {
            w: getRandInt(this.w / 4, this.w / 2),
            l: getRandInt(this.l / 4, this.l / 2),
            x: this.x - 5 * randDir(),
            z: this.z - 5 * randDir()
          })
        )
      );
    }

    if (chance(25) && this.tall) {
      this.parts.push(
        getBoxMeshOpts(
          _.assign(this.rim_opts, {
            w: 3,
            l: 3,
            x: this.x - 5 * randDir(),
            z: this.z - 5 * randDir(),
            h: getRandInt(
              this.city.building_max_h / 5,
              this.city.building_max_h / 3
            )
          })
        )
      );
      const top = getBoxMeshOpts(
        _.assign(this.rim_opts, {
          w: this.w - this.w / 3,
          l: this.w - this.w / 3,
          x: this.x,
          z: this.z,
          h: getRandInt(15, 30)
        })
      );

      top.castShadow = false;
      this.parts.push(top);
    }

    const merged = mergeMeshes(this.parts);
    this.group = merged;
  }
}
