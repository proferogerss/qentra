import { useState, useRef, Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Environment } from '@react-three/drei';
import * as THREE from 'three';

const CATEGORIA_COLOR = {
  virus:          { color: '#fbbf24', hex: 0xfbbf24, label: 'Virus' },
  bacterias:      { color: '#60a5fa', hex: 0x60a5fa, label: 'Bacterias' },
  hongos:         { color: '#4ade80', hex: 0x4ade80, label: 'Hongos' },
  parasitos:      { color: '#fb923c', hex: 0xfb923c, label: 'Parásitos' },
  disfuncion:     { color: '#c084fc', hex: 0xc084fc, label: 'Disfunción' },
  psicoemocional: { color: '#f472b6', hex: 0xf472b6, label: 'Psicoemocional' },
  reservorios:    { color: '#f87171', hex: 0xf87171, label: 'Reservorios' },
  complejos:      { color: '#94a3b8', hex: 0x94a3b8, label: 'Complejos' },
};

// Mapa de coordenadas 3D por zona corporal (ajustado al modelo écorché)
// El modelo está aproximadamente centrado en Y, altura ~2.0 unidades
const ZONA_COORDS = {
  cabeza:       { y:  1.75, rango: 0.15 },
  cuello:       { y:  1.45, rango: 0.08 },
  torax:        { y:  1.10, rango: 0.25 },
  abdomen:      { y:  0.65, rango: 0.20 },
  pelvis:       { y:  0.20, rango: 0.15 },
  espalda:      { y:  0.90, rango: 0.30 },
  extremidades: { y:  0.00, rango: 0.40 },
};

// Convierte coordenadas % (del catálogo 2D) a posición 3D en el modelo
function coordsTo3D(par) {
  const zona = ZONA_COORDS[par.zona_cuerpo] || { y: 0.5, rango: 0.2 };
  const xD = par.coord_x_der != null ? ((par.coord_x_der - 50) / 50) * 0.35 : 0.18;
  const xI = par.coord_x_izq != null ? ((par.coord_x_izq - 50) / 50) * 0.35 : -0.18;
  const y  = zona.y + (Math.random() * 0.02 - 0.01); // micro variación para no apilar
  const z  = 0.22; // ligeramente al frente de la silueta
  return { posD: [xD, y, z], posI: [xI, y, z] };
}

// Punto 3D individual
function PuntoPar({ position, color, activo, par, onClick, onHover }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const pulseRef = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (activo) {
      pulseRef.current += delta * 2;
      const scale = 1 + Math.sin(pulseRef.current) * 0.25;
      meshRef.current.scale.setScalar(scale);
    } else {
      meshRef.current.scale.setScalar(hovered ? 1.4 : 1);
    }
  });

  const r = activo ? 0.022 : 0.016;

  return (
    <group position={position}>
      {/* Halo exterior */}
      {(activo || hovered) && (
        <mesh>
          <sphereGeometry args={[r * 2.2, 12, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.15} />
        </mesh>
      )}
      {/* Punto principal */}
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(par); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(par); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); onHover(null); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[r, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={activo ? 0.8 : hovered ? 0.5 : 0.2}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>
      {/* Tooltip */}
      {hovered && (
        <Html distanceFactor={4} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(20,23,84,0.95)',
            border: `1px solid ${color}`,
            borderRadius: 8,
            padding: '6px 10px',
            whiteSpace: 'nowrap',
            color: 'white',
            fontSize: 11,
            fontFamily: 'Outfit, sans-serif',
            boxShadow: `0 0 12px ${color}40`,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>
              {par.nombre_corto || par.nombre}
            </div>
            <div style={{ color, fontSize: 10 }}>
              {CATEGORIA_COLOR[par.categoria]?.label || par.categoria}
            </div>
            {par.microorganismo && (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, marginTop: 2 }}>
                {par.microorganismo}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// Línea que conecta par D-I cuando está activo
function LineaPar({ posD, posI, color }) {
  const points = [new THREE.Vector3(...posD), new THREE.Vector3(...posI)];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return (
    <line geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.4} />
    </line>
  );
}

// Modelo 3D GLB
function Modelo() {
  const { scene } = useGLTF('/modelo_cuerpo.glb');

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xc8a882,
          roughness: 0.75,
          metalness: 0.05,
          transparent: true,
          opacity: 0.82,
          side: THREE.DoubleSide,
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    // Centrar y escalar el modelo
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2.0 / maxDim;
    scene.scale.setScalar(scale);
    scene.position.sub(center.multiplyScalar(scale));
  }, [scene]);

  return <primitive object={scene} />;
}

// Escena principal
function Escena({ pares, paresActivos, onParClick }) {
  const [hoveredPar, setHoveredPar] = useState(null);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 4, 3]} intensity={1.2} castShadow />
      <directionalLight position={[-2, 2, -2]} intensity={0.4} color="#6080ff" />
      <pointLight position={[0, 3, 2]} intensity={0.5} color="#14b8a6" />

      <Suspense fallback={null}>
        <Modelo />
      </Suspense>

      {/* Puntos de pares */}
      {pares.map(par => {
        if (par.coord_x_der == null) return null;
        const { posD, posI } = coordsTo3D(par);
        const activo = paresActivos.includes(par.id);
        const colorInfo = CATEGORIA_COLOR[par.categoria] || { color: '#94a3b8', hex: 0x94a3b8 };

        return (
          <group key={par.id}>
            {activo && Math.abs(posD[0] - posI[0]) > 0.01 && (
              <LineaPar posD={posD} posI={posI} color={colorInfo.color} />
            )}
            <PuntoPar
              position={posD}
              color={colorInfo.hex}
              activo={activo}
              par={par}
              onClick={onParClick}
              onHover={setHoveredPar}
            />
            {Math.abs(posD[0] - posI[0]) > 0.05 && (
              <PuntoPar
                position={posI}
                color={colorInfo.hex}
                activo={activo}
                par={par}
                onClick={onParClick}
                onHover={setHoveredPar}
              />
            )}
          </group>
        );
      })}

      <OrbitControls
        enablePan={false}
        minDistance={1.5}
        maxDistance={6}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI - 0.1}
        target={[0, 0.3, 0]}
      />
    </>
  );
}

// Loading fallback
function LoadingCuerpo() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <div className="w-10 h-10 border-2 border-mag-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-white/30 text-sm">Cargando modelo 3D...</p>
    </div>
  );
}

export default function CuerpoSVG({ pares = [], paresActivos = [], onParClick }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Instrucciones */}
      <div className="flex items-center justify-between text-xs text-white/30">
        <span>🖱 Arrastra para rotar · Scroll para zoom · Clic en punto para ver par</span>
        <span>{paresActivos.length} activos</span>
      </div>

      {/* Canvas 3D */}
      <div className="rounded-xl overflow-hidden bg-mag-950 border border-white/5" style={{ height: 460 }}>
        <Suspense fallback={<LoadingCuerpo />}>
          <Canvas
            camera={{ position: [0, 0.5, 3.5], fov: 45 }}
            shadows
            gl={{ antialias: true, alpha: true }}
            style={{ background: 'transparent' }}
          >
            <Escena pares={pares} paresActivos={paresActivos} onParClick={onParClick} />
          </Canvas>
        </Suspense>
      </div>

      {/* Leyenda */}
      <div className="grid grid-cols-4 gap-1.5">
        {Object.entries(CATEGORIA_COLOR).map(([cat, { color, label }]) => (
          <div key={cat} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/3">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-xs text-white/50 truncate">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
