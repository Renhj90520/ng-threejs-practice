import * as THREE from 'three';
import { EventEmitter } from '@angular/core';
export class LoaderSupport {
  onProgress = new EventEmitter();
  onReportError = new EventEmitter();
  onMeshAlter = new EventEmitter();
  onLoad = new EventEmitter();
  onLoadMaterials = new EventEmitter();
  constructor() {}
}
export class Validator {
  static isValid(input) {
    return input !== null && input !== undefined;
  }
  static verifyInput(input, defaultValue) {
    return input === null || input === undefined ? defaultValue : input;
  }
}

export class MeshBuilder {
  materials = [];
  callbacks = new Callbacks();
  constructor() {}

  init() {
    const defaultMaterial = new THREE.MeshStandardMaterial({ color: 0xdcf1ff });
    defaultMaterial.name = 'defaultMaterial';

    const defaultVertexColorMaterial = new THREE.MeshStandardMaterial({
      color: 0xdcf1ff
    });
    defaultVertexColorMaterial.name = 'defaultVertexColorMaterial';
    defaultVertexColorMaterial.vertexColors = THREE.VertexColors;

    const defaultLineMaterial = new THREE.LineBasicMaterial();
    defaultLineMaterial.name = 'defaultLineMaterial';

    const defaultPointMaterial = new THREE.PointsMaterial({ size: 1 });
    defaultPointMaterial.name = 'defaultPointMaterial';

    const runtimeMaterials = {};
    runtimeMaterials[defaultMaterial.name] = defaultMaterial;
    runtimeMaterials[
      defaultVertexColorMaterial.name
    ] = defaultVertexColorMaterial;
    runtimeMaterials[defaultLineMaterial.name] = defaultLineMaterial;
    runtimeMaterials[defaultPointMaterial.name] = defaultPointMaterial;

    this.updateMaterials({
      cmd: 'materialData',
      materials: {
        materialCloneInstructions: null,
        serializedMaterials: null,
        runtimeMaterials: runtimeMaterials
      }
    });
  }

  setMaterials(materials) {
    const payload = {
      cms: 'materialData',
      materials: {
        materialCloneInstructions: null,
        serializedMaterials: null,
        runtimeMaterials: materials
      }
    };
    this.updateMaterials(payload);
  }

  processPayload(payload) {
    if (payload.cmd === 'meshData') {
      return this.buildMeshes(payload);
    } else if (payload.cmd === 'materialData') {
      this.updateMaterials(payload);
      return null;
    }
  }
  buildMeshes(payload) {
    const meshName = payload.params.meshName;

    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.addAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(payload.buffers.vertices), 3)
    );

    if (Validator.isValid(payload.buffers.indices)) {
      bufferGeometry.setIndex(
        new THREE.BufferAttribute(new Uint32Array(payload.buffers.indices), 1)
      );
    }
    const haveVertexColors = Validator.isValid(payload.buffers.colors);
    if (haveVertexColors) {
      bufferGeometry.addAttribute(
        'color',
        new THREE.BufferAttribute(new Float32Array(payload.buffers.colors), 3)
      );
    }

    if (Validator.isValid(payload.buffers.normals)) {
      bufferGeometry.addAttribute(
        'normal',
        new THREE.BufferAttribute(new Float32Array(payload.buffers.normals), 3)
      );
    } else {
      bufferGeometry.computeVertexNormals();
    }

    if (Validator.isValid(payload.buffers.uvs)) {
      bufferGeometry.addAttribute(
        'uv',
        new THREE.BufferAttribute(new Float32Array(payload.buffers.uvs), 2)
      );
    }

    let material, materialName, key;
    const materialNames = payload.materials.materialNames;
    const createMultiMaterial = payload.materials.multiMaterial;
    const multiMaterials = [];
    for (const key in materialNames) {
      materialName = materialNames[key];
      material = this.materials[materialName];
      if (createMultiMaterial) multiMaterials.push(material);
    }

    if (createMultiMaterial) {
      material = multiMaterials;
      const materialGroups = payload.materials.materialGroups;
      let materialGroup;
      for (const key in materialGroups) {
        materialGroup = materialGroups[key];
        bufferGeometry.addGroup(
          materialGroup.start,
          materialGroup.count,
          materialGroup.index
        );
      }
    }

    const meshes = [];
    let mesh;
    let callbackOnMeshAlter = this.callbacks.onMeshAlter;
    let callbackOnMeshAlterResult;
    let useOrgMesh = true;
    const geometryType = Validator.verifyInput(payload.geometryType, 0);

    if (Validator.isValid(callbackOnMeshAlter)) {
      callbackOnMeshAlterResult = callbackOnMeshAlter({
        detail: {
          meshName,
          bufferGeometry,
          material,
          geometryType
        }
      });

      if (Validator.isValid(callbackOnMeshAlterResult)) {
        if (callbackOnMeshAlterResult.isDisregardMesh()) {
          useOrgMesh = false;
        } else if (callbackOnMeshAlterResult.providesAlteredMeshes()) {
          for (const i in callbackOnMeshAlterResult.meshes) {
            meshes.push(callbackOnMeshAlterResult.meshes[i]);
          }
          useOrgMesh = false;
        }
      }
    }
    if (useOrgMesh) {
      if (payload.computeBoundingSphere) {
        bufferGeometry.computeBoundingSphere();
      }

      if (geometryType === 0) {
        mesh = new THREE.Mesh(bufferGeometry, material);
      } else if (geometryType === 1) {
        mesh = new THREE.LineSegments(bufferGeometry, material);
      } else {
        mesh = new THREE.Points(bufferGeometry, material);
      }
      mesh.name = meshName;
      meshes.push(mesh);
    }

    let progressMessage;
    if (Validator.isValid(meshes) && meshes.length > 0) {
      const meshNames = [];
      for (const i in meshes) {
        mesh = meshes[i];
        meshNames[i] = mesh.name;
      }
      progressMessage =
        'Adding mesh(es) (' +
        meshNames.length +
        ': ' +
        meshNames +
        ') from input mesh: ' +
        meshName;
      progressMessage +=
        ' (' + (payload.progress.numericalValue * 100).toFixed(2) + '%)';
    } else {
      progressMessage = 'Not adding mesh: ' + meshName;
      progressMessage +=
        ' (' + (payload.progress.numericalValue * 100).toFixed(2) + '%)';
    }

    const callbackOnProgress = this.callbacks.onProgress;
    if (Validator.isValid(callbackOnProgress)) {
      var event = new CustomEvent('MeshBuilderEvent', {
        detail: {
          type: 'progress',
          modelName: payload.params.meshName,
          text: progressMessage,
          numericalValue: payload.progress.numericalValue
        }
      });
      callbackOnProgress(event);
    }

    return meshes;
  }

  updateMaterials(materialPayload) {
    let material, materialName;
    const materialCloneInstructions =
      materialPayload.materials.materialCloneInstructions;
    if (Validator.isValid(materialCloneInstructions)) {
      const materialNameOrg = materialCloneInstructions.materialNameOrg;
      const materialOrg = this.materials[materialNameOrg];
      if (Validator.isValid(materialNameOrg)) {
        material = materialOrg.clone();
        materialName = materialCloneInstructions.materialName;
        material.name = materialName;

        const materialProperties = materialCloneInstructions.materialProperties;
        for (const key in materialProperties) {
          if (
            material.hasOwnProperty(key) &&
            materialProperties.hasOwnProperty(key)
          ) {
            material[key] = materialProperties[key];
          }
        }
        this.materials[materialName] = material;
      } else {
        console.warn(
          'Requested material "' + materialNameOrg + '" is not available!'
        );
      }
    }

    let materials = materialPayload.materials.serializedMaterials;

    if (Validator.isValid(materials) && Object.keys(materials).length > 0) {
      const loader = new THREE.MaterialLoader();
      let materialJson;
      for (const materialName in materials) {
        materialJson = materials[materialName];
        if (Validator.isValid(materialJson)) {
          material = loader.parse(materialJson);
          this.materials[materialName] = material;
        }
      }
    }

    materials = materialPayload.materials.runtimeMaterials;
    if (Validator.isValid(materials) && Object.keys(materials).length > 0) {
      for (const materialName in materials) {
        material = materials[materialName];
        this.materials[materialName] = material;
      }
    }
  }

  getMaterialsJSON() {
    const materialsJSON = {};
    let material;
    for (const materialName in this.materials) {
      material = this.materials[materialName];
      materialsJSON[materialName] = material.toJSON();
    }

    return materialsJSON;
  }

  getMaterials() {
    return this.materials;
  }

  setCallbacks(callbacks) {
    if (Validator.isValid(callbacks.onProgress))
      this.callbacks.setCallbackOnProgress(callbacks.onProgress);
    if (Validator.isValid(callbacks.onReportError))
      this.callbacks.setCallbackOnReportError(callbacks.onReportError);
    if (Validator.isValid(callbacks.onMeshAlter))
      this.callbacks.setCallbackOnMeshAlter(callbacks.onMeshAlter);
    if (Validator.isValid(callbacks.onLoad))
      this.callbacks.setCallbackOnLoad(callbacks.onLoad);
    if (Validator.isValid(callbacks.onLoadMaterials))
      this.callbacks.setCallbackOnLoadMaterials(callbacks.onLoadMaterials);
  }
}
export class WorkerSupport {
  loaderWorker = new LoaderWorker();
  constructor() {}
  setForceWorkerDataCopy(forceWorkderDataCopy) {
    this.loaderWorker.setForceCopy(forceWorkderDataCopy);
  }
  setCallbacks(meshBuilder, onLoad) {
    this.loaderWorker.setCallbacks(meshBuilder, onload);
  }
  setTerminateRequested(terminateRequested) {
    this.loaderWorker.setTerminateRequest(terminateRequested);
  }
  validate(
    functionCodeBuilder,
    parserName,
    libLocations?,
    libPath?,
    runnerImpl?
  ) {
    if (Validator.isValid(this.loaderWorker.worker)) return;

    if (!Validator.isValid(runnerImpl)) {
      runnerImpl = WorkerRunnerRefImpl;
    }
    // else if (typeof window !== undefined) {
    //   runnerImpl = WorkerRunnerRefImpl;
    // } else {
    //   // runnerImpl = NodeWorkerRunnerRefImpl;
    // }

    let userWorkerCode = functionCodeBuilder(CodeSerializer);

    userWorkerCode += 'var Parser = ' + parserName + ';\n\n';
    userWorkerCode += CodeSerializer.serializeClass(
      runnerImpl.runnerName,
      runnerImpl
    );
    userWorkerCode += 'new ' + runnerImpl.runnerName + '();\n\n';

    if (Validator.isValid(libLocations) && libLocations.length > 0) {
      let libsContent = '';

      const loadAllLibraries = (path, locations) => {
        if (locations.length === 0) {
          this.loaderWorker.initWorker(
            libsContent + userWorkerCode,
            runnerImpl.runnerName
          );
        } else {
          const loadedLib = contentAsString => {
            libsContent += contentAsString;
            loadAllLibraries(path, locations);
          };

          const fileLoader = new THREE.FileLoader();
          fileLoader.setPath(path);
          fileLoader.setResponseType('text');
          fileLoader.load(locations[0], loadedLib);
          locations.shift();
        }
      };

      loadAllLibraries(libPath, libLocations);
    } else {
      this.loaderWorker.initWorker(userWorkerCode, runnerImpl.runnerName);
    }
  }
  run(payload) {
    this.loaderWorker.run(payload);
  }
}
class CodeSerializer {
  static serializeObject(fullName, object) {
    let objectString = fullName + ' = {\n\n';
    let part;

    for (const name in object) {
      part = object[name];
      if (typeof part === 'string' || part instanceof String) {
        part = part.replace('\n', '\\n');
        part = part.replace('\r', '\\r');
        objectString += '\t' + name + ': "' + part + '",\n';
      } else if (part instanceof Array) {
        objectString += '\t' + name + ': [' + part + '],\n';
      } else if (typeof part === 'object') {
        objectString += '\t' + name + ': {},\n';
      } else {
        objectString += '\t' + name + ': ' + part + ',\n';
      }
    }
    objectString += '}\n\n';

    return objectString;
  }
  static serializeClass(
    fullName,
    object,
    constructorName?,
    basePrototypeName?,
    ignoreFunctions?,
    includeFunctions?,
    overrideFunctions?
  ) {
    let valueString, objectPart, constructorString, funcOverride;
    let prototypeFunctions = [];
    let objectProperties = [];
    let objectFunctions = [];

    const isExtended =
      basePrototypeName !== null && basePrototypeName !== undefined;

    if (!Array.isArray(ignoreFunctions)) ignoreFunctions = [];
    if (!Array.isArray(includeFunctions)) includeFunctions = [];
    if (!Array.isArray(overrideFunctions)) overrideFunctions = [];

    for (const name in object.prototype) {
      objectPart = object.prototype[name];
      valueString = objectPart.toString();
      if (name === 'constructor') {
        constructorString = fullName + ' = ' + valueString + ';\n\n';
      } else if (typeof objectPart === 'function') {
        if (
          (ignoreFunctions.indexOf(name) < 0 && includeFunctions === null) ||
          includeFunctions.indexOf(name) >= 0
        ) {
          funcOverride = overrideFunctions[name];
          if (
            funcOverride &&
            funcOverride.fullName === fullName + '.prototype.' + name
          ) {
            valueString = funcOverride.code;
          }

          if (isExtended) {
            prototypeFunctions.push(
              fullName + '.prototype.' + name + ' = ' + valueString + ';\n\n'
            );
          } else {
            prototypeFunctions.push('\t' + name + ': ' + valueString + ',\n\n');
          }
        }
      }
    }

    for (const name in object) {
      objectPart = object[name];
      if (typeof objectPart === 'function') {
        if (
          ignoreFunctions.indexOf(name) < 0 &&
          (includeFunctions === null || includeFunctions.indexOf(name) >= 0)
        ) {
          funcOverride = overrideFunctions[name];
          if (funcOverride && funcOverride.fullName === fullName + '.' + name) {
            valueString = funcOverride.code;
          } else {
            valueString = objectPart.toString();
          }
          objectFunctions.push(
            fullName + '.' + name + ' = ' + valueString + ';\n\n'
          );
        }
      } else {
        if (typeof objectPart === 'string' || objectPart instanceof String) {
          valueString = '"' + objectPart.toString() + '"';
        } else if (typeof objectPart === 'object') {
          // TODO: Short-cut for now. Recursion required?
          valueString = '{}';
        } else {
          valueString = objectPart;
        }
        objectProperties.push(
          fullName + '.' + name + ' = ' + valueString + ';\n'
        );
      }
    }

    if (
      (constructorString === undefined || constructorString === null) &&
      typeof object.prototype.constructor === 'function'
    ) {
      constructorString =
        fullName +
        ' = ' +
        object.prototype.constructor.toString().replace(constructorName, '');
    }

    let objectString = constructorString + '\n\n';
    if (isExtended) {
      objectString +=
        fullName +
        '.prototype = Object.create( ' +
        basePrototypeName +
        '.prototype );\n';
    }

    objectString += fullName + '.prototype.constructor = ' + fullName + ';\n';
    objectString + '\n\n';

    for (let i = 0; i < objectProperties.length; i++) {
      objectString += objectProperties[i];
    }
    objectString += '\n\n';
    for (let i = 0; i < objectFunctions.length; i++) {
      objectString += objectFunctions[i];
    }
    objectString += '\n\n';

    if (isExtended) {
      for (let i = 0; i < prototypeFunctions.length; i++) {
        objectString += prototypeFunctions[i];
      }
    } else {
      objectString += fullName + '.prototype = {\n\n';
      for (let i = 0; i < prototypeFunctions.length; i++) {
        objectString += prototypeFunctions[i];
      }
      objectString += '\n\n';
    }

    return objectString;
  }
}
class WorkerRunnerRefImpl {
  runnerName = 'THREE.LoaderSupport.WorkerRunnerRefImpl';
  scopedRunner = evt => {
    this.processMessage(evt.data);
  };
  constructor() {
    this.getParentScope().addEventListener(
      'message',
      this.scopedRunner.bind(this)
    );
  }

  getParentScope() {
    return self;
  }

  applyProperties(parser, params) {
    let property, funcName, values;

    for (const property in params) {
      funcName = `set${property
        .substring(0, 1)
        .toLocaleUpperCase()}${property.substring(1)}`;

      values = params[property];

      if (typeof parser[funcName] === 'function') {
        parser[funcName](values);
      } else if (parser.hasOwnProperty(property)) {
        parser[property] = values;
      }
    }
  }
  processMessage(payload) {
    if (payload.cmd === 'run') {
      const selt = this.getParentScope();

      const callbacks = {
        callbackMeshBuilder: function(payload) {
          self.postMessage(payload, null);
        }
      };

      // const parser = new Parser();
    }
  }
}

export class LoaderWorker {
  worker;
  runnerImpName;
  forceCopy: boolean;
  callbacks = {
    meshBuilder: null,
    onLoad: null
  };
  queuedMessage: any;
  started: boolean;
  terminateRequested: boolean;
  constructor() {}

  checkSupport() {
    if (Worker === undefined) {
      return 'This browser does not support web workers!';
    }
    if (Blob === undefined) {
      return 'This browser does not support Blob!';
    }
    if (typeof URL.createObjectURL !== 'function') {
      return 'This browser does not support Object creation from URL!';
    }
  }

  setForceCopy(forceCopy) {
    this.forceCopy = forceCopy === true;
  }

  initWorker(code, runnerImpName) {
    const supportError = this.checkSupport();
    if (supportError) {
      throw supportError;
    }

    this.runnerImpName = runnerImpName;
    const blob = new Blob([code], { type: 'application/javascript' });
    this.worker = new Worker(window.URL.createObjectURL(blob));

    this.worker.onmessage = this.receiveWorkerMessage.bind(this);
    this.worker.runtimeRef = this;

    this.postMessage();
  }
  run(payload) {
    if (Validator.isValid(this.queuedMessage)) {
      console.warn('Already processing message. Rejecting new run instruction');
      return;
    } else {
      this.queuedMessage = payload;
      this.started = true;
    }

    if (!Validator.isValid(this.callbacks.meshBuilder)) {
      throw 'Unable to run as no "MeshBuilder" callback is set.';
    }
    if (!Validator.isValid(this.callbacks.onLoad)) {
      throw 'Unable to run as no "onLoad" callback is set.';
    }

    if (payload.cmd !== 'run') {
      payload.cmd = 'run';
    }

    this.postMessage();
  }

  private receiveWorkerMessage(e) {
    const payload = e.data;
    switch (payload.cmd) {
      case 'meshData':
      case 'materialData':
      case 'imageData':
        this.callbacks.meshBuilder(payload);
        break;
      case 'complete':
        this.queuedMessage = null;
        this.started = false;
        this.callbacks.onLoad(payload.msg);
        if (this.terminateRequested) {
          this.terminate();
        }
      case 'ease':
        this.queuedMessage = null;
        this.started = false;
        this.callbacks.onLoad(payload.msg);
        if (this.terminateRequested) {
          this.terminate();
        }
      default:
        console.error(
          'WorkerSupport [' +
            this.runnerImpName +
            ']: Received unknown command: ' +
            payload.cmd
        );
        break;
    }
  }
  setCallbacks(meshBuilder, onload) {
    this.callbacks.meshBuilder = Validator.verifyInput(
      meshBuilder,
      this.callbacks.meshBuilder
    );
    this.callbacks.onLoad = Validator.verifyInput(
      onload,
      this.callbacks.onLoad
    );
  }
  setTerminateRequest(terminateRequested) {
    this.terminateRequested = terminateRequested === true;
    if (
      this.terminateRequested &&
      Validator.isValid(this.worker) &&
      !Validator.isValid(this.queuedMessage) &&
      this.started
    ) {
      this.terminate();
    }
  }
  private terminate() {
    this.worker.terminate();
    this.reset();
  }
  private reset() {
    this.worker = null;
    this.runnerImpName = null;
    this.callbacks = {
      meshBuilder: null,
      onLoad: null
    };
    this.terminateRequested = false;
    this.queuedMessage = null;
    this.started = false;
    this.forceCopy = false;
  }

  private postMessage() {
    if (
      Validator.isValid(this.queuedMessage) &&
      Validator.isValid(this.worker)
    ) {
      if (this.queuedMessage.data.input instanceof ArrayBuffer) {
        let content;
        if (this.forceCopy) {
          content = this.queuedMessage.data.input.slice(0);
        } else {
          content = this.queuedMessage.data.input;
        }
        this.worker.postMessage(this.queuedMessage, [content]);
      } else {
        this.worker.postMessage(this.queuedMessage);
      }
    }
  }
}
export class ResourceDescriptor {
  urlParts;

  path;
  resourcePath;
  name;
  url;
  extension;
  content;

  constructor(url, extension) {
    this.urlParts = url.split('/');
    this.name = url;
    this.url = url;

    if (this.urlParts.length >= 2) {
      this.path = Validator.verifyInput(
        this.urlParts.slice(0, this.urlParts.length - 1).join('/') + '/',
        this.path
      );
    }

    this.name = Validator.verifyInput(this.name, 'Unnamed_Resource');
    this.extension = Validator.verifyInput(extension, 'default');
    this.extension = this.extension.trim();
    this.content = null;
  }

  setContent(content) {
    this.content = Validator.verifyInput(content, null);
  }
  setResourcePath(resourcePath) {
    this.resourcePath = Validator.verifyInput(resourcePath, this.resourcePath);
  }
}
export class Callbacks {
  onProgress = null;
  onReportError = null;
  onMeshAlter = null;
  onLoad = null;
  onLoadMaterials = null;

  setCallbackOnProgress(callbackOnProgress) {
    this.onProgress = Validator.verifyInput(
      callbackOnProgress,
      this.onProgress
    );
  }

  setCallbackOnReportError(callbackOnReportError) {
    this.onReportError = Validator.verifyInput(
      callbackOnReportError,
      this.onReportError
    );
  }

  setCallbackOnMeshAlter(callbackOnMeshAlter) {
    this.onMeshAlter = Validator.verifyInput(
      callbackOnMeshAlter,
      this.onMeshAlter
    );
  }

  setCallbackOnLoad(callbackOnLoad) {
    this.onLoad = Validator.verifyInput(callbackOnLoad, this.onLoad);
  }

  setCallbackOnLoadMaterials(callbackOnLoadMaterials) {
    this.onLoadMaterials = Validator.verifyInput(
      callbackOnLoadMaterials,
      this.onLoadMaterials
    );
  }
}

export class LoadedMeshUserOverride {
  disregardMesh;
  alteredMesh;
  meshes = [];

  constructor(disregardMesh, alteredMesh) {
    this.disregardMesh = disregardMesh === true;
    this.alteredMesh = alteredMesh === true;
  }

  addMesh(mesh) {
    this.meshes.push(mesh);
    this.alteredMesh = true;
  }

  isDisregardMesh() {
    return this.disregardMesh;
  }

  providesAlteredMeshes() {
    return this.alteredMesh;
  }
}

export class PrepData {
  modelName;
  resources = [];
  callbacks = new Callbacks();

  constructor(modelName) {
    this.modelName = Validator.verifyInput(modelName, '');
  }

  getCallbacks() {
    return this.callbacks;
  }

  addResource(resource) {
    this.resources.push(resource);
  }

  clone() {
    const clone = new PrepData(this.modelName);
    clone.resources = this.resources;
    clone.callbacks = this.callbacks;

    let property, value;

    for (property in this) {
      value = this[property];

      if (
        !clone.hasOwnProperty(property) &&
        typeof this[property] !== 'function'
      ) {
        clone[property] = value;
      }
    }

    return clone;
  }

  checkResourceDescriptprFiles(resources, fileDesc) {
    let resource, triple, found;
    const result: any = {};

    for (const index in resources) {
      resource = resources[index];
      found = false;

      if (!Validator.isValid(resource.name)) continue;
      if (Validator.isValid(resource.content)) {
        for (let i = 0; i < fileDesc && !found.length; i++) {
          triple = fileDesc[i];

          if (resource.extension.toLowerCase() === triple.ext.toLowerCase()) {
            if (triple.ignore) {
              found = true;
            } else if (triple.type === 'ArrayBuffer') {
              if (
                !(
                  resource.content instanceof ArrayBuffer ||
                  resource.content instanceof Uint8Array
                )
              ) {
                throw 'Provided content is not of type ArrayBuffer! Aborting...';
              }
              result[triple.ext] = resource;
              found = true;
            } else if (triple.type === 'string') {
              if (
                !(
                  typeof resource.content === 'string' ||
                  resource.content instanceof String
                )
              ) {
                throw 'Provided  content is not of type String! Aborting...';
              }
              result[triple.ext] = resource;
              found = true;
            }
          }
        }
        if (!found) {
          throw 'Unidentified resource "' +
            resource.name +
            '": ' +
            resource.url;
        }
      } else {
        if (
          !(
            typeof resource.name === 'string' || resource.name instanceof String
          )
        ) {
          throw 'Provided file is not properly defined! Aborting...';
        }

        for (let i = 0; i < fileDesc.length && !found; i++) {
          triple = fileDesc[i];

          if (resource.extension.toLowerCase() === triple.ext.toLowerCase()) {
            if (!triple.ignore) result[triple.ext] = resource;
            found = true;
          }
        }

        if (!found) {
          throw 'Unidentified resource "' +
            resource.name +
            '": ' +
            resource.url;
        }
      }
      return result;
    }
  }
}
