export default class LinearGradient {
  x1: any;
  x2: any;
  y1: any;
  y2: any;
  gradient: any;
  constructor(x1, y1, x2, y2, ctx: CanvasRenderingContext2D) {
    this.x1 = x1;
    this.x2 = x2;
    this.y1 = y1;
    this.y2 = y2;

    this.gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  }

  addStop(position, color) {
    this.gradient.addColorStop(position, color);
    this.gradient;
  }
}
