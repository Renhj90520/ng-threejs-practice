import * as THREE from 'three';
const textureSize = 128.0;
const friction = 0.998;
const gravity = new THREE.Vector3(0, -0.005, 0);

function drawRadialGradation(ctx, canvasRadius, canvasW, canvasH) {
  ctx.save();
  const gradient = ctx.createRadialGradient(
    canvasRadius,
    canvasRadius,
    0,
    canvasRadius,
    canvasRadius,
    canvasRadius
  );

  gradient.addColorStop(0.0, 'rgba(255,255,255,1.0)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
  gradient.addColorStop(1.0, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.restore();
}
function getTexture() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const diameter = textureSize;
  canvas.width = diameter;
  canvas.height = diameter;
  const canvasRadius = diameter / 2;
  drawRadialGradation(ctx, canvasRadius, canvas.width, canvas.height);
  const texture = new THREE.Texture(canvas);
  texture.type = THREE.FloatType;
  texture.needsUpdate = true;
  return texture;
}
const canvasTexture = getTexture();

function getOffsetXYZ(i) {
  const offset = 3;
  const idx = i * offset;
  const x = idx;
  const y = idx + 1;
  const z = idx + 2;
  return { x, y, z };
}
function getOffsetRGBA(i) {
  const offset = 4;
  const idx = i * offset;
  const r = idx;
  const g = idx + 1;
  const b = idx + 2;
  const a = idx + 3;
  return { r, g, b, a };
}
export class BasicFireWorks extends THREE.Group {
  isExplode = false;
  max = 400;
  min = 150;
  petalsNum = randomNum(this.min, this.max);
  life = 150;
  seed;
  flowerSizeRate;
  flower;
  constructor() {
    super();
    this.seed = this.getSeed();
    this.add(this.seed.mesh);
    this.flowerSizeRate = THREE.MathUtils.mapLinear(
      this.petalsNum,
      this.min,
      this.max,
      0.4,
      0.7
    );
  }

  getSeed(): any {
    const num = 40;
    const vels = [];
    for (let i = 0; i < num; i++) {
      const vx = 0;
      const vy = i === 0 ? Math.random() * 2.5 + 0.9 : Math.random() * 2 + 0.4;
      const vz = 0;
      vels.push(new THREE.Vector3(vx, vy, vz));
    }

    const pm = new ParticleSeedMesh(num, vels);
    const x = Math.random() * 80 - 40;
    const y = -50;
    const z = Math.random() * 80 - 40;
    pm.mesh.position.set(x, y, z);
    return pm;
  }

  explode(pos) {
    this.isExplode = true;
    this.flower = this.getFlower(pos);
    this.add(this.flower.mesh);
  }
  getFlower(pos) {
    const vels = [];
    let radius;
    const dice = Math.random();

    if (dice > 0.5) {
      for (let i = 0; i < this.petalsNum; i++) {
        radius = randomNum(60, 120) * 0.01;
        const theta = THREE.MathUtils.degToRad(Math.random() * 180);
        const phi = THREE.MathUtils.degToRad(Math.random() * 360);
        const vx = Math.sin(theta) * Math.cos(phi) * radius;
        const vy = Math.sin(theta) * Math.sin(phi) * radius;
        const vz = Math.cos(theta) * radius;

        const vel = new THREE.Vector3(vx, vy, vz);
        vel.multiplyScalar(this.flowerSizeRate);
        vels.push(vel);
      }
    } else {
      const zStep = 180 / this.petalsNum;
      const trad = (360 * (Math.random() * 20 + 1)) / this.petalsNum;
      const xStep = trad;
      const yStep = trad;

      radius = randomNum(60, 120) * 0.01;
      for (let i = 0; i < this.petalsNum; i++) {
        const sphereRate = Math.sin(THREE.MathUtils.degToRad(zStep * i));
        const vz = Math.cos(THREE.MathUtils.degToRad(zStep * i)) * radius;
        const vx =
          Math.cos(THREE.MathUtils.degToRad(xStep * i)) * sphereRate * radius;
        const vy =
          Math.sin(THREE.MathUtils.degToRad(yStep * i)) * sphereRate * radius;
        const vel = new THREE.Vector3(vx, vy, vz);
        vel.multiplyScalar(this.flowerSizeRate);
        vels.push(vel);
      }
    }

    const particleMesh = new ParticleMesh(this.petalsNum, vels, null);
    particleMesh.mesh.position.set(pos.x, pos.y, pos.z);
    return particleMesh;
  }

  update() {
    if (!this.isExplode) {
      this.drawTail();
    } else {
      this.flower.update();
      if (this.life > 0) this.life--;
    }
  }
  drawTail() {
    this.seed.update();
    const { position, velocity } = this.seed.mesh.geometry.attributes;
    let count = 0;
    let isComplete = true;
    for (let i = 0; i < velocity.array.length; i++) {
      const v = velocity.array[i];
      const idx = i % 3;
      if (idx === 1 && v > 0) {
        count++;
      }
    }

    isComplete = count == 0;
    if (!isComplete) return;
    const { x, y, z } = this.seed.mesh.position;
    const flowerPos = new THREE.Vector3(x, y, z);
    let highestPos = 0;
    let offsetPos;

    for (let i = 0; i < position.array.length; i++) {
      const p = position.array[i];
      const idx = i % 3;
      if (idx === 1 && p > highestPos) {
        highestPos = p;
        offsetPos = new THREE.Vector3(
          position.array[i - 1],
          p,
          position.array[i + 2]
        );
      }
    }

    flowerPos.add(offsetPos);
    this.explode(flowerPos);
  }
}

export class RichFireWorks extends BasicFireWorks {
  tails: any;
  constructor() {
    super();
    this.max = 150;
    this.min = 100;
    this.petalsNum = randomNum(this.min, this.max);
    this.flowerSizeRate = THREE.MathUtils.mapLinear(
      this.petalsNum,
      this.min,
      this.max,
      0.4,
      0.7
    );
  }

  explode(pos) {
    super.explode(pos);
    this.tails = this.getTail();
    for (let i = 0; i < this.tails.length; i++) {
      this.add(this.tails[i].mesh);
    }
  }

  update() {
    if (!this.isExplode) {
      this.drawTail();
    } else {
      this.flower.update();

      const { position: flowerGeo } = this.flower.mesh.geometry.attributes;
      for (let i = 0; i < this.tails.length; i++) {
        const tail = this.tails[i];
        tail.update();
        const { x, y, z } = getOffsetXYZ(i);
        const flowerPos = new THREE.Vector3(
          flowerGeo.array[x],
          flowerGeo.array[y],
          flowerGeo.array[z]
        );

        const { position, velocity } = tail.mesh.geometry.attributes;
        for (let k = 0; k < position.count; k++) {
          const { x, y, z } = getOffsetXYZ(k);
          const desiredVelocity = new THREE.Vector3();
          const tailPos = new THREE.Vector3(
            position.array[x],
            position.array[y],
            position.array[z]
          );

          const tailVel = new THREE.Vector3(
            velocity.array[x],
            velocity.array[y],
            velocity.array[z]
          );

          desiredVelocity.subVectors(flowerPos, tailPos);
          const steer = desiredVelocity.sub(tailVel);
          steer.normalize();
          steer.multiplyScalar(Math.random() * 0.0003 * this.life);
          velocity.array[x] += steer.x;
          velocity.array[y] += steer.y;
          velocity.array[z] += steer.z;
        }

        velocity.needsUpdate = true;
      }
      if (this.life > 0) this.life -= 1.2;
    }
  }

  getTail() {
    const tails = [];
    const num = 20;
    const { color: petalColor } = this.flower.mesh.geometry.attributes;
    for (let i = 0; i < this.petalsNum; i++) {
      const vels = [];
      for (let j = 0; j < num; j++) {
        const vx = 0;
        const vy = 0;
        const vz = 0;
        vels.push(new THREE.Vector3(vx, vy, vz));
      }
      const tail = new ParticleTailMesh(num, vels);
      const { r, g, b, a } = getOffsetRGBA(i);

      const petalR = petalColor.array[r];
      const petalG = petalColor.array[g];
      const petalB = petalColor.array[b];
      const petalA = petalColor.array[a];

      const { position, color } = tail.mesh.geometry.attributes;

      for (let k = 0; k < position.count; k++) {
        const { r, g, b, a } = getOffsetRGBA(k);
        color.array[r] = petalR;
        color.array[g] = petalG;
        color.array[b] = petalB;
        color.array[a] = petalA;
      }

      const { x, y, z } = this.flower.mesh.position;

      tail.mesh.position.set(x, y, z);
      tails.push(tail);
    }
    return tails;
  }
}

class ParticleMesh {
  particleNum: any;
  timerStartFading: number;
  vels: any;
  mesh;
  type: any;
  vertexShader = `
    precision mediump float;
    attribute vec3 position;
    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;
    uniform float size;
    attribute float adjustSize;
    uniform vec3 cameraPosition;
    varying float distanceCamera;
    attribute vec3 velocity;
    attribute vec4 color;
    varying vec4 vColor;
    void main() {
        vColor=color;
        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.);
        gl_PointSize = size * adjustSize * (100. / length(modelViewPosition.xyz));
        gl_Position = projectionMatrix * modelViewPosition;
    }
  `;
  fragmentShader = `
    precision mediump float;
    uniform sampler2D texture;
    varying vec4 vColor;
    void main() {
        vec4 color = vec4(texture2D(texture, gl_PointCoord));
        gl_FragColor = color * vColor;
    }
  `;

  constructor(num, vels, type) {
    this.particleNum = num;
    this.timerStartFading = 10;
    this.vels = vels;
    this.type = type;
    this.mesh = this.getPointMesh();
  }

  update() {
    if (this.timerStartFading > 0) {
      this.timerStartFading -= 0.3;
    }

    const { position, velocity, color, mass } = this.mesh.geometry.attributes;
    const decrementRandom = () => (Math.random() > 0.5 ? 0.98 : 0.96);
    const decrementByVel = (v) => (Math.random() > 0.5 ? 0 : (1 - v) * 0.1);

    for (let i = 0; i < this.particleNum; i++) {
      const { x, y, z } = getOffsetXYZ(i);
      velocity.array[y] += gravity.y - mass.array[i];
      velocity.array[x] *= friction;
      velocity.array[z] *= friction;
      velocity.array[y] *= friction;

      position.array[x] += velocity.array[x];
      position.array[y] += velocity.array[y];
      position.array[z] += velocity.array[z];

      const { a } = getOffsetRGBA(i);
      if (this.timerStartFading <= 0) {
        color.array[a] *= decrementRandom() - decrementByVel(color.array[a]);
        if (color.array[a] < 0.001) color.array[a] = 0;
      }
    }
    position.needsUpdate = true;
    velocity.needsUpdate = true;
    color.needsUpdate = true;
  }

  getPointMesh() {
    const bufferGeo = new THREE.BufferGeometry();
    const vertices = [];
    const velocities = [];
    const colors = [];
    const adjustSizes = [];
    const masses = [];
    const colorType = Math.random() > 0.3 ? 'single' : 'multiple';
    const singleColor = randomNum(20, 100) * 0.01;
    let rgbType;
    const rgbTypeDice = Math.random();
    if (rgbTypeDice > 0.66) {
      rgbType = 'red';
    } else if (rgbTypeDice > 0.33) {
      rgbType = 'green';
    } else {
      rgbType = 'blue';
    }

    for (let i = 0; i < this.particleNum; i++) {
      const pos = new THREE.Vector3(0, 0, 0);
      vertices.push(pos.x, pos.y, pos.z);
      velocities.push(this.vels[i].x, this.vels[i].y, this.vels[i].z);
      if (this.type === 'seed') {
        let size = Math.pow(this.vels[i].y, 2) * 0.04;
        if (i === 0) size *= 1.1;
        adjustSizes.push(size);
        masses.push(size * 0.017);
        colors.push(1, 1, 1, 1);
      } else {
        const size = randomNum(10, 400) * 0.001;
        adjustSizes.push(size);
        masses.push(size * 0.017);
        if (colorType === 'multiple') {
          colors.push(multipleColor(), multipleColor(), multipleColor(), 1);
        } else {
          switch (rgbType) {
            case 'red':
              colors.push(singleColor, 0.1, 0.1, 1);
              break;
            case 'green':
              colors.push(0.1, singleColor, 0.1, 1);
              break;
            case 'blue':
              colors.push(0.1, 0.1, singleColor, 1);
              break;
            default:
              colors.push(singleColor, 0.1, 0.1, 1);
              break;
          }
        }
      }
    }

    bufferGeo.addAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    bufferGeo.addAttribute(
      'velocity',
      new THREE.Float32BufferAttribute(velocities, 3)
    );
    bufferGeo.addAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 4)
    );
    bufferGeo.addAttribute(
      'adjustSize',
      new THREE.Float32BufferAttribute(adjustSizes, 1)
    );
    bufferGeo.addAttribute('mass', new THREE.Float32BufferAttribute(masses, 1));

    const shaderMaterial = new THREE.RawShaderMaterial({
      uniforms: {
        size: { value: textureSize },
        texture: {
          
          value: canvasTexture,
        },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
    });

    return new THREE.Points(bufferGeo, shaderMaterial);
  }
}
class ParticleSeedMesh extends ParticleMesh {
  constructor(num, vels) {
    super(num, vels, 'seed');
  }
  update() {
    const { position, velocity, color, mass } = this.mesh.geometry.attributes;
    const decrementRandom = () => (Math.random() > 0.3 ? 0.99 : 0.96);
    const decrementByVel = (v) => (Math.random() > 0.3 ? 0 : (1 - v) * 0.1);
    const shake = () => (Math.random() > 0.5 ? 0.05 : -0.05);
    const dice = () => Math.random() > 0.1;
    const _f = friction * 0.98;
    for (let i = 0; i < this.particleNum; i++) {
      const { x, y, z } = getOffsetXYZ(i);
      velocity.array[y] += gravity.y - mass.array[i];
      velocity.array[x] *= _f;
      velocity.array[z] *= _f;
      velocity.array[y] *= _f;
      position.array[x] += velocity.array[x];
      position.array[y] += velocity.array[y];
      position.array[z] += velocity.array[z];
      if (dice()) position.array[x] += shake();
      if (dice()) position.array[z] += shake();
      const { a } = getOffsetRGBA(i);
      color.array[a] *= decrementRandom() - decrementByVel(color.array[a]);
      if (color.array[a] < 0.001) color.array[a] = 0;
    }
    position.needsUpdate = true;
    velocity.needsUpdate = true;
    color.needsUpdate = true;
  }
}
class ParticleTailMesh extends ParticleMesh {
  constructor(num, vels) {
    super(num, vels, 'tail');
  }
  update() {
    const { position, velocity, color, mass } = this.mesh.geometry.attributes;
    const decrementRandom = () => (Math.random() > 0.3 ? 0.98 : 0.95);
    const shake = () => (Math.random() > 0.5 ? 0.05 : -0.05);
    const dice = () => Math.random() > 0.2;
    for (let i = 0; i < this.particleNum; i++) {
      const { x, y, z } = getOffsetXYZ(i);
      velocity.array[y] += gravity.y - mass.array[i];
      velocity.array[x] *= friction;
      velocity.array[z] *= friction;
      velocity.array[y] *= friction;
      position.array[x] += velocity.array[x];
      position.array[y] += velocity.array[y];
      position.array[z] += velocity.array[z];
      if (dice()) position.array[x] += shake();
      if (dice()) position.array[z] += shake();
      const { a } = getOffsetRGBA(i);
      color.array[a] *= decrementRandom();
      if (color.array[a] < 0.001) color.array[a] = 0;
    }
    position.needsUpdate = true;
    velocity.needsUpdate = true;
    color.needsUpdate = true;
  }
}
function randomNum(min = 0, max = 0) {
  return Math.floor(Math.random() * (max + 1 - min)) + min;
}
function multipleColor() {
  return randomNum(1, 100) * 0.01;
}
