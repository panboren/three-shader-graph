# three-shader-graph

Create shaders with typescript or javascript for Three.js. The library provides the ability to write code that should be familiar to those with experience with GLSL. The Javascript code will be executed to generate GLSL code but the syntax will make it appear as if you are writing shader code direclty in Typescript/Javascript. The Javascript code builds a directed acyclic graph which is used to generate the GLSL code, hence the graph terminology.  

## Why?
Writing shaders using GLSL for Three.js is not a great developer experience. First of, it is a new language to learn. Second, and more imprtantly, it involves combining chunks of code as strings in order to provide code reusability. Common non-trivial functionality like calculating ligthing is hard to reuse which leads to poor solutions of trying to inject strings of GLSL in multiple places in the built in shaders to add the needed functionality.

## Features

* Close to 100% support for GLSL language and standard library
* Reusable Physical and Lambert lighting implementations. 
* Built in fog effect using the Three.js fog parameters defined on the THREE.Scene


## Example

```ts
const uniformTime = uniformFloat("time")

const diffuse = rgb(0x00ff00)
const color = standardMaterial({ color: diffuse })
const bounce = translateY(sin(uniformTime.multiply(float(5))))

const material = new NodeShaderMaterial({
  color,
  transform: bounce,
  uniforms: {
    time: { value: 0 }
  }
})

const sphere = new SphereGeometry(5, 30, 15)
const mesh = new Mesh(sphere, material)
```


## Install

```bash
npm install three-shader-graph
```

## Documentation 

[See the wiki](https://github.com/adamringhede/three-shader-graph/wiki)
