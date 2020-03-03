import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as THREE from 'three';
@Injectable()
export class ResourceManager {
  geometries = ['interior2', 'exterior2', 'start'];
  sh = ['room', 'studio'];
  textures = [
    'textures/white.png',
    'textures/normal.png',
    'textures/waternormals.jpg',
    'textures/marker.png',
    'textures/circle.png',
    'textures/corner-gradient.png',
    'textures/flare.png'
  ];
  cubemaps = ['room/cubemap.bin'];
  constructor(private http: HttpClient) {}
}
