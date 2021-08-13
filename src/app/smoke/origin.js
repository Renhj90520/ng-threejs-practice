let camera,
  scene,
  renderer,
  cube,
  bounds,
  smokeCloud,
  numParticles,
  text,
  blowButton;

let isBlowing = false;

init();
animate();

function init() {
  stats = new Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  clock = new THREE.Clock();

  // renderer setup
  renderer = new THREE.WebGLRenderer({
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xffffff, 0);

  scene = new THREE.Scene();

  // camera position
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.position.z = 1000;
  scene.add(camera);

  // scene lighting
  light = new THREE.DirectionalLight(0xdaccd8, 1.0);
  light.position.set(-1, 0, 1);
  scene.add(light);

  // selection of smoke textures (transparent pngs)
  const smokeImages = [
    'https://i.imgur.com/EtMcQ33.png',
    'https://i.imgur.com/6Z1clIX.png',
    'https://i.imgur.com/YmcB0HL.png',
    'https://s3-us-west-2.amazonaws.com/s.cdpn.io/95637/Smoke-Element.png',
    'https://qassets.netlify.com/images/smoke1.png',
  ];

  THREE.ImageUtils.crossOrigin = '';
  smokeTexture = THREE.ImageUtils.loadTexture(smokeImages[3]);
  smokeMaterial = new THREE.MeshLambertMaterial({
    color: 0xf1ebdd,
    emissive: 0xffffff,
    map: smokeTexture,
    transparent: true,
    opacity: 0.7,
  });

  smokeGeo = new THREE.PlaneGeometry(500, 500);
  smokeCloud = [];

  bounds = {
    x: 500,
    y: 500,
    z: 500,
  };
  numParticles = 20;

  const cubeSize = 300;

  cube = new THREE.Mesh(
    new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );

  //scene.add(cube)

  for (p = 0; p < numParticles; p++) {
    const particle = new THREE.Mesh(smokeGeo, smokeMaterial);
    particle.position.set(
      Math.random() * bounds.x - bounds.x * 0.5,
      Math.random() * bounds.y - bounds.y * 0.5,
      Math.random() * bounds.z - bounds.z * 0.6
    );
    particle.rotation.z = Math.random() * 360;
    scene.add(particle);
    smokeCloud.push(particle);
  }

  const textImages = [
    'https://i.imgur.com/jK7O95R.png',
    'https://i.imgur.com/5j4r46A.png',
    'https://i.imgur.com/OWqehUB.png',
  ];

  const textGeo = new THREE.PlaneGeometry(360, 360);
  const textTexture = THREE.ImageUtils.loadTexture(textImages[2]);
  const textMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    map: textTexture,
    emissive: 0xffffff,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 1,
  });
  text = new THREE.Mesh(textGeo, textMaterial);
  //text.position.y = 500;
  text.position.z = 300;
  scene.add(text);

  document.body.appendChild(renderer.domElement);
}

function animate() {
  stats.begin();
  delta = clock.getDelta();
  requestAnimationFrame(animate);
  rotateSmoke();
  render();
  stats.end();
}

function rotateSmoke() {
  for (let i = 0; i < numParticles; i++) {
    smokeCloud[i].rotation.z -= delta * 0.4;
    if (isBlowing) {
      smokeCloud[i].position.z -= 10;
      smokeCloud[i].position.x *= 1.01;
      smokeCloud[i].position.y *= 1.01;
      smokeCloud[i].material.opacity -= 0.001;
    }
  }
}

function render() {
  renderer.render(scene, camera);
}

function handleBlowTapped() {
  isBlowing = true;
}
