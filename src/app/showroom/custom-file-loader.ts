import * as THREE from 'three';

export default class CustomFileLoader extends THREE.FileLoader {
  constructor(manager = THREE.DefaultLoadingManager) {
    super(manager);
  }

  load(path, onLoad, onProgress, onError) {
    THREE.FileLoader.prototype.load.call(
      this,
      path,
      result => {
        const buffer = JSON.parse(result);
        const file = this.n(buffer);
        onLoad(file);
      },
      onProgress,
      onError
    );
  }
  n(buffer) {
    var e = buffer.slice(0, 27),
      n = 1 / (2 * Math.sqrt(Math.PI)),
      r = -0.5 * Math.sqrt(3 / Math.PI),
      i = -r,
      o = r,
      a = 0.5 * Math.sqrt(15 / Math.PI),
      s = -a,
      c = 0.25 * Math.sqrt(5 / Math.PI),
      u = s,
      l = 0.25 * Math.sqrt(15 / Math.PI);
    return [
      n,
      n,
      n,
      r,
      r,
      r,
      i,
      i,
      i,
      o,
      o,
      o,
      a,
      a,
      a,
      s,
      s,
      s,
      c,
      c,
      c,
      u,
      u,
      u,
      l,
      l,
      l
    ].map(function(t, n) {
      return t * e[n];
    });
  }
}
