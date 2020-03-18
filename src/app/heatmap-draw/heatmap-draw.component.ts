import {
  Component,
  OnInit,
  ViewChild,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import Heatmap from './heatmap';

@Component({
  selector: 'app-heatmap-draw',
  templateUrl: './heatmap-draw.component.html',
  styleUrls: ['./heatmap-draw.component.css']
})
export class HeatmapDrawComponent implements OnInit, OnChanges {
  @ViewChild('canvasInternal', { static: true }) canvasInternalEl;
  @ViewChild('canvasExternal', { static: true }) canvasExternalEl;
  @Input() internalData;
  @Input() externalData;
  @Input() valveData;
  heatmap: Heatmap;
  max = 350;

  constructor() {
    this.heatmap = new Heatmap(null, this.max);
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.internalData && this.internalData) {
      this.heatmap.drawGrid(
        this.canvasInternalEl.nativeElement,
        this.internalData
      );
    }

    if (changes.externalData && this.externalData) {
      this.heatmap.drawGrid(
        this.canvasExternalEl.nativeElement,
        this.externalData
      );
    }
  }

  ngOnInit(): void {}
}
