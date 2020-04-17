import { Component, OnInit, ViewChild } from '@angular/core';
import { ResourceManager } from './resource-manager';
import Stage from './stage';
@Component({
  selector: 'app-showroom',
  templateUrl: './showroom.component.html',
  styleUrls: ['./showroom.component.css'],
})
export class ShowroomComponent implements OnInit {
  @ViewChild('stage', { static: true }) stageEl;
  resourceManager: ResourceManager;
  stage: Stage;

  constructor() {}

  ngOnInit() {
    this.resourceManager = new ResourceManager();
    this.stage = new Stage(this.stageEl, this.resourceManager);
    this.resourceManager.load(() => {
      console.log(this.resourceManager);

      this.resourceManager.loadScene('start', this.stage, () => {
        this.resourceManager.loadScene('exterior2', this.stage, () => {
          this.resourceManager.loadScene('interior2', this.stage, () => {
            this.stage.init();
          });
        });
      });
    });
  }

  doUpdate() {
    requestAnimationFrame(this.doUpdate.bind(this));
    this.stage.update();
    this.stage.render();
  }
}
