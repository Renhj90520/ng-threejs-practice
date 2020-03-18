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
  selector: 'app-cloud-temperature',
  templateUrl: './cloud-temperature.component.html',
  styleUrls: ['./cloud-temperature.component.css']
})
export class CloudTemperatureComponent implements OnInit, OnChanges {
  @ViewChild('canvas', { static: true }) canvasEl;
  @Input() data;
  heatmap: Heatmap;
  max = 350;
  constructor() {
    this.heatmap = new Heatmap(null, this.max);
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.data && this.data) {
      this.heatmap.drawRadial(this.canvasEl.nativeElement, this.data);
    }
  }

  ngOnInit(): void {}
}
