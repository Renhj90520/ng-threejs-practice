// @https://tympanus.net/codrops/2018/04/10/webgl-distortion-hover-effects/

class HoverImgEffect {
  constructor({ img1, img2, noise, parent }) {
    this.parent = parent;
    this.img1 = img1;
    this.img2 = img2;
    this.noise = noise;

    this.easing = Expo.easeOut;
    this.vertext = `
        varying vec2 vUv;
        
        void main () {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;

    this.fragment = `
        varying vec2 vUv;
        
        uniform sampler2D texture1;
        uniform sampler2D texture2;
        uniform sampler2D noise;
        
        uniform float hover;
        uniform float effectFactor;
  
        void main () {
          vec2 uv = vUv;
  
          vec4 noise = texture2D(noise, uv);
  
          vec4 texture1 = texture2D(texture1, vec2(uv.x + (hover * noise.r * effectFactor) , uv.y));
          vec4 texture2 = texture2D(texture2, vec2(uv.x + ((1.0 - hover) * noise.r), uv.y));
  
          vec4 color = mix(texture1,  texture2, hover);
          gl_FragColor = color;
  
          // vec3 c = step(0.5, uv.x) *  vec3(1.0, 0.1, 0.6);
          // gl_FragColor = vec4(c, 1.0);
          // gl_FragColor = vec4(1.0, 0.1, 0.6, 1.0);
        }
      `;

    this.init();
  }

  init() {
    let offsetWidth = this.parent.offsetWidth;
    let offsetHeight = this.parent.offsetHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(
      offsetWidth / -2,
      offsetWidth / 2,
      offsetHeight / 2,
      offsetHeight / -2,
      1,
      1000
    );
    this.camera.position.z = 1;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0xffff00, 0.0);
    this.renderer.setSize(offsetWidth, offsetHeight);
    this.parent.appendChild(this.renderer.domElement);

    this.scene.add(this.createMesh());

    this.addEvent();
    this.render();
  }

  createTexture({ src, wrap, filter, magFilter }) {
    let loader = new THREE.TextureLoader();
    loader.crossOrigin = '*';

    let texture = loader.load(src);
    if (wrap) {
      texture.wrapS = texture.wrapT = wrap;
    }

    return texture;
  }

  createGeometry() {
    let geometry = new THREE.PlaneBufferGeometry(
      this.parent.offsetWidth,
      this.parent.offsetHeight,
      1
    );

    return geometry;
  }

  createMaterial() {
    let material = new THREE.ShaderMaterial({
      uniforms: {
        texture1: {
          type: 't',
          value: this.createTexture({ src: this.img1 }),
        },
        texture2: {
          type: 't',
          value: this.createTexture({ src: this.img2 }),
        },
        noise: {
          type: 't',
          value: this.createTexture({
            src: this.noise,
            wrap: THREE.RepeatWrapping,
          }),
        },
        hover: {
          type: 'f',
          value: 0.0,
        },
        effectFactor: {
          type: 'f',
          value: 2.0,
        },
      },
      vertexShader: this.vertext,
      fragmentShader: this.fragment,
      transparent: false,
      opacity: 1.0,
    });

    return material;
  }

  createMesh() {
    this.geometry = this.createGeometry();
    this.material = this.createMaterial();

    let mesh = new THREE.Mesh(this.geometry, this.material);

    return mesh;
  }

  addEvent() {
    this.parent.addEventListener('mouseenter', (ev) => {
      TweenMax.to(this.material.uniforms.hover, 1, {
        value: 1,
        ease: this.easing,
      });
    });

    this.parent.addEventListener('mouseleave', (ev) => {
      TweenMax.to(this.material.uniforms.hover, 1, {
        value: 0,
        ease: this.easing,
      });
    });
  }
  render() {
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

let imgEffect = new HoverImgEffect({
  img1: 'https://res.cloudinary.com/dgvptzcjv/image/upload/v1586945925/Img22_exe2xi.jpg',
  img2: 'https://res.cloudinary.com/dgvptzcjv/image/upload/v1586945933/Img21_tbx1u6.jpg',
  noise:
    'https://res.cloudinary.com/dgvptzcjv/image/upload/v1586945944/6_q3kbag.jpg',
  parent: document.querySelector('.hover-box'),
});
