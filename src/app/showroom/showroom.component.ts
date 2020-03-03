import { Component, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
import * as _ from 'lodash';
@Component({
  selector: 'app-showroom',
  templateUrl: './showroom.component.html',
  styleUrls: ['./showroom.component.css']
})
export class ShowroomComponent implements OnInit {
  @ViewChild('stage', { static: true }) stageEl;
  width;
  height;
  renderer: THREE.WebGLRenderer;
  scenes;
  scene: THREE.Scene;
  camera: THREE.Camera;
  mouseX: number;
  mouseY: number;

  constructor() {}

  ngOnInit() {
    this.width = this.stageEl.nativeElement.clientWidth;
    this.height = this.stageEl.nativeElement.clientHeight;

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.domElement.addEventListener('mousemove', evt => {
      this.mouseX = (evt.pageX / this.width) * 2 - 1;
      this.mouseY = 1 - (evt.pageY / this.height) * 2;
    });
    this.renderer.setClearColor(0xffffff);
    this.stageEl.nativeElement.appendChild(this.renderer.domElement);
  }

  render() {
    if (this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  renderScene(scene, camera) {
    this.renderer.render(scene, camera);
  }

  update() {
    if (this.camera) {
      this.camera.updateMatrixWorld(true);
      this.camera.matrixWorldInverse.getInverse(this.camera.matrixWorld);
    }
    _.each(this.scenes, scene => {
      this.updateCustomMaterials(scene);
      if (scene.update) {
        scene.updateMatrixWorld(true);
        scene.update(this.renderer);
      }
    });
  }
  updateCustomMaterials(scene) {
    // _.each(); TODO
  }

  doUpdate() {
    requestAnimationFrame(this.doUpdate.bind(this));
    this.update();
    this.render();
  }
}
