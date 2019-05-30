import * as THREE from 'three';
import {
  Validator,
  MeshBuilder,
  Callbacks,
  WorkerSupport,
  ResourceDescriptor
} from './LoaderSupport';
import MTLLoader from './MTLLoader';
export class OBJLoader2 {
  manager;
  modelName = '';
  instanceNo = 0;
  path;
  resourcePath;
  useIndices = false;
  disregardNormals = false;
  materialPerSmoothingGroup = false;
  useOAsMesh = false;
  loaderRootNode = new THREE.Group();
  meshBuilder = new MeshBuilder();
  callbacks = new Callbacks();
  workerSupport = new WorkerSupport();
  terminateWorkerOnLoad = true;
  constructor(manager?) {
    this.manager = Validator.verifyInput(manager, THREE.DefaultLoadingManager);
  }

  setModelName(modelName) {
    this.modelName = Validator.verifyInput(modelName, this.modelName);
  }

  setPath(path) {
    this.path = Validator.verifyInput(path, this.path);
  }

  setResourcePath(resourcePath) {
    this.resourcePath = Validator.verifyInput(resourcePath, this.resourcePath);
  }

  /**
   * Set the node where the loaded objects will be attached directly
   */

  setStreamMeshesTo(streamMeshesTo) {
    this.loaderRootNode = Validator.verifyInput(
      streamMeshesTo,
      this.loaderRootNode
    );
  }

  /**
   * Set materials loaded by MTLLoader or any other supplier of an Array of THREE.Material
   * @param materials Array of THREE.Material
   */
  setMaterials(materials: THREE.Material[]) {
    this.meshBuilder.setMaterials(materials);
  }

  setUserIndices(userIndeices) {
    this.useIndices = userIndeices === true;
  }
  setDisregardNormals(disregardNormals) {
    this.disregardNormals = Validator.verifyInput(
      disregardNormals,
      this.disregardNormals
    );
  }

  setMaterialPerSmoothingGroup(materialPerSmoothingGroup) {
    this.materialPerSmoothingGroup = materialPerSmoothingGroup === true;
  }

  setUseOAsMesh(useOAsMesh) {
    this.useOAsMesh = useOAsMesh === true;
  }

  setCallbacks(callbacks) {
    if (Validator.isValid(callbacks.onProgress)) {
      this.callbacks.setCallbackOnProgress(callbacks.onProgress);
    }
    if (Validator.isValid(callbacks.onReportError))
      this.callbacks.setCallbackOnReportError(callbacks.onReportError);
    if (Validator.isValid(callbacks.onMeshAlter))
      this.callbacks.setCallbackOnMeshAlter(callbacks.onMeshAlter);
    if (Validator.isValid(callbacks.onLoad))
      this.callbacks.setCallbackOnLoad(callbacks.onLoad);
    if (Validator.isValid(callbacks.onLoadMaterials))
      this.callbacks.setCallbackOnLoadMaterials(callbacks.onLoadMaterials);

    this.meshBuilder.setCallbacks(this.callbacks);
  }

  onProgress(type, text, numericalValue) {
    const content = Validator.isValid(text) ? text : '';
    const event = {
      detail: {
        type,
        modelName: this.modelName,
        instanceNo: this.instanceNo,
        text: content,
        numericalValue
      }
    };

    if (Validator.isValid(this.callbacks.onProgress)) {
      this.callbacks.onProgress(event);
    }
  }

  onError(event) {
    var output = 'Error occurred while downloading!';

    if (event.currentTarget && event.currentTarget.statusText !== null) {
      output +=
        '\nurl: ' +
        event.currentTarget.responseURL +
        '\nstatus: ' +
        event.currentTarget.statusText;
    }
    this.onProgress('error', output, -1);
    this.throwError(output);
  }
  throwError(errorMessage) {
    if (Validator.isValid(this.callbacks.onReportError)) {
      this.callbacks.onReportError(errorMessage);
    } else {
      throw errorMessage;
    }
  }

  load(url, onLoad, onProgress, onError, onMeshAlter, useAsync) {
    const resource = new ResourceDescriptor(url, 'OBJ');
    this.loadObj(resource, onLoad, onProgress, onError, onMeshAlter, useAsync);
  }
  private loadObj(
    resource: ResourceDescriptor,
    onLoad,
    onProgress,
    onError,
    onMeshAlter,
    useAsync
  ) {
    if (!Validator.isValid(onError)) {
      onError = evt => this.onError(evt);
    }

    if (!Validator.isValid(resource)) {
      onError(
        'An invalid ResourceDescriptor was provided. Unable to continue!'
      );
    }

    const fileLoaderOnLoad = content => {
      resource.content = content;

      if (useAsync) {
        this.parseAsync(content, onLoad);
      } else {
        const callbacks = new Callbacks();
        callbacks.setCallbackOnMeshAlter(onMeshAlter);
        this.setCallbacks(callbacks);
        onLoad({
          detail: {
            loaderRootNode: this.parse(content),
            modelName: this.modelName,
            instanceNo: this.instanceNo
          }
        });
      }
    };
  }
  parse(content) {
    if (!Validator.isValid(content)) {
      console.warn('Provided content is not a valid ArrayBuffer or String.');
      return this.loaderRootNode;
    }

    this.meshBuilder.init();
    const parser = new Parser();

    //TODO
    // parser.setMaterial;
  }

  run(prepData, workerSupportExternal) {
    this.applyPrepData(prepData);
    const avaliable = prepData.checkResourceDescriptorFiles(
      prepData.resources,
      [
        { ext: 'obj', type: 'ArrayBuffer', ignore: false },
        { ext: 'mtl', type: 'String', ignore: false },
        { ext: 'zip', type: 'String', ignore: true }
      ]
    );

    if (Validator.isValid(workerSupportExternal)) {
      this.terminateWorkerOnLoad = false;
      this.workerSupport = workerSupportExternal;
    }
    const onMaterialsLoaded = materials => {
      if (materials !== null) this.meshBuilder.setMaterials(materials);

      this.loadObj(
        avaliable.obj,
        this.callbacks.onLoad,
        null,
        null,
        this.callbacks.onMeshAlter,
        prepData.useAsync
      );
    };

    this._loadMtl(
      avaliable.mtl,
      onMaterialsLoaded,
      null,
      null,
      prepData.crossOrigin,
      prepData.materialOptions
    );
  }
  _loadMtl(
    resource,
    onLoad,
    onProgress,
    onError,
    crossOrigin,
    materialOptions
  ) {
    const materials = [];
    const processMaterials = (materialCreator?) => {
      let materialCreatorMaterials = [];
      if (Validator.isValid(materialCreator)) {
        materialCreator.preload();
        materialCreatorMaterials = materialCreator.materials;
        for (const materialName in materialCreatorMaterials) {
          if (materialCreatorMaterials.hasOwnProperty(materialName)) {
            materials[materialName] = materialCreatorMaterials[materialName];
          }
        }
      }

      onLoad(materials, materialCreator);
    };

    if (
      !Validator.isValid(resource) ||
      (!Validator.isValid(resource.content) && !Validator.isValid(resource.url))
    ) {
      processMaterials();
    } else {
      const mtlloader = new MTLLoader(this.manager);

      crossOrigin = Validator.verifyInput(crossOrigin, 'anonymous');
      mtlloader.setCrossOrigin(crossOrigin);
      mtlloader.setResourcePath(resource.resourcePath || resource.path);
      if (Validator.isValid(materialOptions)) {
        mtlloader.setMaterialOptions(materialOptions);
      }

      const parseTextWithMtlLoader = content => {
        let contentAsText = content;

        if (typeof content !== 'string' && !(content instanceof String)) {
          if (content.length > 0 || content.byteLength > 0) {
            contentAsText = THREE.LoaderUtils.decodeText(content);
          } else {
            this.throwError(
              'Unable to parse mtl as it it seems to be neither a String, an Array or an ArrayBuffer!'
            );
          }
        }
        processMaterials(mtlloader.parse(contentAsText));
      };

      if (Validator.isValid(resource.content)) {
        parseTextWithMtlLoader(resource.content);
      } else if (Validator.isValid(resource.url)) {
        const fileLoader = new THREE.FileLoader(this.manager);
        if (!Validator.isValid(onError)) {
          onError = evt => {
            this.onError(evt);
          };
        }
        if (!Validator.isValid(onProgress)) {
          let numericalValueRef = 0;
          let numericalValue = 0;

          onProgress = evt => {
            if (!evt.lengthComputable) return;

            numericalValue = evt.loaded / evt.total;
            if (numericalValue > numericalValueRef) {
              numericalValueRef = numericalValue;
              const output =
                'Download of  "' +
                resource.url +
                '": ' +
                (numericalValue * 100).toFixed(2) +
                '%';

              this.onProgress('progressLoad', output, numericalValue);
            }
          };
        }

        fileLoader.load(
          resource.url,
          parseTextWithMtlLoader,
          onprogress,
          onError
        );
      }
    }
  }

  applyPrepData(prepData) {
    if (Validator.isValid(prepData)) {
      this.setModelName(prepData.modelName);
      this.setStreamMeshesTo(prepData.streamMeshesTo);
      this.meshBuilder.setMaterials(prepData.material);
      this.setUserIndices(prepData.useIndices);
      this.setDisregardNormals(prepData.disregardNormals);
      this.setMaterialPerSmoothingGroup(prepData.materialPerSmoothingGroup);
      this.setUseOAsMesh(prepData.useOAsMesh);
      this.setCallbacks(prepData.getCallbacks());
    }
  }
  parseAsync(content, onLoad) {
    let measureTime = false;
    const scopedOnLoad = () => {
      onLoad({
        detail: {
          loaderRootNode: this.loaderRootNode,
          modelName: this.modelName,
          instanceNo: this.instanceNo
        }
      });
    };

    if (!Validator.isValid(content)) {
      console.warn('Provided content is not a valid ArrayBuffer.');
      scopedOnLoad();
    } else {
      measureTime = true;
    }

    this.meshBuilder.init();

    const scopedOnMeshLoaded = payload => {
      const meshes = this.meshBuilder.processPayload(payload);
      let mesh;
      for (const i in meshes) {
        mesh = meshes[i];
        this.loaderRootNode.add(mesh);
      }
    };

    const buildCode = codeSerializer => {
      let workerCode = '';
      workerCode += '/**\n';
      workerCode += '  * This code was constructed by OBJLoader2 buildCode.\n';
      workerCode += '  */\n\n';
      workerCode += 'THREE = { LoaderSupport: {}, OBJLoader2: {} };\n\n';
      workerCode += codeSerializer.serializeObject(
        'THREE.LoaderSupport.Validator',
        Validator
      );
      workerCode += codeSerializer.serializeClass(
        'THREE.OBJLoader2.Parser',
        Parser
      );

      return workerCode;
    };
  }
}
export class Parser {
  callbackProgress = null;
  callbackMeshBuilder = null;
  contentRef = null;
  legacyMode = false;

  materials = {};
  useAsync = false;
  materialPerSmoothingGroup = false;
  useOAsMesh = false;
  useIndices = false;
  disregardNormals = false;

  vertices = [];
  colors = [];
  normals = [];
  uvs = [];
  rawMesh = {
    objectName: '',
    groupName: '',
    activeMtlName: '',
    mtllibName: '',

    // reset with new mesh
    faceType: -1,
    subGroups: [],
    subGroupInUse: null,
    smoothingGroup: {
      splitMaterials: false,
      normalized: -1,
      real: -1
    },
    counts: {
      doubleIndicesCount: 0,
      faceCount: 0,
      mtlCount: 0,
      smoothingGroupCount: 0
    }
  };

  inputObjectCount = 1;
  outputObjectCount = 1;
  globalCounts = {
    vertices: 0,
    faces: 0,
    doubleIndicesCount: 0,
    lineByte: 0,
    currentByte: 0,
    totalBytes: 0
  };

  resetRawMesh() {
    // faces are stored according combined index of group, material and smoothingGroup (0 or not)
    this.rawMesh.subGroups = [];
    this.rawMesh.subGroupInUse = null;
    this.rawMesh.smoothingGroup.normalized = -1;
    this.rawMesh.smoothingGroup.real = -1;

    // this default index is required as it is possible to define faces without 'g' or 'usemtl'
    this.pushSmoothingGroup(1);

    this.rawMesh.counts.doubleIndicesCount = 0;
    this.rawMesh.counts.faceCount = 0;
    this.rawMesh.counts.mtlCount = 0;
    this.rawMesh.counts.smoothingGroupCount = 0;
  }

  setUseAsync(useAsync) {
    this.useAsync = useAsync;
  }
  setMaterialPerSmoothingGroup(materialPerSmoothingGroup) {
    this.materialPerSmoothingGroup = materialPerSmoothingGroup;
  }

  setUseOAsMesh(useOAsMesh) {
    this.useOAsMesh = useOAsMesh;
  }

  setUseIndices(useIndices) {
    this.useIndices = useIndices;
  }

  setDisregardNormals(disregardNormals) {
    this.disregardNormals = disregardNormals;
  }
  setMaterials(materials) {
    this.materials = Validator.verifyInput(materials, this.materials);
    this.materials = Validator.verifyInput(this.materials, {});
  }
  setCallbackMeshBuilder(callbackMeshBuilder) {
    if (!Validator.isValid(callbackMeshBuilder)) {
      this.throwError('Unable to run as no "MeshBuilder" callback is set.');
    }
    this.callbackMeshBuilder = callbackMeshBuilder;
  }
  setCallbackProgress(callbackProgress) {
    this.callbackProgress = callbackProgress;
  }

  pushSmoothingGroup(smoothingGroup) {
    let smoothingGroupInt = parseInt(smoothingGroup);
    if (isNaN(smoothingGroupInt)) {
      smoothingGroupInt = smoothingGroup === 'off' ? 0 : 1;
    }

    const smoothCheck = this.rawMesh.smoothingGroup.normalized;
    this.rawMesh.smoothingGroup.normalized = this.rawMesh.smoothingGroup
      .splitMaterials
      ? smoothingGroupInt
      : smoothingGroupInt === 0
      ? 0
      : 1;

    this.rawMesh.smoothingGroup.real = smoothingGroupInt;
    if (smoothCheck !== smoothingGroupInt) {
      this.rawMesh.counts.smoothingGroupCount++;
      this.checkSubGroup();
    }
  }

  /**
   * Expanded faceTypes include all four face types,
   * bothline types and the point type
   * faceType = 0: 'f vertex ...'
   * faceType = 1: 'f vertex/uv ...'
   * faceType = 2: 'f vertex/uv/normal ...'
   * faceType = 3: 'f vertex//normal ...'
   * faceType = 4: 'l vertex/uv ...' or 'l vertex ...'
   * faceType = 5: 'l vertex ...'
   * faceType = 6: 'p vertex ...'
   */
  checkFaceType(faceType) {
    if (this.rawMesh.faceType !== faceType) {
      this.processCompletedMesh();
      this.rawMesh.faceType = faceType;
      this.checkSubGroup();
    }
  }
  processCompletedMesh() {
    const result = this.finalizeRawMesh();
    if (Validator.isValid(result)) {
      if (
        this.colors.length > 0 &&
        this.colors.length !== this.vertices.length
      ) {
        this.throwError(
          'Vertex colors were detected, but vertex count and color count do not match!'
        );
      }
      this.inputObjectCount++;

      this.buildMesh(result);

      const progressBytesPercent =
        this.globalCounts.currentByte / this.globalCounts.totalBytes;
      this.callbackProgress(
        'Completed [o: ' +
          this.rawMesh.objectName +
          ' g:' +
          this.rawMesh.groupName +
          '] Total progress: ' +
          (progressBytesPercent * 100).toFixed(2) +
          '%',
        progressBytesPercent
      );

      this.resetRawMesh();
      return true;
    } else {
      return false;
    }
  }
  buildMesh(result) {
    const meshOutputGroups = result.subGroups;

    const vertexFA = new Float32Array(result.absoluteVertextCount);
    this.globalCounts.vertices += result.absoluteVertextCount / 3;
    this.globalCounts.faces += result.faceCount;
    this.globalCounts.doubleIndicesCount += result.doubleIndicesCount;

    const indexUA =
      result.absoluteIndexCount > 0
        ? new Uint32Array(result.absoluteIndexCount)
        : null;

    const colorFA =
      result.absoluteColorCount > 0
        ? new Float32Array(result.absoluteColorCount)
        : null;

    const normalFA =
      result.absoluteNormalCount > 0
        ? new Float32Array(result.absoluteNormalCount)
        : null;

    const uvFA =
      result.absoluteUvCount > 0
        ? new Float32Array(result.absoluteUvCount)
        : null;

    const haveVertexColors = Validator.isValid(colorFA);

    let meshOutputGroup;
    const materialNames = [];

    const createMultiMaterial = meshOutputGroups.length > 1;
    let materialIndex = 0;
    let materialIndexMapping = [];
    let selectedMaterialIndex;
    let materialGroup;
    let materialGroups = [];

    let vertextFAOffset = 0;
    let indexUAOffset = 0;
    let colorFAOffset = 0;
    let noramlFAOffset = 0;
    let uvFAOffset = 0;
    let materialGroupOffset = 0;
    let materialGroupLength = 0;

    let materialOrg, material, materialName, materialNameOrg;

    for (const oodIndex in meshOutputGroups) {
      if (!meshOutputGroup.hasOwnProperty(oodIndex)) continue;

      meshOutputGroup = meshOutputGroups[oodIndex];
      materialNameOrg = meshOutputGroup.materialName;

      if (this.rawMesh.faceType < 4) {
        materialName =
          materialNameOrg +
          (haveVertexColors ? '_vertexColor' : '') +
          (meshOutputGroup.smoothingGroup === 0 ? '_flat' : '');
      } else {
        materialName =
          this.rawMesh.faceType === 6
            ? 'defaultPointMaterial'
            : 'defaultLineMaterial';
      }

      materialOrg = this.materials[materialNameOrg];
      material = this.materials[materialName];

      if (!Validator.isValid(materialOrg) && !Validator.isValid(material)) {
        const defaultMaterialName = haveVertexColors
          ? 'defaultVertexColorMaterial'
          : 'defaultMaterial';

        materialOrg = this.materials[defaultMaterialName];

        materialNameOrg = defaultMaterialName;
        if (materialNameOrg === materialName) {
          material = materialOrg;
          materialName = defaultMaterialName;
        }
      }
      if (!Validator.isValid(material)) {
        const materialCloneInstructions = {
          materialNameOrg,
          materialName,
          materialProperties: {
            vertexColors: haveVertexColors ? 2 : 0,
            flatShading: meshOutputGroup.smoothingGroup === 0
          }
        };
        const payload = {
          cmd: 'materialData',
          materials: {
            materialCloneInstructions
          }
        };
        this.callbackMeshBuilder(payload);

        if (this.useAsync) {
          this.materials[materialName] = materialCloneInstructions;
        }
      }

      if (createMultiMaterial) {
        selectedMaterialIndex = materialIndexMapping[materialName];
        if (!selectedMaterialIndex) {
          selectedMaterialIndex = materialIndex;
          materialIndexMapping[materialName] = materialIndex;
          materialNames.push(materialName);
          materialIndex++;
        }
        materialGroupLength = this.useIndices
          ? meshOutputGroup.indices.length
          : meshOutputGroup.vertices.length / 3;
        materialGroup = {
          start: materialGroupOffset,
          count: materialGroupLength,
          index: selectedMaterialIndex
        };

        materialGroups.push(materialGroup);
        materialGroupOffset += materialGroupLength;
      } else {
        materialNames.push(materialName);
      }

      vertexFA.set(meshOutputGroup.vertices, vertextFAOffset);
      vertextFAOffset += meshOutputGroup.vertices.length;

      if (indexUA) {
        indexUA.set(meshOutputGroup.indices, indexUAOffset);
        indexUAOffset += meshOutputGroup.indices.length;
      }

      if (colorFA) {
        colorFA.set(meshOutputGroup.colors, colorFAOffset);
        colorFAOffset += meshOutputGroup.colors.length;
      }

      if (normalFA) {
        normalFA.set(meshOutputGroup.normals, noramlFAOffset);
        noramlFAOffset += meshOutputGroup.normals.length;
      }

      if (uvFA) {
        uvFA.set(meshOutputGroup.uvs, uvFAOffset);
        uvFAOffset += meshOutputGroup.uvs.length;
      }
    }

    this.outputObjectCount++;
    this.callbackMeshBuilder(
      {
        cmd: 'meshData',
        progress: {
          numericalValue:
            this.globalCounts.currentByte / this.globalCounts.totalBytes
        },
        params: {
          meshName: result.name
        },
        materials: {
          multiMaterial: createMultiMaterial,
          materialNames,
          materialGroups
        },
        buffers: {
          vertices: vertexFA,
          indices: indexUA,
          colors: colorFA,
          normals: normalFA,
          uvs: uvFA
        },
        geometryType:
          this.rawMesh.faceType < 4 ? 0 : this.rawMesh.faceType === 6 ? 2 : 1
      },
      [vertexFA.buffer],
      Validator.isValid(indexUA) ? [indexUA.buffer] : null,
      Validator.isValid(colorFA) ? [colorFA.buffer] : null,
      Validator.isValid(normalFA) ? [colorFA.buffer] : null,
      Validator.isValid(uvFA) ? [uvFA.buffer] : null
    );
  }
  finalizeRawMesh() {
    const meshOutputGroupTemp = [];
    let meshOutputGroup;
    let absoluteVertextCount = 0;
    let absoluteIndexMappingsCount = 0;
    let absoluteIndexCount = 0;
    let absoluteColorCount = 0;
    let absoluteNormalCount = 0;
    let absoluteUvCount = 0;
    let indices;

    for (const name in this.rawMesh.subGroups) {
      meshOutputGroup = this.rawMesh.subGroups[name];
      if (meshOutputGroup.vertices.length > 0) {
        indices = meshOutputGroup.indices;
        if (indices.length > 0 && absoluteIndexMappingsCount > 0) {
          for (const i in indices) {
            indices[i] = indices[i] + absoluteIndexMappingsCount;
          }
        }
        meshOutputGroupTemp.push(meshOutputGroup);
        absoluteVertextCount += meshOutputGroup.vertices.length;
        absoluteIndexMappingsCount += meshOutputGroup.indexMappingsCount;
        absoluteIndexCount += meshOutputGroup.indices.length;
        absoluteColorCount += meshOutputGroup.colors.length;
        absoluteUvCount += meshOutputGroup.uvs.length;
        absoluteNormalCount += meshOutputGroup.normal.length;
      }
    }

    let result = null;
    if (meshOutputGroupTemp.length > 0) {
      result = {
        name: this.rawMesh.groupName || this.rawMesh.objectName,
        subGroups: meshOutputGroupTemp,
        absoluteVertextCount,
        absoluteIndexCount,
        absoluteColorCount,
        absoluteNormalCount,
        absoluteUvCount,
        faceCount: this.rawMesh.counts.faceCount,
        doubleIndicesCount: this.rawMesh.counts.doubleIndicesCount
      };
    }
    return result;
  }

  private throwError(errorMessage) {
    // TODO callbacks? why is doing so.
    // if(Validator.isValid(this.callbacks))
    throw errorMessage;
  }
  checkSubGroup() {
    const index =
      this.rawMesh.activeMtlName + '|' + this.rawMesh.smoothingGroup.normalized;
    this.rawMesh.subGroupInUse = this.rawMesh.subGroups[index];

    if (!Validator.isValid(this.rawMesh.subGroupInUse)) {
      this.rawMesh.subGroupInUse = {
        index: index,
        objectName: this.rawMesh.objectName,
        groupName: this.rawMesh.groupName,
        materialName: this.rawMesh.activeMtlName,
        smoothingGroup: this.rawMesh.smoothingGroup.normalized,
        vertices: [],
        indexMappingsCount: 0,
        indexMappings: [],
        indices: [],
        colors: [],
        uvs: [],
        normals: []
      };
      this.rawMesh.subGroups[index] = this.rawMesh.subGroupInUse;
    }
  }

  buildFace(faceIndexV, faceIndexU, faceIndexN) {
    if (this.disregardNormals) faceIndexN = undefined;

    if (this.useIndices) {
      const mappingName =
        faceIndexV +
        (faceIndexU ? '_' + faceIndexU : '_n') +
        (faceIndexN ? '_' + faceIndexN : '_n');

      let indeicesPointer = this.rawMesh.subGroupInUse.indexMappings[
        mappingName
      ];

      if (Validator.isValid(indeicesPointer)) {
        this.rawMesh.counts.doubleIndicesCount++;
      } else {
        indeicesPointer = this.rawMesh.subGroupInUse.vertices.length / 3;
        this.updateSubGroupInUse(faceIndexV, faceIndexU, faceIndexN);

        this.rawMesh.subGroupInUse.indexMappings[mappingName] = indeicesPointer;
        this.rawMesh.subGroupInUse.indexMappingsCount++;
      }

      this.rawMesh.subGroupInUse.indices.push(indeicesPointer);
    } else {
      this.updateSubGroupInUse(faceIndexV, faceIndexU, faceIndexN);
    }
    this.rawMesh.counts.faceCount++;
  }

  private updateSubGroupInUse(faceIndexV, faceIndexU, faceIndexN) {
    const faceIndexVi = parseInt(faceIndexV);
    let indexPointerV =
      3 *
      (faceIndexVi > 0
        ? faceIndexVi - 1
        : faceIndexVi + this.vertices.length / 3);
    let indexPointerC = this.colors.length > 0 ? indexPointerV : null;
    const vertices = this.rawMesh.subGroupInUse.vertices;
    vertices.push(this.vertices[indexPointerV++]);
    vertices.push(this.vertices[indexPointerV++]);
    vertices.push(this.vertices[indexPointerV]);
    if (indexPointerC !== null) {
      const colors = this.rawMesh.subGroupInUse.colors;
      colors.push(this.colors[indexPointerC++]);
      colors.push(this.colors[indexPointerC++]);
      colors.push(this.colors[indexPointerC]);
    }
    if (faceIndexU) {
      const faceIndexUi = parseInt(faceIndexU);
      let indexPointerU =
        2 *
        (faceIndexUi > 0 ? faceIndexUi - 1 : faceIndexUi + this.uvs.length / 2);
      const uvs = this.rawMesh.subGroupInUse.uvs;
      uvs.push(this.uvs[indexPointerU++]);
      uvs.push(this.uvs[indexPointerU]);
    }
    if (faceIndexN) {
      const faceIndexNi = parseInt(faceIndexN);
      let indexPointerN =
        3 *
        (faceIndexNi > 0
          ? faceIndexNi - 1
          : faceIndexNi + this.normals.length / 3);
      const normals = this.rawMesh.subGroupInUse.normals;
      normals.push(this.normals[indexPointerN++]);
      normals.push(this.normals[indexPointerN++]);
      normals.push(this.normals[indexPointerN]);
    }
  }
}
