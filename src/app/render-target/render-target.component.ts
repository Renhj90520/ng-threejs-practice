import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import * as THREE from 'three';
@Component({
  selector: 'app-render-target',
  templateUrl: './render-target.component.html',
  styleUrls: ['./render-target.component.css'],
})
export class RenderTargetComponent implements OnInit {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.Camera;
  mouseCoord = new THREE.Vector3();
  mouse = new THREE.Vector3();
  pmouse = new THREE.Vector3();
  width;
  height;
  basic_vert = `
    precision highp float;
    
    void main() {
      gl_Position = vec4(position, vec2(1.));
    }
  `;

  prep_frag = `
    precision highp float;

    void main() {
      gl_FragColor.z = .012;
    }
  `;

  physics_frag = `
    precision highp float;

    uniform vec3 mouse;
    uniform vec3 pmouse;
    uniform vec2 resolution;
    uniform sampler2D texture;

    float distToSegment(vec2 x1, vec2 x2, vec2 p) {
      vec2 v = x2 - x1;
      vec2 w = p - x1;

      float c1 = dot(w, v);
      float c2 = dot(v, v);

      // if c2 <= c1  == c1
      // if c2 >  c1  == c2
      float div = mix(c2, c1, step(c2, c1));

      // if c1 < 0 == 0.0
      float mult = step(.0, c1);

      float b = c1 * mult / div;
      vec2 pb = x1 + b * v;

      return distance(p, pb);
    }

    vec3 computeNormal(vec4 n) {
      // pixel scale
      vec2 un = 1. / resolution;
      vec2 uv = gl_FragCoord.xy * un;

      // tex sample neighbour-4
      vec3 n_r = texture2D(texture, uv + vec2(1, 0) * un).xyz;
      vec3 n_l = texture2D(texture, uv - vec2(1, 0) * un).xyz;
      vec3 n_u = texture2D(texture, uv + vec2(0, 1) * un).xyz;
      vec3 n_d = texture2D(texture, uv - vec2(0, 1) * un).xyz;

      // partial differnences n-4
      vec4 dn = vec4(n.z);
      dn -= vec4(n_r.z, n_l.z, n_u.z, n_d.z);

      // right - left, up - bottom;
      vec2 xy = vec2(dn.x - dn.y, dn.z - dn.w);
      xy += n_r.xy + n_l.xy + n_u.xy +n_d.xy;
      xy *= .972; // energy disipation

      float z;
      z += dot(n_r.xy, - vec2(1, 0));
      z += dot(n_l.xy, + vec2(1, 0));
      z += dot(n_u.xy, - vec2(0, 1));
      z += dot(n_d.xy, + vec2(0, 1));

      return vec3(xy, z) * .25;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution;
      float asp = resolution.x / resolution.y; // aspect

      // normal sampling
      vec4 h = texture2D(texture, uv);

      // previous velocity
      float vel = h.a;
      // apply elastic-viscous acceleration
      // acc = - offset * elasticity - vel * viscosity
      vel += -(h.z - 0.012) * .016 - vel * .059;

      // compute normal advection
      vec3 f = computeNormal(h);
      f.z += h.z + vel;

      // mouse interaction - continuous distance from mouse
      float dist = distToSegment(
        vec2( pmouse.x * asp, pmouse.y), // previous mouse
        vec2( mouse.x * asp, mouse.y), // current mouse
        vec2( uv.x * asp, uv.y) // fragcoord
      );

      float mSize = .065; // mouse radius
      float peak = .9; // max-height

      float isDisp = step(.5, mouse.z); // is displaced

      if( mouse.z > .5 && dist <= mSize) {
        
        float dst = (mSize - dist) / mSize;
        f.z += pow( abs(dst), 1.9 ) * peak * 2.5;
        f.xy -= f.xy * pow(abs(dst), 3.9) * .1;
        f.z = min(peak, f.z);
      }

      gl_FragColor = clamp(vec4(f, vel), -1.0, 1.);
    }
  `;

  light_frag = `
    precision highp float;

    #define RECIPROCAL_PI 0.31830988618

    uniform vec2 resolution;
    uniform sampler2D texture;

    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    vec3 dithering(vec3 color) {
      // calculate grid position
      float grid_position = rand(gl_FragCoord.xy);

      // shift the individual colors differently, thus making it even harder to see the dithering pattern
      vec3 dither_shift_RGB = vec3(.25 / 255., -0.25 / 255., .25 / 255.);

      // modify shift acording to grid position
      dither_shift_RGB = mix(2. * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position);

      // shift the color by dither_shift
      return color + dither_shift_RGB;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution.xy;
      vec3 N = texture2D(texture, uv).xyz;

      vec3 viewPos = vec3(0., .0, 1.2);
      vec3 lightPos = vec3(.0, 1.5, .98);
      vec3 fragPos = vec3((2. * uv - 1.), N.z);

      vec3 L = normalize(lightPos - fragPos);
      vec3 H = normalize(L + normalize(viewPos - fragPos));
      vec3 dN = vec3(N.xy, N.z / 2. + .28);

      float dif = max(dot(dN, L), .0);
      float spec = clamp(dot(normalize(N), H), .0,1.);

      float attenuation = 1. - length(lightPos - fragPos) / 3.1;
      vec3 dif_int = vec3(dif * .056 * attenuation);

      float shininess = 4.8;
      float ref = RECIPROCAL_PI * (shininess * .5 + 1.) * pow(spec, shininess);
      vec3 spec_int = vec3(ref * .38 * pow(attenuation, 3.));

      vec3 col = dif_int + spec_int;
      col = pow(col, vec3(1. / 2.2));
      col.r = mix(col.r * 1.28, col.r, length(dif_int) * 1.2 / 3.);

      gl_FragColor = vec4(dithering(col), 1.);
    }
  `;
  res: THREE.Vector2;
  rtt: THREE.WebGLRenderTarget;
  rtt2: any;
  mesh: THREE.Mesh;
  physicsMaterial: THREE.ShaderMaterial;
  lightsMaterial: THREE.ShaderMaterial;
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initThree();
    this.addRenderTarget();
    this.update();
  }
  addRenderTarget() {
    this.rtt = new THREE.WebGLRenderTarget(this.width, this.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
        ? THREE.HalfFloatType
        : THREE.FloatType,
      depthBuffer: false,
      stencilBuffer: false,
    });

    this.rtt2 = this.rtt.clone();

    const copyMaterial = new THREE.ShaderMaterial({
      vertexShader: this.basic_vert,
      fragmentShader: this.prep_frag,
      blending: THREE.NoBlending,
      transparent: false,
      fog: false,
      lights: false,
      depthWrite: false,
      depthTest: false,
    });

    this.physicsMaterial = new THREE.ShaderMaterial({
      uniforms: {
        mouse: { value: this.mouse },
        pmouse: { value: this.pmouse },
        resolution: { value: this.res },
        texture: { value: null },
      },
      vertexShader: this.basic_vert,
      fragmentShader: this.physics_frag,
      blending: THREE.NoBlending,
      transparent: false,
      fog: false,
      lights: false,
      depthWrite: false,
      depthTest: false,
    });

    this.lightsMaterial = new THREE.ShaderMaterial({
      uniforms: {
        resolution: { value: this.res },
        texture: { value: null },
      },
      vertexShader: this.basic_vert,
      fragmentShader: this.light_frag,
      blending: THREE.NoBlending,
      transparent: false,
      fog: false,
      lights: false,
      depthWrite: false,
      depthTest: false,
    });

    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([-1.0, -1.0, 3.0, -1.0, -1.0, 3.0]);

    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 2));
    this.mesh = new THREE.Mesh(geometry, copyMaterial);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);

    this.renderer.setRenderTarget(this.rtt);
    this.renderer.render(this.scene, this.camera);

    this.renderer.setRenderTarget(this.rtt2);
    this.renderer.render(this.scene, this.camera);

    this.mesh.material = this.physicsMaterial;
  }
  initThree() {
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;
    this.res = new THREE.Vector2(this.width, this.height);

    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(this.width, this.height);
    this.el.nativeElement.appendChild(this.renderer.domElement);
  }
  update() {
    const temp = this.rtt;
    this.rtt = this.rtt2;
    this.rtt2 = temp;

    this.pmouse.copy(this.mouse);
    this.mouse.copy(this.mouseCoord);

    if (this.pmouse.z === 0) {
      this.pmouse.copy(this.mouse);
    }
    this.mesh.material = this.physicsMaterial;
    (this.mesh.material as THREE.ShaderMaterial).uniforms.texture.value =
      this.rtt2.texture;
    this.renderer.setRenderTarget(this.rtt);
    this.renderer.render(this.scene, this.camera);

    this.mesh.material = this.lightsMaterial;
    (this.mesh.material as THREE.ShaderMaterial).uniforms.texture.value =
      this.rtt.texture;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.update.bind(this));
  }

  @HostListener('mousemove', ['$event'])
  mousemove(evt) {
    this.mouseCoord.x = evt.clientX / this.width;
    this.mouseCoord.y = 1 - evt.clientY / this.height;
    this.mouseCoord.z = 1;
  }
  @HostListener('mouseout')
  mouseout() {
    this.mouseCoord.z = 0;
  }

  @HostListener('touchmove', ['$event'])
  @HostListener('touchstart', ['$event'])
  touchmove(evt) {
    evt.preventDefault();

    this.mouseCoord.x = evt.touches[0].clientX / this.width;
    this.mouseCoord.y = 1 - evt.touches[0].clientY / this.height;
    this.mouseCoord.z = 1;
  }
  @HostListener('touchend')
  touchend() {
    this.mouseCoord.z = 0;
  }

  @HostListener('window.resize')
  resize() {
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;

    this.res.set(this.width, this.height);
    this.rtt.setSize(this.width, this.height);
    this.rtt2.setSize(this.width, this.height);
    this.renderer.setSize(this.width, this.height);
  }
}
