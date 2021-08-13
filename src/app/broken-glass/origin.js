/*
 *		Click to start/stop movement
 *
 *	  Based on the ThreeJS example :
 * 	https://threejs.org/examples/#webgl_buffergeometry_rawshader
 */
var container, stats;
var camera, scene, renderer, vertices, geometry, initial;

var options = {
  max: 10000,
  easing: 0.08,
  move: false,
};

init();
animate();

function init() {
  container = document.body;

  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.z = 1;

  scene = new THREE.Scene();

  var triangles = options.max;

  geometry = new THREE.BufferGeometry();

  vertices = new THREE.BufferAttribute(new Float32Array(triangles * 3 * 3), 3);
  initial = [];

  for (var i = 0; i < vertices.length; i++) {
    var x = Math.random() - 0.5;
    var y = Math.random() - 0.5;
    var z = Math.random() - 0.5;
    vertices.setXYZ(i, x, y, z);
  }

  for (var i = 0; i < vertices.array.length; i++) {
    initial.push(vertices.array[i]);
  }

  geometry.addAttribute('position', vertices);

  var colors = new THREE.BufferAttribute(
    new Float32Array(triangles * 3 * 4),
    4
  );

  for (var i = 0; i < colors.length; i++) {
    colors.setXYZW(i, 0.2, 0.2, 0.2, 0.2);
  }

  geometry.addAttribute('color', colors);

  var material = new THREE.RawShaderMaterial({
    uniforms: {
      time: { type: 'f', value: 1.0 },
    },
    vertexShader: document.getElementById('vertexShader').textContent,
    fragmentShader: document.getElementById('fragmentShader').textContent,
    side: THREE.DoubleSide,
    transparent: true,
  });

  var mesh = new THREE.Mesh(geometry, material);

  scene.add(mesh);

  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0x000000 /*0xc09e*/);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', onWindowResize, false);
  window.addEventListener('click', move, false);
}

function onWindowResize(event) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  if (options.move) {
    for (var i = 0; i < vertices.length; i += 3) {
      var x = vertices.array[i];
      var y = vertices.array[i + 1];
      var initx = initial[i];
      var inity = initial[i + 1];

      var plusOrMinus = Math.random() > 0.5 ? 0.00019 : -0.00019;

      vertices.array[i] += (initx - x) * options.easing + plusOrMinus;
      vertices.array[i + 1] += (inity - y) * options.easing + plusOrMinus;
    }
  }

  render();
}

function render() {
  geometry.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
}

function onMouseMove(mouse) {
  MOUSE.x = mouse.x || mouse.clientX;
  MOUSE.y = mouse.y || mouse.clientY;
}

function move(mouse) {
  options.move = !options.move;
}
