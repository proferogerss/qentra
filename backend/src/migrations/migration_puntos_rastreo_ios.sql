-- Migración: puntos_rastreo_ios
-- Tabla dedicada para coordenadas de calibración del mapa corporal en la app iOS de Qentra.
-- Independiente de coord_x_der/coord_y_der/etc. en pares_biomagneticos (esas eran para
-- el mapa web que ya no se usará).

CREATE TABLE IF NOT EXISTS puntos_rastreo_ios (
    id SERIAL PRIMARY KEY,
    par_id INTEGER NOT NULL REFERENCES pares_biomagneticos(id) ON DELETE CASCADE,
    vista VARCHAR(20) NOT NULL,        -- 'cuerpoFrente' | 'cuerpoAtras' | 'cabezaFrente' | 'cabezaAtras'
    lado VARCHAR(10),                   -- 'derecho' | 'izquierdo' | NULL (si es punto único/central)
    x_pct NUMERIC(6,4) NOT NULL,        -- 0.0000 a 1.0000
    y_pct NUMERIC(6,4) NOT NULL,
    nombre_punto VARCHAR(100),          -- ej "Hígado", "Timo" — para mostrar en el pin
    creado_por INTEGER REFERENCES usuarios(id),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_puntos_rastreo_ios UNIQUE(par_id, vista, lado)
);

CREATE INDEX IF NOT EXISTS idx_puntos_rastreo_ios_vista ON puntos_rastreo_ios(vista);
CREATE INDEX IF NOT EXISTS idx_puntos_rastreo_ios_par ON puntos_rastreo_ios(par_id);

COMMENT ON TABLE puntos_rastreo_ios IS 'Coordenadas de calibración del mapa corporal en la app iOS de Qentra. El rastreo web fue descontinuado; esta tabla reemplaza el uso de coord_x_der/coord_y_der/etc.';
