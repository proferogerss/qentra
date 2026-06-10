// Mapa corporal SVG interactivo — Par Biomagnético
// Los puntos se posicionan según coordenadas del catálogo

const CATEGORIA_COLOR = {
  virus:          '#fbbf24',
  bacterias:      '#60a5fa',
  hongos:         '#4ade80',
  parasitos:      '#fb923c',
  disfuncion:     '#c084fc',
  psicoemocional: '#f472b6',
  reservorios:    '#f87171',
  complejos:      '#94a3b8',
};

export default function CuerpoSVG({ pares = [], paresActivos = [], onParClick }) {
  return (
    <div className="relative w-full flex justify-center">
      <svg viewBox="0 0 200 420" className="w-full max-w-xs" style={{ maxHeight: 500 }}>
        {/* ── Silueta cuerpo frontal ── */}
        <g opacity="0.15" fill="#6080ff" stroke="#6080ff" strokeWidth="0.5">
          {/* Cabeza */}
          <ellipse cx="100" cy="22" rx="18" ry="20" />
          {/* Cuello */}
          <rect x="92" y="40" width="16" height="12" rx="4" />
          {/* Torso */}
          <path d="M72 52 Q60 55 58 80 L58 160 Q60 168 100 168 Q140 168 142 160 L142 80 Q140 55 128 52 Z" />
          {/* Brazo izquierdo */}
          <path d="M58 60 Q44 68 40 90 L38 145 Q39 150 44 150 L48 145 L50 100 L60 80 Z" />
          {/* Brazo derecho */}
          <path d="M142 60 Q156 68 160 90 L162 145 Q161 150 156 150 L152 145 L150 100 L140 80 Z" />
          {/* Pierna izquierda */}
          <path d="M78 168 Q72 172 70 200 L68 290 Q69 298 76 298 L84 298 L86 200 L90 172 Z" />
          {/* Pierna derecha */}
          <path d="M122 168 Q128 172 130 200 L132 290 Q131 298 124 298 L116 298 L114 200 L110 172 Z" />
          {/* Pie izquierdo */}
          <ellipse cx="76" cy="305" rx="10" ry="5" />
          {/* Pie derecho */}
          <ellipse cx="124" cy="305" rx="10" ry="5" />
        </g>

        {/* ── Línea central ── */}
        <line x1="100" y1="42" x2="100" y2="165" stroke="rgba(96,128,255,0.2)" strokeWidth="0.5" strokeDasharray="3,3" />

        {/* ── Puntos de pares ── */}
        {pares.map(par => {
          const activo = paresActivos.includes(par.id);
          const color = CATEGORIA_COLOR[par.categoria] || '#94a3b8';
          const hasCoords = par.coord_x_der != null && par.coord_y_der != null;
          if (!hasCoords) return null;

          // Escalar coordenadas de % a px del viewBox
          const xD = (par.coord_x_der / 100) * 200;
          const yD = (par.coord_y_der / 100) * 320;
          const xI = (par.coord_x_izq / 100) * 200;
          const yI = (par.coord_y_izq / 100) * 320;

          return (
            <g key={par.id} onClick={() => onParClick?.(par)} style={{ cursor: 'pointer' }}>
              {/* Punto derecho */}
              <circle cx={xD} cy={yD} r={activo ? 5 : 3.5}
                fill={activo ? color : `${color}60`}
                stroke={activo ? color : 'transparent'}
                strokeWidth={activo ? 1.5 : 0}
                className="transition-all duration-300"
              />
              {activo && (
                <circle cx={xD} cy={yD} r="7" fill="none" stroke={color} strokeWidth="0.8" opacity="0.5">
                  <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              {/* Punto izquierdo (solo si es diferente) */}
              {(Math.abs(xI - xD) > 1 || Math.abs(yI - yD) > 1) && (
                <>
                  <circle cx={xI} cy={yI} r={activo ? 5 : 3.5}
                    fill={activo ? color : `${color}60`}
                    stroke={activo ? color : 'transparent'}
                    strokeWidth={activo ? 1.5 : 0}
                    className="transition-all duration-300"
                  />
                  {activo && (
                    <circle cx={xI} cy={yI} r="7" fill="none" stroke={color} strokeWidth="0.8" opacity="0.5">
                      <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                </>
              )}
              {/* Línea que conecta par activo */}
              {activo && Math.abs(xI - xD) > 1 && (
                <line x1={xD} y1={yD} x2={xI} y2={yI}
                  stroke={color} strokeWidth="0.5" opacity="0.3" strokeDasharray="2,2" />
              )}
            </g>
          );
        })}

        {/* ── Leyenda ── */}
        <g transform="translate(2, 325)">
          {Object.entries(CATEGORIA_COLOR).slice(0, 4).map(([cat, color], i) => (
            <g key={cat} transform={`translate(${i * 48}, 0)`}>
              <circle cx="4" cy="4" r="3" fill={color} />
              <text x="9" y="7" fontSize="5" fill="rgba(255,255,255,0.4)" fontFamily="sans-serif">
                {cat.slice(0, 6)}
              </text>
            </g>
          ))}
        </g>
        <g transform="translate(2, 335)">
          {Object.entries(CATEGORIA_COLOR).slice(4).map(([cat, color], i) => (
            <g key={cat} transform={`translate(${i * 48}, 0)`}>
              <circle cx="4" cy="4" r="3" fill={color} />
              <text x="9" y="7" fontSize="5" fill="rgba(255,255,255,0.4)" fontFamily="sans-serif">
                {cat.slice(0, 6)}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
