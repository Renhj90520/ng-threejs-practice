import {
  Component,
  OnInit,
  ViewChild,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import LinearGradient from './linear-gradient';

@Component({
  selector: 'app-heatmap-draw',
  templateUrl: './heatmap-draw.component.html',
  styleUrls: ['./heatmap-draw.component.css']
})
export class HeatmapDrawComponent implements OnInit, OnChanges {
  @ViewChild('canvas', { static: true }) canvasEl;
  @Input() data = [];
  @Input() max = 500;
  @Input() gradient;

  defaultRadius = 25;
  defaultGradient = {
    0: 'blue',
    0.25: 'cyan',
    0.5: 'lime',
    0.75: 'yellow',
    1.0: 'red'
  };
  width: any;
  height: any;
  ctx: any;
  circle: any;
  radius: any;
  grad;

  parsedData = [];

  blur;
  rect: any;
  constructor() {}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.data && this.data) {
      this.initCanvas();
      this.drawData();
    } else {
      this.parsedData = [];
      this.clear();
    }
  }

  ngOnInit(): void {
    this.initCanvas();
  }
  private initCanvas() {
    if (!this.ctx) {
      const stage = this.canvasEl.nativeElement.parentElement;
      this.width = stage.clientWidth;
      this.height = stage.clientHeight;
      this.canvasEl.nativeElement.width = this.width;
      this.canvasEl.nativeElement.height = this.height;
      this.ctx = this.canvasEl.nativeElement.getContext('2d');
    }
  }

  private drawData() {
    if (this.data.length > 0 && this.ctx) {
      const rowCount = this.data.length;
      const columnCount = this.data[0].length;
      const pointWidth = Math.floor(this.width / columnCount);
      const pointHeight = Math.floor(this.height / rowCount);
      // const pointWidth = this.width / columnCount;
      // const pointHeight = this.height / rowCount;
      this.parseData(pointWidth, pointHeight);
      this.draw();
    }
  }

  createRect(width, height) {
    this.rect = document.createElement('canvas');
    const ctx = this.rect.getContext('2d');

    this.rect.width = width;
    this.rect.height = height;

    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.fill();
  }

  createGradient(grad) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);

    canvas.width = 1;
    canvas.height = 256;
    for (const i in grad) {
      gradient.addColorStop(+i, grad[i]);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1, 256);

    this.grad = ctx.getImageData(0, 0, 1, 256).data;
  }

  draw() {
    if (!this.grad) this.createGradient(this.defaultGradient);

    const canvasH = document.createElement('canvas');
    canvasH.width = this.width;
    canvasH.height = this.height;
    const canvasV = document.createElement('canvas');
    canvasV.width = this.width;
    canvasV.height = this.height;
    const ctxH = canvasH.getContext('2d');
    const ctxV = canvasV.getContext('2d');
    this.ctx.clearRect(0, 0, this.width, this.height);
    for (let i = 0; i < this.parsedData.length; i++) {
      const row = this.parsedData[i];
      for (let j = 0; j < row.length; j++) {
        const p = row[j];
        const selfColor = this.getColor(p[4]);

        ctxH.beginPath();

        this.linearFill(j, row, p, ctxH, selfColor, i, ctxV);
      }
    }
    this.ctx.imageSmoothingEnabled = true;
    // this.ctx.drawImage(canvasV, 0, 0);
    const imageData1 = ctxH.getImageData(0, 0, this.width, this.height);
    const imageData2 = ctxV.getImageData(0, 0, this.width, this.height);
    let pixels = 4 * this.width * this.height;
    while (pixels--) {
      imageData1.data[pixels] = Math.floor(
        (imageData1.data[pixels] + imageData2.data[pixels]) / 2
      );
    }
    this.ctx.putImageData(imageData1, 0, 0);
  }
  private linearFill(
    j: number,
    row: any,
    p: any,
    ctxH: CanvasRenderingContext2D,
    selfColor: any[],
    i: number,
    ctxV: CanvasRenderingContext2D
  ) {
    let left;
    if (j > 0) {
      left = row[j - 1];
    }
    let right;
    if (j < row.length - 1) {
      right = row[j + 1];
    }
    const horizontalGradient = new LinearGradient(
      p[0],
      p[1],
      p[0] + p[2],
      p[1],
      ctxH
    );
    if (left) {
      const leftColor = this.getColor(left[4]);
      const leftMix = this.mixColor(leftColor, selfColor);
      horizontalGradient.addStop(0, leftMix);
      if (right) {
        horizontalGradient.addStop(0.5, this.getColorStr(selfColor));
        const rightColor = this.getColor(right[4]);
        const rightMix = this.mixColor(selfColor, rightColor);
        horizontalGradient.addStop(1, rightMix);
      } else {
        horizontalGradient.addStop(1, this.getColorStr(selfColor));
      }
    } else {
      horizontalGradient.addStop(0, this.getColorStr(selfColor));
      const rightColor = this.getColor(right[4]);
      const rightMix = this.mixColor(selfColor, rightColor);
      horizontalGradient.addStop(1, rightMix);
    }
    const fillColor = horizontalGradient.gradient;
    ctxH.fillStyle = fillColor;
    ctxH.fillRect(p[0], p[1], p[2], p[3]);
    let top;
    if (i > 0) {
      top = this.parsedData[i - 1][j];
    }
    let bottom;
    if (i < row.length - 1) {
      bottom = this.parsedData[i + 1][j];
    }
    const verticalGradient = new LinearGradient(
      p[0],
      p[1],
      p[0],
      p[1] + p[3],
      ctxH
    );
    if (top) {
      const topColor = this.getColor(top[4]);
      const topMix = this.mixColor(topColor, selfColor);
      verticalGradient.addStop(0, topMix);
      if (bottom) {
        verticalGradient.addStop(0.5, this.getColorStr(selfColor));
        const bottomColor = this.getColor(bottom[4]);
        const bottomMix = this.mixColor(selfColor, bottomColor);
        verticalGradient.addStop(1, bottomMix);
      } else {
        verticalGradient.addStop(1, this.getColorStr(selfColor));
      }
    } else {
      verticalGradient.addStop(0, this.getColorStr(selfColor));
      const bottomColor = this.getColor(bottom[4]);
      const bottomMix = this.mixColor(selfColor, bottomColor);
      verticalGradient.addStop(1, bottomMix);
    }
    const fillColor1 = verticalGradient.gradient;
    ctxV.fillStyle = fillColor1;
    ctxV.fillRect(p[0], p[1], p[2], p[3]);
  }

  mixColor(c0, c1) {
    const r = Math.floor((c0[0] + c1[0]) / 2);
    const g = Math.floor((c0[1] + c1[1]) / 2);
    const b = Math.floor((c0[2] + c1[2]) / 2);
    const a = Math.floor((c0[3] + c1[3]) / 2);
    return this.getColorStr([r, g, b, a]);
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
  parseData(width, height) {
    console.log(width);
    console.log(height);
    for (let i = 0; i < this.data.length; i++) {
      const row = this.data[i];
      const newRow = [];
      for (let j = 0; j < row.length; j++) {
        const temperature = this.data[i][j];
        const x = j * width;
        const y = i * height;
        newRow.push([x, y, width, height, temperature]);
      }
      this.parsedData.push(newRow);
    }
  }

  clear() {
    if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height);
  }
}
