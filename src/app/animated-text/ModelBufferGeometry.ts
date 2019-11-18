import * as THREE from 'three';

export default class ModelBufferGeometry extends THREE.BufferGeometry {
  modelGeometry: any;
  faceCount: any;
  vertexCount: any;
  centroids: any[];
  constructor(model, options?) {
    super();

    this.modelGeometry = model;
    this.faceCount = this.modelGeometry.faces.length;
    this.vertexCount = this.modelGeometry.vertices.length;

    options = options || {};

    options.computeCentroids && this.computeCentroids();

    this.bufferIndices();
    this.bufferPositions(options.localizeFaces);
  }
  computeCentroids() {
    this.centroids = [];
    for (let i = 0; i < this.faceCount; i++) {
      this.centroids[i] = this.computeCentroid(
        this.modelGeometry,
        this.modelGeometry.faces[i]
      );
    }
  }
  computeCentroid(geometry, face, v?) {
    const a = geometry.vertices[face.a];
    const b = geometry.vertices[face.b];
    const c = geometry.vertices[face.c];

    v = v || new THREE.Vector3();
    v.x = (a.x + b.x + c.x) / 3;
    v.y = (a.y + b.y + c.y) / 3;
    v.z = (a.z + b.z + c.z) / 3;

    return v;
  }
  bufferIndices() {
    const indexBuffer = new Uint32Array(this.faceCount * 3);

    this.setIndex(new THREE.BufferAttribute(indexBuffer, 1));
    for (let i = 0, offset = 0; i < this.faceCount; i++, offset += 3) {
      const face = this.modelGeometry.faces[i];

      indexBuffer[offset] = face.a;
      indexBuffer[offset + 1] = face.b;
      indexBuffer[offset + 2] = face.c;
    }
  }
  bufferPositions(localizeFaces) {
    const positionBuffer: any = this.createAttribute('position', 3).array;
    let i, offset;
    if (localizeFaces) {
      for (i = 0; i < this.faceCount; i++) {
        const face = this.modelGeometry.faces[i];

        const centroid = this.centroids
          ? this.centroids[i]
          : this.computeCentroid(this.modelGeometry, face);

        const a = this.modelGeometry.vertices[face.a];
        const b = this.modelGeometry.vertices[face.b];
        const c = this.modelGeometry.vertices[face.c];

        positionBuffer[face.a * 3] = a.x - centroid.x;
        positionBuffer[face.a * 3 + 1] = a.y - centroid.y;
        positionBuffer[face.a * 3 + 2] = a.z - centroid.z;

        positionBuffer[face.b * 3] = b.x - centroid.x;
        positionBuffer[face.b * 3 + 1] = b.y - centroid.y;
        positionBuffer[face.b * 3 + 2] = b.z - centroid.z;

        positionBuffer[face.c * 3] = c.x - centroid.x;
        positionBuffer[face.c * 3 + 1] = c.y - centroid.y;
        positionBuffer[face.c * 3 + 2] = c.z - centroid.z;
      }
    } else {
      for (i = 0, offset = 0; i < this.vertexCount; i++, offset += 3) {
        const vertex = this.modelGeometry.vertices[i];

        positionBuffer[offset] = vertex.x;
        positionBuffer[offset + 1] = vertex.y;
        positionBuffer[offset + 2] = vertex.z;
      }
    }
  }
  createAttribute(name, itemSize, factory?) {
    const buffer = new Float32Array(this.vertexCount * itemSize);
    const attribute = new THREE.BufferAttribute(buffer, itemSize);

    this.addAttribute(name, attribute);

    if (factory) {
      const data = [];

      for (let i = 0; i < this.faceCount; i++) {
        factory(data, i, this.faceCount);
        this.setFactoryData(attribute, i, data);
      }
    }

    return attribute;
  }
  setFactoryData(attribute, faceIndex: number, data) {
    attribute =
      typeof attribute === 'string' ? this.attributes[attribute] : attribute;

    let offset = faceIndex * 3 * attribute.itemSize;

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < attribute.itemSize; j++) {
        attribute.array[offset++] = data[j];
      }
    }
  }
}
