'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { TaskItem } from '@/lib/models';
import { Sparkles, RotateCw, ZoomIn, ZoomOut, Eye, CheckCircle2, Clock } from 'lucide-react';

interface ThreeSceneProps {
  tasks: TaskItem[];
  onSelectTask: (task: TaskItem) => void;
  onToggleComplete: (task: TaskItem) => void;
}

interface HoveredTaskInfo {
  task: TaskItem;
  screenX: number;
  screenY: number;
}

export default function ThreeScene({ tasks, onSelectTask, onToggleComplete }: ThreeSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredTask, setHoveredTask] = useState<HoveredTaskInfo | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [focusedCategory, setFocusedCategory] = useState<string>('all');

  // Three.js internal refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const taskMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2(-9999, -9999));
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const animationFrameIdRef = useRef<number | null>(null);
  const coreGroupRef = useRef<THREE.Group | null>(null);
  const nodesGroupRef = useRef<THREE.Group | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const prevMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraRotationRef = useRef<{ theta: number; phi: number; radius: number }>({
    theta: Math.PI / 4,
    phi: Math.PI / 3,
    radius: 32,
  });

  // Filter tasks based on focusedCategory
  const displayedTasks = useMemo(() => {
    if (focusedCategory === 'all') return tasks;
    if (focusedCategory === 'pending') return tasks.filter((t) => !t.completed);
    if (focusedCategory === 'completed') return tasks.filter((t) => t.completed);
    return tasks.filter((t) => t.category === focusedCategory);
  }, [tasks, focusedCategory]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x070913, 0.015);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    cameraRef.current = camera;
    const { theta, phi, radius } = cameraRotationRef.current;
    camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
    camera.position.y = radius * Math.cos(phi);
    camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x223366, 1.8);
    scene.add(ambientLight);

    const coreLight = new THREE.PointLight(0x6366f1, 4, 60);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    const topCyanLight = new THREE.PointLight(0x06b6d4, 3, 70);
    topCyanLight.position.set(15, 20, 15);
    scene.add(topCyanLight);

    const bottomMagentaLight = new THREE.PointLight(0xd946ef, 2.5, 70);
    bottomMagentaLight.position.set(-15, -15, -15);
    scene.add(bottomMagentaLight);

    // 5. Starfield / Nebula Dust
    const particleCount = 1200;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(particleCount * 3);
    const starColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const r = 20 + Math.random() * 80;
      const thetaS = Math.random() * Math.PI * 2;
      const phiS = Math.acos(Math.random() * 2 - 1);

      starPositions[i3] = r * Math.sin(phiS) * Math.cos(thetaS);
      starPositions[i3 + 1] = r * Math.cos(phiS);
      starPositions[i3 + 2] = r * Math.sin(phiS) * Math.sin(thetaS);

      // Star hues: cyan, lavender, gold
      const choice = Math.random();
      if (choice < 0.4) {
        starColors[i3] = 0.4;
        starColors[i3 + 1] = 0.7;
        starColors[i3 + 2] = 1.0;
      } else if (choice < 0.8) {
        starColors[i3] = 0.7;
        starColors[i3 + 1] = 0.5;
        starColors[i3 + 2] = 1.0;
      } else {
        starColors[i3] = 1.0;
        starColors[i3 + 1] = 0.8;
        starColors[i3 + 2] = 0.5;
      }
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.65,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // 6. Central Holographic Core (Productivity Chronos Nucleus)
    const coreGroup = new THREE.Group();
    coreGroupRef.current = coreGroup;
    scene.add(coreGroup);

    // Inner glowing sphere
    const innerSphereGeo = new THREE.SphereGeometry(2.4, 32, 32);
    const innerSphereMat = new THREE.MeshStandardMaterial({
      color: 0x4f46e5,
      emissive: 0x312e81,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: false,
    });
    const innerSphere = new THREE.Mesh(innerSphereGeo, innerSphereMat);
    coreGroup.add(innerSphere);

    // Outer wireframe crystalline cage (Icosahedron)
    const cageGeo = new THREE.IcosahedronGeometry(3.6, 1);
    const cageMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const cage = new THREE.Mesh(cageGeo, cageMat);
    coreGroup.add(cage);

    // Time Orbit Rings (Concentric celestial rings)
    const ringRadii = [6, 10, 15, 20];
    ringRadii.forEach((r, idx) => {
      const ringGeo = new THREE.RingGeometry(r - 0.05, r + 0.05, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx % 2 === 0 ? 0x06b6d4 : 0x818cf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.25 - idx * 0.03,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      coreGroup.add(ringMesh);
    });

    // 7. Group for interactive 3D Task Nodes
    const nodesGroup = new THREE.Group();
    nodesGroupRef.current = nodesGroup;
    scene.add(nodesGroup);

    // Drag / Orbit interaction
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDraggingRef.current = true;
        prevMousePosRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouseRef.current.set(x, y);

      if (isDraggingRef.current) {
        const deltaX = e.clientX - prevMousePosRef.current.x;
        const deltaY = e.clientY - prevMousePosRef.current.y;
        prevMousePosRef.current = { x: e.clientX, y: e.clientY };

        cameraRotationRef.current.theta -= deltaX * 0.008;
        cameraRotationRef.current.phi = Math.max(
          0.1,
          Math.min(Math.PI - 0.1, cameraRotationRef.current.phi - deltaY * 0.008)
        );
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraRotationRef.current.radius = Math.max(
        14,
        Math.min(60, cameraRotationRef.current.radius + e.deltaY * 0.04)
      );
    };

    const handleClick = () => {
      if (!cameraRef.current || !sceneRef.current) return;
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const meshes = Array.from(taskMeshesRef.current.values());
      const intersects = raycasterRef.current.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const taskData = hitMesh.userData?.task as TaskItem;
        if (taskData) {
          onSelectTask(taskData);
        }
      }
    };

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('click', handleClick);
    window.addEventListener('resize', handleResize);

    // 8. Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Camera positioning
      if (autoRotate && !isDraggingRef.current) {
        cameraRotationRef.current.theta += 0.0025;
      }
      const { theta, phi, radius } = cameraRotationRef.current;
      camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
      camera.lookAt(0, 0, 0);

      // Core rotations
      if (coreGroupRef.current) {
        coreGroupRef.current.rotation.y = elapsedTime * 0.15;
        cage.rotation.x = elapsedTime * 0.2;
        cage.rotation.z = elapsedTime * 0.15;
      }

      // Starfield slow drift
      starField.rotation.y = elapsedTime * 0.02;

      // Animate task nodes
      taskMeshesRef.current.forEach((mesh, id) => {
        const speed = (mesh.userData.orbitSpeed || 0.1) * 0.6;
        const orbitRadius = mesh.userData.orbitRadius || 12;
        const initialAngle = mesh.userData.initialAngle || 0;
        const currentAngle = initialAngle + elapsedTime * speed;
        const yOffset = mesh.userData.yOffset || 0;

        mesh.position.x = Math.cos(currentAngle) * orbitRadius;
        mesh.position.z = Math.sin(currentAngle) * orbitRadius;
        mesh.position.y = yOffset + Math.sin(elapsedTime * 1.5 + initialAngle) * 0.8;

        mesh.rotation.x += 0.02;
        mesh.rotation.y += 0.03;

        // Pulse scale if urgent
        if (mesh.userData.task?.priority === 'urgent' && !mesh.userData.task?.completed) {
          const pulse = 1 + Math.sin(elapsedTime * 6) * 0.18;
          mesh.scale.set(pulse, pulse, pulse);
        }
      });

      // Raycasting for hover tooltip
      if (cameraRef.current && nodesGroupRef.current) {
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const meshes = Array.from(taskMeshesRef.current.values());
        const intersects = raycasterRef.current.intersectObjects(meshes);

        if (intersects.length > 0) {
          const hitMesh = intersects[0].object as THREE.Mesh;
          const task = hitMesh.userData?.task as TaskItem;
          if (task) {
            // Project 3D coordinate to 2D screen coordinate
            const tempV = new THREE.Vector3();
            hitMesh.getWorldPosition(tempV);
            tempV.project(camera);

            const screenX = ((tempV.x + 1) * container.clientWidth) / 2;
            const screenY = ((-tempV.y + 1) * container.clientHeight) / 2;

            setHoveredTask({ task, screenX, screenY });
            document.body.style.cursor = 'pointer';
          }
        } else {
          setHoveredTask(null);
          document.body.style.cursor = 'default';
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [autoRotate, onSelectTask]);

  // Update 3D nodes whenever displayedTasks changes
  useEffect(() => {
    const nodesGroup = nodesGroupRef.current;
    if (!nodesGroup) return;

    // Clear previous task nodes
    taskMeshesRef.current.forEach((mesh) => {
      nodesGroup.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
    });
    taskMeshesRef.current.clear();

    const count = displayedTasks.length;
    if (count === 0) return;

    displayedTasks.forEach((task, index) => {
      const id = task.id || task._id || `task_${index}`;

      // Calculate orbital distance and height based on category and index
      const tier = (index % 3) + 1;
      const orbitRadius = 7 + tier * 4.5;
      const initialAngle = (index / count) * Math.PI * 2;
      const yOffset = ((index % 5) - 2) * 2.2;
      const orbitSpeed = 0.15 / Math.sqrt(tier);

      // Node color & appearance based on completion and priority
      let colorHex = 0x06b6d4; // Cyan default
      let emissiveHex = 0x0284c7;

      if (task.completed) {
        colorHex = 0x10b981; // Emerald for Completed
        emissiveHex = 0x059669;
      } else if (task.priority === 'urgent') {
        colorHex = 0xef4444; // Crimson for Urgent Pending
        emissiveHex = 0xdc2626;
      } else if (task.priority === 'high') {
        colorHex = 0xf59e0b; // Amber for High Pending
        emissiveHex = 0xd97706;
      } else if (task.category === 'study') {
        colorHex = 0x8b5cf6; // Purple for Study
        emissiveHex = 0x7c3aed;
      } else if (task.category === 'health') {
        colorHex = 0x14b8a6; // Teal for Health
        emissiveHex = 0x0d9488;
      }

      // Geometry: Completed tasks are smooth spheres; Pending tasks are multifaceted crystals (Octahedrons/Dodecahedrons)
      let geometry: THREE.BufferGeometry;
      if (task.completed) {
        geometry = new THREE.SphereGeometry(0.9, 24, 24);
      } else if (task.priority === 'urgent') {
        geometry = new THREE.DodecahedronGeometry(1.2, 0);
      } else {
        geometry = new THREE.OctahedronGeometry(1.0, 0);
      }

      const material = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: emissiveHex,
        emissiveIntensity: task.completed ? 0.7 : 0.9,
        roughness: 0.15,
        metalness: 0.85,
        wireframe: false,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = Math.cos(initialAngle) * orbitRadius;
      mesh.position.z = Math.sin(initialAngle) * orbitRadius;
      mesh.position.y = yOffset;

      // Add a faint orbital beacon ring around urgent tasks
      if (task.priority === 'urgent' && !task.completed) {
        const ringGeo = new THREE.RingGeometry(1.4, 1.5, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xef4444,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
        });
        const beaconRing = new THREE.Mesh(ringGeo, ringMat);
        beaconRing.rotation.x = Math.PI / 2;
        mesh.add(beaconRing);
      }

      mesh.userData = {
        task,
        orbitRadius,
        initialAngle,
        yOffset,
        orbitSpeed,
      };

      nodesGroup.add(mesh);
      taskMeshesRef.current.set(id, mesh);
    });
  }, [displayedTasks]);

  const zoomIn = () => {
    cameraRotationRef.current.radius = Math.max(14, cameraRotationRef.current.radius - 5);
  };

  const zoomOut = () => {
    cameraRotationRef.current.radius = Math.min(60, cameraRotationRef.current.radius + 5);
  };

  const resetCamera = () => {
    cameraRotationRef.current = {
      theta: Math.PI / 4,
      phi: Math.PI / 3,
      radius: 32,
    };
  };

  return (
    <div className="three-scene-wrapper">
      {/* 3D Canvas Container */}
      <div ref={mountRef} className="three-canvas-viewport" />

      {/* Floating 3D HUD Controls */}
      <div className="three-hud-controls">
        <div className="hud-pill">
          <Sparkles size={14} className="hud-icon text-cyan" />
          <span>Interactive 3D Constellation</span>
        </div>

        <div className="hud-actions">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`hud-btn ${autoRotate ? 'active' : ''}`}
            title="Toggle Celestial Rotation"
          >
            <RotateCw size={14} className={autoRotate ? 'spin-slow' : ''} />
            <span>{autoRotate ? 'Rotating' : 'Paused'}</span>
          </button>

          <button onClick={zoomIn} className="hud-btn" title="Zoom In">
            <ZoomIn size={14} />
          </button>

          <button onClick={zoomOut} className="hud-btn" title="Zoom Out">
            <ZoomOut size={14} />
          </button>

          <button onClick={resetCamera} className="hud-btn" title="Reset 3D Perspective">
            <Eye size={14} />
            <span>Reset View</span>
          </button>
        </div>
      </div>

      {/* Filter Badges in 3D Space */}
      <div className="three-filters-bar">
        {['all', 'pending', 'completed', 'work', 'study', 'health'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFocusedCategory(cat)}
            className={`filter-chip ${focusedCategory === cat ? 'active' : ''}`}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* 3D Interactive Hover Tooltip */}
      {hoveredTask && (
        <div
          className="three-hover-tooltip"
          style={{
            left: `${hoveredTask.screenX}px`,
            top: `${hoveredTask.screenY}px`,
          }}
        >
          <div className="tooltip-header">
            <span className={`priority-badge ${hoveredTask.task.priority}`}>
              {hoveredTask.task.priority.toUpperCase()}
            </span>
            <span className="category-badge">{hoveredTask.task.category}</span>
          </div>

          <h4 className="tooltip-title">{hoveredTask.task.title}</h4>

          <div className="tooltip-time">
            <Clock size={12} />
            <span>
              {hoveredTask.task.startTime} - {hoveredTask.task.endTime} ({hoveredTask.task.date})
            </span>
          </div>

          <div className="tooltip-status">
            {hoveredTask.task.completed ? (
              <span className="status-done">
                <CheckCircle2 size={12} /> Work Completed
              </span>
            ) : (
              <span className="status-pending">⚡ Work Pending</span>
            )}
          </div>

          <div className="tooltip-action-hint">
            <span>Click node to view & manage</span>
          </div>
        </div>
      )}

      {/* Instructional Banner */}
      <div className="three-instruction-footer">
        <span>Drag to rotate 3D orbit • Scroll to zoom • Click glowing nodes to inspect tasks</span>
      </div>
    </div>
  );
}
