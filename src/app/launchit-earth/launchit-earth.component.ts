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
    unifomr float fogFar;

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
  arcSnakeCreated = false;
  arcSnakeAnimation: TimelineMax;
  arcSnakeBufferGeometry: THREE.BufferGeometry;
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.addGroup();
    this.addLights();
    this.addUniverseBack();
    this.addGlobe();
    this.addDots();
    this.addArcsSnake();
    this.update();
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
        debugger
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

    if (this.universeCreated) {
      this.universeBgMat.color = this.colorBase;
      this.universeBgMat.needsUpdate = true;
    }
    requestAnimationFrame(this.update.bind(this));
  }

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
