import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

import polygons from '../data/polygons.json';

const imgWidth = 2500;
const imgHeight = 2274;
const defaultExtrudeHeight = 50;
const targetElevateHeight = 350;

function applyTopFaceUVs(geometry) {
  geometry.computeBoundingBox();
  const posAttr = geometry.attributes.position;
  const uvAttr = geometry.attributes.uv;

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);

    const u = (x + imgWidth / 2) / imgWidth;
    const v = (y + imgHeight / 2) / imgHeight;

    uvAttr.setXY(i, u, v);
  }
  uvAttr.needsUpdate = true;
}

export default function MapCanvas({
  activeTab,
  activeParcels,
  onToggleParcel,
  cameraPreset,
  autoRotate,
  cadastralData,
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const labelRendererRef = useRef(null);
  const controlsRef = useRef(null);
  const meshesRef = useRef([]);
  const lineMaterialsRef = useRef([]);
  const skySphereRef = useRef(null);
  const groundPlaneRef = useRef(null);
  const pointerDownPosRef = useRef({ x: 0, y: 0 });
  const pointerDownTimeRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x090a10);

    // Camera
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(60, aspect, 1, 10000);
    cameraRef.current = camera;
    camera.position.set(0, -imgHeight * 0.8, imgHeight * 0.8);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);

    // CSS2D Renderer for Area Badges
    const labelRenderer = new CSS2DRenderer();
    labelRendererRef.current = labelRenderer;
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    containerRef.current.appendChild(labelRenderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(500, -1000, 1500);
    scene.add(dirLight);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;

    // Texture Loader
    const textureLoader = new THREE.TextureLoader();

    // 360 VR Sky Sphere
    const skyGeo = new THREE.SphereGeometry(4000, 60, 40);
    skyGeo.scale(-1, 1, 1);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x111122, side: THREE.DoubleSide });
    const skySphere = new THREE.Mesh(skyGeo, skyMat);
    skySphere.visible = false;
    scene.add(skySphere);
    skySphereRef.current = skySphere;

    const loadVrPhoto = (path) => {
      textureLoader.load(
        path,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          skySphere.material = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
          skySphere.material.needsUpdate = true;
        },
        undefined,
        () => {
          if (path.includes('_web.jpg')) {
            loadVrPhoto('360_2/DJI_20260729145559_0019_D.JPG');
          }
        }
      );
    };
    loadVrPhoto('360_2/DJI_20260729145559_0019_D_web.jpg');

    // Base Texture & Ground Plane
    textureLoader.load('base.png', (baseTex) => {
      baseTex.colorSpace = THREE.SRGBColorSpace;
      const groundGeo = new THREE.PlaneGeometry(imgWidth, imgHeight);
      const groundMat = new THREE.MeshBasicMaterial({ map: baseTex, side: THREE.DoubleSide });
      const groundPlane = new THREE.Mesh(groundGeo, groundMat);
      groundPlane.position.z = 0;
      scene.add(groundPlane);
      groundPlaneRef.current = groundPlane;

      // Side Texture for Land Parcel Extrusions
      textureLoader.load('dirt_side_2.avif', (sideTex) => {
        sideTex.wrapS = THREE.RepeatWrapping;
        sideTex.wrapT = THREE.RepeatWrapping;
        sideTex.repeat.set(1, 1);
        sideTex.colorSpace = THREE.SRGBColorSpace;

        const sequence = cadastralData.sequence || [];
        const areas = cadastralData.areas || {};
        const meshes = [];
        const lineMats = [];

        polygons.forEach((poly, index) => {
          const shape = new THREE.Shape();
          for (let i = 0; i < poly.length; i++) {
            const x = poly[i][0] - imgWidth / 2;
            const y = -poly[i][1] + imgHeight / 2;
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
          }

          const geometry = new THREE.ExtrudeGeometry(shape, {
            steps: 1,
            depth: defaultExtrudeHeight,
            bevelEnabled: false
          });

          applyTopFaceUVs(geometry);

          const topMat = new THREE.MeshStandardMaterial({
            map: baseTex,
            roughness: 0.6,
            metalness: 0.1
          });
          const sideMat = new THREE.MeshStandardMaterial({
            map: sideTex,
            roughness: 0.8,
            metalness: 0.1
          });

          const mesh = new THREE.Mesh(geometry, [topMat, sideMat]);

          // Line Outline
          const positions = [];
          for (let i = 0; i < poly.length; i++) {
            positions.push(poly[i][0] - imgWidth / 2, -poly[i][1] + imgHeight / 2, 0);
          }
          positions.push(poly[0][0] - imgWidth / 2, -poly[0][1] + imgHeight / 2, 0);

          const lineGeo = new LineGeometry();
          lineGeo.setPositions(positions);
          const lineMat = new LineMaterial({
            color: 0xffffff,
            linewidth: 8,
            resolution: new THREE.Vector2(window.innerWidth, window.innerHeight)
          });
          lineMats.push(lineMat);
          const outline = new Line2(lineGeo, lineMat);
          outline.position.z = defaultExtrudeHeight + 0.1;
          mesh.add(outline);

          // CSS2D Area Label
          const seqIndex = sequence.indexOf(index);
          let labelObj = null;
          if (seqIndex !== -1) {
            const seqNo = seqIndex + 1;
            const areaInfo = areas[String(seqIndex)] || areas[String(index)] || '';

            const labelDiv = document.createElement('div');
            labelDiv.className = 'building-label';
            labelDiv.innerHTML = `<div class="seq">No. ${seqNo}</div><div class="area">${areaInfo}</div>`;

            labelObj = new CSS2DObject(labelDiv);
            let cx = 0, cy = 0;
            for (let k = 0; k < poly.length; k++) {
              cx += poly[k][0] - imgWidth / 2;
              cy += -poly[k][1] + imgHeight / 2;
            }
            labelObj.position.set(cx / poly.length, cy / poly.length, defaultExtrudeHeight + 10);
            mesh.add(labelObj);
          }

          mesh.userData = {
            index,
            seqNo: seqIndex !== -1 ? seqIndex + 1 : null,
            shape,
            height: defaultExtrudeHeight,
            targetHeight: defaultExtrudeHeight,
            outline,
            topMaterial: topMat,
            label: labelObj
          };

          scene.add(mesh);
          meshes.push(mesh);
        });

        meshesRef.current = meshes;
        lineMaterialsRef.current = lineMats;
      });
    });

    // Resize Handler
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current || !labelRendererRef.current) return;
      const w = window.innerWidth;
      const h = window.innerHeight;

      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(w, h);
      labelRendererRef.current.setSize(w, h);

      lineMaterialsRef.current.forEach((mat) => {
        mat.resolution.set(w, h);
      });
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Smooth Lerp for Parcel Elevation (position-based, no geometry recreation)
      meshesRef.current.forEach((mesh) => {
        const targetZ = mesh.userData.targetHeight - defaultExtrudeHeight;
        const currentZ = mesh.position.z;
        if (Math.abs(currentZ - targetZ) > 0.1) {
          mesh.position.z += (targetZ - currentZ) * 0.1;
        }
      });

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      if (labelRendererRef.current && sceneRef.current && cameraRef.current) {
        labelRendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  // Update target heights based on activeParcels (Elevate land on click!)
  useEffect(() => {
    meshesRef.current.forEach((mesh) => {
      const seqNo = mesh.userData.seqNo;
      if (seqNo && activeParcels.has(seqNo)) {
        mesh.userData.targetHeight = targetElevateHeight;
      } else {
        mesh.userData.targetHeight = defaultExtrudeHeight;
      }
    });
  }, [activeParcels]);

  // Handle Camera Presets
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (cameraPreset === 'overview') {
      camera.position.set(0, -imgHeight * 0.8, imgHeight * 0.8);
      controls.target.set(0, 0, 0);
    } else if (cameraPreset === 'front') {
      camera.position.set(0, -imgHeight * 1.1, imgHeight * 0.2);
      controls.target.set(0, 0, 0);
    } else if (cameraPreset === 'drone') {
      camera.position.set(0, -imgHeight * 0.4, imgHeight * 1.0);
      controls.target.set(0, 0, 0);
    }
    controls.update();
  }, [cameraPreset]);

  // Handle Tab Switching
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current || !skySphereRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const skySphere = skySphereRef.current;
    const groundPlane = groundPlaneRef.current;
    const labelRenderer = labelRendererRef.current;

    if (activeTab === 'map') {
      skySphere.visible = false;
      if (groundPlane) groundPlane.visible = true;
      meshesRef.current.forEach((m) => (m.visible = true));
      if (labelRenderer) labelRenderer.domElement.style.display = 'block';

      controls.enabled = true;
      controls.enableZoom = true;
      controls.rotateSpeed = 1.0;
      controls.minDistance = 10;
      controls.maxDistance = 5000;
      controls.minPolarAngle = 0;
      controls.maxPolarAngle = Math.PI - 0.01;

      camera.fov = 60;
      camera.position.set(0, -imgHeight * 0.8, imgHeight * 0.8);
      controls.target.set(0, 0, 0);
      camera.updateProjectionMatrix();
      controls.update();
    } else if (activeTab === 'vr') {
      skySphere.visible = true;
      if (groundPlane) groundPlane.visible = false;
      meshesRef.current.forEach((m) => (m.visible = false));
      if (labelRenderer) labelRenderer.domElement.style.display = 'none';

      camera.position.set(0, 0, 0);
      controls.enabled = true;
      controls.enableZoom = false;
      controls.rotateSpeed = -0.5;
      controls.minDistance = 10;
      controls.maxDistance = 500;
      controls.minPolarAngle = 0.01;
      controls.maxPolarAngle = Math.PI - 0.01;

      // Restore saved viewpoint
      const savedLookX = localStorage.getItem('vrLookVectorX');
      const savedLookY = localStorage.getItem('vrLookVectorY');
      const savedLookZ = localStorage.getItem('vrLookVectorZ');

      if (savedLookX !== null && savedLookY !== null && savedLookZ !== null) {
        const lookDir = new THREE.Vector3(
          parseFloat(savedLookX),
          parseFloat(savedLookY),
          parseFloat(savedLookZ)
        ).normalize();
        controls.target.set(lookDir.x * 100, lookDir.y * 100, lookDir.z * 100);
      } else {
        controls.target.set(0, 10, 100);
      }

      camera.updateProjectionMatrix();
      controls.update();
    }
  }, [activeTab]);

  // Handle Auto Rotate
  useEffect(() => {
    if (!controlsRef.current) return;
    controlsRef.current.autoRotate = autoRotate;
    controlsRef.current.autoRotateSpeed = 2.0;
  }, [autoRotate]);

  // Handle VR Wheel Zoom
  const handleWheel = (e) => {
    if (activeTab === 'vr' && cameraRef.current) {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 3.5 : -3.5;
      cameraRef.current.fov = Math.max(20, Math.min(95, cameraRef.current.fov + zoomFactor));
      cameraRef.current.updateProjectionMatrix();
    }
  };

  // Pointer Down & Up event listener for land parcel click elevation
  const handlePointerDown = (e) => {
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    pointerDownTimeRef.current = Date.now();
  };

  const handlePointerUp = (e) => {
    const clickDist = Math.hypot(
      e.clientX - pointerDownPosRef.current.x,
      e.clientY - pointerDownPosRef.current.y
    );

    if (activeTab === 'vr' && cameraRef.current) {
      const dir = new THREE.Vector3();
      cameraRef.current.getWorldDirection(dir);
      localStorage.setItem('vrLookVectorX', dir.x.toString());
      localStorage.setItem('vrLookVectorY', dir.y.toString());
      localStorage.setItem('vrLookVectorZ', dir.z.toString());
      return;
    }

    if (activeTab === 'map' && clickDist < 12 && cameraRef.current) {
      const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      const visibleMeshes = meshesRef.current.filter((m) => m.visible);
      const intersects = raycaster.intersectObjects(visibleMeshes, true);

      if (intersects.length > 0) {
        let targetM = intersects[0].object;
        while (targetM && targetM.parent && targetM.userData?.index === undefined) {
          targetM = targetM.parent;
        }
        if (targetM && targetM.userData && targetM.userData.seqNo) {
          onToggleParcel(targetM.userData.seqNo);
        }
      }
    }
  };

  return (
    <div
      className="canvas-container"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
    />
  );
}
