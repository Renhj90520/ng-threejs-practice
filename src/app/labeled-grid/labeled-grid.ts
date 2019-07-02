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
      i < this.width / 2;
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
          new THREE.Vector3(-length / 2, i, mainGridZ)
        );
        gridGeometry.vertices.push(new THREE.Vector3(length / 2, i, mainGridZ));
        gridGeometry.vertices.push(
          new THREE.Vector3(-length / 2, -i, mainGridZ)
        );
        gridGeometry.vertices.push(
          new THREE.Vector3(length / 2, -i, mainGridZ)
        );
      }
    }

    for (let i = 0; i <= length / 2; i += this.step / this.stepSubDivisions) {
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
      new THREE.Vector3(length / 2, -this.width / 2, subGridZ)
    );

    marginGeometry.vertices.push(
      new THREE.Vector3(length / 2, -this.width / 2, subGridZ)
    );
    marginGeometry.vertices.push(
      new THREE.Vector3(length / 2, this.width / 2, subGridZ)
    );

    marginGeometry.vertices.push(
      new THREE.Vector3(length / 2, this.width / 2, subGridZ)
    );
    marginGeometry.vertices.push(
      new THREE.Vector3(-length / 2, this.width / 2, subGridZ)
    );

    marginGeometry.vertices.push(
      new THREE.Vector3(-length / 2, this.width / 2, subGridZ)
    );
    marginGeometry.vertices.push(
      new THREE.Vector3(-length / 2, -this.width / 2, subGridZ)
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
  }
}
