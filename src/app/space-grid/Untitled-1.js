var mouse = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2
};
//access mouse pos with mouse.x and mouse.y
function getMousePos(event) {
  return {
    x: event.clientX,
    y: event.clientY
  };
}
window.addEventListener('mousemove', function(event) {
  mouse = getMousePos(event);
});
addNote();

var scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 0, 200);
var camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
/*composer = new THREE.EffectComposer( renderer );
				composer.addPass( new THREE.RenderPass( scene, camera ) );

				hblur = new THREE.ShaderPass( THREE.HorizontalBlurShader );
				composer.addPass( hblur );
				
				vblur = new THREE.ShaderPass( THREE.VerticalBlurShader );
				vblur.renderToScreen = true;
				composer.addPass( vblur );
*/

function rad(deg) {
  return deg * (Math.PI / 180);
}

var directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
scene.add(directionalLight);
directionalLight.position.y = 100;

//Create elements here:

var lines = [];
var amountAdds = 100;

function addmorelines(y) {
  var material = new THREE.MeshPhongMaterial({
    color: '#8080ff',
    reflectivity: 0.8,
    shininess: 100
  });
  var material2 = new THREE.MeshPhongMaterial({
    color: 'skyblue',
    transparent: true,
    opacity: 0.5,
    reflectivity: 0.8,
    shininess: 100
  });
  for (var x = -55; x <= 55; x += 10) {
    var geometry = new THREE.BoxGeometry(125, 0.5, 0.5);
    var cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    cube.position.x = x;
    cube.position.y = y;
    cube.rotation.y = rad(90);
    lines.push(cube);
    var geometry = new THREE.BoxGeometry(125, 1, 1);
    var cube = new THREE.Mesh(geometry, material2);
    scene.add(cube);
    cube.position.x = x;
    cube.position.y = y;
    cube.rotation.y = rad(90);
  }
  for (var z = -55; z <= 55; z += 10) {
    var geometry = new THREE.BoxGeometry(125, 0.5, 0.5);
    var cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    cube.position.z = z;
    cube.position.y = y;
    lines.push(cube);
    var geometry = new THREE.BoxGeometry(125, 1, 1);
    var cube = new THREE.Mesh(geometry, material2);
    scene.add(cube);
    cube.position.z = z;
    cube.position.y = y;
    lines.push(cube);
  }
}
for (var i = 0; i > -200; i -= 25) {
  addmorelines(i);
}
var material = new THREE.MeshBasicMaterial({
  color: 'skyblue'
});
var material2 = new THREE.MeshBasicMaterial({
  color: 'skyblue',
  transparent: true,
  opacity: 0.5
});
vlines = [];

for (var z = -55; z <= 55; z += 10) {
  for (var x = -55; x <= 55; x += 10) {
    var geometry = new THREE.BoxGeometry(0.1, 200, 0.1);
    var cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    cube.position.z = z;
    cube.position.x = x;
    vlines.push(cube);
    var geometry = new THREE.BoxGeometry(0.5, 200, 0.5);
    var cube = new THREE.Mesh(geometry, material2);
    scene.add(cube);
    cube.position.z = z;
    cube.position.x = x;
    vlines.push(cube);
  }
}
//Particles:
function createCanvasMaterial(color, size) {
  var matCanvas = document.createElement('canvas');
  matCanvas.width = matCanvas.height = size;
  var matContext = matCanvas.getContext('2d');
  // create exture object from canvas.
  var texture = new THREE.Texture(matCanvas);
  // Draw a circle
  var center = size / 2;
  matContext.beginPath();
  matContext.arc(center, center, size / 2, 0, 2 * Math.PI, false);
  matContext.closePath();
  matContext.fillStyle = color;
  matContext.fill();
  // need to set needsUpdate
  texture.needsUpdate = true;
  // return a texture made from the canvas
  return texture;
}

function createParticleSystem() {
  // The number of particles in a particle system is not easily changed.
  var particleCount = 12000;

  // Particles are just individual vertices in a geometry
  // Create the geometry that will hold all of the vertices
  var particles = new THREE.Geometry();

  // Create the vertices and add them to the particles geometry
  for (var p = 0; p < particleCount; p++) {
    // This will create all the vertices in a range of -200 to 200 in all directions
    var x = Math.random() * 50 - 25;
    var y = Math.random() * 200 - 200;
    var z = Math.random() * 50 - 25;

    // Create the vertex
    var particle = new THREE.Vector3(x, y, z);

    // Add the vertex to the geometry
    particles.vertices.push(particle);
  }

  // Create the material that will be used to render each vertex of the geometry
  var particleMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.2,
    map: createCanvasMaterial('#ffffff', 256),
    blending: THREE.AdditiveBlending,
    transparent: true
  });

  // Create the particle system
  particleSystem = new THREE.Points(particles, particleMaterial);

  return particleSystem;
}
function animateParticles() {
  var verts = particleSystem.geometry.vertices;
  for (var i = 0; i < verts.length; i++) {
    var vert = verts[i];
    if (vert.y > 0) {
      vert.y = -200;
    }
    vert.y += 0.1 * speed;
  }
  particleSystem.geometry.verticesNeedUpdate = true;
}
var particleSystem = createParticleSystem();
scene.add(particleSystem);
particleSystem.position.y = 25;

//end of elements
camera.position.y = 20;
lookAt = new THREE.Vector3(0, 0, 0);
camera.lookAt(lookAt);
var render = function() {
  requestAnimationFrame(render);
  mainloop();
  renderer.render(scene, camera);
};
var nextLines = 0;
var speed = 1;
function mainloop() {
  speed = (mouse.y / window.innerHeight) * 2;
  camera.position.y -= 0.2 * speed;
  camera.rotation.z += 0.0025 * speed;
  particleSystem.position.y -= 0.2 * speed;
  particleSystem.rotation.y += 0.001 * speed;
  animateParticles();
  nextLines -= 1 * speed;
  if (nextLines < 0) {
    addmorelines(camera.position.y - 200);
    console.log('adding at ' + (camera.position.y - 200));
    nextLines = 100;
  }
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    line.scale.z = (Math.random() * 200 + 900) / 1000;
    if (line.position.y > camera.position.y) {
      scene.remove(line);
      lines.splice(i, 1);
    }
  }
  for (var i = 0; i < vlines.length; i++) {
    var line = vlines[i];
    line.position.y -= 0.2 * speed;
    line.scale.z = (Math.random() * 200 + 900) / 1000;
  }
}
render();

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}
