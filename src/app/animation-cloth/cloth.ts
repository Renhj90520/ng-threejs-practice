import Particle from './particle';
import { restDistance } from './utils';

export default class Cloth {
  w;
  h;

  MASS = 0.1;
  particles: any[];
  constraints: any[];
  constructor(w = 10, h = 10) {
    this.w = w;
    this.h = h;

    const particles = [];
    const constraints = [];

    for (let v = 0; v <= h; v++) {
      for (let u = 0; u <= w; u++) {
        particles.push(new Particle(u / w, v / h, 0, this.MASS));
      }
    }

    for (let v = 0; v < h; v++) {
      for (let u = 0; u < w; u++) {
        constraints.push([
          particles[this.index(u, v)],
          particles[this.index(u, v + 1)],
          restDistance,
        ]);

        constraints.push([
          particles[this.index(u, v)],
          particles[this.index(u + 1, v)],
          restDistance,
        ]);
      }
    }

    for (let u = w, v = 0; v < h; v++) {
      constraints.push([
        particles[this.index(u, v)],
        particles[this.index(u, v + 1)],
        restDistance,
      ]);
    }

    for (let v = h, u = 0; u < w; u++) {
      constraints.push([
        particles[this.index(u, v)],
        particles[this.index(u + 1, v)],
        restDistance,
      ]);
    }

    this.particles = particles;
    this.constraints = constraints;
  }

  index(u, v) {
    return u + v * (this.w + 1);
  }
}
