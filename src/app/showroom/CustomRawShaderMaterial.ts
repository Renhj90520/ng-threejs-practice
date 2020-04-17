import * as THREE from 'three';
import * as _ from 'lodash';
export default class CustomRawShaderMaterial extends THREE.RawShaderMaterial {
  constructor(parameters?) {
    super(parameters);
    // this.setParameters(parameters);
  }

  protected setParameters(parameters: any) {
    for (const key in parameters) {
      const parameter = parameters[key];
      if (parameter) {
        this[key] = parameter;
      }
    }
  }

  onPropertyChange(propertyName, callback) {
    Object.defineProperty(this, propertyName, {
      get: function() {
        return this['_' + propertyName];
      },
      set: function(value) {
        this['_' + propertyName] = value;
        callback.call(this, value);
      },
      configurable: true
    });
  }
}
