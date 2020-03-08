import * as _ from 'lodash';
import { Observable } from 'rxjs';
export default class Cacher {
  cache: any;
  loader: any;

  constructor(loader, cache?) {
    this.loader = loader;
    this.cache = cache || {};
  }
  load(path, onLoad, onProgress, onError, fileName) {
    if (_.has(this.cache, fileName)) {
      onLoad(this.cache[fileName]);
    } else {
      this.loader.load(
        path,
        result => {
          this.cache[fileName] = result;
          onLoad(result);
        },
        onProgress,
        onError
      );
    }
  }

  get(path) {
    if (!_.has(this.cache, path)) {
      console.error('Resource not found: ' + path);
    }
    return this.cache[path];
  }
}
