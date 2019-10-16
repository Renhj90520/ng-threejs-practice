import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { TimelineMax, Linear } from 'gsap';
@Component({
  selector: 'app-sphere-slice',
  templateUrl: './sphere-slice.component.html',
  styleUrls: ['./sphere-slice.component.css']
})
export class SphereSliceComponent implements OnInit {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.addLights();
    this.addSphere();
    this.update();
  }
  addSphere() {
    const outerMat = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      metalness: 0.4,
      roughness: 0.7,
      side: THREE.FrontSide
    });

    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      metalness: 0.2,
      roughness: 0.8,
      side: THREE.BackSide
    });

    this.renderer.localClippingEnabled = true;

    const makeSphereSlice = (i, total) => {
      const geometry = new THREE.SphereGeometry(5, 32, 32);
      const innerSphere = new THREE.Mesh(geometry, innerMat.clone());
      this.scene.add(innerSphere);

      const sphere = new THREE.Mesh(geometry, outerMat.clone());
      this.scene.add(sphere);

      const box = new THREE.Box3().setFromObject(sphere);
      const clipTop = new THREE.Plane(
        new THREE.Vector3(0, box.max.y * 1, 0),
        1
      );
      const clipBottom = new THREE.Plane(
        new THREE.Vector3(0, box.max.y * -1, 0),
        -1
      );

      const clipPlanes = [clipTop, clipBottom];

      const clipMaterial = m => {
        m.clippingPlanes = clipPlanes;
        m.needsUpdate = true;
      };

      clipMaterial(sphere.material);
      clipMaterial(innerSphere.material);

      const tl = new TimelineMax({ repeat: -1 });

      const color = { hue: 1, s: 1, l: 0.6 };

      tl.to(color, 6.8, {
        hue: 0,
        onUpdate: function() {
          (innerSphere.material as THREE.MeshStandardMaterial).color.setHSL(
            color.hue,
            color.s,
            color.l
          );
        }
      });

      tl.fromTo(
        clipTop,
        6,
        { constant: -1 },
        { constant: 1, ease: Linear.easeNone },
        0
      );

      tl.fromTo(
        clipBottom,
        6,
        { constant: 1 },
        { constant: -1, ease: Linear.easeNone },
        0.8
      );

      tl.progress(i / total);
    };

    for (let i = 0; i < 5; i++) {
      makeSphereSlice(i, 5);
    }
  }
  addLights() {
    const spotLight = new THREE.SpotLight(0xffffff, 1.25);
    spotLight.position.set(-200, 200, 600);
    this.scene.add(spotLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.25);
    this.scene.add(pointLight);
  }
  initTHREE() {
    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(80, width / height, 0.1, 800);
    this.camera.position.set(0, 0, 20);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x111111);
    this.el.nativeElement.appendChild(this.renderer.domElement);
  }

  update() {
    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.update.bind(this));
  }
}
