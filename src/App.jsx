import React, { useEffect, useRef, useState } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import {PerspectiveCamera, Scene, AmbientLight, WebGLRenderer, Matrix4} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


const mapOptions = {
  mapId: import.meta.env.VITE_MAP_ID,
  center: {lat: 43.661036, lng: -79.371277},
  zoom: 17,
  disableDefaultUi: true,
  heading: 10,
  tilt: 100,
}

const App = () => {
  return (
    <Wrapper apiKey={import.meta.env.VITE_MAP_API_KEY}>
      <MyMap></MyMap>
    </Wrapper>
  );
};

export default App;

const MyMap = () => {
  const [map, setMap] = useState()
  const ref = useRef()
  const overlayRef = useRef()

  useEffect( () => {
    if(!overlayRef.current){
      console.log("Setting up map")
      const instance = new window.google.maps.Map(ref.current, mapOptions)
      setMap(instance)
      overlayRef.current = createOverlay(instance)
    }
    
  }, [])
  
  return(
    <div ref={ref} id='map'>
      
    </div>
  );
}

const createOverlay = (map) => {
  const overlay = new google.maps.WebGLOverlayView()
  let renderer, scene, camera, loader;

  overlay.onAdd = () => {
    scene = new Scene();
    camera = new PerspectiveCamera()
    const light = new AmbientLight(0xffffff, 2)
    scene.add(light)

    loader = new GLTFLoader()
    loader.loadAsync('../src/assets/3dModel/low_poly_scooter/scene.gltf').then(object => {
      const group = object.scene;
      group.scale.setScalar(25);
      group.rotation.set(Math.PI / 2, 0, 0)
      group.position.setZ(-120)
      scene.add(group)
    })
  }

  overlay.onContextRestored = ({gl}) => {
    renderer = new WebGLRenderer({
      canvas: gl.canvas,
      context: gl,
      ...gl.getContextAttributes()
    })
    renderer.autoClear = false;

    loader.manager.onLoad = () => {
      renderer.setAnimationLoop(() => {
        map.moveCamera({
          tilt: mapOptions.tilt,
          heading: mapOptions.heading,
          zoom: mapOptions.zoom,
        })

        if(mapOptions.tilt < 60){
          mapOptions.tilt += 0.5
        }
        else if(mapOptions.zoom < 20){
          mapOptions.zoom += 0.04
        }
        else if(mapOptions.heading < 125){
          mapOptions.heading += 0.5
        }
        else{
          renderer.setAnimationLoop(null)
        }
      })
    }
  }

  overlay.onDraw = ({transformer}) => {
    const matrix = transformer.fromLatLngAltitude({
      lat: mapOptions.center.lat,
      lng: mapOptions.center.lng,
      altitude: 120
    })
    camera.projectionMatrix = new Matrix4().fromArray(matrix)

    overlay.requestRedraw()
    renderer.render(scene, camera)
    renderer.resetState()
  }
  
  overlay.setMap(map)
  
  return overlay;
}