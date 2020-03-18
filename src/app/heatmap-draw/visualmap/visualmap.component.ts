import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  Input
} from '@angular/core';

@Component({
  selector: 'app-visualmap',
  templateUrl: './visualmap.component.html',
  styleUrls: ['./visualmap.component.css']
})
export class VisualmapComponent implements OnInit, OnChanges {
  labels = [];
  @Input() max = 350;
  constructor() {}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.max && this.max) {
      this.labels = [];
      this.labels.push(
        this.max,
        Math.floor(this.max * 0.8),
        Math.floor(this.max * 0.6),
        Math.floor(this.max * 0.4),
        Math.floor(this.max * 0.2),
        0
      );
    }
  }

  ngOnInit(): void {}
}
