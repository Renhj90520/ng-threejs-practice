// THREE.JS variables
var globalW = 600,
  globalH = 600,
  fov = 45,
  far = 1000,
  container = document.body,
  renderer = new THREE.WebGLRenderer(),
  scene = new THREE.Scene(),
  cam = new THREE.PerspectiveCamera(fov, globalW / globalH, 1, far),
  mainLight = new THREE.PointLight(0xd29553),
  ambLight = new THREE.AmbientLight(0x2a4159);
(baseMat = new THREE.MeshLambertMaterial({
  color: 0xa7897d,
  shading: THREE.FlatShading
})),
  (secondMat = new THREE.MeshPhongMaterial({
    /* credit goes to Mombasa */
    color: new THREE.Color('rgb(216,25,203)'),
    emissive: new THREE.Color('rgb(255,78,14)'),
    specular: new THREE.Color('rgb(235,135,235)'),
    shininess: 10,
    shading: THREE.FlatShading,
    transparent: 1,
    opacity: 0.7
  })),
  (mainSphere = new THREE.Mesh(new THREE.IcosahedronGeometry(100, 2), baseMat)),
  (group = new THREE.Object3D());

// Initialize THREE.js system
(function initTHREE() {
  renderer.setSize(globalW, globalH);
  container.appendChild(renderer.domElement);
  scene.add(cam);
  scene.add(mainLight);
  scene.add(ambLight);

  group.add(mainSphere);

  scene.add(group);

  cam.position.z = 600;

  mainLight.position.z = 400;
  mainLight.position.y = 200;
  mainLight.position.x = 50;
  mainLight.target = mainSphere;

  // For every single face on the sphere, create a new, smaller sphere
  // This makes 112 spheres, on a 16x8 sphere
  for (var i = 1, j = mainSphere.geometry.faces.length; i < j; i++) {
    var newSphere = new THREE.Mesh(
      new THREE.IcosahedronGeometry(20, 1),
      secondMat
    );

    // Calculate average centroid of the two triangles
    newSphere.position = mainSphere.geometry.faces[i].centroid;

    // Animation based values
    newSphere.target = new THREE.Vector3(
      Math.random() * 200 - 100,
      Math.random() * 200 - 100,
      Math.random() * 200 - 100
    );
    newSphere.base = new THREE.Vector3(
      newSphere.position.x,
      newSphere.position.y,
      newSphere.position.z
    );

    // Add to render group
    group.add(newSphere);
  }

  renderer.render(scene, cam);
})();

// Animation-based variables
var t = 0,
  decell = false,
  lastP = 0;

(function tick() {
  t++;
  var progress = Math.sin(t / 13) / 2 + 0.5;

  // Scale main sphere
  group.children[0].scale.x = 1 + progress / 5;
  group.children[0].scale.y = 1 + progress / 5;
  group.children[0].scale.z = 1 + progress / 5;

  // Loop through every small sphere
  for (var i = 1, j = group.children.length; i < j; i++) {
    var sphere = group.children[i];

    // Animate to target
    sphere.position.x = sphere.base.x + sphere.target.x * progress;
    sphere.position.y = sphere.base.y + sphere.target.y * progress;
    sphere.position.z = sphere.base.z + sphere.target.z * progress;
  }

  if (progress < lastP && !decell) {
    decell = true;
  }
  if (progress > lastP && decell) {
    // Generate new random targets
    for (var i = 1, j = group.children.length; i < j; i++) {
      group.children[i].target = new THREE.Vector3(
        Math.random() * 200 - 100,
        Math.random() * 200 - 100,
        Math.random() * 200 - 100
      );
    }
    decell = false;
  }
  lastP = progress;

  group.rotation.y += rotDeg(1.5);
  renderer.render(scene, cam);
  requestAnimationFrame(tick);
})();

// Utility functions
function rotDeg(deg) {
  return deg * (Math.PI / 180);
}
