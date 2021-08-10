import CustomShaderMaterial from './CustomShaderMaterial';
import * as THREE from 'three';
import * as _ from 'lodash';
export default class StrokeMaterial extends CustomShaderMaterial {
  vertexShader = `
    uniform float objectScale;
    void main() {
      float thickness = .015 / objectScale;
      vec4 worldPos = modelMatrix * vec4(position, 1.);
      vec4 worldNormal = modelMatrix * vec4(normal, 0.0);

      worldPos += worldNormal * thickness;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `;
  fragmentShader = `
    uniform vec3 diffuse;
    uniform float opacity;
    void main() {
      gl_FragColor = vec4(diffuse, opacity);
    }
  `;
  uniforms = {
    diffuse: {
      value: new THREE.Color(0xffffff),
    },
    opacity: { value: 1 },
    objectScale: { value: 1 },
  };
  constructor(opts?) {
    super(opts);
    opts = Object.assign({ uniforms: this.uniforms }, opts);
    this.setParameters(opts);

    Object.keys(this.uniforms).forEach((key) => {
      this.onPropertyChange(key, (val) => {
        this.uniforms[key].value = val;
      });
    });
    this.depthWrite = false;
  }

  clone(cloneTarget?) {
    cloneTarget = cloneTarget || new StrokeMaterial();
    cloneTarget.name = this.name;
    cloneTarget.transparent = this.transparent;
    _.each(this.uniforms, (uniform: any, key) => {
      const type = uniform.type;
      if (type === 'v2' || type === 'v4') {
        cloneTarget.uniforms[key].value.copy(uniform.value);
      } else {
        cloneTarget.uniforms[key].value = uniform.value;
      }
    });
    return cloneTarget;
  }
}
