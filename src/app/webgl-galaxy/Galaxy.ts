export default class Galaxy {
  num = 10000;
  axis1;
  axis2;
  armsAngle;
  bulbSize;
  ellipticity;
  constructor() {
    this.axis1 = 60 + Math.random() * 20;
    this.axis2 = this.axis1 + 20 + Math.random() * 40;
    this.armsAngle = (Math.random() * 2 - 1 > 0 ? 1 : -1) * 12 + 3;
    this.bulbSize = Math.random() * 0.6;
    this.ellipticity = 0.2 + Math.random() * 0.2;
  }

  createStars() {
    const stars = [];

    for (let i = 0; i < this.num; i++) {
      const dist = Math.random();
      const angle = (dist - this.bulbSize) * this.armsAngle;

      const a = this.axis2 * dist;
      const b = this.axis1 * dist;

      const e = Math.sqrt(a * a - b * b) / a;

      const phi =
        ((this.ellipticity * Math.PI) / 2) *
        (1 - dist) *
        (Math.random() * 2 - 1);
      let theta = Math.random() * Math.PI * 2;

      const radius =
        Math.sqrt((b * b) / (1 - e * e * Math.pow(Math.cos(theta), 2))) *
        (1 + Math.random() * 0.1);

      if (dist > this.bulbSize) theta += angle;

      stars.push({
        x: Math.cos(phi) * Math.cos(theta) * radius,
        y: Math.cos(phi) * Math.sin(theta) * radius,
        z: Math.sin(phi) * radius
      });
    }
    return stars;
  }
}
