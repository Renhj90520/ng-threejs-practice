import { getRandInt, getBoxMesh, getCylinderMesh, mergeMeshes } from './utils';

export default class Tree {
  parts = [];
  group: any;
  constructor(colors, x, z, city) {
    const h = getRandInt(2, 4);
    const trunk = getBoxMesh(
      colors.LIGHT_BROWN,
      2,
      h,
      2,
      x,
      h / 2 + city.curb_h,
      z
    );
    const leaves = getCylinderMesh(
      colors.TREE,
      5,
      10,
      0,
      x,
      h + 5 + city.curb_h,
      z
    );
    const leaves2 = getCylinderMesh(
      colors.TREE,
      5,
      10,
      0,
      x,
      leaves.position.y + 5,
      z
    );

    leaves.rotation.y = Math.random();
    this.parts.push(leaves, leaves2, trunk);
    this.group = mergeMeshes(this.parts);
  }
}
