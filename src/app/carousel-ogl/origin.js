import {
  Renderer,
  Program,
  Mesh,
  Triangle,
  Texture,
  TextureLoader,
  Vec2,
} from 'https://cdn.skypack.dev/ogl';
import { gsap } from 'https://cdn.skypack.dev/gsap';

class App {
  constructor(target) {
    this.target = target;
    this.currentTextureIndex = 0;
    this.nextTextureIndex = 0;
    this.isAnimating = false;

    this._resizeCb = () => this._onResize();
    this._clickCb = (e) => this._onClick(e);
  }

  init() {
    this._setup();
    this._addListeners();
    this._loadTextures();
    this._createBackground();
    this._onResize();

    gsap.ticker.add(() => {
      this._updateTexturesUniforms();

      this.renderer.render({
        scene: this.mesh,
      });
    });
  }

  destroy() {
    this._removeListeners();
  }

  _setup() {
    this.renderer = new Renderer();
    this.gl = this.renderer.gl;

    this.target.appendChild(this.gl.canvas);

    this.gl.clearColor(1, 1, 1, 1);

    this.slides = [...document.querySelectorAll('[data-slide]')];

    // Upload empty textures while source loading
    this.textures = [
      new Texture(this.gl),
      new Texture(this.gl),
      new Texture(this.gl),
      new Texture(this.gl),
    ];
  }

  _loadTextures() {
    const urls = [
      'https://picsum.photos/id/218/1920/1280',
      'https://picsum.photos/id/202/1920/1280',
      'https://picsum.photos/id/173/1920/1280',
      'https://picsum.photos/id/227/1920/1280',
    ];

    urls.forEach((url, index) => {
      const img = new Image();

      img.crossOrigin = 'anonymous';

      img.onload = () => {
        this.textures[index].image = img;
      };

      img.src = urls[index];
    });
  }

  _updateTexturesUniforms() {
    this.program.uniforms[`uTexture0Size`].value = new Vec2(
      this.textures[this.currentTextureIndex].width,
      this.textures[this.currentTextureIndex].height
    );

    this.program.uniforms[`uTexture1Size`].value = new Vec2(
      this.textures[this.nextTextureIndex].width,
      this.textures[this.nextTextureIndex].height
    );
  }

  _createBackground() {
    const geometry = new Triangle(this.gl);

    this.program = new Program(this.gl, {
      vertex: document.querySelector('[data-vertex-shader]').textContent,
      fragment: document.querySelector('[data-fragment-shader]').textContent,
      uniforms: {
        uScreenSize: { value: new Vec2() },
        uProgress: { value: 0 },
        uTexture0: { value: this.textures[0] },
        uTexture0Size: { value: new Vec2() },
        uTexture1: { value: this.textures[1] },
        uTexture1Size: { value: new Vec2() },
        uRotationDirection: { value: 1 },
      },
    });

    this.mesh = new Mesh(this.gl, { geometry, program: this.program });
  }

  _addListeners() {
    window.addEventListener('resize', this._resizeCb, { passive: true });

    document.querySelectorAll('#controls button').forEach((btn) => {
      btn.addEventListener('click', this._clickCb);
    });
  }

  _removeListeners() {
    window.removeEventListener('resize', this._resizeCb, { passive: true });

    document.querySelectorAll('#controls button').forEach((btn) => {
      btn.removeEventListener('click', this._clickCb);
    });
  }

  _onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.program.uniforms.uScreenSize.value = new Vec2(
      window.innerWidth,
      window.innerHeight
    );
  }

  _onClick(e) {
    if (this.isAnimating) return;

    const currentTitle =
      this.slides[this.currentTextureIndex].querySelector('[data-slide-title]');
    const currentSubtitle = this.slides[this.currentTextureIndex].querySelector(
      '[data-slide-subtitle]'
    );

    const dir = parseInt(e.target.dataset.dir);

    this.nextTextureIndex = this.nextTextureIndex + dir;
    if (this.nextTextureIndex == this.textures.length)
      this.nextTextureIndex = 0;
    if (this.nextTextureIndex < 0)
      this.nextTextureIndex = this.textures.length - 1;

    const nextTitle =
      this.slides[this.nextTextureIndex].querySelector('[data-slide-title]');
    const nextSubtitle = this.slides[this.nextTextureIndex].querySelector(
      '[data-slide-subtitle]'
    );

    const tl = new gsap.timeline({
      onStart: () => {
        this.isAnimating = true;

        this.program.uniforms.uTexture1.value =
          this.textures[this.nextTextureIndex];
        this.program.uniforms.uRotationDirection.value = dir;
      },
      onComplete: () => {
        this.isAnimating = false;
      },
    });

    tl.to([currentTitle, currentSubtitle], {
      opacity: 0,
      duration: 0.8,
      onComplete: () => {
        this.slides[this.currentTextureIndex].removeAttribute('data-current');
        gsap.set(currentTitle, { clearProps: 'opacity' });
      },
    })

      .to(
        this.program.uniforms.uProgress,
        {
          value: 1,
          duration: 1.6,
          onComplete: () => {
            this.currentTextureIndex = this.nextTextureIndex;

            this.program.uniforms.uTexture0.value =
              this.textures[this.currentTextureIndex];
            this.program.uniforms.uProgress.value = 0;
          },
        },
        '<0.2'
      )

      .call(
        () => {
          this.slides[this.nextTextureIndex].setAttribute('data-current', '');
        },
        null,
        '>-0.6'
      )

      .fromTo(
        nextTitle,
        {
          clipPath: 'polygon(-10% -30%, 110% -30%, 110% -30%, -10% -30%)',
          yPercent: 100,
        },
        {
          clipPath: 'polygon(-10% -30%, 110% -30%, 110% 130%, -10% 130%)',
          yPercent: 0,
          duration: 0.7,
        },
        '<'
      )

      .fromTo(
        nextSubtitle,
        {
          opacity: 0,
        },
        {
          opacity: 1,
        },
        '<0.2'
      )

      .set([nextTitle, nextSubtitle], { clearProps: 'all' });
  }
}

new App(document.querySelector('#app')).init();
