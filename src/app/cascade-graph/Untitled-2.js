//////////////
//GLOBAL SCOPE
//////////////
var scene, camera, D, renderer, threejs, WIDTH, HEIGHT, aspect, controls;
var mouse = new THREE.Vector2(),
  INTERSECTED,
  raycaster = new THREE.Raycaster();
var vizStartFlag = false;
var canvasBB;
var totalObjects;
var objects = [];
var spriteYears = [];
var spritePercents = [];
var line,
  circles = [],
  currentDetailIndex,
  detailViewGroup = new THREE.Group();
var currentCamera = 'view3';
var cameraSettings = {};
var globalData;
var extrusionSettings = {
  size: 0,
  height: 0,
  curveSegments: 0,
  amount: 0.16,
  bevelThickness: 0,
  bevelSize: 0,
  bevelEnabled: false,
  material: 0,
  extrudeMaterial: 1
};
var xBandUnit = 1.487;
var testData = {
  type: 'DI-PERCENTAGE-STACKED-3D-2D',
  question: 'When are you likely to begin your holiday shopping this year?',
  options: ['December or Later', 'Late November', 'Early'],

  //Color order should match options order
  colors: ['673AB7', 'F50057', '3D5AFE'],
  columns: [2012, 2013, 2014, 2015, 2016, 2017],
  range: [0, 100],

  //Data order should match options order
  data: [
    [21, 21, 21, 18, 17, 16],
    [29, 27, 27, 27, 29, 30],
    [51, 53, 52, 56, 54, 54]
  ]
};

////////////////////////////
//Functions for doing things
//on load and to animate...
////////////////////////////
function de2ra(degree) {
  return degree * (Math.PI / 180);
}

function dec2hex(i) {
  var result = '0x000000';
  if (i >= 0 && i <= 15) {
    result = '0x00000' + i.toString(16);
  } else if (i >= 16 && i <= 255) {
    result = '0x0000' + i.toString(16);
  } else if (i >= 256 && i <= 4095) {
    result = '0x000' + i.toString(16);
  } else if (i >= 4096 && i <= 65535) {
    result = '0x00' + i.toString(16);
  } else if (i >= 65535 && i <= 1048575) {
    result = '0x0' + i.toString(16);
  } else if (i >= 1048575) {
    result = '0x' + i.toString(16);
  }
  if (result.length == 8) {
    return result;
  }
}

function getYearFromOrder(o) {
  return o + 2012;
}
function makeMaterialOfColor(c) {
  return new THREE.MeshLambertMaterial({
    color: c,
    wireframe: false,
    transparent: true,
    opacity: 0.95
  });
}

function makeStackableObject(pdata, order, color) {
  var data = globalData;
  var stackableObject = { order: order, color: color };
  stackableObject.datapoints = pdata;
  stackableObject.areapoints = makeAreaPointsFromDataPoints(
    stackableObject.datapoints
  );
  stackableObject.shapePointsGrounded = makeShapePointsFromAreaPoints(
    stackableObject.areapoints['grounded']
  );
  stackableObject.shapePointsLifted = makeShapePointsFromAreaPoints(
    stackableObject.areapoints['lifted']
  );

  //build mesh and add to scene
  stackableObject.geo = new THREE.ExtrudeGeometry(
    new THREE.Shape(stackableObject.shapePointsGrounded),
    extrusionSettings
  );
  stackableObject.mesh = new THREE.Mesh(
    stackableObject.geo,
    makeMaterialOfColor(stackableObject.color)
  );
  stackableObject.mesh.position.set(
    0,
    0,
    (-8 / totalObjects) * stackableObject.order
  );
  stackableObject.mesh.name = 'DI_DATASTACK';
  stackableObject.mesh.DI_OBJ = stackableObject;
  scene.add(stackableObject.mesh);

  //change state
  stackableObject.lift = function() {
    tweenArea(
      this.mesh,
      this.shapePointsGrounded,
      this.shapePointsLifted,
      this.order
    );
  };
  stackableObject.drop = function() {
    tweenArea(
      this.mesh,
      this.shapePointsLifted,
      this.shapePointsGrounded,
      totalObjects - this.order
    );
  };

  //labels on grounded state in 3d
  stackableObject.groundedLabels = [];
  for (var i = 0; i < stackableObject.areapoints['grounded'][0].length; i++) {
    var tmpVal = Math.round(data.data[order - 1][i]) + '%';
    stackableObject.groundedLabels.push(
      makeDataLabels(
        getYearFromOrder(i),
        tmpVal,
        i * xBandUnit,
        stackableObject.areapoints['grounded'][0][i],
        (-8 / totalObjects) * order,
        color
      )
    );
  }
  stackableObject.labelsHidden = true;
  stackableObject.hideLabels = function() {
    this.labelsHidden = true;
    for (var i = 0; i < this.groundedLabels.length; i++) {
      this.groundedLabels[i].visible = false;
    }
  };
  stackableObject.showLabels = function() {
    this.labelsHidden = false;
    for (var i = 0; i < this.groundedLabels.length; i++) {
      this.groundedLabels[i].visible = true;
    }
  };
  return stackableObject;
}

function makeAreaPointsFromDataPoints(dp) {
  var areaPointsA = dp;
  var areaPointsB = [[], []];
  for (var i = 0; i < dp[0].length; i++) {
    areaPointsB[0].push(dp[0][i] - dp[1][i]);
    areaPointsB[1].push(0);
  }
  return { lifted: areaPointsA, grounded: areaPointsB };
}

function makeShapePointsFromAreaPoints(ap) {
  var shapeArray = [];
  for (var i = 0; i < ap[0].length; i++) {
    var p = new THREE.Vector2(i * xBandUnit, ap[0][i]);
    shapeArray.push(p);
  }
  for (var i = ap[1].length - 1; i >= 0; i--) {
    var p = new THREE.Vector2(i * xBandUnit, ap[1][i]);
    shapeArray.push(p);
  }
  return shapeArray;
}

function makeDataLabels(yr, value, px, py, pz, c) {
  var sprite = new THREE.TextSprite({
    textSize: 0.25,
    redrawInterval: 250,
    texture: {
      text: yr + ' | ' + value + '',
      fontFamily: '"Open Sans"'
    },
    material: {
      color: 0x000000
    }
  });
  sprite.position.set(px, py + 0.4, pz);
  sprite.visible = false;
  scene.add(sprite);
  return sprite;
}

function makeYearLabels(yr, pos) {
  var sprite = new THREE.TextSprite({
    textSize: 0.25,
    redrawInterval: 250,
    texture: {
      text: yr + '',
      fontFamily: '"Open Sans"',
      fontWeight: '600'
    },
    material: {
      color: 0x53565a
    }
  });
  sprite.position.set(pos, -0.3, 0);
  sprite.visible = false;
  scene.add(sprite);
  spriteYears.push(sprite);
}

function makePercentLabels(pc, pos) {
  var sprite = new THREE.TextSprite({
    textSize: 0.25,
    redrawInterval: 250,
    texture: {
      text: pc + '%',
      fontFamily: '"Open Sans"'
    },
    material: {
      color: 0x53565a
    }
  });
  sprite.position.set(-0.3, pos, 0);
  sprite.visible = false;
  scene.add(sprite);
  spritePercents.push(sprite);
}

function showYearLabels() {
  for (var i = 0; i < spriteYears.length; i++) {
    spriteYears[i].visible = true;
    spritePercents[i].visible = true;
  }
}

function hideYearLabels() {
  for (var i = 0; i < spriteYears.length; i++) {
    spriteYears[i].visible = false;
    spritePercents[i].visible = false;
  }
}

function tweenArea(s, so1, so2, o) {
  var sl = so1.length;
  var nso1 = {};
  var nso2 = {};
  for (var i = 0; i < sl; i++) {
    nso1['px' + i] = so1[i]['x'];
    nso1['py' + i] = so1[i]['y'];
    nso2['px' + i] = so2[i]['x'];
    nso2['py' + i] = so2[i]['y'];
  }
  var tween = new TWEEN.Tween(nso1).to(nso2, 1000);
  tween.delay(o * 400).start();
  tween.onUpdate(function() {
    for (var i = 0; i < sl; i++) {
      s.geometry.vertices[i].x = this['px' + i];
      s.geometry.vertices[i].y = this['py' + i];

      s.geometry.vertices[i + sl].x = this['px' + i];
      s.geometry.vertices[i + sl].y = this['py' + i];
    }
    s.geometry.verticesNeedUpdate = true;
  });
}

function camera2D() {
  currentCamera = 'view2';
  //disable orbit
  controls.enabled = false;
  //hide all object grounded labels;
  for (var i = 0; i < objects.length; i++) {
    if (!objects[i].labelsHidden) {
      objects[i].hideLabels();
    }
  }
  //Start tween
  var tween = new TWEEN.Tween(
    JSON.parse(JSON.stringify(cameraSettings.view3))
  ).to(JSON.parse(JSON.stringify(cameraSettings.view2)), 1000);
  tween.delay(400).start();
  tween.onUpdate(function() {
    camera.position.set(this.a, this.b, this.c);
    camera.left = this.left;
    camera.right = this.right;
    camera.top = this.top;
    camera.bottom = this.bottom;
    camera.updateProjectionMatrix();
  });
  tween.onComplete(function() {
    showYearLabels();
    setTimeout(showDetailView, 1000);
  });
}

function camera3D() {
  var tween = new TWEEN.Tween(
    JSON.parse(JSON.stringify(cameraSettings.view2))
  ).to(JSON.parse(JSON.stringify(cameraSettings.view3)), 1000);
  tween.delay(1000).start();
  tween.onUpdate(function() {
    camera.position.set(this.a, this.b, this.c);
    camera.left = this.left;
    camera.right = this.right;
    camera.top = this.top;
    camera.bottom = this.bottom;
    camera.updateProjectionMatrix();
  });
  tween.onComplete(function() {
    currentCamera = 'view3';
    controls.enabled = true;
    hideYearLabels();
  });
  hideDetailView();
}

function getWidthOfContainer() {
  return document.getElementById('App').getBoundingClientRect().width;
  //return window.innerWidth|| document.documentElement.clientWidth|| document.body.clientWidth;
}

function setupCamera() {
  WIDTH = getWidthOfContainer();
  if (WIDTH > 700) WIDTH = 700;
  HEIGHT = WIDTH * 0.7;

  aspect = WIDTH / HEIGHT;
  D = 4;

  cameraSettings = {
    view3: {
      a: 15,
      b: 20,
      c: 20,
      left: -1,
      right: 2 * D * aspect,
      top: 2 * D - 1,
      bottom: -2
    },
    view2: {
      a: 0,
      b: 0,
      c: 20,
      left: -0.75,
      right: 2 * D * aspect - 0.25 * D * aspect,
      top: 2 * D - 1,
      bottom: -0.75
    }
  };

  var camSetting = cameraSettings[currentCamera];
  camera.left = camSetting.left;
  camera.right = camSetting.right;
  camera.top = camSetting.top;
  camera.bottom = camSetting.bottom;
  camera.position.set(camSetting.a, camSetting.b, camSetting.c);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  canvasBB = renderer.domElement.getBoundingClientRect();
}

function updateDetailView() {
  //remove old detail group
  for (var i = detailViewGroup.children.length - 1; i >= 0; i--) {
    detailViewGroup.remove(detailViewGroup.children[i]);
  }
  //add new detail group
  function makeSprite(txt, col) {
    return new THREE.TextSprite({
      textSize: 0.3,
      redrawInterval: 250,
      texture: {
        text: txt,
        fontFamily: '"Open Sans"',
        fontWeight: '600'
      },
      material: {
        color: col
      }
    });
  }
  var sprite = makeSprite(
    '' + globalData.columns[currentDetailIndex],
    0x000000
  );
  sprite.position.set(
    xBandUnit * (globalData.columns.length - 1) + 1.35,
    6.2,
    0
  );
  detailViewGroup.add(sprite);
  //update line and circle positions
  for (var i = 0; i < objects.length; i++) {
    circles[i].position.set(
      objects[i].shapePointsLifted[currentDetailIndex].x,
      objects[i].shapePointsLifted[currentDetailIndex].y,
      0
    );
    line.position.setX(objects[i].shapePointsLifted[currentDetailIndex].x);
    //add the planes
    var heightOfPlane =
      objects[i].areapoints.lifted[0][currentDetailIndex] -
      objects[i].areapoints.lifted[1][currentDetailIndex];
    var planeYoffset =
      heightOfPlane / 2 + objects[i].areapoints.lifted[1][currentDetailIndex];
    var geometry = new THREE.PlaneGeometry(2, heightOfPlane);
    var material = makeMaterialOfColor(objects[i].color);
    var plane = new THREE.Mesh(geometry, material);
    plane.position.set(
      xBandUnit * (globalData.columns.length - 1) + 1.35,
      planeYoffset,
      0
    );
    detailViewGroup.add(plane);
    var sprite = makeSprite(
      Math.round(globalData.data[i][currentDetailIndex]) + '%',
      0xffffff
    );
    sprite.position.set(
      xBandUnit * (globalData.columns.length - 1) + 1.35,
      planeYoffset,
      0
    );
    detailViewGroup.add(sprite);
  }
}

function hideDetailView() {
  for (var i = 0; i < circles.length; i++) {
    circles[i].visible = false;
  }
  line.visible = false;
  detailViewGroup.visible = false;
}

function showDetailView() {
  for (var i = 0; i < circles.length; i++) {
    circles[i].visible = true;
  }
  line.visible = true;
  detailViewGroup.visible = true;
}

///////////////////
//BUILD STACK CHART
///////////////////
function buildStackChart(data) {
  globalData = data;
  totalObjects = data.data.length;
  objects = [];
  spriteYears = [];
  spritePercents = [];
  var cleanUpNode = document.getElementById('threejs');
  while (cleanUpNode.firstChild) {
    cleanUpNode.removeChild(cleanUpNode.firstChild);
  }

  WIDTH = getWidthOfContainer();
  if (WIDTH > 700) WIDTH = 700;
  HEIGHT = WIDTH * 0.7;

  threejs = document.getElementById('threejs');
  scene = new THREE.Scene();
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setClearColor(0xffffff, 1);
  threejs.appendChild(renderer.domElement);

  //CAMERA & LIGHTS
  camera = new THREE.OrthographicCamera(0, 0, 0, 0, 1, 1000);
  //camera = new THREE.PerspectiveCamera( 35, WIDTH/HEIGHT, 1, 6000 );
  setupCamera();
  scene.add(camera);
  scene.add(new THREE.AmbientLight(0xffffff));
  var directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
  scene.add(directionalLight);

  // FLOOR
  var floorSizeW = xBandUnit * data.columns.length + 1;
  var floorSizeH = 10;
  var floorTexture = new THREE.TextureLoader().load('./checkerboard.jpg');
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(30, 30);
  var floorMaterial = new THREE.MeshBasicMaterial({
    map: floorTexture,
    side: THREE.DoubleSide
  });
  var floorGeometry = new THREE.PlaneGeometry(floorSizeW, floorSizeH);
  var floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.x = -1 + floorSizeW / 2;
  floor.position.z = -floorSizeH / 2;
  floor.position.y = -0.1;
  floor.rotation.x = Math.PI / 2;
  scene.add(floor);

  //DATA to objects
  var arrOld = [];
  var arrNew = [];
  for (var i = 0; i < data.data.length; i++) {
    var di = data.data[i];

    //insert grounded zero line data
    if (i == 0) {
      for (var j = 0; j < di.length; j++) {
        arrOld.push(0);
      }
    }
    //calculate the offseted y values
    for (var j = 0; j < di.length; j++) {
      var nY;
      if (i == data.data.length - 1) {
        nY = 6;
      } else {
        nY = (di[j] / 100) * 6 + arrOld[j];
      }
      arrNew.push(nY);
    }
    var tmp = makeStackableObject(
      [arrNew, arrOld],
      i + 1,
      parseInt('0x' + data.colors[i], 16)
    );
    objects.push(tmp);

    //for next object baseline
    arrOld = arrNew;
    arrNew = [];
  }

  //LABEL SETUP
  //add labels for each year
  for (var i = 0; i < data.columns.length; i++) {
    makeYearLabels(data.columns[i], i * xBandUnit);
  }
  //add labels for each percent at 20%
  if (data.type == 'DI-PERCENTAGE-STACKED-3D-2D') {
    for (var i = 0; i < 6; i++) {
      makePercentLabels(i * 20, (6 / 5) * i);
    }
  }

  //dashed line test
  //create a blue LineBasicMaterial
  var material = new THREE.LineDashedMaterial({
    color: 0x000000,
    linewidth: 0.1,
    scale: 1,
    dashSize: 0.18,
    gapSize: 0.08
  });
  var linegeometry = new THREE.Geometry();
  var circlegeometry = new THREE.CircleGeometry(0.08, 32);
  linegeometry.vertices.push(new THREE.Vector3(0, -0.1, 0));
  linegeometry.vertices.push(new THREE.Vector3(0, 6, 0));

  linegeometry.computeLineDistances();
  line = new THREE.Line(linegeometry, material);
  line.visible = false;
  scene.add(line);
  currentDetailIndex = globalData.columns.length - 1;
  for (var i = 0; i < objects.length; i++) {
    var circle = new THREE.Mesh(circlegeometry, material);
    circle.visible = false;
    scene.add(circle);
    circles.push(circle);
  }
  updateDetailView(currentDetailIndex);
  detailViewGroup.visible = false;
  scene.add(detailViewGroup);

  //ORBIT ROTATE CONTROLS & RESIZE
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.noZoom = true;
  controls.enabled = true;
  window.addEventListener('resize', onWindowResize, false);
  renderer.domElement.addEventListener('mousemove', onDocumentMouseDown, false);

  animate();
  setupOptions();
}

/////////////////
//NON INIT SETUP
/////////////////
function onWindowResize() {
  setupCamera();
  renderer.setSize(WIDTH, HEIGHT);
}

function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  controls.update();
  renderScene();
}

function renderScene() {
  renderer.render(scene, camera);
}

/////////////////////////
//START ON DOCUMENT READY
/////////////////////////
$(document).ready(function() {
  buildStackChart(testData);
});

////////////////////////
//Interaction with mouse
////////////////////////
function onDocumentMouseDown(event) {
  event.preventDefault();
  if (!vizStartFlag) {
    return;
  }

  if (currentCamera == 'view2') {
    //only inside 2d view
    var x = (event.clientX - canvasBB.left) / canvasBB.width;
    var vx =
      x * (cameraSettings.view2.right - cameraSettings.view2.left) +
      cameraSettings.view2.left;
    if (vx >= 0 && vx <= xBandUnit * (globalData.columns.length - 1)) {
      var tmp = Math.round(vx / xBandUnit);
      if (tmp != currentDetailIndex) {
        currentDetailIndex = tmp;
        updateDetailView(currentDetailIndex);
      }
    }
    return;
  }

  //Only for 3d view
  mouse.x = ((event.clientX - canvasBB.left) / canvasBB.width) * 2 - 1;
  mouse.y = -((event.clientY - canvasBB.top) / canvasBB.height) * 2 + 1;
  // find intersections
  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(scene.children);
  if (intersects.length > 0) {
    if (
      intersects[0].object.name == 'DI_DATASTACK' &&
      intersects[0].object != INTERSECTED
    ) {
      if (INTERSECTED && !INTERSECTED.DI_OBJ.labelsHidden) {
        INTERSECTED.DI_OBJ.hideLabels();
      }
      INTERSECTED = intersects[0].object;
      if (INTERSECTED.DI_OBJ.labelsHidden) {
        INTERSECTED.DI_OBJ.showLabels();
      }
    }
  } else {
    if (INTERSECTED && !INTERSECTED.DI_OBJ.labelsHidden) {
      INTERSECTED.DI_OBJ.hideLabels();
    }
    INTERSECTED = null;
  }
}

/////////////////////////////
//For toggle button to debug
/////////////////////////////
var t = true;
function toggle() {
  if (t) {
    camera2D();
    for (var i = 0; i < objects.length; i++) {
      objects[i].lift();
    }
  } else {
    camera3D();
    for (var i = 0; i < objects.length; i++) {
      objects[i].drop();
    }
  }
  t = !t;
}
function startViz() {
  document.getElementById('skipSurvey').style.display = 'none';
  document.getElementById('skipSurveyBackground').style.display = 'none';
  document.getElementById('toggle').style.display = 'inline-block';
  d3.select('.HIDDEN').classed('HIDDEN', false);
  d3.select('.optionsTitle').html('LEGEND:');
  vizStartFlag = true;
  toggle();
}

function setupOptions() {
  var optionContainer = d3.select('.optionsBlock .optionsList');
  var options = optionContainer
    .selectAll('.Options')
    .data(globalData.options)
    .enter()
    .append('li')
    .classed('Options', true)
    .on('click', function(d, i) {
      if (vizStartFlag) return;
      startViz();
    })
    .html(function(d, i) {
      return (
        '<div class="box" style="background-color:#' +
        globalData.colors[i] +
        '"></div><span>' +
        d +
        '</span>'
      );
    });
}
