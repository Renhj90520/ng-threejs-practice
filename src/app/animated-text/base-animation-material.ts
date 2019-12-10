import * as THREE from 'three';
export default class BaseAnimationMaterial extends THREE.ShaderMaterial {
  constructor(parameters, uniforms) {
    super({
      uniforms: THREE.UniformsUtils.merge([uniforms, parameters.uniforms])
    });
    const uniformValues = parameters.uniformValues;
    delete parameters.uniformValues;
    // this.setValues(parameters);

    this.setUniformValues(uniformValues);

    if (uniformValues) {
      uniformValues.map && (this.defines['USE_MAP'] = '');
      uniformValues.normalMap && (this.defines['USE_NORMALMAP'] = '');
      uniformValues.envMap && (this.defines['USE_ENVMAP'] = '');
      uniformValues.aoMap && (this.defines['USE_AOMAP'] = '');
      uniformValues.specularMap && (this.defines['USE_SPECULARMAP'] = '');
      uniformValues.alphaMap && (this.defines['USE_ALPHAMAP'] = '');
      uniformValues.lightMap && (this.defines['USE_LIGHTMAP'] = '');
      uniformValues.emissiveMap && (this.defines['USE_EMISSIVEMAP'] = '');
      uniformValues.bumpMap && (this.defines['USE_BUMPMAP'] = '');
      uniformValues.displacementMap &&
        (this.defines['USE_DISPLACEMENTMAP'] = '');
      uniformValues.roughnessMap && (this.defines['USE_ROUGHNESSMAP'] = '');
      uniformValues.metalnessMap && (this.defines['USE_MELTANESS'] = '');
      uniformValues.gradientMap && (this.defines['USE_GRADIENTMAP'] = '');

      if (uniformValues.envMap) {
        this.defines['USE_ENVMAP'] = '';

        let envMapTypeDefine = 'ENVMAP_TYPE_CODE';
        let envMAPModeDefine = 'ENVMAP_MODE_REFLECTION';
        let envMapBlendingDefine = 'ENVMAP_BLENDING_MULTIPLY';

        switch (uniformValues.envMap.mapping) {
          case THREE.CubeReflectionMapping:
          case THREE.CubeRefractionMapping:
            envMapTypeDefine = 'ENVMAP_TYPE_CUBE';
            break;

          case THREE.CubeUVReflectionMapping:
          case THREE.CubeUVRefractionMapping:
            envMapTypeDefine = 'ENVMAP_TYPE_CUBE_UV';
            break;
          case THREE.EquirectangularReflectionMapping:
          case THREE.EquirectangularRefractionMapping:
            envMapTypeDefine = 'ENVMAP_TYPE_EQUIREC';
            break;
          case THREE.SphericalReflectionMapping:
            envMAPModeDefine = 'ENVMAP_TYPE_SPHERE';
            break;
        }

        switch (uniformValues.envMap.mapping) {
          case THREE.CubeRefractionMapping:
          case THREE.EquirectangularRefractionMapping:
            envMAPModeDefine = 'ENVMAP_MODE_REFRACTION';
            break;
        }

        switch (uniformValues.combine) {
          case THREE.MixOperation:
            envMapBlendingDefine = 'ENVMAP_BLENDING_MIX';
            break;
          case THREE.AddOperation:
            envMapBlendingDefine = 'ENVMAP_BLENDING_ADD';
            break;
          case THREE.MultiplyOperation:
          default:
            envMapBlendingDefine = 'ENVMAP_BLENDING_MULTIPLY';
            break;
        }

        this.defines[envMapTypeDefine] = '';
        this.defines[envMapBlendingDefine] = '';
        this.defines[envMAPModeDefine] = '';
      }
    }
  }

  setUniformValues(values) {
    if (values) {
      const keys = Object.keys(values);

      keys.forEach(key => {
        if (key in this.uniforms) {
          this.uniforms[key].value = values[key];
        }
      });
    }
  }

  stringifyChunk(name) {
    let value;

    if (!this[name]) {
      value = '';
    } else if (typeof this[name] === 'string') {
      value = this[name];
    } else {
      value = this[name].join('\n');
    }

    return value;
  }

  toJSON(meta) {
    const data = THREE.Material.prototype.toJSON.call(this, meta);

    data.uniforms = {};
    for (const name in this.uniforms) {
      const uniform = this.uniforms[name];
      const value = uniform.value;

      if (value === null || value === undefined) {
        data.uniforms[name] = { value };
      } else if (value.isTexture) {
        data.uniforms[name] = {
          type: 't',
          value: value.toJSON(meta).uuid
        };
      } else if (value.usColor) {
        data.uniforms[name] = {
          type: 'c',
          value: value.getHex()
        };
      } else if (value.isVector2) {
        data.uniforms[name] = {
          type: 'v2',
          value: value.toArray()
        };
      } else if (value.isVector4) {
        data.uniforms[name] = {
          type: 'v4',
          value: value.toArray()
        };
      } else if (value.isMatrix4) {
        data.uniforms[name] = {
          type: 'm4',
          value: value.toArray()
        };
      } else {
        data.uniforms[name] = {
          value
        };
      }
    }

    if (Object.keys(this.defines).length > 0) {
      data.defines = this.defines;
    }
    data.vertexShader = this.vertexShader;
    data.fragmentShader = this.fragmentShader;

    return data;
  }
}
