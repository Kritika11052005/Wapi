"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface ThreeCenterpieceProps {
  scrollPercent: number;
}

export default function ThreeCenterpiece({ scrollPercent }: ThreeCenterpieceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(scrollPercent);

  // Keep scrollPercent updated in ref to prevent effect recreation
  useEffect(() => {
    scrollRef.current = scrollPercent;
  }, [scrollPercent]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let width = container.clientWidth;
    let height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    // Central group
    const centerGroup = new THREE.Group();
    scene.add(centerGroup);

    // ============================================
    // 1. AMBIENT HALO — dark blue radial glow behind centerpiece
    // ============================================
    const haloGeo = new THREE.PlaneGeometry(20, 20);
    const haloCanvas = document.createElement("canvas");
    haloCanvas.width = 512;
    haloCanvas.height = 512;
    const hCtx = haloCanvas.getContext("2d");
    if (hCtx) {
      const grad = hCtx.createRadialGradient(256, 256, 0, 256, 256, 256);
      grad.addColorStop(0, "rgba(15, 25, 60, 0.6)");
      grad.addColorStop(0.3, "rgba(10, 15, 40, 0.3)");
      grad.addColorStop(0.6, "rgba(5, 8, 25, 0.1)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      hCtx.fillStyle = grad;
      hCtx.fillRect(0, 0, 512, 512);
    }
    const haloTexture = new THREE.CanvasTexture(haloCanvas);
    const haloMat = new THREE.MeshBasicMaterial({
      map: haloTexture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.z = -3;
    scene.add(haloMesh);

    // ============================================
    // 2. CENTRAL ACHROMATIC SPHERES & HEXAGONAL CORE
    // ============================================
    // Outer sphere wireframe (chrome ring feel)
    const outerSphereGeo = new THREE.SphereGeometry(1.0, 32, 16);
    const outerSphereMat = new THREE.MeshBasicMaterial({
      color: 0x888888,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    });
    const outerSphere = new THREE.Mesh(outerSphereGeo, outerSphereMat);
    centerGroup.add(outerSphere);

    // Middle sphere — slightly smaller, more opaque
    const midSphereGeo = new THREE.SphereGeometry(0.75, 24, 12);
    const midSphereMat = new THREE.MeshBasicMaterial({
      color: 0xaaaaaa,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
    });
    const midSphere = new THREE.Mesh(midSphereGeo, midSphereMat);
    centerGroup.add(midSphere);

    // 3D Hexagonal Core (Double hexagonal pyramid joined base-to-base)
    const hexagonalCoreGroup = new THREE.Group();
    
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xdddddd,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });

    const innerConeTop = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.45, 6, 1), innerMat);
    innerConeTop.position.y = 0.225;
    const innerConeBottom = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.45, 6, 1), innerMat);
    innerConeBottom.rotation.x = Math.PI;
    innerConeBottom.position.y = -0.225;
    
    hexagonalCoreGroup.add(innerConeTop);
    hexagonalCoreGroup.add(innerConeBottom);
    centerGroup.add(hexagonalCoreGroup);

    // Solid glow center (also hexagonal double-pyramid)
    const glowCoreGroup = new THREE.Group();
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const glowConeTop = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.22, 6, 1), glowMat);
    glowConeTop.position.y = 0.11;
    const glowConeBottom = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.22, 6, 1), glowMat);
    glowConeBottom.rotation.x = Math.PI;
    glowConeBottom.position.y = -0.11;

    glowCoreGroup.add(glowConeTop);
    glowCoreGroup.add(glowConeBottom);
    centerGroup.add(glowCoreGroup);

    // Point light from center (subtle warm orange highlight)
    const coreLight = new THREE.PointLight(0xffaa55, 3, 15, 2);
    centerGroup.add(coreLight);

    // ============================================
    // 3. CONCENTRIC ACHROMATIC RINGS — orbiting rings
    // ============================================
    interface RingData {
      mesh: THREE.Mesh;
      axis: THREE.Vector3;
      speed: number;
      phase: number;
    }
    const rings: RingData[] = [];

    const ringSpecs = [
      { radius: 1.4, tube: 0.012, color: 0xffffff, opacity: 0.5, speed: 0.12 },
      { radius: 1.9, tube: 0.008, color: 0xcccccc, opacity: 0.35, speed: -0.09 },
      { radius: 2.4, tube: 0.006, color: 0x999999, opacity: 0.25, speed: 0.06 },
      { radius: 2.9, tube: 0.005, color: 0x666666, opacity: 0.18, speed: -0.045 },
    ];

    ringSpecs.forEach((s, i) => {
      const geo = new THREE.TorusGeometry(s.radius, s.tube, 12, 100);
      const mat = new THREE.MeshBasicMaterial({
        color: s.color,
        transparent: true,
        opacity: s.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const axis = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();
      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      centerGroup.add(mesh);
      rings.push({ mesh, axis, speed: s.speed, phase: i * 1.2 });
    });

    // ============================================
    // 4. RIBBON TRAILS — flowing lines from center downward (achromatic)
    // ============================================
    const RIBBON_COUNT = 3;
    const RIBBON_SEGS = 120;
    interface RibbonData {
      line: THREE.Line;
      positions: Float32Array;
      angle: number;
      speed: number;
      radius: number;
      yBase: number;
      wobble: number;
    }
    const ribbons: RibbonData[] = [];

    for (let r = 0; r < RIBBON_COUNT; r++) {
      const positions = new Float32Array(RIBBON_SEGS * 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({
        color: r === 0 ? 0xffffff : r === 1 ? 0xcccccc : 0x888888,
        transparent: true,
        opacity: 0.2 + Math.random() * 0.15,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const line = new THREE.Line(geo, mat);
      centerGroup.add(line);
      ribbons.push({
        line,
        positions,
        angle: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.3,
        radius: 0.8 + Math.random() * 1.5,
        yBase: -0.5 - Math.random() * 1.5,
        wobble: 0.4 + Math.random() * 0.5,
      });
    }

    // ============================================
    // 5. BOKEH PARTICLES — large, scattered amber/orange glow
    // ============================================
    const BOKEH_COUNT = 60;
    const bokehGeo = new THREE.BufferGeometry();
    const bokehPos = new Float32Array(BOKEH_COUNT * 3);
    const bokehColors = new Float32Array(BOKEH_COUNT * 3);
    const bokehSizes = new Float32Array(BOKEH_COUNT);
    const bokehDrift: { vx: number; vy: number; vz: number }[] = [];

    const bokehPalette = [
      [1.0, 0.85, 0.3],   // gold
      [1.0, 0.65, 0.15],  // amber
      [1.0, 0.95, 0.85],  // warm white
      [0.9, 0.4, 0.25],   // rose/red
      [1.0, 0.75, 0.4],   // light amber
      [0.95, 0.95, 0.9],  // cool white
    ];

    for (let i = 0; i < BOKEH_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 1.5 + Math.random() * 5;
      bokehPos[i * 3] = Math.cos(angle) * dist;
      bokehPos[i * 3 + 1] = (Math.random() - 0.6) * 6;
      bokehPos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;

      const color = bokehPalette[Math.floor(Math.random() * bokehPalette.length)];
      bokehColors[i * 3] = color[0];
      bokehColors[i * 3 + 1] = color[1];
      bokehColors[i * 3 + 2] = color[2];

      bokehSizes[i] = 0.15 + Math.random() * 0.5;

      bokehDrift.push({
        vx: (Math.random() - 0.5) * 0.003,
        vy: 0.001 + Math.random() * 0.004,
        vz: (Math.random() - 0.5) * 0.002,
      });
    }

    bokehGeo.setAttribute("position", new THREE.BufferAttribute(bokehPos, 3));
    bokehGeo.setAttribute("color", new THREE.BufferAttribute(bokehColors, 3));

    const bokehCanvas = document.createElement("canvas");
    bokehCanvas.width = 64;
    bokehCanvas.height = 64;
    const bkCtx = bokehCanvas.getContext("2d");
    if (bkCtx) {
      const grad = bkCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255, 255, 255, 1)");
      grad.addColorStop(0.1, "rgba(255, 240, 200, 0.8)");
      grad.addColorStop(0.4, "rgba(255, 200, 100, 0.3)");
      grad.addColorStop(0.7, "rgba(255, 150, 50, 0.08)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      bkCtx.fillStyle = grad;
      bkCtx.fillRect(0, 0, 64, 64);
    }
    const bokehTexture = new THREE.CanvasTexture(bokehCanvas);

    const bokehMat = new THREE.PointsMaterial({
      size: 0.4,
      map: bokehTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const bokehPoints = new THREE.Points(bokehGeo, bokehMat);
    scene.add(bokehPoints);

    // ============================================
    // 6. SPARSE SPARK PARTICLES — small amber emitting from center
    // ============================================
    const SPARK_COUNT = 100;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(SPARK_COUNT * 3);
    const sparkVels: THREE.Vector3[] = [];
    const sparkLife = new Float32Array(SPARK_COUNT);
    const sparkMaxLife = new Float32Array(SPARK_COUNT);

    function resetSpark(i: number) {
      sparkPos[i * 3] = (Math.random() - 0.5) * 0.2;
      sparkPos[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      sparkPos[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const spd = 0.005 + Math.random() * 0.015;
      sparkVels[i] = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * spd,
        Math.sin(phi) * Math.sin(theta) * spd,
        Math.cos(phi) * spd
      );
      sparkLife[i] = 0;
      sparkMaxLife[i] = 2 + Math.random() * 3;
    }

    for (let i = 0; i < SPARK_COUNT; i++) resetSpark(i);
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));

    const sparkCanvas = document.createElement("canvas");
    sparkCanvas.width = 16;
    sparkCanvas.height = 16;
    const skCtx = sparkCanvas.getContext("2d");
    if (skCtx) {
      const grad = skCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, "rgba(255, 220, 150, 1)");
      grad.addColorStop(0.3, "rgba(255, 160, 60, 0.6)");
      grad.addColorStop(1, "rgba(255, 80, 0, 0)");
      skCtx.fillStyle = grad;
      skCtx.fillRect(0, 0, 16, 16);
    }
    const sparkTexture = new THREE.CanvasTexture(sparkCanvas);

    const sparkMat = new THREE.PointsMaterial({
      size: 0.08,
      map: sparkTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    centerGroup.add(sparkPoints);

    // ============================================
    // MOUSE PARALLAX
    // ============================================
    let mouseX = 0, mouseY = 0;
    let targetMX = 0, targetMY = 0;

    const onMouseMove = (e: MouseEvent) => {
      targetMX = ((e.clientX / window.innerWidth) * 2 - 1) * 0.5;
      targetMY = ((e.clientY / window.innerHeight) * 2 - 1) * 0.5;
    };
    window.addEventListener("mousemove", onMouseMove);

    // ============================================
    // RESIZE
    // ============================================
    const onResize = () => {
      if (!containerRef.current) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", onResize);

    // ============================================
    // ANIMATION
    // ============================================
    let frameId: number;
    const clock = new THREE.Clock();
    let smoothScroll = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const t = clock.getElapsedTime();

      // Interlope smoothScroll from current prop value
      smoothScroll += (scrollRef.current - smoothScroll) * 0.08;

      // Sphere & core rotations — speed increases as you scroll down
      const scrollSpeedMultiplier = 1 + smoothScroll * 2.0;
      outerSphere.rotation.y = t * 0.1 * scrollSpeedMultiplier;
      outerSphere.rotation.x = Math.sin(t * 0.08) * 0.2;
      midSphere.rotation.y = -t * 0.15 * scrollSpeedMultiplier;
      midSphere.rotation.z = t * 0.05;

      hexagonalCoreGroup.rotation.y = t * 0.3 * scrollSpeedMultiplier;
      hexagonalCoreGroup.rotation.x = t * 0.15;
      glowCoreGroup.rotation.y = t * 0.3 * scrollSpeedMultiplier;
      glowCoreGroup.rotation.x = t * 0.15;

      // Core pulse and light intensity based on scroll progress
      const pulse = (1 + Math.sin(t * 2) * 0.08) * (1 - smoothScroll * 0.2);
      glowCoreGroup.scale.setScalar(pulse);
      coreLight.intensity = (2.5 + Math.sin(t * 1.5) * 1.0) * (1 + smoothScroll * 1.5);

      // Centerpiece scaling and displacement based on scroll progress
      const groupScale = 1.0 - smoothScroll * 0.25;
      centerGroup.scale.setScalar(groupScale);
      
      // Move centerpiece slightly up/down as the view shifts
      centerGroup.position.y = -smoothScroll * 0.8;

      // Ring rotations & scroll stack disassembly
      rings.forEach((ring, i) => {
        const q = new THREE.Quaternion();
        q.setFromAxisAngle(ring.axis, ring.speed * dt * scrollSpeedMultiplier);
        ring.mesh.quaternion.premultiply(q);
        
        const breathe = 1 + Math.sin(t * 0.6 + ring.phase) * 0.02;
        ring.mesh.scale.setScalar(breathe);

        // Expand concentric rings along Z axis based on scroll (disassembly effect)
        const direction = i % 2 === 0 ? 1 : -1;
        ring.mesh.position.z = Math.sin(t * 0.4 + ring.phase) * 0.05 + (smoothScroll * 2.2 * direction);
      });

      // Ribbon trails — stretch out as you scroll
      ribbons.forEach((ribbon) => {
        ribbon.angle += ribbon.speed * dt * scrollSpeedMultiplier;
        for (let s = RIBBON_SEGS - 1; s > 0; s--) {
          ribbon.positions[s * 3] = ribbon.positions[(s - 1) * 3];
          ribbon.positions[s * 3 + 1] = ribbon.positions[(s - 1) * 3 + 1];
          ribbon.positions[s * 3 + 2] = ribbon.positions[(s - 1) * 3 + 2];
        }
        const r = (ribbon.radius + Math.sin(t * ribbon.wobble) * 0.3) * (1 + smoothScroll * 0.4);
        const yDrop = ribbon.yBase + Math.sin(ribbon.angle * 0.5) * 1.5 - Math.abs(Math.sin(ribbon.angle)) * 1.0;
        ribbon.positions[0] = Math.cos(ribbon.angle) * r * 0.6;
        ribbon.positions[1] = yDrop - smoothScroll * 1.5;
        ribbon.positions[2] = Math.sin(ribbon.angle) * r * 0.6;
        ribbon.line.geometry.attributes.position.needsUpdate = true;
      });

      // Sparks — fly faster and disperse outward with scroll progress
      const sP = sparkPoints.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < SPARK_COUNT; i++) {
        sparkLife[i] += dt;
        if (sparkLife[i] >= sparkMaxLife[i]) {
          resetSpark(i);
        } else {
          sP[i * 3] += sparkVels[i].x * scrollSpeedMultiplier;
          sP[i * 3 + 1] += sparkVels[i].y * scrollSpeedMultiplier;
          sP[i * 3 + 2] += sparkVels[i].z * scrollSpeedMultiplier;
          sparkVels[i].multiplyScalar(0.997);
        }
      }
      sparkPoints.geometry.attributes.position.needsUpdate = true;

      // Bokeh drift — float upward faster when scrolling down
      const bP = bokehPoints.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < BOKEH_COUNT; i++) {
        bP[i * 3] += bokehDrift[i].vx;
        bP[i * 3 + 1] += bokehDrift[i].vy + smoothScroll * 0.015;
        bP[i * 3 + 2] += Math.sin(t * 0.5 + i) * 0.0003;
        if (bP[i * 3 + 1] > 5) {
          bP[i * 3 + 1] = -5;
          bP[i * 3] = (Math.random() - 0.5) * 10;
        }
      }
      bokehPoints.geometry.attributes.position.needsUpdate = true;

      // Mouse parallax + camera adjustment based on scroll progress
      mouseX += (targetMX - mouseX) * 0.03;
      mouseY += (targetMY - mouseY) * 0.03;
      camera.position.x = mouseX * 2;
      camera.position.y = -mouseY * 1.5 + smoothScroll * 0.5;
      camera.position.z = 8 + smoothScroll * 2.0; // Zoom out slightly
      camera.lookAt(0, -smoothScroll * 0.8, 0);

      renderer.render(scene, camera);
    };

    animate();

    // ============================================
    // CLEANUP
    // ============================================
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.Line) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      haloTexture.dispose();
      bokehTexture.dispose();
      sparkTexture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full z-0"
      style={{ pointerEvents: "none" }}
    />
  );
}
