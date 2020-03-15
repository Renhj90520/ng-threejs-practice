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
  @Input()
  gradient = {
    0: 'blue',
    0.25: 'cyan',
    0.5: 'lime',
    0.75: 'yellow',
    1.0: 'red'
  };
  width: any;
  height: any;
  ctx: CanvasRenderingContext2D;
  grad;

  parsedData = [];

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
      this.parseData(pointWidth, pointHeight);
      this.drawGrid();
    }
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

  drawGrid() {
    if (!this.grad) this.createGradient(this.gradient);

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.imageSmoothingEnabled = true;

    const image = document.createElement('canvas');
    const rowCount = this.parsedData.length;
    const columnCount = this.parsedData[0].length;
    image.width = columnCount;
    image.height = rowCount;
    const imgCtx = image.getContext('2d');

    for (let i = 0; i < this.parsedData.length; i++) {
      const row = this.parsedData[i];
      for (let j = 0; j < row.length; j++) {
        const p = row[j];
        const selfColor = this.getColorStr(this.getColor(p[4]));
        imgCtx.fillStyle = selfColor;
        imgCtx.fillRect(j, i, 1, 1);
      }
    }

    this.ctx.drawImage(image, 0, 0, this.width, this.height);
  }

  private fillRadialGradient() {
    for (let i = 0; i < this.parsedData.length; i++) {
      const row = this.parsedData[i];
      for (let j = 0; j < row.length; j++) {
        const p = row[j];
        const selfColor = this.getColor(p[4]);
        let color = selfColor.slice();
        let hasLeft = false;
        let hasTop = false;
        let hasRight = false;
        let hasBottom = false;
        if (j > 0) {
          hasLeft = true;
        }
        if (j < row.length - 1) {
          hasRight = true;
        }
        if (i > 0) {
          hasTop = true;
        }
        if (i < this.parsedData.length - 1) {
          hasBottom = true;
        }
        if (hasLeft) {
          color = this.mixLeft(i, j, color);
          if (hasTop) {
            color = this.mixTop(i, j, color);
            color = this.mixTopLeft(i, j, color);
          }
          if (hasBottom) {
            color = this.mixBottom(i, j, color);
            color = this.mixLeftBottom(i, j, color);
          }
        } else {
          if (hasTop) {
            color = this.mixTop(i, j, color);
          }
          if (hasBottom) {
            color = this.mixBottom(i, j, color);
          }
        }
        if (hasRight) {
          color = this.mixRight(i, j, color);
          if (hasTop) {
            color = this.mixRightTop(i, j, color);
          }
          if (hasBottom) {
            color = this.mixRightBottom(i, j, color);
          }
        }
        const selfColorStr = this.getColorStr(selfColor);
        const mixColorStr = this.getColorStr(color);
        const x = p[0];
        const y = p[1];
        const width = p[2];
        const height = p[3];
        const radius = Math.max(width, height) / 2;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const gradient = this.ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          radius
        );
        gradient.addColorStop(0, selfColorStr);
        gradient.addColorStop(1, mixColorStr);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, width, height);
      }
    }
  }

  private mixRightBottom(i: number, j: number, color: any[]) {
    return this.mixColor(color, i + 1, j + 1);
  }

  private mixRightTop(i: number, j: number, color: any[]) {
    return this.mixColor(color, i - 1, j + 1);
  }

  private mixRight(i: number, j: number, color: any[]) {
    return this.mixColor(color, i, j + 1);
  }

  private mixLeftBottom(i: number, j: number, color: any[]) {
    return this.mixColor(color, i + 1, j - 1);
  }

  private mixBottom(i: number, j: number, color: any[]) {
    return this.mixColor(color, i + 1, j);
  }

  private mixTopLeft(i: number, j: number, color: any[]) {
    return this.mixColor(color, i - 1, j - 1);
  }

  private mixTop(i: number, j: number, color: any[]) {
    return this.mixColor(color, i - 1, j);
  }

  private mixLeft(i: number, j: number, color: any[]) {
    return this.mixColor(color, i, j - 1);
  }

  mixColor(color, i, j) {
    const targetColor = this.getColor(this.parsedData[i][j][4]);
    color = [
      (color[0] + targetColor[0]) / 2,
      (color[1] + targetColor[1]) / 2,
      (color[2] + targetColor[2]) / 2,
      (color[3] + targetColor[3]) / 2
    ];
    return color;
  }

  private linearFill() {
    const canvasH = document.createElement('canvas');
    canvasH.width = this.width;
    canvasH.height = this.height;
    const canvasV = document.createElement('canvas');
    canvasV.width = this.width;
    canvasV.height = this.height;
    const ctxH = canvasH.getContext('2d');
    const ctxV = canvasV.getContext('2d');
    for (let i = 0; i < this.parsedData.length; i++) {
      const row = this.parsedData[i];
      for (let j = 0; j < row.length; j++) {
        const p = row[j];
        const selfColor = this.getColor(p[4]);

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
          const leftMix = this.mixTwoColor(leftColor, selfColor);
          horizontalGradient.addStop(0, leftMix);
          if (right) {
            horizontalGradient.addStop(0.5, this.getColorStr(selfColor));
            const rightColor = this.getColor(right[4]);
            const rightMix = this.mixTwoColor(selfColor, rightColor);
            horizontalGradient.addStop(1, rightMix);
          } else {
            horizontalGradient.addStop(1, this.getColorStr(selfColor));
          }
        } else {
          horizontalGradient.addStop(0, this.getColorStr(selfColor));
          const rightColor = this.getColor(right[4]);
          const rightMix = this.mixTwoColor(selfColor, rightColor);
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
          const topMix = this.mixTwoColor(topColor, selfColor);
          verticalGradient.addStop(0, topMix);
          if (bottom) {
            verticalGradient.addStop(0.5, this.getColorStr(selfColor));
            const bottomColor = this.getColor(bottom[4]);
            const bottomMix = this.mixTwoColor(selfColor, bottomColor);
            verticalGradient.addStop(1, bottomMix);
          } else {
            verticalGradient.addStop(1, this.getColorStr(selfColor));
          }
        } else {
          verticalGradient.addStop(0, this.getColorStr(selfColor));
          const bottomColor = this.getColor(bottom[4]);
          const bottomMix = this.mixTwoColor(selfColor, bottomColor);
          verticalGradient.addStop(1, bottomMix);
        }
        const fillColor1 = verticalGradient.gradient;
        ctxV.fillStyle = fillColor1;
        ctxV.fillRect(p[0], p[1], p[2], p[3]);
      }
    }

    this.ctx.drawImage(canvasH, 0, 0);
  }

  mixTwoColor(c0, c1) {
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
