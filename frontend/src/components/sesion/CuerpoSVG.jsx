import { useState, useRef, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

const CATEGORIA_COLOR = {
  virus:          { color: '#fbbf24', label: 'Virus' },
  bacterias:      { color: '#60a5fa', label: 'Bacterias' },
  hongos:         { color: '#4ade80', label: 'Hongos' },
  parasitos:      { color: '#fb923c', label: 'Parásitos' },
  disfuncion:     { color: '#c084fc', label: 'Disfunción' },
  psicoemocional: { color: '#f472b6', label: 'Psicoemocional' },
  reservorios:    { color: '#f87171', label: 'Reservorios' },
  complejos:      { color: '#94a3b8', label: 'Complejos' },
};

// El modelo tiene dimensiones ~25(X) x 12(Y) x 68(Z), acostado boca arriba
// Después de rotar -90° en X: Z se convierte en Y (altura), Y en Z (profundidad)
// Centro real: X≈13, Y≈6, Z≈34  → tras escalar a altura 4.0: factor = 4/68 ≈ 0.0588
// Posiciones 3D de zonas corporales (en espacio normalizado post-rotación)
// Y positivo = arriba (cabeza), Y negativo = abajo (pies)
const ZONA_Y = {
  cabeza:       1.85,
  cuello:       1.50,
  torax:        1.00,
  abdomen:      0.40,
  pelvis:      -0.10,
  espalda:      0.80,
  extremidades:-0.80,
};

// Convierte coord_x (0-100, 50=centro) a X en 3D
// Derecho del paciente = X negativo en Three.js (espejo)
function toX(coord, lado) {
  if (coord == null) return lado === 'D' ? -0.30 : 0.30;
  // 50 = centro, <50 = izquierda pantalla = derecha paciente = X negativo
  return ((coord - 50) / 50) * 0.55;
}

function toY(zona) {
  return ZONA_Y[zona] ?? 0.3;
}

// Punto 3D
function PuntoPar({ position, colorHex, activo, par, onClick, onHover }) {
  const meshRef = useRef();
  const pulseRef = useRef(0);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (activo) {
      pulseRef.current += delta * 3;
      meshRef.current.scale.setScalar(1 + Math.sin(pulseRef.current) * 0.3);
    } else {
      meshRef.current.scale.setScalar(hovered ? 1.5 : 1.0);
    }
  });

  const radius = activo ? 0.055 : 0.038;

  return (
    <group position={position}>
      {(activo || hovered) && (
        <mesh>
          <sphereGeometry args={[radius * 2.5, 10, 10]} />
          <meshBasicMaterial color={colorHex} transparent opacity={0.18} />
        </mesh>
      )}
      <mesh ref={meshRef}
        onClick={e => { e.stopPropagation(); onClick(par); }}
        onPointerOver={e => { e.stopPropagation(); setHovered(true); onHover(par); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); onHover(null); document.body.style.cursor = 'auto'; }}>
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial
          color={colorHex}
          emissive={colorHex}
          emissiveIntensity={activo ? 1.0 : hovered ? 0.6 : 0.25}
          roughness={0.2}
          metalness={0.2}
        />
      </mesh>
      {hovered && (
        <Html distanceFactor={5} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(14,17,48,0.97)',
            border: `1.5px solid ${CATEGORIA_COLOR[par.categoria]?.color || '#94a3b8'}`,
            borderRadius: 8,
            padding: '7px 12px',
            whiteSpace: 'nowrap',
            fontFamily: 'Outfit, sans-serif',
            boxShadow: `0 4px 20px ${CATEGORIA_COLOR[par.categoria]?.color || '#94a3b8'}40`,
            minWidth: 140,
          }}>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 12, marginBottom: 3 }}>
              {par.nombre_corto || par.nombre}
            </div>
            <div style={{ color: CATEGORIA_COLOR[par.categoria]?.color || '#94a3b8', fontSize: 10, marginBottom: par.microorganismo ? 2 : 0 }}>
              {CATEGORIA_COLOR[par.categoria]?.label || par.categoria}
            </div>
            {par.microorganismo && (
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9 }}>{par.microorganismo}</div>
            )}
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, marginTop: 3 }}>
              Clic para detalles
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function LineaPar({ posD, posI, color }) {
  const ref = useRef();
  useEffect(() => {
    if (!ref.current) return;
    const points = [new THREE.Vector3(...posD), new THREE.Vector3(...posI)];
    ref.current.geometry.setFromPoints(points);
  }, [posD, posI]);
  return (
    <line_ ref={ref}>
      <bufferGeometry />
      <lineBasicMaterial color={color} transparent opacity={0.5} />
    </line_>
  );
}

function Modelo() {
  const { scene } = useGLTF('/modelo_cuerpo.glb');
  const groupRef = useRef();

  useEffect(() => {
    // Aplicar material anatómico
    scene.traverse(child => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xc49a6c,
          roughness: 0.80,
          metalness: 0.0,
          transparent: true,
          opacity: 0.88,
          side: THREE.FrontSide,
        });
      }
    });

    // Calcular bounding box real
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // El eje más largo es Z (altura del cuerpo acostado = ~68)
    // Escalamos para que mida 4.0 unidades de alto
    const targetHeight = 4.0;
    const scale = targetHeight / size.z;
    scene.scale.setScalar(scale);

    // Recentrar después de escalar
    const box2 = new THREE.Box3().setFromObject(scene);
    const center2 = box2.getCenter(new THREE.Vector3());
    scene.position.set(-center2.x, -center2.y, -center2.z);

    // Rotar: el modelo está acostado (Z=altura), lo paramos (-90° en X)
    if (groupRef.current) {
      groupRef.current.rotation.x = -Math.PI / 2;
    }
  }, [scene]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

function Escena({ pares, paresActivos, onParClick }) {
  const [hovered, setHovered] = useState(null);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 4]} intensity={1.4} />
      <directionalLight position={[-3, 2, -3]} intensity={0.5} color="#4060ff" />
      <pointLight position={[0, 4, 3]} intensity={0.6} color="#14b8a6" />

      <Suspense fallback={null}>
        <Modelo />
      </Suspense>

      {pares.map(par => {
        if (par.coord_x_der == null) return null;
        const activo = paresActivos.includes(par.id);
        const cat = CATEGORIA_COLOR[par.categoria] || { color: '#94a3b8', label: '?' };
        const colorInt = parseInt(cat.color.replace('#', ''), 16);

        const y = toY(par.zona_cuerpo);
        const xD = toX(par.coord_x_der, 'D');
        const xI = toX(par.coord_x_izq, 'I');
        const posD = [xD, y, 0.18];
        const posI = [xI, y, 0.18];
        const isDiff = Math.abs(xD - xI) > 0.05;

        return (
          <group key={par.id}>
            {activo && isDiff && (
              <line>
                <bufferGeometry
                  ref={ref => {
                    if (ref) ref.setFromPoints([
                      new THREE.Vector3(...posD),
                      new THREE.Vector3(...posI),
                    ]);
                  }}
                />
                <lineBasicMaterial color={colorInt} transparent opacity={0.45} />
              </line>
            )}
            <PuntoPar position={posD} colorHex={colorInt} activo={activo}
              par={par} onClick={onParClick} onHover={setHovered} />
            {isDiff && (
              <PuntoPar position={posI} colorHex={colorInt} activo={activo}
                par={par} onClick={onParClick} onHover={setHovered} />
            )}
          </group>
        );
      })}

      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={8}
        target={[0, 0.2, 0]}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
      />
    </>
  );
}

export default function CuerpoSVG({ pares = [], paresActivos = [], onParClick }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-white/30">
        <span>🖱 Arrastra para rotar · Scroll para zoom · Clic en punto para ver par</span>
        <span>{paresActivos.length} par(es) activo(s)</span>
      </div>

      <div className="rounded-xl overflow-hidden border border-white/5 bg-[#080b24]" style={{ height: 480 }}>
        <Canvas camera={{ position: [0, 0.5, 4.5], fov: 42 }} gl={{ antialias: true }}>
          <Escena pares={pares} paresActivos={paresActivos} onParClick={onParClick} />
        </Canvas>
      </div>

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
