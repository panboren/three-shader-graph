import * as THREE from 'three';
import { Clock, Mesh, PerspectiveCamera, PointLight, SphereGeometry, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { NodeShaderMaterial } from '../../src/index';
import { float, rgb, uniformFloat } from '../../src/lib/dsl';
import { standardColor } from '../../src/lib/effects/physical';
import { sin } from '../../src/lib/functions';
import { translateY } from '../../src/lib/transformation/transforms';
import { UniformFloatNode } from '../../src/lib/uniforms';

export function init() {
  const outputContainer = document.getElementById('output');

  if (outputContainer == null) {
    throw new Error("Missing output container element")
  }

  // renderer setup
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0, 1);
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
    color: standardColor({ color: rgb(0x00ff00) }),
    transform: oscilate(uniformTime),
    uniforms: {
      time: { value: 0 }
    }
  })

  const mesh = new Mesh(sphere, material)
  mesh.position.set(0, 0, 0)
  scene.add(mesh)

  const pointlight = new PointLight()
  pointlight.position.set(10, 10, 5)
  scene.add(pointlight)

  const hemilight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
  scene.add(hemilight);

  function render() {
    material.uniforms.time.value = clock.getElapsedTime()

    requestAnimationFrame(render)
    renderer.render(scene, camera)
  }
  render()

}

function oscilate(uniformTime: UniformFloatNode) {
  return translateY(sin(uniformTime.multiply(float(5))))
}