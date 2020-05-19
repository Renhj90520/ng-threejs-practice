import * as THREE from 'three';
import * as _ from 'lodash';
export default class CompressedTextureLoader extends THREE.CompressedTextureLoader {
  size: any;
  interLeaved: any;
  constructor(size, interLeaved, manager = THREE.DefaultLoadingManager) {
    super(manager);
    this.size = size;
    this.interLeaved = interLeaved;
  }

  parse(buffer) {
    const minimaps = [];
    const minimapsLength = Math.log2(this.size);
    let count = 0;
    for (let i = 0; i <= minimapsLength; i++) {
      const size = Math.pow(2, minimapsLength - i);
      const offset = size * size * 4;

      if (count >= buffer.buteLength) break;

      for (let j = 0; j < 6; j++) {
        if (!minimaps[j]) {
          minimaps[j] = [];
        }
        let l;
        if (this.interLeaved) {
          const u = new Uint8Array(buffer, count, offset);
          l = new Uint8Array(offset);
          this.n(size, u, l);
        } else {
          l = new Uint8Array(buffer, count, offset);
        }
        minimaps[j].push({ data: l, width: size, height: size });
        count += offset;
      }
    }

    return {
      isCubemap: true,
      mipmaps: _.flatten(minimaps),
      mipmapCount: minimapsLength + 1,
      width: this.size,
      height: this.size,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearMipMapLinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      type: THREE.UnsignedByteType,
    };
  }
  n(t, e, n) {
    for (var r = t * t, i = 2 * t * t, o = 3 * t * t, a = 0, s = 0; s < r; s++)
      (n[a++] = e[s]),
        (n[a++] = e[s + r]),
        (n[a++] = e[s + i]),
        (n[a++] = e[s + o]);
  }
}
