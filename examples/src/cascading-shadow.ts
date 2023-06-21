import * as Stats from 'stats.js';
import * as THREE from 'three';
import {
  Clock,
  InstancedMesh,
  Material,
  Matrix4,
  Mesh,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  SphereGeometry,
  Vector3,
  WebGLRenderer
} from 'three';
import CSM from 'three-csm';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { NodeShaderMaterial } from '../../src/index';
import { rgb, uniformFloat } from '../../src/lib/dsl';
import { standardMaterial } from '../../src/lib/effects/physical';

export function init() {
  var stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom

  const outputContainer = document.getElementById('output');

  outputContainer.appendChild(stats.dom);

  if (outputContainer == null) {
    throw new Error('Missing output container element');
  }

  // renderer setup
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  outputContainer.appendChild(renderer.domElement);

  // camera setup
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    50
  );
  camera.position.set(0, 15, 15);
  camera.far = 200;
  camera.lookAt(new Vector3(0, 0, 0));
  camera.updateProjectionMatrix();

  function onResize(camera: PerspectiveCamera, renderer: WebGLRenderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener('resize', () => onResize(camera, renderer), false);
  onResize(camera, renderer);

  new OrbitControls(camera, renderer.domElement);

  const clock = new Clock();

  const scene = new THREE.Scene();

  const sphere = new SphereGeometry(5, 30, 15);

  const uniformTime = uniformFloat('time');

  let material = new NodeShaderMaterial({
    color: standardMaterial({ color: rgb(0x00ff00) }),

    uniforms: {
      time: { value: 0 },
    },
  });

  const numObjects = 15;
  const gap = 20;
  const mesh = new InstancedMesh(sphere, material, numObjects);

  for (let i = 0; i < numObjects; i++) {
    mesh.setMatrixAt(i, new Matrix4().makeTranslation(0, 0, i * -gap));
  }

  mesh.castShadow = true;
  mesh.position.set(0, 0, 0);
  scene.add(mesh);

  const pointlight = new PointLight(null, 0.2);
  pointlight.position.set(10, 10, 5);
  pointlight.castShadow = true;
  //scene.add(pointlight);

  // TODO Replace the directional light with CSM
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
  directionalLight.position.x = -0.5;
  directionalLight.castShadow = true;
  //scene.add(directionalLight);

  const hemilight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.2);
  //scene.add(hemilight);

  let csm = new CSM({
    maxFar: camera.far,
    cascades: 4,
    mode: 'practical',
    shadowMapSize: 1024,
    lightDirection: new THREE.Vector3(1, -1, 1).normalize(),
    camera: camera,
    parent: scene,
  });
  csm.setupMaterial(material);
  console.log(material);

  const plane = createPlane();
  csm.setupMaterial(plane.material);
  scene.add(plane);

  function render() {
    stats.begin();
    material.uniforms.time.value = clock.getElapsedTime();

    csm.update();

    renderer.render(scene, camera);
    stats.end();
    requestAnimationFrame(render);
  }
  render();
}

function createPlane() {
  const plane = new PlaneGeometry(400, 400);

  let material: Material;
  material = new NodeShaderMaterial({
    color: standardMaterial({ color: rgb(0xcccccc) }),
    uniforms: {
      time: { value: 0 },
    },
  });
  //material = new MeshLambertMaterial({ color: 0xcccccc })
  //material = new MeshStandardMaterial({ color: 0xcccccc });

  const mesh = new Mesh(plane, material);
  mesh.receiveShadow = true;

  mesh.translateY(-5);
  mesh.rotateX(-Math.PI / 2);
  return mesh;
}
