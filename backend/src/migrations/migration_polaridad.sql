-- Migración: cambiar "lado" (derecho/izquierdo) por "polaridad" (rojo/negro)
-- en puntos_rastreo_ios.
--
-- Razón: en Par Biomagnético cada par tiene un polo positivo (rojo) y un
-- polo negativo (negro). Esto es independiente de en qué lado del cuerpo
-- caiga cada polo — "lado" mezclaba dos conceptos distintos.

-- 1. Agregar la columna nueva
ALTER TABLE puntos_rastreo_ios ADD COLUMN IF NOT EXISTS polaridad VARCHAR(10);

-- 2. Migrar datos existentes: lo que hoy es "derecho" lo tratamos como "rojo",
--    "izquierdo" como "negro", y NULL (único) se queda en NULL.
--    (Esto es solo para no perder el punto de prueba que ya guardamos;
--     se puede corregir manualmente después si no aplica.)
UPDATE puntos_rastreo_ios SET polaridad = 'rojo'  WHERE lado = 'derecho';
UPDATE puntos_rastreo_ios SET polaridad = 'negro' WHERE lado = 'izquierdo';

-- 3. Quitar la restricción UNIQUE vieja (basada en lado) y crear la nueva (basada en polaridad)
ALTER TABLE puntos_rastreo_ios DROP CONSTRAINT IF EXISTS uq_puntos_rastreo_ios;
ALTER TABLE puntos_rastreo_ios ADD CONSTRAINT uq_puntos_rastreo_ios UNIQUE (par_id, vista, polaridad);

-- 4. Eliminar la columna vieja
ALTER TABLE puntos_rastreo_ios DROP COLUMN IF EXISTS lado;

COMMENT ON COLUMN puntos_rastreo_ios.polaridad IS 'rojo (polo positivo) | negro (polo negativo) | NULL si el par tiene un solo punto';
