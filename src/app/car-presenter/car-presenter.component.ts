import { Component, OnInit, ViewChild } from "@angular/core";

@Component({
  selector: "app-car-presenter",
  templateUrl: "./car-presenter.component.html",
  styleUrls: ["./car-presenter.component.css"]
})
export class CarPresenterComponent implements OnInit {
  @ViewChild("stage") stageEl;
  constructor() {}

  ngOnInit() {}
}
