import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.css']
})
export class GalleryComponent implements OnInit {
  heatmapdata = [];
  constructor() {}

  ngOnInit() {
    for (let i = 0; i < 42; i++) {
      const row = [];
      for (let j = 0; j < 13; j++) {
        row.push(200);
      }
      this.heatmapdata.push(row);
    }
  }
}
