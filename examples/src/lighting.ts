import * as THREE from 'three';
import { Clock, Material, Mesh, MeshLambertMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, PointLight, SphereGeometry, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { NodeShaderMaterial } from '../../src/index';
import { float, rgb, uniformFloat } from '../../src/lib/dsl';
import { standardMaterial } from '../../src/lib/effects/physical';
import { sin } from '../../src/lib/functions';
import { translateY } from '../../src/lib/transformation/transforms';
import { UniformFloatNode } from '../../src/lib/uniforms';
import { lambertMaterial } from '../../src/lib/effects/lambert';
import * as Stats from 'stats.js'


export function init() {
  var stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom


  const outputContainer = document.getElementById('output');

  outputContainer.appendChild(stats.dom);


  if (outputContainer == null) {
    throw new Error("Missing output container element")
  }

  // renderer setup
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0, 1);
  renderer.shadowMap.enabled = true
  outputContainer.appendChild(renderer.domElement);

  // camera setup
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.set(0, 15, 15);
  camera.far = 100;
  camera.lookAt(new Vector3(0, 0, 0))
  camera.updateProjectionMatrix();

  function onResize(camera: PerspectiveCamera, renderer: WebGLRenderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );
  }

  window.addEventListener('resize', () => onResize(camera, renderer), false);
  onResize(camera, renderer);

  new OrbitControls(camera, renderer.domElement);

  const clock = new Clock()

  const scene = new THREE.Scene()

  const sphere = new SphereGeometry(5, 30, 15)

  const uniformTime = uniformFloat("time")

  const material = new NodeShaderMaterial({
    color: standardMaterial({ color: rgb(0x00ff00) }),
    transform: oscilate(uniformTime),
    uniforms: {
      time: { value: 0 }
    }
  })

  const mesh = new Mesh(sphere, material)
  mesh.castShadow = true
  mesh.position.set(0, 0, 0)
  scene.add(mesh)

  const pointlight = new PointLight()
  pointlight.position.set(10, 10, 5)
  pointlight.castShadow = true
  scene.add(pointlight)

  const hemilight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.2);
  scene.add(hemilight);

  scene.add(createPlane())

  function render() {
    stats.begin()
    material.uniforms.time.value = clock.getElapsedTime()

    renderer.render(scene, camera)
    stats.end()
    requestAnimationFrame(render)

  }
  render()

}

function createPlane() {
  const plane = new PlaneGeometry(40, 40);

  let material: Material;
  material = new NodeShaderMaterial({
    color: lambertMaterial(rgb(0xcccccc)),
    uniforms: {
      time: { value: 0 }
    }
  })

  const mesh = new Mesh(plane, material)
  mesh.receiveShadow = true

  mesh.translateY(-5)
  mesh.rotateX(-Math.PI / 2)
  return mesh;
}

function oscilate(uniformTime: UniformFloatNode) {
  return translateY(sin(uniformTime.multiply(float(5))))
}