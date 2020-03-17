import {
  Component,
  OnInit,
  ViewChild,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import Heatmap from '../heatmap';

@Component({
  selector: 'app-valve-draw',
  templateUrl: './valve-draw.component.html',
  styleUrls: ['./valve-draw.component.css']
})
export class ValveDrawComponent implements OnInit, OnChanges {
  @ViewChild('canvas', { static: true }) canvasEl;
  @Input() data;
  @Input() pipeDiameterRatio = 0.3;
  @Input() circleDiameterRatio = 0.8;
  @Input() minDiameterRatio = 0.3;
  @Input() pipeSide = 'left';

  heatmap: Heatmap;
  width: any;
  height: any;
  pipeRadius: number;
  circleRadius: number;
  ctx: CanvasRenderingContext2D;
  centerHeight: number;
  topData: any;
  bottomData: any;
  centerColor: string;
  constructor() {
    this.heatmap = new Heatmap(null, 350);
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.data && this.data) {
      this.initCanvas();
      this.splitData();
      this.drawHorizontalPipe();
      this.drawVerticalPipe();
      this.drawCircle();
    }
  }
  splitData() {
    const dataLength = this.data.length;
    let centerValue;

    if (dataLength % 2 === 0) {
      centerValue = Math.max(
        this.data[dataLength / 2 - 1],
        this.data[dataLength]
      );
      this.topData = this.data.slice(0, dataLength / 2 - 1);
      this.bottomData = this.data.slice(dataLength / 2);
    } else {
      const centerIdx = Math.ceil(dataLength / 2) - 1;
      centerValue = this.data[centerIdx];
      this.topData = this.data.slice(0, centerIdx);
      this.bottomData = this.data.slice(centerIdx + 1);
    }

    this.centerColor = this.heatmap.getColorStr(
      this.heatmap.getColor(centerValue)
    );
  }
  drawCircle() {
    let centerX;
    if (this.pipeSide === 'left') {
      centerX = (this.width - this.pipeRadius * 2) / 2 + this.pipeRadius * 2;
    } else {
      centerX = (this.width - this.pipeRadius * 2) / 2;
    }
    const centerY = this.height / 2;

    const minRadius = (this.pipeRadius * 2) / 3;
    const leftRadius = this.circleRadius - minRadius;
    const dataLength = this.data.length;
    let circleCount;
    let centerValue;
    let mixValue = [];

    if (dataLength % 2 === 0) {
      circleCount = this.data.length / 2;
      centerValue = Math.max(
        this.data[circleCount - 1],
        this.data[circleCount]
      );
      for (let i = 0; i < this.data.length / 2; i++) {
        const val = this.data[i];
        const mirrorVal = this.data[dataLength - i - 1];
        mixValue.push(Math.floor((val + mirrorVal) / 2));
      }
    } else {
      circleCount = Math.floor(this.data.length / 2);
      centerValue = this.data[circleCount];

      for (let i = 0; i < (dataLength - 1) / 2; i++) {
        const val = this.data[i];
        const mirrorVal = this.data[dataLength - i - 1];
        mixValue.push(Math.floor((val + mirrorVal) / 2));
      }
    }

    const step = Math.ceil(leftRadius / mixValue.length);

    const centerColor = this.heatmap.getColorStr(
      this.heatmap.getColor(centerValue)
    );
    for (let i = 0; i < mixValue.length; i++) {
      const val = mixValue[i];
      let nextVal;
      if (i + 1 === mixValue.length) {
        nextVal = centerValue;
      } else {
        nextVal = mixValue[i + 1];
      }
      const nextColor = this.heatmap.getColorStr(
        this.heatmap.getColor(nextVal)
      );
      const color = this.heatmap.getColorStr(this.heatmap.getColor(val));
      const radius = this.circleRadius - step * i;
      const gradient = this.ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      );
      gradient.addColorStop(0, nextColor);
      gradient.addColorStop(1, color);

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    const image = document.createElement('canvas');
    const ctx = image.getContext('2d');
    image.width = 1;
    image.height = (this.pipeRadius * 2) / 3;
    let pipe;
    const y = Math.floor(this.height / 2 - image.height / 2);
    if (this.pipeSide === 'left') {
      pipe = this.ctx.getImageData(this.pipeRadius * 2, y, 1, image.height);
    } else {
      pipe = this.ctx.getImageData(0, y, 1, image.height);
    }
    ctx.putImageData(pipe, 0, 0);
    this.ctx.drawImage(
      image,
      0,
      0,
      1,
      image.height,
      centerX - this.circleRadius - 1,
      y,
      this.circleRadius * 2 + 2,
      image.height
    );
    this.ctx.fillStyle = centerColor;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, minRadius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }
  drawVerticalPipe() {
    const width = this.height / 2 + this.pipeRadius;
    const height = this.pipeRadius * 2;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    this.drawPipe(0, 0, width, ctx);

    const clearWidth = (this.pipeRadius * 2 - this.centerHeight) / 2;
    const clearHeight = Math.floor(this.pipeRadius * 2 - clearWidth);
    const verticalClip = this.ctx.getImageData(
      0,
      Math.ceil(this.height / 2 - this.pipeRadius),
      clearWidth + 2,
      clearHeight
    );
    this.ctx.save();
    if (this.pipeSide === 'left') {
      const horizontalClip = this.ctx.getImageData(
        0,
        this.height / 2 - this.pipeRadius,
        this.pipeRadius * 2,
        clearWidth
      );

      this.ctx.rotate(-Math.PI / 2);
      this.ctx.translate(-this.height, 0);
      this.ctx.drawImage(canvas, 0, 0, width, height);
      this.ctx.putImageData(
        verticalClip,
        clearWidth + this.centerHeight,
        Math.ceil(this.height / 2 - this.pipeRadius)
      );
      this.ctx.putImageData(
        horizontalClip,
        0,
        this.height / 2 - this.pipeRadius
      );

      this.ctx.fillStyle = 'lightgray';
      this.ctx.fillRect(0, 0, this.height / 2 + this.pipeRadius, clearWidth);
      this.ctx.fillRect(
        0,
        clearWidth + this.centerHeight,
        this.height / 2 - this.pipeRadius + clearWidth,
        clearWidth
      );
    } else {
      const horizontalClip = this.ctx.getImageData(
        0,
        this.height / 2 + this.pipeRadius - clearWidth,
        this.pipeRadius * 2,
        clearWidth
      );
      this.ctx.translate(this.width - this.pipeRadius * 2, 0);
      this.ctx.rotate(-Math.PI / 2);
      this.ctx.translate(-this.height / 2 - this.pipeRadius, 0);
      this.ctx.drawImage(canvas, 1, 0, width, height);
      this.ctx.putImageData(
        verticalClip,
        this.width - this.pipeRadius * 2,
        Math.ceil(this.height / 2 - this.pipeRadius)
      );

      this.ctx.putImageData(
        horizontalClip,
        this.width - this.pipeRadius * 2,
        this.height / 2 + this.pipeRadius - clearWidth
      );

      this.ctx.fillStyle = 'lightgray';
      this.ctx.fillRect(
        0,
        clearWidth + this.centerHeight,
        this.height / 2 + this.pipeRadius,
        clearWidth
      );
      this.ctx.fillRect(
        this.pipeRadius * 2 - clearWidth,
        0,
        this.height / 2 - this.pipeRadius + clearWidth,
        clearWidth
      );
    }
    this.ctx.restore();
  }
  drawHorizontalPipe() {
    const width = this.width;
    this.drawPipe(0, this.height / 2 - this.pipeRadius, width, this.ctx);
  }

  private drawPipe(x, y, width, ctx) {
    const topCanvas = document.createElement('canvas');
    const height = this.pipeRadius - this.centerHeight / 2;
    topCanvas.width = width;
    topCanvas.height = height;
    this.heatmap.drawGrid(topCanvas, this.topData);
    ctx.drawImage(topCanvas, 0, 0, width, height, x, y, width, height + 1);
    const bottomCanvas = document.createElement('canvas');
    bottomCanvas.width = width;
    bottomCanvas.height = height;
    this.heatmap.drawGrid(bottomCanvas, this.bottomData);
    ctx.drawImage(
      bottomCanvas,
      0,
      0,
      width,
      height,
      x,
      y + height + this.centerHeight,
      width,
      height
    );
    ctx.fillStyle = this.centerColor;
    ctx.fillRect(0, y + height, width, this.centerHeight);
  }

  private initCanvas() {
    const stage = this.canvasEl.nativeElement.parentElement;
    this.width = stage.clientWidth;
    this.height = stage.clientHeight;
    this.canvasEl.nativeElement.width = this.width;
    this.canvasEl.nativeElement.height = this.height;
    this.pipeRadius = (this.height * this.pipeDiameterRatio) / 2;
    const minRatio = Math.min(this.pipeDiameterRatio, this.minDiameterRatio);
    this.centerHeight = minRatio * (minRatio * this.height);
    this.circleRadius = (this.height * this.circleDiameterRatio) / 2;

    this.ctx = this.canvasEl.nativeElement.getContext('2d');
  }

  ngOnInit(): void {}
}
