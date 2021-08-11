import { Component, ElementRef, OnInit } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
@Component({
  selector: 'app-lonely-candle',
  templateUrl: './lonely-candle.component.html',
  styleUrls: ['./lonely-candle.component.css'],
})
export class LonelyCandleComponent implements OnInit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;

  width;
  height;
  controls: OrbitControls;
  clock = new THREE.Clock();
  time = 0;
  table: THREE.Mesh;

  vertexShader = `
    uniform float time;
    varying vec2 vUv;
    varying float hValue;

    // https://thebookofshaders.com/11/
    // 2D Random

    float random (in vec2 st) {
      return fract(sin(dot(st.xy, vec2(129898, 78.233))) * 43758.543123);
    }

    // 2D Noise based on Morgan McGuire @morgan3d
    // https://www.shadertoy.com/view/4dS3Wd

    float noise (in vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);

      //for corners in 2D of a tile
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));

      // smooth interpolation
      // cubic hermine curve. same as smoothstep()
      vec2 u = f * f * (3.0 - 2.0 * f);
      // u = smoothstep(0., 1., f);

      // mix 4 conrners percentages

      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
      vUv = uv;
      vec3 pos = position;

      pos *= vec3(.8, 2., .725);
      hValue = position.y;

      float posXZlen = length(position.xz);

      // flame height
      pos.y *= 1. + (cos((posXZlen + .25) * 3.1415926) * .25 + noise(vec2(0, time)) * .125 + noise(vec2(position.x + time, position.z + time)) * .5) * position.y;
      // flame trembling
      pos.x += noise(vec2(time * 2., (position.y - time) * 4.)) * hValue * .0312;
      pos.z += noise(vec2((position.y - time) * 4., time * 2.)) * hValue * .0312;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
    }
  `;

  fragmentShader = `
    varying float hValue;
    varying vec2 vUv;

    // https://www.shadertoy.com/view/4dsSzr
    vec3 heatmapGradient(float t) {
      return clamp((pow(t, 1.5) * .8 + .2) * vec3(smoothstep(.0, .35, t), smoothstep(.5, 1., t), max(1. - t * 1.7, t * 7. - 6.)), .0, 1.);
    }

    void main() {
      float v = abs(smoothstep(.0, .4, hValue) - 1.);
      float alpha = (1. - v) * .99; // bottom transparency
      alpha -= 1. - smoothstep(1., .97, hValue);// tip transparency
      gl_FragColor = vec4(heatmapGradient(smoothstep(.0, .3, hValue)) * vec3(.95, .95, .4), alpha);
      gl_FragColor.rgb = mix(vec3(0,0,1), gl_FragColor.rgb, smoothstep(0.0, 0.3, hValue)); // blueish for bottom
      gl_FragColor.rgb += vec3(1, 0.9, 0.5) * (1.25 - vUv.y); // make the midst brighter
      gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.66, 0.32, 0.03), smoothstep(0.95, 1., hValue)); // tip
    }
  `;
  flameMaterials = [];
  candleLight2: THREE.PointLight;
  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.initTHREE();
    this.addLights();
    this.addTable();
    this.addCandle();
    this.addPentagram();
    this.render();
  }
  addPentagram() {
    const penta = new THREE.CircleGeometry(7, 5);
    penta.rotateX(-Math.PI * 0.5);
    penta.vertices.shift();
    const pentagramGeo = new THREE.BufferGeometry().setFromPoints(
      penta.vertices
    );
    pentagramGeo.setIndex([
      0, 1, 1, 2, 2, 3, 3, 4, 4, 0, 0, 2, 2, 4, 4, 1, 1, 3, 3, 0,
    ]);

    const pentagram = new THREE.LineSegments(
      pentagramGeo,
      new THREE.LineBasicMaterial({ color: 0xff3311 })
    );
    pentagram.position.y = 0.01;
    this.scene.add(pentagram);
  }
  addCandle() {
    const casePath = new THREE.Path();
    casePath.moveTo(0, 0);
    casePath.lineTo(0, 0);
    casePath.absarc(1.5, 0.5, 0.5, Math.PI * 1.5, Math.PI * 2, false);
    casePath.lineTo(2, 1.5);
    casePath.lineTo(1.99, 1.5);
    casePath.lineTo(1.9, 0.5);

    const caseGeo = new THREE.LatheBufferGeometry(casePath.getPoints(), 64);
    const caseMat = new THREE.MeshStandardMaterial({ color: 'silver' });
    const caseMesh = new THREE.Mesh(caseGeo, caseMat);
    caseMesh.castShadow = true;

    //paraffin
    const paraffinPath = new THREE.Path();
    paraffinPath.moveTo(0, -0.25);
    paraffinPath.lineTo(0, -0.25);
    paraffinPath.absarc(1, 0, 0.25, Math.PI * 1.5, Math.PI * 2, false);
    paraffinPath.lineTo(1.25, 0);
    paraffinPath.absarc(1.89, 0.1, 0.1, Math.PI * 1.5, Math.PI * 2, false);
    const paraffinGeo = new THREE.LatheBufferGeometry(
      paraffinPath.getPoints(),
      64
    );
    paraffinGeo.translate(0, 1.25, 0);
    const paraffinMat = new THREE.MeshStandardMaterial({
      color: 0xffff99,
      side: THREE.BackSide,
      metalness: 0,
      roughness: 0.75,
    });

    const paraffin = new THREE.Mesh(paraffinGeo, paraffinMat);
    caseMesh.add(paraffin);

    // candlewick
    const candlewickProfile = new THREE.Shape();
    candlewickProfile.absarc(0, 0, 0.0625, 0, Math.PI * 2, false);

    const candlewickCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.5, -0.06525),
      new THREE.Vector3(0.25, 0.5, 0.125),
    ]);

    const candlewickGeo = new THREE.ExtrudeBufferGeometry(candlewickProfile, {
      steps: 8,
      bevelEnabled: false,
      extrudePath: candlewickCurve,
    });

    const colors = [];
    const color1 = new THREE.Color('black');
    const color2 = new THREE.Color(0x994411);
    const color3 = new THREE.Color(0xffff44);

    for (let i = 0; i < candlewickGeo.attributes.position.count; i++) {
      if (candlewickGeo.attributes.position.getY(i) < 0.4) {
        color1.toArray(colors, i * 3);
      } else {
        color2.toArray(colors, i * 3);
      }

      if (candlewickGeo.attributes.position.getY(i) < 0.15) {
        color3.toArray(colors, i * 3);
      }
    }

    candlewickGeo.setAttribute(
      'color',
      new THREE.BufferAttribute(new Float32Array(colors), 3)
    );
    candlewickGeo.translate(0, 0.95, 0);
    const candlewickMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
    });

    const candlewick = new THREE.Mesh(candlewickGeo, candlewickMat);
    caseMesh.add(candlewick);

    // candle light
    const candleLight = new THREE.PointLight(0xffaa33, 1, 5, 2);
    candleLight.position.set(0, 3, 0);
    candleLight.castShadow = true;
    caseMesh.add(candleLight);

    this.candleLight2 = new THREE.PointLight(0xffaa33, 1, 10, 2);
    this.candleLight2.position.set(0, 4, 0);
    this.candleLight2.castShadow = true;
    caseMesh.add(this.candleLight2);

    // flame

    this.flameMaterials = [];

    const flame = () => {
      const flameGeo = new THREE.SphereBufferGeometry(0.5, 32, 32);
      flameGeo.translate(0, 0.5, 0);
      const flameMat = this.getFlameMaterial(true);

      this.flameMaterials.push(flameMat);
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(0.06, 1.2, 0.06);
      flame.position.y = THREE.MathUtils.degToRad(-45);
      caseMesh.add(flame);
    };

    flame();
    flame();
    this.table.add(caseMesh);
  }
  addTable() {
    const tableGeo = new THREE.CylinderBufferGeometry(14, 14, 0.5, 64);
    tableGeo.translate(0, -0.25, 0);
    const loader = new THREE.TextureLoader();
    const tableTexture = loader.load('/assets/images/hardwood2_diffuse.jpg');
    const tableMaterial = new THREE.MeshStandardMaterial({
      map: tableTexture,
      metalness: 0,
      roughness: 0.75,
    });

    this.table = new THREE.Mesh(tableGeo, tableMaterial);
    this.table.receiveShadow = true;
    this.scene.add(this.table);
  }

  addLights() {
    const light = new THREE.DirectionalLight(0xffffff, 0.025);
    light.position.setScalar(10);
    const lightHelper = new THREE.DirectionalLightHelper(light);
    this.scene.add(light);
    // this.scene.add(lightHelper);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.0625));
  }
  initTHREE() {
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.width / this.height,
      1,
      1000
    );

    this.camera.position.set(3, 5, 8).setLength(15);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x101005);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.minPolarAngle = THREE.MathUtils.degToRad(60);
    this.controls.maxPolarAngle = THREE.MathUtils.degToRad(95);
    this.controls.minDistance = 4;
    this.controls.maxDistance = 20;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 1;
    this.controls.target.set(0, 2, 0);
  }

  render() {
    requestAnimationFrame(this.render.bind(this));
    this.time += this.clock.getDelta();

    this.flameMaterials[0].uniforms.time.value = this.time;
    this.flameMaterials[1].uniforms.time.value = this.time;

    this.candleLight2.position.x = Math.sin(this.time * Math.PI) * 0.25;
    this.candleLight2.position.z = Math.cos(this.time * Math.PI * 0.75) * 0.25;
    this.candleLight2.intensity =
      2 +
      Math.sin(this.time * Math.PI * 2) *
        Math.cos(this.time * Math.PI * 1.5) *
        0.25;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  getFlameMaterial(isFrontSide) {
    const side = isFrontSide ? THREE.FrontSide : THREE.BackSide;

    return new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      transparent: true,
      side: side,
    });
  }
}
