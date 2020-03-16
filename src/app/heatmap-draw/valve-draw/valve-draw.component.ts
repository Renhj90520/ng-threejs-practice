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
  @Input() pipeSide = 'left';

  heatmap: Heatmap;
  width: any;
  height: any;
  pipeRadius: number;
  circleRadius: number;
  ctx: CanvasRenderingContext2D;
  constructor() {
    this.heatmap = new Heatmap(null, 350);
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.data && this.data) {
      this.initCanvas();
      this.drawHorizontalPipe();
      this.drawVerticalPipe();
    }
  }
  drawVerticalPipe() {
    const width = this.height / 2 + this.pipeRadius;
    const height = this.pipeRadius * 2;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    this.heatmap.drawGrid(canvas, this.data);
    const clearWidth = Math.ceil((this.pipeRadius * 2) / 3);
    const clearHeight = this.pipeRadius * 2;
    const verticalClip = this.ctx.getImageData(
      0,
      this.height / 2 - this.pipeRadius,
      clearWidth,
      clearHeight
    );
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
        2 * clearWidth,
        this.height / 2 - this.pipeRadius
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
        2 * clearWidth,
        this.height / 2 - this.pipeRadius + clearWidth,
        clearWidth
      );
      this.ctx.restore();
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
      this.ctx.drawImage(canvas, 0, 0, width, height);
      this.ctx.putImageData(
        verticalClip,
        this.width - this.pipeRadius * 2,
        this.height / 2 - this.pipeRadius
      );

      this.ctx.putImageData(
        horizontalClip,
        this.width - this.pipeRadius * 2,
        this.height / 2 + this.pipeRadius - clearWidth
      );

      this.ctx.fillStyle = 'lightgray';
      this.ctx.fillRect(
        0,
        2 * clearWidth,
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
    const height = 2 * this.pipeRadius;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    this.heatmap.drawGrid(canvas, this.data);

    this.ctx.drawImage(
      canvas,
      0,
      0,
      width,
      height,
      0,
      this.height / 2 - this.pipeRadius,
      width,
      height
    );
  }

  private initCanvas() {
    const stage = this.canvasEl.nativeElement.parentElement;
    this.width = stage.clientWidth;
    this.height = stage.clientHeight;
    this.canvasEl.nativeElement.width = this.width;
    this.canvasEl.nativeElement.height = this.height;
    this.pipeRadius = (this.height * this.pipeDiameterRatio) / 2;
    this.circleRadius = (this.height * this.circleDiameterRatio) / 2;

    this.ctx = this.canvasEl.nativeElement.getContext('2d');
  }

  ngOnInit(): void {}
}
