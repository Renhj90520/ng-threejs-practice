import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
import OrbitControls from '../controls/OrbitControls';
import { dataMap } from './data-map';
import { TimelineMax, Expo } from 'gsap';
@Component({
  selector: 'app-launchit-earth',
  templateUrl: './launchit-earth.component.html',
  styleUrls: ['./launchit-earth.component.css']
})
export class LaunchitEarthComponent implements OnInit {
  scene;
  camera;
  renderer;

  width;
  height;

  toRAD = Math.PI / 180;
  rotationObject: THREE.Group;
  openingRotationX = 0.45;
  openingRotationY = 65 * this.toRAD;
  earthObject: THREE.Group;

  lightShield1;
  lightShield2;
  lightShield3;
  lightShieldIntensity = 1.25;
  lightShieldDistance = 400;
  lightShieldDecay = 2.0;
  lightsCreated = false;

  colorPrimary_Base = '#33CCFF';
  colorSecondary_Base = '#FF1313';
  colorPrimary = this.colorPrimary_Base;
  colorSecondary = this.colorSecondary_Base;
  colorDarken = '#000000';
  colorBrighten = '#FFFFFF';

  colorBase = new THREE.Color(this.colorPrimary);
  colorBase50 = new THREE.Color(
    this.shadeBlend(0.5, this.colorPrimary, this.colorDarken)
  );
  colorBase75 = new THREE.Color(
    this.shadeBlend(0.75, this.colorPrimary, this.colorDarken)
  );
  colorBase85 = new THREE.Color(
    this.shadeBlend(0.85, this.colorPrimary, this.colorDarken)
  );
  colorHighlight = new THREE.Color(this.colorSecondary);
  universeCreated = false;
  universeBgMat: THREE.MeshBasicMaterial;
  controls: OrbitControls;
  globeRadius = 65;
  globeCloudVerticesArray = [];
  globeCloudBufferGeometry: THREE.BufferGeometry;
  globeCreated = false;
  globeExtraDistance = 0.05;
  dotDetailsArray = [];
  dotSpritesArray = [];
  dotSpritesHoverArray = [];
  dotSpikesVerticesArray = [];
  dotSpikesCloudVerticesArray = [];
  dotsCreated = false;
  arcsSnakeObject: THREE.Group;
  lineBufferDivisions = 25;
  arcSnakeVerticesArray = [];
  arcSnakeDetailsArray = [];

  line_vertexshader = `
    attribute float alpha;
    varying float vAlpha;
    void main() {
      vAlpha = alpha;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  line_fragmentshader = `
    uniform vec3 color;
    varying float vAlpha;

    uniform vec3 fogColor;
    uniform float fogNear;
    uniform float fogFar;

    void main() {
      gl_FragColor = vec4(color, vAlpha);

      #ifdef USE_FOG
        #ifdef USE_LOGDEPTHBUF_EXT
          float depth = gl_FragDepthEXT / gl_FragCoord.w;
        #else
          float depth = gl_FragCoord.z / gl_FragCoord.w;
        #endif
        float fogFactor = smoothstep(fogNear, fogFar, depth);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);
      #endif
    }
  `;

  particle_vertexshader = `
    attribute float size;
    attribute float alpha;
    varying float vAlpha;

    void main() {
      vAlpha = alpha;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  particle_fragmentshader = `
    uniform vec3 color;
    uniform sampler2D texture;
    varying float vAlpha;
    
    void main() {
      gl_FragColor = vec4(color, 1.0);
      gl_FragColor = gl_FragColor * texture2D(texture, gl_PointCoord);
      gl_FragColor.a *= vAlpha;
    }
  `;
  arcSnakeCreated = false;
  arcSnakeAnimation: TimelineMax;
  arcSnakeBufferGeometry: THREE.BufferGeometry;
  arcRocketObject: THREE.Group;
  arcRocketVerticesArray = [];
  arcRocketBufferGeometry: THREE.BufferGeometry;
  arcRocketMaterial: THREE.ShaderMaterial;
  arcRocketCreated = false;
  arcRocketAnimation: TimelineMax;
  arcRocketDetailsArray = [];
  arcAllObject: THREE.Group;
  arcAllsVerticesArray = [];
  arcAllMaterial: THREE.LineBasicMaterial;
  arcAllBufferGeometry: THREE.BufferGeometry;
  arcAllMesh: THREE.LineSegments;
  arcAllAnimation: TimelineMax;
  arcAllCreated = false;
  ringsObject: THREE.Group;
  ringLargeGeometry: THREE.RingGeometry;
  ringMediumGeometry: THREE.RingGeometry;
  ringsOuterMaterial: THREE.MeshBasicMaterial;
  ringsInnerMaterial: THREE.MeshBasicMaterial;
  ringsCreated = false;
  spikesObject: THREE.Group;
  spilesVerticesArray = [];
  spikeRadius = this.globeRadius + 30;
  spikesVerticesArray = [];
  spikesBufferGeometry: THREE.BufferGeometry;
  spikesCreated = false;
  ringPulseObject: THREE.Group;
  ringPulseTotal = 250;
  ringPulseRadius = this.globeRadius + 25;
  ringPulseAngle = (2 * Math.PI) / this.ringPulseTotal;
  ringPulseVerticesArray = [];
  ringPulseBufferGeometry: THREE.BufferGeometry;
  ringExplosionSize = 100;
  ringPointTotal = 250;
  ringPointRadius = this.globeRadius + 20;
  ringPointAngle = (2 * Math.PI) / this.ringPointTotal;
  ringPointSize = 0.5;
  ringPulseCreated: boolean;
  rainObject: THREE.Group;
  rainParticleTotal = 50;
  rainRingRadius = 40;
  rainMaxDistance = 100;
  rainBuffer = this.globeRadius - 15;
  rainSize = 5;
  rainDetails = [];
  rainCreated = false;
  starsObject: THREE.Group;
  starsObject2: THREE.Group;
  starsTotal = 500;
  starsMaxDistance = 400;
  starsCenter = new THREE.Vector3(0, 0, 0);
  starsMinDistance = 100;
  starsVerticesArray = [];
  starsSize = 1;
  starsZoomObject: THREE.Group;
  starZoomTotal = 150;
  starsZoomMaxDistance = 200;
  starsZoomVerticesArray = [];
  starsCreated = false;
  globeMaxZoom = 90;
  rainGeometry: THREE.BufferGeometry;
  rainVelocityFactor = 0.0016;
  rainFadeDistance: number;
  targetTiltX = 0;
  targetTiltY = 0;
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.addGroup();
    this.addLights();
    this.addUniverseBack();
    this.addGlobe();
    this.addDots();
    this.addArcsSnake();
    // this.addArcsRocket();
    // this.addArcsAll();
    this.addRings();
    this.addSpikes();
    this.addRingPulse();
    this.addRain();
    this.addMinimapBg();
    this.addStars();
    this.update();
  }
  addStars() {
    this.starsObject = new THREE.Group();
    this.starsObject.name = 'starsObject';
    this.scene.add(this.starsObject);

    this.starsObject2 = new THREE.Group();
    this.starsObject2.name = 'starsObject2';
    this.scene.add(this.starsObject2);

    for (let i = 0; i < this.starsTotal; i++) {
      var vertex = new THREE.Vector3();
      vertex.x =
        Math.random() * this.starsMaxDistance - this.starsMaxDistance / 2;
      vertex.y = Math.random() * 150 - 150 / 2;
      vertex.z =
        Math.random() * this.starsMaxDistance - this.starsMaxDistance / 2;

      const tempDifference = this.checkDistance(this.starsCenter, vertex);
      const tempBuffer = this.starsMinDistance;

      if (tempDifference < tempBuffer) {
        if (vertex.x < tempBuffer) vertex.x = tempBuffer;
        if (vertex.y < tempBuffer) vertex.y = tempBuffer;
        if (vertex.z < tempBuffer) vertex.z = tempBuffer;
      }

      this.starsVerticesArray.push(vertex);
    }

    const starsMaterial = new THREE.PointsMaterial({
      size: this.starsSize,
      sizeAttenuation: false,
      color: this.colorBase,
      fog: true
    });
    starsMaterial.needsUpdate = true;

    const positions = new Float32Array(this.starsVerticesArray.length * 3);
    for (let i = 0; i < this.starsVerticesArray.length; i++) {
      const vertex = this.starsVerticesArray[i];
      positions[i * 3] = vertex.x;
      positions[i * 3 + 1] = vertex.y;
      positions[i * 3 + 2] = vertex.z;
    }

    const starsBufferGeometry = new THREE.BufferGeometry();
    starsBufferGeometry.addAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );

    const starsCloud1 = new THREE.Points(starsBufferGeometry, starsMaterial);
    this.starsObject.add(starsCloud1);

    const starsCloud2 = new THREE.Points(starsBufferGeometry, starsMaterial);
    this.starsObject2.add(starsCloud2);
    this.starsObject2.rotation.x = 180 * this.toRAD;

    this.starsZoomObject = new THREE.Group();
    this.starsZoomObject.name = 'starsObjectZoom';
    this.scene.add(this.starsZoomObject);

    const starZoomTexture = new THREE.TextureLoader().load(
      'assets/images/star.jpg'
    );

    for (let i = 0; i < this.starZoomTotal; i++) {
      const vertex = new THREE.Vector3();
      vertex.x =
        Math.random() * this.starsZoomMaxDistance -
        this.starsZoomMaxDistance / 2;
      vertex.y =
        Math.random() * this.starsZoomMaxDistance -
        this.starsZoomMaxDistance / 2;
      vertex.z = Math.random() * 500;
      this.starsZoomVerticesArray.push(vertex);
    }

    const starsZoomMaterial = new THREE.PointsMaterial({
      map: starZoomTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      size: 5,
      color: this.colorBase,
      fog: true
    });

    const position = new Float32Array(this.starsZoomVerticesArray.length * 3);
    for (let i = 0; i < this.starsZoomVerticesArray.length; i++) {
      const vertex = this.starsZoomVerticesArray[i];
      position[i * 3] = vertex.x;
      position[i * 3 + 1] = vertex.y;
      position[i * 3 + 2] = vertex.z;
    }

    const starsZoomBufferGeometry = new THREE.BufferGeometry();
    starsZoomBufferGeometry.addAttribute(
      'position',
      new THREE.BufferAttribute(position, 3)
    );

    const starsZoomCloud = new THREE.Points(
      starsZoomBufferGeometry,
      starsZoomMaterial
    );
    this.starsZoomObject.add(starsZoomCloud);

    this.starsCreated = true;
  }
  addMinimapBg() {}
  addRain() {
    this.rainObject = new THREE.Group();
    this.rainObject.name = 'raniObject';
    this.scene.add(this.rainObject);

    this.rainGeometry = new THREE.BufferGeometry();
    const rainShaderUniforms = {
      color: { value: this.colorBase },
      texture: {
        value: new THREE.TextureLoader().load('assets/images/dot-inverted.png')
      }
    };

    const rainShaderMaterial = new THREE.ShaderMaterial({
      uniforms: rainShaderUniforms,
      vertexShader: this.particle_vertexshader,
      fragmentShader: this.particle_fragmentshader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false
    });

    const positions = new Float32Array(this.rainParticleTotal * 3);
    const alphas = new Float32Array(this.rainParticleTotal);
    const sizes = new Float32Array(this.rainParticleTotal);

    const circleAngle = (2 * Math.PI) / this.rainParticleTotal;
    for (let i = 0, i3 = 0; i < this.rainParticleTotal; i++, i3 += 3) {
      const circleRadius = Math.random() * this.rainRingRadius;
      const vertex = new THREE.Vector3();
      vertex.x = circleRadius * Math.cos(circleAngle * i);
      vertex.y = Math.random() * this.rainMaxDistance;
      vertex.z = circleRadius * Math.sin(circleAngle * i);

      let destinationY = this.rainBuffer + this.rainMaxDistance;
      const startSize = Math.random() * this.rainSize;
      const startAlpha = Math.random();
      const startPercentage =
        (this.rainMaxDistance - vertex.y) / this.rainMaxDistance;
      const startVelocity =
        (1 - startPercentage) * ((this.rainMaxDistance * 2) / 100);

      vertex.y = vertex.y + this.rainBuffer;

      let originY = this.rainBuffer;

      if (i % 2 === 0) {
        vertex.y = -vertex.y;
        originY = -originY;
        destinationY = -destinationY;
      }

      positions[i3] = vertex.x;
      positions[i3 + 1] = vertex.y;
      positions[i3 + 2] = vertex.z;
      sizes[i] = startSize;
      alphas[i] = 1;

      this.rainDetails.push({
        origin: new THREE.Vector3(vertex.x, originY, vertex.z),
        current: new THREE.Vector3(vertex.x, vertex.y, vertex.z),
        destination: new THREE.Vector3(vertex.x, destinationY, vertex.z),
        size: startSize,
        alpha: startAlpha,
        velocity: startVelocity
      });
    }

    this.rainGeometry.addAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );

    this.rainGeometry.addAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.rainGeometry.addAttribute(
      'alpha',
      new THREE.BufferAttribute(alphas, 1)
    );
    const rainCloud = new THREE.Points(this.rainGeometry, rainShaderMaterial);
    this.rainObject.add(rainCloud);

    this.rainCreated = true;
  }
  addRingPulse() {
    this.ringPulseObject = new THREE.Group();
    this.ringPulseObject.name = 'ringPulse';

    for (let i = 0; i < this.ringPulseTotal; i++) {
      const vertex = new THREE.Vector3();
      vertex.x = this.ringPulseRadius * Math.cos(this.ringPulseAngle * i);
      vertex.y = 0;
      vertex.z = this.ringPulseRadius * Math.sin(this.ringPulseAngle * i);
      vertex.normalize();
      vertex.multiplyScalar(this.ringPulseRadius);
      this.ringPulseVerticesArray.push(vertex);
    }

    this.ringPulseBufferGeometry = new THREE.BufferGeometry();
    const ringPulseShaderUniforms = {
      color: { value: this.colorBase },
      fogColor: { type: 'c', value: this.scene.fog.color },
      fogNear: { type: 'f', value: this.scene.fog.near },
      fogFar: { type: 'f', value: this.scene.fog.far }
    };

    const ringPulseShaderMaterial = new THREE.ShaderMaterial({
      uniforms: ringPulseShaderUniforms,
      vertexShader: this.line_vertexshader,
      fragmentShader: this.line_fragmentshader,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      fog: true,
      transparent: true
    });

    const positions = new Float32Array(this.ringPulseVerticesArray.length * 3);
    const alphas = new Float32Array(this.ringPulseVerticesArray.length);

    const maxOpacity = 0.5;
    for (let i = 0; i < this.ringPulseVerticesArray.length; i++) {
      const vertex = this.ringPulseVerticesArray[i];
      positions[i * 3] = vertex.x;
      positions[i * 3 + 1] = vertex.y;
      positions[i * 3 + 2] = vertex.z;

      let tempOpacity = 0;
      const tempHalfOpacity = this.ringPulseTotal / 4;
      if (i < this.ringPulseTotal / 2) {
        if (i < tempHalfOpacity) {
          tempOpacity = (i / tempHalfOpacity) * maxOpacity;
        } else {
          tempOpacity = 1 - (i / tempHalfOpacity) * maxOpacity;
        }
      }
      alphas[i] = tempOpacity;
    }

    this.ringPulseBufferGeometry.addAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    this.ringPulseBufferGeometry.addAttribute(
      'alpha',
      new THREE.BufferAttribute(alphas, 1)
    );

    const ringPulseMesh = new THREE.LineLoop(
      this.ringPulseBufferGeometry,
      ringPulseShaderMaterial
    );

    this.ringPulseObject.add(ringPulseMesh);
    this.rotationObject.add(this.ringPulseObject);

    const ringExplosionTexture = new THREE.TextureLoader().load(
      'assets/images/ring_explosion.jpg'
    );
    const ringExplosionBufferGeometry = new THREE.PlaneBufferGeometry(
      this.ringExplosionSize,
      this.ringExplosionSize,
      1,
      1
    );

    const ringExplosionMaterial = new THREE.MeshBasicMaterial({
      map: ringExplosionTexture,
      color: this.colorBase85,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const ringExplosionMesh = new THREE.Mesh(
      ringExplosionBufferGeometry,
      ringExplosionMaterial
    );

    ringExplosionMesh.rotation.x = 90 * this.toRAD;
    ringExplosionMesh.name = 'ringExplosionMesh';
    ringExplosionMesh.visible = false;
    this.rotationObject.add(ringExplosionMesh);

    const ringPointGeometry = new THREE.Geometry();
    for (let i = 0; i < this.ringPointTotal; i++) {
      const vertex = new THREE.Vector3();
      vertex.x = this.ringPointRadius * Math.cos(this.ringPointAngle * i);
      vertex.y = 0;
      vertex.z = this.ringPointRadius * Math.sin(this.ringPointAngle * i);
      ringPointGeometry.vertices.push(vertex);
    }

    const ringPointMaterial = new THREE.PointsMaterial({
      size: this.ringPointSize,
      color: this.colorBase75,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const ringPointMesh: any = new THREE.Points(
      ringPointGeometry,
      ringPointMaterial
    );
    ringPointMesh.sortParticles = true;
    this.rotationObject.add(ringPointMesh);

    this.ringPulseCreated = true;
  }
  addSpikes() {
    this.spikesObject = new THREE.Group();
    this.spikesObject.name = 'spikesObject';
    this.rotationObject.add(this.spikesObject);

    const sphereSpikeRadius = this.globeRadius + 40;
    const sphereGeometry = new THREE.SphereGeometry(sphereSpikeRadius, 8, 4);
    sphereGeometry.mergeVertices();

    for (let i = 0; i < sphereGeometry.vertices.length; i++) {
      const vertex1 = new THREE.Vector3();
      vertex1.x = sphereGeometry.vertices[i].x;
      vertex1.y = sphereGeometry.vertices[i].y;
      vertex1.z = sphereGeometry.vertices[i].z;
      vertex1.normalize();
      vertex1.multiplyScalar(sphereSpikeRadius);

      const vertex2 = vertex1.clone();
      vertex2.multiplyScalar(1.03);
      this.spilesVerticesArray.push(vertex1);
      this.spilesVerticesArray.push(vertex2);
    }

    const spikeTotal = 400;
    const spikeAngle = (2 * Math.PI) / spikeTotal;
    for (let i = 0; i < spikeTotal; i++) {
      const vertex1 = new THREE.Vector3();
      vertex1.x = this.spikeRadius * Math.cos(spikeAngle * i);
      vertex1.y = 0;
      vertex1.z = this.spikeRadius * Math.sin(spikeAngle * i);
      vertex1.normalize();
      vertex1.multiplyScalar(this.spikeRadius);

      const vertex2 = vertex1.clone();
      if (i % 10 === 1) {
        vertex2.multiplyScalar(1.02);
      } else {
        vertex2.multiplyScalar(1.01);
      }

      this.spikesVerticesArray.push(vertex1);
      this.spikesVerticesArray.push(vertex2);
    }

    const positions = new Float32Array(this.spikesVerticesArray.length * 3);
    for (let i = 0; i < this.spikesVerticesArray.length; i++) {
      positions[i * 3] = this.spikesVerticesArray[i].x;
      positions[i * 3 + 1] = this.spikesVerticesArray[i].y;
      positions[i * 3 + 2] = this.spikesVerticesArray[i].z;
    }

    const spikesMaterial = new THREE.LineBasicMaterial({
      linewidth: 1,
      color: this.colorBase50,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      fog: true,
      depthWrite: false
    });

    this.spikesBufferGeometry = new THREE.BufferGeometry();
    this.spikesBufferGeometry.addAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );

    const spikesMesh = new THREE.LineSegments(
      this.spikesBufferGeometry,
      spikesMaterial
    );
    this.spikesObject.add(spikesMesh);
    this.spikesCreated = true;
  }
  addRings() {
    this.ringsObject = new THREE.Group();
    this.ringsObject.name = 'ringsObject';
    this.scene.add(this.ringsObject);

    this.ringLargeGeometry = new THREE.RingGeometry(200, 195, 128);
    this.ringMediumGeometry = new THREE.RingGeometry(100, 98, 120);

    this.ringsOuterMaterial = new THREE.MeshBasicMaterial({
      color: this.colorBase75,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      fog: true,
      depthWrite: false
    });

    this.ringsInnerMaterial = new THREE.MeshBasicMaterial({
      color: this.colorBase50,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      fog: true,
      depthWrite: false
    });

    const ringLargeMesh1 = new THREE.Mesh(
      this.ringLargeGeometry,
      this.ringsOuterMaterial
    );
    ringLargeMesh1.rotation.x = 90 * this.toRAD;
    const ringLargeMesh2 = ringLargeMesh1.clone();
    ringLargeMesh1.position.y = 90;
    ringLargeMesh2.position.y = -90;
    this.ringsObject.add(ringLargeMesh1);
    this.ringsObject.add(ringLargeMesh2);

    const ringMediumMesh1 = new THREE.Mesh(
      this.ringMediumGeometry,
      this.ringsInnerMaterial
    );
    ringMediumMesh1.rotation.x = 90 * this.toRAD;
    const ringMediumMesh2 = ringMediumMesh1.clone();
    ringMediumMesh1.position.y = 100;
    ringMediumMesh2.position.y = -100;
    this.ringsObject.add(ringMediumMesh1);
    this.ringsObject.add(ringMediumMesh2);

    this.ringsCreated = true;
  }
  addArcsAll() {
    this.arcAllObject = new THREE.Group();
    this.arcAllObject.name = 'arcsAll';

    for (let i = 0; i < dataMap.length - 1; i++) {
      const p1 = this.latLongToVector3(
        dataMap[0][2],
        dataMap[0][3],
        this.globeRadius,
        this.globeExtraDistance
      );

      const p4 = this.latLongToVector3(
        dataMap[i + 1][2],
        dataMap[i + 1][3],
        this.globeRadius,
        this.globeExtraDistance
      );

      const tempArcHeightMid = 1 + this.checkDistance(p1, p4) * 0.005;
      const pMid = new THREE.Vector3();
      pMid.addVectors(p1, p4);
      pMid.normalize().multiplyScalar(this.globeRadius * tempArcHeightMid);

      const tempArcHeight = 1 + this.checkDistance(p1, pMid) * 0.005;

      const p2 = new THREE.Vector3();
      p2.addVectors(p1, pMid);
      p2.normalize().multiplyScalar(this.globeRadius * tempArcHeight);

      const p3 = new THREE.Vector3();
      p3.addVectors(pMid, p4);
      p3.normalize().multiplyScalar(this.globeRadius * tempArcHeight);

      const curve = new THREE.CubicBezierCurve3(p1, p2, p3, p4);
      const curveVertices = curve.getPoints(this.lineBufferDivisions);
      for (let j = 0; j < this.lineBufferDivisions; j++) {
        this.arcAllsVerticesArray.push(curveVertices[j]);
        this.arcAllsVerticesArray.push(curveVertices[j + 1]);
      }
    }

    this.arcAllMaterial = new THREE.LineBasicMaterial({
      linewidth: 1,
      color: this.colorHighlight,
      transparent: true,
      blending: THREE.AdditiveBlending,
      fog: true,
      depthWrite: false
    });

    const positions = new Float32Array(this.arcAllsVerticesArray.length * 3);
    for (let i = 0; i < this.arcAllsVerticesArray.length; i++) {
      const vertice = this.arcAllsVerticesArray[i];
      positions[i * 3] = vertice.x;
      positions[i * 3 + 1] = vertice.y;
      positions[i * 3 + 2] = vertice.z;
    }

    this.arcAllBufferGeometry = new THREE.BufferGeometry();
    this.arcAllBufferGeometry.addAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );

    this.arcAllMesh = new THREE.LineSegments(
      this.arcAllBufferGeometry,
      this.arcAllMaterial
    );
    this.arcAllObject.add(this.arcAllMesh);
    this.arcAllObject.add(this.arcAllMesh);
    this.arcAllObject.visible = false;

    this.arcAllAnimation = new TimelineMax({ paused: true });
    this.arcAllAnimation.fromTo(
      this.arcAllMesh.material,
      2,
      { opacity: 0 },
      { opacity: 1 },
      0
    );
    this.arcAllAnimation.timeScale(1);
    this.arcAllCreated = true;
  }
  addArcsRocket() {
    this.arcRocketObject = new THREE.Group();
    this.arcRocketObject.name = 'arcsRocket';

    for (let i = 0; i < dataMap.length - 1; i++) {
      const p1 = this.latLongToVector3(
        dataMap[0][2],
        dataMap[0][3],
        this.globeRadius,
        this.globeExtraDistance
      );
      const p4 = this.latLongToVector3(
        dataMap[i + 1][2],
        dataMap[i + 1][3],
        this.globeRadius,
        this.globeExtraDistance
      );

      const tempArcHeightMid = 1 + this.checkDistance(p1, p4) * 0.006;
      const pMid = new THREE.Vector3();
      pMid.addVectors(p1, p4);
      pMid.normalize().multiplyScalar(this.globeRadius * tempArcHeightMid);

      const tempArcHeight = 1 + this.checkDistance(p1, pMid) * 0.006;
      const p2 = new THREE.Vector3();
      p2.addVectors(p1, pMid);
      p2.normalize().multiplyScalar(this.globeRadius * tempArcHeight);

      const p3 = new THREE.Vector3();
      p3.addVectors(pMid, p4);
      p3.normalize().multiplyScalar(this.globeRadius * tempArcHeight);

      const curve = new THREE.CubicBezierCurve3(p1, p2, p3, p4);
      const curveVertices = curve.getPoints(this.lineBufferDivisions);
      for (let j = 0; j < this.lineBufferDivisions; j++) {
        this.arcRocketVerticesArray.push(curveVertices[j]);
        this.arcRocketDetailsArray.push({ alpha: 0 });
        this.arcRocketVerticesArray.push(curveVertices[j + 1]);
        this.arcRocketDetailsArray.push({ alpha: 0 });
      }
    }

    this.arcRocketBufferGeometry = new THREE.BufferGeometry();
    const arcRocketShaderUniforms = {
      color: { value: this.colorHighlight },
      fogColor: { type: 'c', value: this.scene.fog.color },
      fogNear: { type: 'f', value: this.scene.fog.near },
      fogFar: { type: 'f', value: this.scene.fog.far }
    };

    this.arcRocketMaterial = new THREE.ShaderMaterial({
      uniforms: arcRocketShaderUniforms,
      vertexShader: this.line_vertexshader,
      fragmentShader: this.line_fragmentshader,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      fog: true,
      transparent: true
    });

    const positions = new Float32Array(this.arcRocketVerticesArray.length * 3);
    const alphas = new Float32Array(this.arcRocketVerticesArray.length);

    for (let i = 0; i < this.arcRocketVerticesArray.length; i++) {
      const vertice = this.arcRocketVerticesArray[i];

      positions[i * 3] = vertice.x;
      positions[i * 3 + 1] = vertice.y;
      positions[i * 3 + 2] = vertice.z;
      alphas[i] = 0;
    }

    this.arcRocketBufferGeometry.addAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );

    this.arcRocketBufferGeometry.addAttribute(
      'alpha',
      new THREE.BufferAttribute(alphas, 1)
    );

    const arcRocketMesh = new THREE.LineSegments(
      this.arcRocketBufferGeometry,
      this.arcRocketMaterial
    );
    this.arcRocketObject.add(arcRocketMesh);
    this.arcRocketObject.visible = false;
    this.arcRocketCreated = true;

    const that = this;
    this.arcRocketAnimation = new TimelineMax({
      paused: true,
      repeat: -1,
      onUpdate() {
        that.renderArcsRocket();
      }
    });

    this.arcRocketAnimation.staggerTo(
      this.arcRocketDetailsArray,
      0.25,
      { alpha: 0 },
      0.025,
      0
    );
    this.arcRocketAnimation.staggerFromTo(
      this.arcRocketDetailsArray,
      0.25,
      { alpha: 0 },
      { alpha: 1 },
      0.025,
      0
    );

    this.arcRocketAnimation.timeScale(2);
  }

  renderArcsRocket() {
    if (this.arcRocketCreated) {
      const attributes: any = this.arcRocketBufferGeometry.attributes;
      for (let i = 0; i < this.arcRocketDetailsArray.length; i++) {
        const pd = this.arcRocketDetailsArray[i];
        attributes.alpha[i] = pd.value;
      }
      attributes.alpha.needsUpdate = true;
    }
  }
  addArcsSnake() {
    this.arcsSnakeObject = new THREE.Group();
    this.arcsSnakeObject.name = 'arcSnake';

    for (let i = 0; i < dataMap.length - 1; i++) {
      const p1 = this.latLongToVector3(
        dataMap[i][2],
        dataMap[i][3],
        this.globeRadius,
        this.globeExtraDistance
      );

      const p4 = this.latLongToVector3(
        dataMap[i + 1][2],
        dataMap[i + 1][3],
        this.globeRadius,
        this.globeExtraDistance
      );

      const tempArcHeightMid = 1 + this.checkDistance(p1, p4) * 0.0065;
      const pMid = new THREE.Vector3();
      pMid.addVectors(p1, p4);
      pMid.normalize().multiplyScalar(this.globeRadius * tempArcHeightMid);

      const tempArcHeight = 1 + this.checkDistance(p1, pMid) * 0.0065;
      const p2 = new THREE.Vector3();
      p2.addVectors(p1, pMid);
      p2.normalize().multiplyScalar(this.globeRadius * tempArcHeight);

      const p3 = new THREE.Vector3();
      p3.addVectors(pMid, p4);
      p3.normalize().multiplyScalar(this.globeRadius * tempArcHeight);

      const curve = new THREE.CubicBezierCurve3(p1, p2, p3, p4);
      const curveVertices = curve.getPoints(this.lineBufferDivisions);
      for (let j = 0; j < this.lineBufferDivisions; j++) {
        this.arcSnakeVerticesArray.push(curveVertices[j]);
        this.arcSnakeDetailsArray.push({ alpha: 0 });
      }
    }

    this.arcSnakeBufferGeometry = new THREE.BufferGeometry();
    const arcSnakeShaderUniforms = {
      color: { value: this.colorHighlight },
      fogColor: { type: 'c', value: this.scene.fog.color },
      fogNear: { type: 'f', value: this.scene.fog.near },
      fogFar: { type: 'f', value: this.scene.fog.far }
    };
    const arcSnakeShaderMaterial = new THREE.ShaderMaterial({
      uniforms: arcSnakeShaderUniforms,
      vertexShader: this.line_vertexshader,
      fragmentShader: this.line_fragmentshader,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      fog: true,
      transparent: true
    });

    const positions = new Float32Array(this.arcSnakeVerticesArray.length * 3);
    const alphas = new Float32Array(this.arcSnakeVerticesArray.length);

    for (let i = 0; i < this.arcSnakeVerticesArray.length; i++) {
      const vertice = this.arcSnakeVerticesArray[i];
      positions[i * 3] = vertice.x;
      positions[i * 3 + 1] = vertice.y;
      positions[i * 3 + 2] = vertice.z;
      alphas[i] = 0;
    }

    this.arcSnakeBufferGeometry.addAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    this.arcSnakeBufferGeometry.addAttribute(
      'alpha',
      new THREE.BufferAttribute(alphas, 1)
    );

    const arcSnakeMesh = new THREE.Line(
      this.arcSnakeBufferGeometry,
      arcSnakeShaderMaterial
    );
    this.arcsSnakeObject.add(arcSnakeMesh);
    this.earthObject.add(this.arcsSnakeObject);

    this.arcSnakeCreated = true;

    const that = this;
    this.arcSnakeAnimation = new TimelineMax({
      paused: true,
      delay: 2,
      repeat: -1,
      onUpdate() {
        debugger;
        that.renderArcsSnake();
      }
    });

    for (let i = 0; i < this.dotSpritesHoverArray.length; i++) {
      const tempTarget = this.dotSpritesHoverArray[i];
      this.arcSnakeAnimation.fromTo(
        tempTarget.scale,
        1,
        { x: 2, y: 2 },
        { x: 10, y: 10, ease: Expo.easeOut },
        this.lineBufferDivisions * 0.025 * i
      );

      this.arcSnakeAnimation.fromTo(
        tempTarget.material,
        1.5,
        { opacity: 1 },
        { opacity: 0 },
        this.lineBufferDivisions * 0.025 * i
      );

      this.arcSnakeAnimation.fromTo(
        tempTarget,
        1.5,
        {},
        {
          onStart: function() {
            this.target.visible = true;
          },
          onComplete: function() {
            this.target.visible = false;
          }
        },
        this.lineBufferDivisions * 0.025 * i
      );
    }
    this.arcSnakeAnimation.staggerTo(
      this.arcSnakeDetailsArray,
      0.25,
      { alpha: 0 },
      0.025,
      2
    );

    this.arcSnakeAnimation.staggerFromTo(
      this.arcSnakeDetailsArray,
      0.25,
      { alpha: 0 },
      { alpha: 1 },
      0.025,
      0
    );
  }
  renderArcsSnake() {
    if (this.arcSnakeCreated) {
      const attributes: any = this.arcSnakeBufferGeometry.attributes;
      for (let i = 0; i < this.arcSnakeDetailsArray.length; i++) {
        const pd = this.arcSnakeDetailsArray[i];
        attributes.alpha.array[1] = pd.alpha;
      }
      attributes.alpha.needsUpdate = true;
    }
  }
  checkDistance(p1: THREE.Vector3, p2: THREE.Vector3) {
    return Math.sqrt(
      (p2.x - p1.x) * (p2.x - p1.x) +
        (p2.y - p1.y) * (p2.y - p1.y) +
        (p2.z - p1.z) * (p2.z - p1.z)
    );
  }

  initTHREE() {
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x000000, 0, 400);

    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      1,
      2000
    );

    this.camera.position.set(0, 0, 1000);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });

    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 1);

    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    const cameraHelper = new THREE.CameraHelper(this.camera);
    this.scene.add(cameraHelper);
  }

  addGroup() {
    this.rotationObject = new THREE.Group();
    this.rotationObject.name = 'rotationObject';
    this.rotationObject.rotation.x = this.openingRotationX;
    this.rotationObject.rotation.y = this.openingRotationY;

    this.scene.add(this.rotationObject);

    this.earthObject = new THREE.Group();
    this.earthObject.name = 'earthObject';
    this.earthObject.rotation.y = -90 * this.toRAD;
    this.rotationObject.add(this.earthObject);
  }
  addLights() {
    this.lightShield1 = new THREE.PointLight(
      this.colorBase,
      this.lightShieldIntensity,
      this.lightShieldDistance,
      this.lightShieldDecay
    );

    this.lightShield1.position.set(-50, 150, 75);
    this.lightShield1.name = 'lightShield1';
    this.scene.add(this.lightShield1);

    this.lightShield2 = new THREE.PointLight(
      this.colorBase,
      this.lightShieldIntensity,
      this.lightShieldDistance,
      this.lightShieldDecay
    );

    this.lightShield2.position.set(100, 50, 50);
    this.lightShield2.name = 'lightShield2';
    this.scene.add(this.lightShield2);

    this.lightShield3 = new THREE.PointLight(
      this.colorBase,
      this.lightShieldIntensity,
      this.lightShieldDistance,
      this.lightShieldDecay
    );

    this.lightShield3.position.set(0, -300, 50);
    this.lightShield3.name = 'lightShield3';
    this.scene.add(this.lightShield3);

    this.lightsCreated = true;
  }
  addUniverseBack() {
    const universeBgTexture = new THREE.TextureLoader().load(
      '/assets/images/universe.jpg'
    );
    universeBgTexture.anisotropy = 16;
    const universeBgGeo = new THREE.PlaneGeometry(1500, 750, 1, 1);
    this.universeBgMat = new THREE.MeshBasicMaterial({
      map: universeBgTexture,
      blending: THREE.AdditiveBlending,
      color: this.colorBase,
      transparent: true,
      opacity: 0,
      fog: false,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false
    });

    const universeBgMesh = new THREE.Mesh(universeBgGeo, this.universeBgMat);
    universeBgMesh.position.z = -400;
    universeBgMesh.name = 'universeBgMesh';
    this.scene.add(universeBgMesh);

    this.universeCreated = true;
  }
  addGlobe() {
    const globeBufferGeometry = new THREE.SphereBufferGeometry(
      this.globeRadius,
      64,
      64
    );

    const globeTexture = new THREE.TextureLoader().load(
      '/assets/images/map.png'
    );

    globeTexture.anisotropy = 16;

    const globeInnerMaterial = new THREE.MeshBasicMaterial({
      map: globeTexture,
      color: this.colorBase75,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      fog: true,
      depthWrite: false,
      depthTest: false
    });
    globeInnerMaterial.needsUpdate = true;
    const globeInnerMesh = new THREE.Mesh(
      globeBufferGeometry,
      globeInnerMaterial
    );

    this.earthObject.add(globeInnerMesh);

    const globeOuterMaterial = new THREE.MeshBasicMaterial({
      map: globeTexture,
      color: this.colorBase,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      fog: true,
      depthWrite: false,
      depthTest: false
    });
    globeOuterMaterial.needsUpdate = true;
    const globeOuterMesh = new THREE.Mesh(
      globeBufferGeometry,
      globeOuterMaterial
    );

    this.earthObject.add(globeOuterMesh);

    const globeShieldMaterial = new THREE.MeshPhongMaterial({
      color: this.colorBase75,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      opacity: 0,
      fog: false,
      depthWrite: false,
      depthTest: false
    });
    const globeShieldMesh = new THREE.Mesh(
      globeBufferGeometry,
      globeShieldMaterial
    );
    globeShieldMesh.name = 'globeShieldMesh';
    this.scene.add(globeShieldMesh);

    const img = new Image();
    img.src = '/assets/images/map_inverted.png';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, img.width, img.height);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const cruX = (i / 4) % canvas.width;
        const curY = (i / 4 - cruX) / canvas.width;
        if ((i / 4) % 2 === 1 && curY % 2 === 1) {
          const color = imgData.data[i];

          if (color === 0) {
            const x = cruX;
            const y = curY;

            const lat = (y / (canvas.height / 180) - 90) / -1;
            const lng = x / (canvas.width / 360) - 180;

            const position = this.latLongToVector3(
              lat,
              lng,
              this.globeRadius,
              -0.1
            );

            this.globeCloudVerticesArray.push(position);
          }
        }
      }

      this.globeCloudBufferGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(
        this.globeCloudVerticesArray.length * 3
      );
      for (let i = 0; i < this.globeCloudVerticesArray.length; i++) {
        positions[i * 3] = this.globeCloudVerticesArray[i].x;
        positions[i * 3 + 1] = this.globeCloudVerticesArray[i].y;
        positions[i * 3 + 2] = this.globeCloudVerticesArray[i].z;
      }

      this.globeCloudBufferGeometry.addAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      );

      const globeCloudMaterial = new THREE.PointsMaterial({
        size: 0.75,
        fog: true,
        vertexColors: THREE.VertexColors,
        depthWrite: false
      });

      const colors = new Float32Array(this.globeCloudVerticesArray.length * 3);
      const globeCloudColors = [];

      for (let i = 0; i < this.globeCloudVerticesArray.length; i++) {
        const tempPercentage = this.generateRandomNumber(80, 90) * 0.01;
        const shadedColor = this.shadeBlend(
          tempPercentage,
          this.colorPrimary_Base,
          this.colorDarken
        );
        globeCloudColors[i] = new THREE.Color(shadedColor);
      }

      for (let i = 0; i < this.globeCloudVerticesArray.length; i++) {
        colors[i * 3] = globeCloudColors[i].r;
        colors[i * 3 + 1] = globeCloudColors[i].g;
        colors[i * 3 + 2] = globeCloudColors[i].b;
      }

      this.globeCloudBufferGeometry.addAttribute(
        'color',
        new THREE.BufferAttribute(colors, 3)
      );

      // this.globeCloudBufferGeometry.colorsNeedUpdate = true;

      const globeCloud = new THREE.Points(
        this.globeCloudBufferGeometry,
        globeCloudMaterial
      );
      // globeCloud.sortParticles = true;
      globeCloud.name = 'globeCloud';
      this.earthObject.add(globeCloud);
    };

    const globeGlowSize = 200;
    const globeGlowTexture = new THREE.TextureLoader().load(
      '/assets/images/earth-glow.jpg'
    );
    globeGlowTexture.anisotropy = 2;

    globeGlowTexture.wrapS = globeGlowTexture.wrapT = THREE.RepeatWrapping;
    globeGlowTexture.magFilter = THREE.NearestFilter;
    globeGlowTexture.minFilter = THREE.NearestMipMapNearestFilter;

    const globeGlowBufferGeometry = new THREE.PlaneBufferGeometry(
      globeGlowSize,
      globeGlowSize,
      1,
      1
    );

    const globeGlowMaterial = new THREE.MeshBasicMaterial({
      map: globeGlowTexture,
      color: this.colorBase,
      transparent: true,
      opacity: 0,
      fog: false,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const globeGlowMesh = new THREE.Mesh(
      globeGlowBufferGeometry,
      globeGlowMaterial
    );
    globeGlowMesh.name = 'globeGlowMesh';
    this.scene.add(globeGlowMesh);

    this.globeCreated = true;
  }

  addDots() {
    const dotObject = new THREE.Group();
    dotObject.name = 'dotObject';
    this.earthObject.add(dotObject);

    const dotTexture = new THREE.TextureLoader().load(
      '/assets/images/dot-inverted.png'
    );
    const dotMaterial = new THREE.MeshBasicMaterial({
      map: dotTexture,
      color: this.colorHighlight,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      fog: true,
      depthWrite: false
    });

    for (let i = 0; i < dataMap.length; i++) {
      const bookType = dataMap[i][1];
      const x: any = dataMap[i][2];
      const y: any = dataMap[i][3];

      const dotGeometry = new THREE.PlaneBufferGeometry(1, 1, 1);

      const dotSprite = new THREE.Mesh(dotGeometry, dotMaterial);
      dotSprite.userData = { id: i };

      let randomExtra = 0.1;
      if (bookType === 2) randomExtra += 0.05;
      const dotPosition = this.latLongToVector3(
        x,
        y,
        this.globeRadius,
        this.globeExtraDistance + randomExtra
      );
      dotSprite.position.set(dotPosition.x, dotPosition.y, dotPosition.z);
      dotSprite.lookAt(new THREE.Vector3(0, 0, 0));

      let dotSize = 2;
      if (bookType === 2) dotSize = 3;

      dotSprite.scale.set(dotSize, dotSize, dotSize);

      this.dotDetailsArray.push({
        position: new THREE.Vector3(
          dotSprite.position.x,
          dotSprite.position.y,
          dotSprite.position.z
        ),
        type: bookType
      });

      this.dotSpritesArray.push(dotSprite);
      dotObject.add(dotSprite);

      const dotHoverMaterial = new THREE.MeshBasicMaterial({
        map: dotTexture,
        color: this.colorHighlight,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        opacity: 0,
        depthWrite: false
      });

      const dotHoverSprite = new THREE.Mesh(dotGeometry, dotHoverMaterial);

      const position = this.latLongToVector3(
        x,
        y,
        this.globeRadius,
        this.globeExtraDistance + randomExtra
      );
      dotHoverSprite.position.set(position.x, position.y, position.z);
      dotHoverSprite.lookAt(new THREE.Vector3(0, 0, 0));
      dotHoverSprite.visible = false;

      this.dotSpritesHoverArray.push(dotHoverSprite);
      dotObject.add(dotHoverSprite);
    }

    for (let i = 0; i < this.dotDetailsArray.length; i++) {
      const dotDetail = this.dotDetailsArray[i];
      const vertex1 = new THREE.Vector3();
      vertex1.x = dotDetail.position.x;
      vertex1.y = dotDetail.position.y;
      vertex1.z = dotDetail.position.z;

      const vertex2 = vertex1.clone();
      const tempScalar = Math.random() * 4 * 0.01;
      if (dotDetail.type === 2) {
        vertex2.multiplyScalar(1.12);
      } else if (dotDetail.type === 1 || dotDetail.type === 0) {
        vertex2.multiplyScalar(1.02 + tempScalar);
      }

      this.dotSpikesVerticesArray.push(vertex1);
      this.dotSpikesVerticesArray.push(vertex2);
      this.dotSpikesCloudVerticesArray.push(vertex2);
    }

    const positions = new Float32Array(this.dotSpikesVerticesArray.length * 3);
    for (let i = 0; i < this.dotSpikesVerticesArray.length; i++) {
      const dotSpike = this.dotSpikesVerticesArray[i];
      positions[i * 3] = dotSpike.x;
      positions[i * 3 + 1] = dotSpike.y;
      positions[i * 3 + 2] = dotSpike.z;
    }

    const dotSpikesMaterial = new THREE.LineBasicMaterial({
      linewidth: 1,
      color: this.colorHighlight,
      transparent: true,
      blending: THREE.AdditiveBlending,
      fog: true,
      depthWrite: false
    });

    const dotSpikesBufferGeometry = new THREE.BufferGeometry();
    dotSpikesBufferGeometry.addAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );

    const dotSpikesMesh = new THREE.LineSegments(
      dotSpikesBufferGeometry,
      dotSpikesMaterial
    );
    dotObject.add(dotSpikesMesh);

    const tempArray = [];

    for (let i = 0; i < this.dotSpikesCloudVerticesArray.length; i++) {
      const vertex1 = this.dotSpikesCloudVerticesArray[i];
      const vertex2 = vertex1.clone();
      vertex2.multiplyScalar(1.0025);
      tempArray.push(vertex1);
      tempArray.push(vertex2);
    }

    const spikesCloudPositions = new Float32Array(tempArray.length * 3);
    for (let i = 0; i < tempArray.length; i++) {
      const temp = tempArray[i];
      spikesCloudPositions[i * 3] = temp.x;
      spikesCloudPositions[i * 3 + 1] = temp.y;
      spikesCloudPositions[i * 3 + 2] = temp.z;
    }

    const dotSpikesExtraMaterial = new THREE.LineBasicMaterial({
      linewidth: 1,
      color: 0xffffff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      fog: true,
      depthWrite: false
    });

    const dotSpikesExtraBufferGeometry = new THREE.BufferGeometry();
    dotSpikesBufferGeometry.addAttribute(
      'position',
      new THREE.BufferAttribute(spikesCloudPositions, 3)
    );
    const dotSpikesExtraMesh = new THREE.LineSegments(
      dotSpikesExtraBufferGeometry,
      dotSpikesExtraMaterial
    );

    dotObject.add(dotSpikesExtraMesh);

    this.dotsCreated = true;
  }
  generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  latLongToVector3(lat, lng, radius: number, height: number) {
    const phi = (lat * Math.PI) / 180;
    const theta = ((lng - 180) * Math.PI) / 180;
    const x = -(radius + height) * Math.cos(phi) * Math.cos(theta);
    const y = (radius + height) * Math.sin(phi);
    const z = (radius + height) * Math.cos(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
  }
  update() {
    this.renderer.render(this.scene, this.camera);
    this.controls.update();

    if (this.globeCreated) {
      this.renderGlobe();
    }
    if (this.dotsCreated) {
      this.renderDots();
    }
    if (this.starsCreated) {
      this.renderStars();
    }
    if (this.ringPulseCreated) {
      this.renderRingPulse();
    }
    if (this.rainCreated) {
      this.renderRain();
    }
    if (this.ringsCreated) {
      this.renderRings();
    }
    // if (this.universeCreated) {
    //   this.universeBgMat.color = this.colorBase;
    //   this.universeBgMat.needsUpdate = true;
    // }
    requestAnimationFrame(this.update.bind(this));
  }
  renderRings() {
    this.ringsObject.rotation.x +=
      (this.targetTiltX - this.ringsObject.rotation.x) * 0.25;
    this.ringsObject.rotation.z -=
      (this.targetTiltY + this.ringsObject.rotation.z) * 0.25;
  }
  renderRain() {
    this.rainObject.rotation.y += this.rainObject.rotation.z + 0.0075;
    const attributes: any = this.rainGeometry.attributes;
    for (let i = 0, i3 = 0; i < this.rainDetails.length; i++, i3 += 3) {
      const pd = this.rainDetails[i];

      pd.velocity += this.rainVelocityFactor;
      if (pd.current.y > 0) {
        if (pd.current.y > pd.destination.y) {
          pd.current.y = this.rainBuffer;
          pd.velocity = 0;
        }
        pd.current.y = pd.current.y + pd.velocity;
      } else if (pd.current.y < 0) {
        if (pd.current.y < pd.destination.y) {
          pd.current.y = pd.origin.y;
          pd.velocity = 0;
        }
        pd.current.y = pd.current.y - pd.velocity;
      }
      attributes.position.array[i3 + 1] = pd.current.y;

      if (pd.current.y > 0) {
        pd.alpha =
          (pd.current.y - this.rainBuffer) /
          (pd.origin.y - this.rainBuffer + this.rainFadeDistance);
      }
    }
  }
  renderRingPulse() {
    this.ringPulseObject.rotation.y += 0.025;
  }
  renderStars() {
    this.starsObject.rotation.y += 0.00025;
    this.starsObject2.rotation.y += 0.00025;
  }
  renderDots() {
    const cameraThresholdZ = 200;
    const tempCameraZ = this.camera.position.z;
    let dotScale = 0;
    if (tempCameraZ < cameraThresholdZ && tempCameraZ > this.globeMaxZoom) {
      const tempDifference = cameraThresholdZ - this.globeMaxZoom;
      const tempScale = (cameraThresholdZ - tempCameraZ) / tempDifference;
      dotScale = tempScale * 1.25;
    }
    for (let i = 0; i < this.dotDetailsArray.length; i++) {
      const dotDetail = this.dotDetailsArray[i];
      let baseScale = 2;
      if (dotDetail.type === 2) baseScale = 3;

      this.dotSpritesArray[i].scale.set(
        baseScale - dotScale,
        baseScale - dotScale,
        1
      );
    }
  }
  renderGlobe() {}

  private shadeBlend(p, c0, c1) {
    const n = p < 0 ? p * -1 : p;
    if (c0.length > 7) {
      const f = c0.split(',');
      const t = (c1 ? c1 : p < 0 ? 'rgb(0,0,0)' : 'rgb(255,255,255)').split(
        ','
      );
      const R = Math.round(f[0].slice(4));
      const G = Math.round(f[1]);
      const B = Math.round(f[2]);

      return `rgb(${Math.round((parseInt(t[0].slice(4)) - R) * n) +
        R},${Math.round((parseInt(t[1]) - G) * n) + G},${Math.round(
        (parseInt(t[2]) - B) * n
      ) + B})`;
    } else {
      const f = parseInt(c0.slice(1), 16);
      const t = parseInt(
        (c1 ? c1 : p < 0 ? '#000000' : '#FFFFFF').slice(1),
        16
      );

      const R1 = f >> 16;
      const G1 = (f >> 8) & 0x00ff;
      const B1 = f & 0x0000ff;

      return `#${(
        0x1000000 +
        (Math.round(((t >> 16) - R1) * n) + R1) * 0x10000 +
        (Math.round(((t >> 8) & 0x00ff) - G1) * n + G1) * 0x100 +
        (Math.round(((t & 0x0000ff) - B1) * n) + B1)
      )
        .toString(16)
        .slice(1)}`;
    }
  }
}
