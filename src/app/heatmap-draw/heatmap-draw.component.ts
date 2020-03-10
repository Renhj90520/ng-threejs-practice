import {
  Component,
  OnInit,
  ViewChild,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';

@Component({
  selector: 'app-heatmap-draw',
  templateUrl: './heatmap-draw.component.html',
  styleUrls: ['./heatmap-draw.component.css']
})
export class HeatmapDrawComponent implements OnInit, OnChanges {
  @ViewChild('canvas', { static: true }) canvasEl;
  @Input() data = [];
  @Input() max = 1;
  @Input() gradient;

  defaultRadius = 25;
  defaultGradient = {
    0.4: 'blue',
    0.6: 'cyan',
    0.7: 'lime',
    0.8: 'yellow',
    1.0: 'red'
  };
  width: any;
  height: any;
  ctx: any;
  circle: any;
  radius: any;
  grad: Uint8ClampedArray;

  parsedData = [];

  blur;
  constructor() {}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.data && this.data) {
      this.drawData();
    } else {
      this.parsedData = [];
      this.clear();
    }
  }

  ngOnInit(): void {
    const stage = this.canvasEl.nativeElement.parentElement;
    this.width = stage.clientWidth;
    this.height = stage.clientHeight;
    this.canvasEl.nativeElement.width = this.width;
    this.canvasEl.nativeElement.height = this.height;
    this.ctx = this.canvasEl.nativeElement.getContext('2d');
    this.drawData();
  }
  private drawData() {
    if (this.data.length > 0 && this.ctx) {
      const rowCount = this.data.length;
      const columnCount = this.data[0].length;
      const pointWidth = this.width / columnCount;
      const pointHeight = this.height / rowCount;
      this.radius = Math.min(pointWidth, pointHeight);
      this.blur = Math.abs(pointWidth - pointHeight);
      this.parseData(pointWidth, pointHeight);
      this.draw();
    }
  }
  createCircle(radius) {
    // const blur = this.blur || 15;
    this.circle = document.createElement('canvas');
    const ctx = this.circle.getContext('2d');
    // this.radius = radius + blur;
    this.circle.width = this.radius * 2;
    this.circle.height = this.radius * 2;

    ctx.shadowOffsetX = ctx.shadowOffsetY = this.radius * 2;
    ctx.shadowBlur = this.blur;
    ctx.shadowColor = 'black';

    ctx.beginPath();
    ctx.arc(-this.radius, -this.radius, radius, 0, Math.PI * 2, true);
    ctx.closePath();
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

  draw(minOpacity = 0.05) {
    if (!this.circle) this.createCircle(this.defaultRadius);
    if (!this.grad) this.createGradient(this.defaultGradient);

    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.parsedData.length; i++) {
      const p = this.parsedData[i];
      this.ctx.globalAlpha = Math.min(Math.max(p[2] / this.max, minOpacity), 1);
      this.ctx.drawImage(this.circle, p[0] - this.radius, p[1] - this.radius);
    }
    const colored = this.ctx.getImageData(0, 0, this.width, this.height);

    this.colorized(colored.data, this.grad);
    this.ctx.putImageData(colored, 0, 0);
  }
  colorized(pixels, gradient) {
    let offset;
    for (let i = 0; i < pixels.length; i += 4) {
      offset = pixels[i + 3] * 4;
      if (offset) {
        pixels[i] = gradient[offset];
        pixels[i + 1] = gradient[offset + 1];
        pixels[i + 2] = gradient[offset + 2];
      }
    }
  }
  parseData(width, height) {
    for (let i = 0; i < this.data.length; i++) {
      const row = this.data[i];
      for (let j = 0; j < row.length; j++) {
        const temperature = this.data[i][j];
        const x = width / 2 + j * width;
        const y = height / 2 + i * height;
        this.parsedData.push([x, y, temperature]);
      }
    }
  }

  clear() {
    if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height);
  }
  // animate() {
  //   requestAnimationFrame(this.animate.bind(this));

  //   this.data.push([
  //     Math.random() * this.width,
  //     Math.random() * this.height,
  //     Math.random() * 1500
  //   ]);

  //   this.draw();
  // }
}
