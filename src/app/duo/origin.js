import * as $ from '//unpkg.com/three@0.120.0/build/three.module.js';
import { OrbitControls } from '//unpkg.com/three@0.120.0/examples/jsm/controls/OrbitControls.js';

// ----
// Boot
// ----

const renderer = new $.WebGLRenderer({ alpha: true });
const scene = new $.Scene();
const camera = new $.PerspectiveCamera(75, 2, 0.1, 100);
const controls = new OrbitControls(camera, renderer.domElement);
window.addEventListener('resize', () => {
  const { clientWidth, clientHeight } = renderer.domElement;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(clientWidth, clientHeight, false);
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
});
document.body.prepend(renderer.domElement);
window.dispatchEvent(new Event('resize'));
renderer.setAnimationLoop((t) => {
  renderer.render(scene, camera);
  controls.update();
});

// ----
// Main
// ----

const W = 10,
  H = 10,
  SW = W * 20,
  SH = H * 20;
const IMG_URLS = [
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=600&q=60',
  'https://images.unsplash.com/flagged/photo-1575494539155-6af0f84aa076?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=80',
];

camera.position.set(0, 0, 8);

for (const { color, intensity, x, y, z } of [
  { color: 'white', intensity: 1, x: -W, y: 0, z: 0 },
  { color: 'white', intensity: 1, x: W, y: 0, z: 0 },
]) {
  const L = new $.SpotLight(color, intensity, W, Math.PI / 2, 0, 0);
  L.position.set(x, y, z);
  scene.add(L);
}

const vs = [];
for (let i = 0, I = SH; i < I; ++i) {
  vs[i] = [];
  const nY = i / (I - 1);
  for (let j = 0, J = SW; j < J; ++j) {
    const nX = j / (J - 1);
    vs[i][j] = {
      uv: [nX, nY],
      xyz: [
        (nX - 0.5) * W,
        (nY - 0.5) * H,
        ((i + 1) % 2) * (j % 2) * 0.5 - 0.25,
      ],
    };
  }
}

//// Make Geometry - 2 Sets

const geoms = [];
for (let k = 0; k <= 1; ++k) {
  const geom = new $.BufferGeometry();
  const N = ((SW - k) >> 1) * (SH - 1);
  const pos = new Float32Array(N * 3 * 6); // six (x,y,z)
  const uv = new Float32Array(N * 2 * 6); // six (u,v)
  let n = 0;
  for (let i = 0, I = SH - 1; i < I; ++i) {
    for (let j = k, J = SW - 1; j < J; j += 2) {
      let v = vs[i][j];
      pos.set(v.xyz, n * 3);
      uv.set(v.uv, n * 2);
      ++n;
      v = vs[i][j + 1];
      pos.set(v.xyz, n * 3);
      uv.set(v.uv, n * 2);
      ++n;
      v = vs[i + 1][j];
      pos.set(v.xyz, n * 3);
      uv.set(v.uv, n * 2);
      ++n;
      v = vs[i][j + 1];
      pos.set(v.xyz, n * 3);
      uv.set(v.uv, n * 2);
      ++n;
      v = vs[i + 1][j + 1];
      pos.set(v.xyz, n * 3);
      uv.set(v.uv, n * 2);
      ++n;
      v = vs[i + 1][j];
      pos.set(v.xyz, n * 3);
      uv.set(v.uv, n * 2);
      ++n;
    }
  }
  geom.setAttribute('position', new $.Float32BufferAttribute(pos, 3));
  geom.setAttribute('uv', new $.Float32BufferAttribute(uv, 2));
  geom.computeVertexNormals();
  geoms.push(geom);
}

//// Make Meshes

const g = new $.Group();
for (const [i, geom] of geoms.entries()) {
  const map = new $.TextureLoader().load(IMG_URLS[i]);
  const mat = new $.MeshLambertMaterial({ map, side: $.DoubleSide });
  const mesh = new $.Mesh(geoms[i], mat);
  g.add(mesh);
}
scene.add(g);

//// Animate

const k = Math.PI / 5;
gsap
  .timeline({ defaults: { duration: 0.35 }, repeat: 1, yoyo: true })
  .to(g.rotation, { x: -k / 2, y: k })
  .to(g.rotation, { x: -k / 2, y: -k })
  .to(g.rotation, { x: 0, y: 0 });
