export default class Heatmap {
  max = 500;
  gradient = {
    0: 'blue',
    0.25: 'cyan',
    0.5: 'lime',
    0.75: 'yellow',
    1.0: 'red'
  };
  grad;

  constructor(gradient?, max?) {
    this.max = max || this.max;
    this.gradient = gradient || this.gradient;

    this.createGradient();
  }
  createGradient() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);

    canvas.width = 1;
    canvas.height = 256;
    for (const i in this.gradient) {
      gradient.addColorStop(+i, this.gradient[i]);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1, 256);

    this.grad = ctx.getImageData(0, 0, 1, 256).data;
  }
  drawGrid(canvas, data) {
    const { ctx, width, height } = this.initCanvas(canvas);

    const image = document.createElement('canvas');
    const rowCount = data.length;
    const columnCount = Array.isArray(data[0]) ? data[0].length : 1;
    image.width = columnCount;
    image.height = rowCount;
    const imgCtx = image.getContext('2d');

    for (let i = 0; i < data.length; i++) {
      let row = data[i];
      if (!Array.isArray(row)) {
        row = [row];
      }
      for (let j = 0; j < row.length; j++) {
        const p = row[j];
        const selfColor = this.getColorStr(this.getColor(p));
        imgCtx.fillStyle = selfColor;
        imgCtx.fillRect(j, i, 1, 1);
      }
    }

    ctx.drawImage(image, 0, 0, width, height);
  }
  private initCanvas(canvas) {
    const stage = canvas.parentElement;
    let width, height;
    if (stage) {
      width = stage.clientWidth;
      height = stage.clientHeight;
    } else {
      width = canvas.width;
      height = canvas.height;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    return { ctx, width, height };
  }

  getColor(pointValue) {
    const ratio = pointValue / this.max;
    const scaleIdx = Math.floor(256 * ratio) - 1;
    const colorIdx = scaleIdx * 4;
    const r = this.grad[colorIdx];
    const g = this.grad[colorIdx + 1];
    const b = this.grad[colorIdx + 2];
    const a = this.grad[colorIdx + 3];

    return [r, g, b, a];
  }
  getColorStr(color) {
    return `rgba(${color[0]},${color[1]},${color[2]},${color[3]})`;
  }
}
