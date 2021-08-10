import { Component, ElementRef, OnInit } from '@angular/core';
import * as THREE from 'three';
import Cloth from './cloth';
import { clothFunction, xSegs, ySegs } from './utils';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
@Component({
  selector: 'app-animation-cloth',
  templateUrl: './animation-cloth.component.html',
  styleUrls: ['./animation-cloth.component.css'],
})
export class AnimationClothComponent implements OnInit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;

  width;
  height;
  cloth: Cloth;
  clothGeometry: THREE.ParametricBufferGeometry;
  ballSize = 60; //40
  sphere: THREE.Mesh;
  windForce = new THREE.Vector3(0, 0, 0);
  params = {
    enableWind: true,
    showBall: true,
    togglePins: this.togglePins,
  };

  constructor(private el: ElementRef) {
    this.cloth = new Cloth(xSegs, ySegs);
    this.pins = [6];

    this.pinsFormation.push(this.pins);

    this.pins = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    this.pinsFormation.push(this.pins);

    this.pins = [0];
    this.pinsFormation.push(this.pins);

    this.pins = []; // cut the rope ;)
    this.pinsFormation.push(this.pins);

    this.pins = [0, this.cloth.w]; // classic 2 pins
    this.pinsFormation.push(this.pins);

    this.pins = this.pinsFormation[1];
  }

  ngOnInit(): void {
    this.initTHREE();
    this.addCloth();
    this.addSphere();
    this.addGround();
    this.addPoles();
    this.animate(0);
  }
  addPoles() {
    const poleGeo = new THREE.BoxGeometry(5, 375, 5);
    const poleMat = new THREE.MeshLambertMaterial();

    const pole1 = new THREE.Mesh(poleGeo, poleMat);
    pole1.position.x = -125;
    pole1.position.y = -62;
    pole1.castShadow = true;
    pole1.receiveShadow = true;
    this.scene.add(pole1);

    const pole2 = new THREE.Mesh(poleGeo, poleMat);
    pole2.position.x = 125;
    pole2.position.y = -62;
    pole2.castShadow = true;
    pole2.receiveShadow = true;
    this.scene.add(pole2);

    let mesh = new THREE.Mesh(new THREE.BoxGeometry(255, 5, 5), poleMat);
    mesh.position.y = -250 + 750 / 2;
    mesh.position.x = 0;
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.scene.add(mesh);

    const gg = new THREE.BoxGeometry(10, 10, 10);
    mesh = new THREE.Mesh(gg, poleMat);
    mesh.position.y = -250;
    mesh.position.x = 125;
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.scene.add(mesh);

    mesh = new THREE.Mesh(gg, poleMat);
    mesh.position.y = -250;
    mesh.position.x = -125;
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.scene.add(mesh);
  }
  addGround() {
    const loader = new THREE.TextureLoader();
    const groundTexture = loader.load('/assets/images/grasslight-big.jpg');
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(25, 25);
    groundTexture.anisotropy = 16;
    groundTexture.encoding = THREE.sRGBEncoding;

    const groundMaterial = new THREE.MeshLambertMaterial({
      map: groundTexture,
    });

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(20000, 20000),
      groundMaterial
    );
    mesh.position.y = -250;
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }
  addSphere() {
    const ballGeo = new THREE.SphereGeometry(this.ballSize, 32, 16);
    const ballMaterial = new THREE.MeshLambertMaterial();

    this.sphere = new THREE.Mesh(ballGeo, ballMaterial);
    this.sphere.castShadow = true;
    this.sphere.receiveShadow = true;
    this.sphere.visible = false;
    this.scene.add(this.sphere);
  }
  addCloth() {
    const loader = new THREE.TextureLoader();
    const clothTexture = loader.load('/assets/images/circuit_pattern.png');
    clothTexture.anisotropy = 16;

    const clothMaterial = new THREE.MeshLambertMaterial({
      map: clothTexture,
      side: THREE.DoubleSide,
      alphaTest: 0.5,
      wireframe: true,
    });

    this.clothGeometry = new THREE.ParametricBufferGeometry(
      clothFunction,
      this.cloth.w,
      this.cloth.h
    );

    const object = new THREE.Mesh(this.clothGeometry, clothMaterial);
    object.position.set(0, 0, 0);
    object.castShadow = true;
    this.scene.add(object);

    object.customDepthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map: clothTexture,
      alphaTest: 0.5,
    });
  }
  initTHREE() {
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xcce0ff);
    this.scene.fog = new THREE.Fog(0xcce0ff, 500, 10000);

    this.camera = new THREE.PerspectiveCamera(
      30,
      this.width / this.height,
      1,
      10000
    );
    this.camera.position.set(1000, 50, 1500);

    this.scene.add(new THREE.AmbientLight(0x666666));

    const light = new THREE.DirectionalLight(0xdfebff, 1);
    light.position.set(50, 200, 100);
    light.position.multiplyScalar(1.3);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;

    const d = 300;
    light.shadow.camera.left = -d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = -d;

    light.shadow.camera.far = 1000;

    this.scene.add(light);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);

    this.el.nativeElement.appendChild(this.renderer.domElement);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxPolarAngle = Math.PI * 0.5;
    this.controls.minDistance = 1000;
    this.controls.maxDistance = 5000;
  }

  render() {
    const p = this.cloth.particles;

    for (let i = 0; i < p.length; i++) {
      const v = p[i].position;
      this.clothGeometry.attributes.position.setXYZ(i, v.x, v.y, v.z);
    }

    (
      this.clothGeometry.attributes.position as THREE.BufferAttribute
    ).needsUpdate = true;

    this.clothGeometry.computeVertexNormals();

    this.sphere.position.copy(this.ballPosition);

    this.renderer.render(this.scene, this.camera);
  }

  animate(now) {
    requestAnimationFrame(this.animate.bind(this));

    this.simulation(now);
    this.render();
    this.controls.update();
  }

  simulation(now) {
    const windStrength = Math.cos(now / 7000) * 20 + 40;
    this.windForce.set(
      Math.sin(now / 2000),
      Math.cos(now / 3000),
      Math.sin(now / 1000)
    );

    this.windForce.normalize();
    this.windForce.multiplyScalar(windStrength);

    // Aerodynamics forces

    const particles = this.cloth.particles;

    if (this.params.enableWind) {
      let indx;
      const normal = new THREE.Vector3();
      const indices = this.clothGeometry.index;
      const normals: THREE.BufferAttribute = this.clothGeometry.attributes
        .normal as THREE.BufferAttribute;

      for (let i = 0; i < indices.count; i += 3) {
        for (let j = 0; j < 3; j++) {
          indx = indices.getX(i + j);
          normal.fromBufferAttribute(normals, indx);
          this.tmpForce
            .copy(normal)
            .normalize()
            .multiplyScalar(normal.dot(this.windForce));

          particles[indx].addForce(this.tmpForce);
        }
      }
    }

    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      particle.addForce(this.gravity);
      particle.integrate(this.TIMESTEP_SQ);
    }

    // start constraints

    const constraints = this.cloth.constraints;
    const il = constraints.length;

    for (let i = 0; i < il; i++) {
      const constraint = constraints[i];
      this.satifyConstraints(constraint[0], constraint[1], constraint[2]);
    }

    // ball constraints
    this.ballPosition.z = -Math.sin(now / 600) * 90;
    this.ballPosition.x = Math.cos(now / 400) * 70;

    if (this.params.showBall) {
      this.sphere.visible = true;

      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        const pos = particle.position;
        this.diff.subVectors(pos, this.ballPosition);
        if (this.diff.length() < this.ballSize) {
          //collided
          this.diff.normalize().multiplyScalar(this.ballSize);
          pos.copy(this.ballPosition).add(this.diff);
        }
      }
    } else {
      this.sphere.visible = false;
    }

    // floor constraints
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      const pos = particle.position;
      if (pos.y < -250) {
        pos.y = -250;
      }
    }

    // pin constraints
    for (let i = 0; i < this.pins.length; i++) {
      const xy = this.pins[i];
      const p = particles[xy];
      p.position.copy(p.original);
      p.previous.copy(p.previous);
    }
  }
  satifyConstraints(p1, p2, distance) {
    this.diff.subVectors(p2.position, p1.position);
    const currentDist = this.diff.length();
    if (currentDist === 0) return; // prevents division by 0

    const correction = this.diff.multiplyScalar(1 - distance / currentDist);
    const correctionHalf = correction.multiplyScalar(0.5);
    p1.position.add(correctionHalf);
    p2.position.sub(correctionHalf);
  }

  tmpForce = new THREE.Vector3();
  diff = new THREE.Vector3();
  GRAVITY = 981 * 1.4;
  MASS = 0.1;
  gravity = new THREE.Vector3(0, -this.GRAVITY, 0).multiplyScalar(this.MASS);
  TIMESTEP = 18 / 1000;
  TIMESTEP_SQ = this.TIMESTEP * this.TIMESTEP;

  ballPosition = new THREE.Vector3(0, -45, 0);

  pins = [];

  pinsFormation = [];

  togglePins() {
    this.pins =
      this.pinsFormation[~~(Math.random() * this.pinsFormation.length)];
  }
}
