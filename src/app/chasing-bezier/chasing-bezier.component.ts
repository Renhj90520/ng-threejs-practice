import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import * as THREE from 'three';
import { points } from '../vr-sonic/points';
@Component({
  selector: 'app-chasing-bezier',
  templateUrl: './chasing-bezier.component.html',
  styleUrls: ['./chasing-bezier.component.css']
})
export class ChasingBezierComponent implements OnInit {
  canvas;
  ctx;
  brushes = 5;
  chains = [];

  t = 0;
  c = 0;
  POINTS = 200;
  moved = false;
  lastX;
  lastY;
  width: number;
  height: number;
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width = this.el.nativeElement.clientWidth;
    this.canvas.height = this.height = this.el.nativeElement.clientHeight;

    this.el.nativeElement.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');

    this.chains = [];
    for (let j = this.brushes; j--; ) {
      this.chains.push(new Chain());
    }

    for (let i = 0; i < this.POINTS; i++) {
      const randomRadius = 20 + Math.random() * 60;
      this.addWayPoint(
        Math.random() * this.width,
        Math.random() * this.height,
        randomRadius
      );
    }

    this.t = 0;

    this.draw();
  }

  draw() {
    requestAnimationFrame(this.draw.bind(this));
    const inc = 0.08;
    if (this.t > this.POINTS - 1) {
      const randomRadius = 20 + Math.random() * 60;
      if (this.moved) {
        this.addWayPoint(this.lastX, this.lastY, randomRadius);
      } else {
        this.addWayPoint(
          Math.random() * this.width,
          Math.random() * this.height,
          randomRadius
        );
      }
      for (let j = this.brushes; j--; ) {
        const chain = this.chains[j];
        chain.points.shift();
        chain.midpoints.shift();
      }

      this.t -= 1;

      this.moved = false;
    }

    const j = Math.floor(this.t);

    const k = this.t % 1;

    for (let b = this.brushes; b--; ) {
      const chain = this.chains[b];
      const midpoints = chain.midpoints;
      const points = chain.points;
      const strokes = chain.strokes;

      chain.curve = new THREE.QuadraticBezierCurve(
        midpoints[j],
        points[j],
        midpoints[j + 1]
      );

      strokes.push({
        from: chain.curve.getPoint(k % 1),
        to: chain.curve.getPoint(k + (inc % 1)),
        width: chain.widths[j] * (k % 1) + chain.widths[j + 1] * (1 - (k % 1)),
        h: (this.c * 2) % 360,
        a: 1
      });

      while (strokes.length > 200) {
        strokes.shift();
      }
    }
    this.c++;
    this.t += inc;

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.globalCompositeOeration = 'lighter';

    for (let b = this.brushes; b--; ) {
      const strokes = this.chains[b].strokes;

      let s, w;
      for (let i = strokes.length; i--; ) {
        s = strokes[i];
        w = s.width;

        this.ctx.fillStyle = `hsla(${~~s.h},50%,20%,${s.a * 0.7})`;
        this.ctx.lineWidth = w * 4;
        this.ctx.beginPath();

        this.ctx.moveTo(s.from.x, s.from.y);
        this.ctx.lineTo(s.to.x, s.to.y);
        this.ctx.stroke();

        this.ctx.strokeStyle = `hsla(${~~s.h},50%,50%,${s.a})`;
        s.a -= 0.01;
        this.ctx.lineWidth = w;
        this.ctx.beginPath();
        this.ctx.moveTo(s.from.x, s.from.y);
        this.ctx.lineTo(s.to.x, s.to.y);
        this.ctx.stroke();
      }
    }
  }
  addWayPoint(x, y, randomRadius) {
    let p = new THREE.Vector2(x, y);

    for (let j = this.brushes; j--; ) {
      const chain = this.chains[j];
      p = p.clone();
      p.x += (Math.random() - 0.5) * randomRadius;
      p.y += (Math.random() - 0.5) * randomRadius;
      chain.points.push(p);
      chain.widths.push(randomRadius / 10);

      const points = chain.points;
      const midPoint = new THREE.Vector2();

      const l = points.length;
      if (l === 1) {
        midPoint.addVectors(points[l - 1], points[l - 1]);
      } else {
        midPoint.addVectors(points[l - 2], points[l - 1]);
      }

      midPoint.multiplyScalar(0.5);
      chain.midpoints.push(midPoint);
    }
  }

  @HostListener('mousemove', ['$event'])
  mousemove(evt) {
    this.lastX = evt.offsetX;
    this.lastY = evt.offsetY;
    this.moved = true;
  }
}

class Chain {
  points = [];
  midpoints = [];
  strokes = [];
  widths = [];
  curve;
}
