import * as THREE from 'three';
export default class LabeledGrid extends THREE.Object3D {
  width: number;
  length: number;
  step: number;
  color: number;
  opacity: number;
  text: boolean;
  textColor: string;
  textLocation: string;
  upVector;
  marginSize: number;
  stepSubDivisions: number;
  mainGrid: THREE.LineSegments;
  subGrid: THREE.LineSegments;
  margin: THREE.LineSegments;
  labelStore: {};
  labels: any;
  constructor(
    width = 200,
    length = 200,
    step = 100,
    upVector = [0, 1, 0],
    color = 0x00baff,
    opacity = 0.2,
    text = true,
    textColor = '#000000',
    textLocation = 'center'
  ) {
    super();

    this.width = width;
    this.length = length;
    this.step = step;
    this.color = color;
    this.opacity = opacity;
    this.text = text;
    this.textColor = textColor;
    this.textLocation = textLocation;
    this.upVector = new THREE.Vector3().fromArray(upVector);

    this.name = 'grid';

    this.marginSize = 10;
    this.stepSubDivisions = 10;

    this.drawGrid();

    this.up = this.upVector;
    this.lookAt(this.upVector);
  }

  private drawGrid() {
    let gridGeometry,
      gridMaterial,
      mainGridZ,
      planeFragmentShader,
      PlaneGeometry,
      planeMaterial,
      subGridGeometry,
      subGridMaterial,
      subGridZ;

    mainGridZ = -0.05;

    gridGeometry = new THREE.Geometry();
    gridMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color().setHex(this.color),
      opacity: this.opacity,
      linewidth: 2,
      transparent: true
    });

    subGridZ = -0.05;

    subGridGeometry = new THREE.Geometry();
    subGridMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color().setHex(this.color),
      opacity: this.opacity / 2,
      transparent: true
    });

    for (
      let i = 0;
      i <= this.width / 2;
      i += this.step / this.stepSubDivisions
    ) {
      subGridGeometry.vertices.push(
        new THREE.Vector3(-this.length / 2, i, subGridZ)
      );
      subGridGeometry.vertices.push(
        new THREE.Vector3(this.length / 2, i, subGridZ)
      );

      subGridGeometry.vertices.push(
        new THREE.Vector3(-this.length / 2, -i, subGridZ)
      );
      subGridGeometry.vertices.push(
        new THREE.Vector3(this.length / 2, -i, subGridZ)
      );

      if (i % this.step === 0) {
        gridGeometry.vertices.push(
          new THREE.Vector3(-this.length / 2, i, mainGridZ)
        );
        gridGeometry.vertices.push(
          new THREE.Vector3(this.length / 2, i, mainGridZ)
        );
        gridGeometry.vertices.push(
          new THREE.Vector3(-this.length / 2, -i, mainGridZ)
        );
        gridGeometry.vertices.push(
          new THREE.Vector3(this.length / 2, -i, mainGridZ)
        );
      }
    }

    for (
      let i = 0;
      i <= this.length / 2;
      i += this.step / this.stepSubDivisions
    ) {
      subGridGeometry.vertices.push(
        new THREE.Vector3(i, -this.width / 2, subGridZ)
      );
      subGridGeometry.vertices.push(
        new THREE.Vector3(i, this.width / 2, subGridZ)
      );

      subGridGeometry.vertices.push(
        new THREE.Vector3(-i, -this.width / 2, subGridZ)
      );
      subGridGeometry.vertices.push(
        new THREE.Vector3(-i, this.width / 2, subGridZ)
      );

      if (i % this.step == 0) {
        gridGeometry.vertices.push(
          new THREE.Vector3(i, -this.width / 2, mainGridZ)
        );
        gridGeometry.vertices.push(
          new THREE.Vector3(i, this.width / 2, mainGridZ)
        );

        gridGeometry.vertices.push(
          new THREE.Vector3(-i, -this.width / 2, mainGridZ)
        );
        gridGeometry.vertices.push(
          new THREE.Vector3(-i, this.width / 2, mainGridZ)
        );
      }
    }

    this.mainGrid = new THREE.LineSegments(gridGeometry, gridMaterial);

    this.subGrid = new THREE.LineSegments(subGridGeometry, subGridMaterial);

    const offsetWidth = this.width + this.marginSize;
    const offsetLength = this.length + this.marginSize;

    const marginGeometry = new THREE.Geometry();
    marginGeometry.vertices.push(
      new THREE.Vector3(-this.length / 2, -this.width / 2, subGridZ)
    );
    marginGeometry.vertices.push(
      new THREE.Vector3(this.length / 2, -this.width / 2, subGridZ)
    );

    marginGeometry.vertices.push(
      new THREE.Vector3(this.length / 2, -this.width / 2, subGridZ)
    );
    marginGeometry.vertices.push(
      new THREE.Vector3(this.length / 2, this.width / 2, subGridZ)
    );

    marginGeometry.vertices.push(
      new THREE.Vector3(this.length / 2, this.width / 2, subGridZ)
    );
    marginGeometry.vertices.push(
      new THREE.Vector3(-this.length / 2, this.width / 2, subGridZ)
    );

    marginGeometry.vertices.push(
      new THREE.Vector3(-this.length / 2, this.width / 2, subGridZ)
    );
    marginGeometry.vertices.push(
      new THREE.Vector3(-this.length / 2, -this.width / 2, subGridZ)
    );

    marginGeometry.vertices.push(
      new THREE.Vector3(-offsetLength / 2, -offsetWidth / 2, subGridZ)
    );
    marginGeometry.vertices.push(
      new THREE.Vector3(offsetLength / 2, -offsetWidth / 2, subGridZ)
    );

    marginGeometry.vertices.push(
      new THREE.Vector3(offsetLength / 2, -offsetWidth / 2, subGridZ)
    );
    marginGeometry.vertices.push(
      new THREE.Vector3(offsetLength / 2, offsetWidth / 2, subGridZ)
    );

    marginGeometry.vertices.push(
      new THREE.Vector3(offsetLength / 2, offsetWidth / 2, subGridZ)
    );
    marginGeometry.vertices.push(
      new THREE.Vector3(-offsetLength / 2, offsetWidth / 2, subGridZ)
    );

    marginGeometry.vertices.push(
      new THREE.Vector3(-offsetLength / 2, offsetWidth / 2, subGridZ)
    );
    marginGeometry.vertices.push(
      new THREE.Vector3(-offsetLength / 2, -offsetWidth / 2, subGridZ)
    );

    const strongGridMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color().setHex(this.color),
      opacity: this.opacity * 2,
      linewidth: 2,
      transparent: true
    });

    this.margin = new THREE.LineSegments(marginGeometry, strongGridMaterial);

    this.add(this.mainGrid);
    this.add(this.subGrid);
    this.add(this.margin);

    this.drawNumbering();
  }
  private drawNumbering() {
    this.labelStore = {};
    if (this.labels != null) {
      this.mainGrid.remove(this.labels);
    }

    this.labels = new THREE.Object3D();

    const labelsFront = new THREE.Object3D();
    const labelsSideRight = new THREE.Object3D();

    for (let i = 0; i <= this.width / 2; i += this.step) {
      const sizeLabel = this.drawTextOnPlane('' + i);
      const sizeLabel2 = sizeLabel.clone();

      sizeLabel.position.set(this.length / 2, -i, 0.1);
      sizeLabel.rotation.z = -Math.PI / 2;
      labelsFront.add(sizeLabel);

      sizeLabel2.position.set(this.length / 2, i, 0.1);
      sizeLabel2.rotation.z = -Math.PI / 2;
      labelsFront.add(sizeLabel2);
    }

    for (let i = 0; i <= this.length / 2; i += this.step) {
      const sizeLabel = this.drawTextOnPlane('' + i);
      const sizeLabel2 = sizeLabel.clone();

      sizeLabel.position.set(-i, this.width / 2, 0.1);
      labelsSideRight.add(sizeLabel);

      sizeLabel2.position.set(i, this.width / 2, 0.1);
      labelsSideRight.add(sizeLabel2);
    }

    const labelsSideLeft = labelsSideRight.clone();
    labelsSideLeft.rotation.z = -Math.PI;

    const labelsBack = labelsFront.clone();
    labelsBack.rotation.z = -Math.PI;

    this.labels.add(labelsFront);
    this.labels.add(labelsBack);
    this.labels.add(labelsSideLeft);
    this.labels.add(labelsSideRight);

    this.labels.traverse(child => {
      child.visible = this.text;
    });

    this.mainGrid.add(this.labels);
  }
  drawTextOnPlane(text) {
    let canvas, context, material, plane, texture;

    const size = 128;
    canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;

    context = canvas.getContext('2d');
    context.font = '18px sans-serif';
    context.textAlign = 'center';
    context.fillStyle = this.textColor;
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    context.strokeStyle = this.textColor;
    context.strokeText(text, canvas.width / 2, canvas.height / 2);

    texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    texture.generateMipmaps = true;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;

    material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      color: 0xffffff,
      alphaTest: 0.3
    });

    plane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(size / 8, size / 8),
      material
    );

    plane.doubleSided = true;
    plane.overdraw = true;

    return plane;
  }
}
