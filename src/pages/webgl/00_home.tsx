import React, { useEffect, useRef } from 'react'
import { WebglReact } from '../../vim-web'
import * as THREE from 'three'
import * as Urls from '../devUrls'
globalThis.THREE = THREE

export function WebglHome () {
  const div = useRef<HTMLDivElement>(null)
  const refViewer = useRef<WebglReact.Refs.VimComponentRef>(null)
  useEffect(() => {
    //test()
    
    void createComponent(div.current, refViewer)
    return () => {
      refViewer.current?.dispose()
      globalThis.webgl = undefined
    }
      
  }, [])

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function createComponent (div: HTMLDivElement, ref: React.MutableRefObject<WebglReact.Refs.VimComponentRef>) {
  const webgl = await WebglReact.createWebglComponent(div, {
    ui:{
      bimInfoPanel: false,
      bimTreePanel: false,
      performance: true,
    }
  }, {
    rendering:{
      onDemand: false
    }
  })

  const request = webgl.loader.request(
    { url: getPathFromUrl() ?? "tower.vim" },
    { rotation: new THREE.Vector3(270, 0, 0) }
  )

  const result = await request.getResult()
  if (result.isSuccess()) {
    webgl.loader.add(result.result)
    webgl.camera.frameVisibleObjects()
  }
  webgl.camera.frameVisibleObjects()

  ref.current = webgl
  globalThis.webgl = webgl
}


function getPathFromUrl () {
  const params = new URLSearchParams(window.location.search)
  return params.get('vim') ?? undefined
}

function test(){
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(
    75,                                      // Field of View
    window.innerWidth / window.innerHeight,  // aspect ratio
    0.1,                                     // near clipping plane
    1000                                     // far clipping plane
  );
  var renderer = new THREE.WebGLRenderer();

  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);



  var geometry = new THREE.BoxGeometry(1, 1, 1);
  var material = new THREE.ShaderMaterial(
    {
      vertexShader: /* glsl */ `
        void main() {
          #include <begin_vertex>
          #include <project_vertex>
        }
      `,
      fragmentShader: /* glsl */ `
        void main() {
          gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
      `
    }
  );
  var cube = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: 0x00ff00}));
  scene.add(cube);
  scene.overrideMaterial = material

  camera.position.z = 5; // move camera back so we can see the cube

  var render = function() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);

    // rotate cube a little each frame
    cube.rotation.x += 0.05;
    cube.rotation.y += 0.05;
  };

  render();

}