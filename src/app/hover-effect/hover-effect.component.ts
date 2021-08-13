import { Component, ElementRef, OnInit } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-hover-effect',
  templateUrl: './hover-effect.component.html',
  styleUrls: ['./hover-effect.component.css'],
})
export class HoverEffectComponent implements OnInit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;

  width;
  height;
  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.initTHREE();
  }
  initTHREE() {
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;
  }
}
