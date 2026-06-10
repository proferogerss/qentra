-- ============================================================
-- Qentra — Migración inicial completa
-- Base de datos: biomag_pro
-- ============================================================

-- EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USUARIOS / TERAPEUTAS
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(30) NOT NULL DEFAULT 'terapeuta', -- superadmin | admin | terapeuta
    telefono VARCHAR(20),
    foto TEXT, -- base64
    especialidad VARCHAR(200),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PACIENTES
-- ============================================================
CREATE TABLE IF NOT EXISTS pacientes (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE, -- generado automáticamente P-0001
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(80) NOT NULL,
    apellido_materno VARCHAR(80),
    fecha_nacimiento DATE,
    sexo VARCHAR(10), -- masculino | femenino | otro
    telefono VARCHAR(20),
    email VARCHAR(150),
    direccion TEXT,
    ciudad VARCHAR(100),
    estado VARCHAR(100),
    ocupacion VARCHAR(100),
    estado_civil VARCHAR(30),
    -- Historial médico
    antecedentes TEXT,
    alergias TEXT,
    medicamentos_actuales TEXT,
    enfermedades_cronicas TEXT,
    cirugias_previas TEXT,
    observaciones TEXT,
    -- Metadata
    terapeuta_id INTEGER REFERENCES usuarios(id),
    foto TEXT, -- base64
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS pacientes_codigo_seq START 1;

-- ============================================================
-- PARES BIOMAGNÉTICOS (catálogo del Dr. Isaac Goiz)
-- ============================================================
CREATE TABLE IF NOT EXISTS pares_biomagneticos (
    id SERIAL PRIMARY KEY,
    numero INTEGER, -- número del par en el manual
    nombre VARCHAR(200) NOT NULL,
    nombre_corto VARCHAR(100),
    -- Punto principal
    punto_derecho VARCHAR(200),
    punto_izquierdo VARCHAR(200),
    definicion TEXT,
    posicionamiento TEXT,
    -- Par relacionado
    par_nombre VARCHAR(200),
    par_derecho VARCHAR(200),
    par_izquierdo VARCHAR(200),
    -- Clasificación
    categoria VARCHAR(50), -- virus | bacterias | hongos | parasitos | disfuncion | psicoemocional | reservorios | complejos
    microorganismo VARCHAR(200),
    -- Síntomas y comentarios
    sintomas TEXT,
    comentarios TEXT,
    -- Localización en cuerpo (coordenadas SVG aproximadas)
    coord_x_der DECIMAL(5,2),
    coord_y_der DECIMAL(5,2),
    coord_x_izq DECIMAL(5,2),
    coord_y_izq DECIMAL(5,2),
    zona_cuerpo VARCHAR(50), -- cabeza | cuello | torax | abdomen | pelvis | espalda | extremidades
    -- Estado
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CITAS
-- ============================================================
CREATE TABLE IF NOT EXISTS citas (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id),
    terapeuta_id INTEGER NOT NULL REFERENCES usuarios(id),
    fecha_hora TIMESTAMPTZ NOT NULL,
    duracion_minutos INTEGER DEFAULT 60,
    estado VARCHAR(30) DEFAULT 'programada', -- programada | confirmada | en_curso | completada | cancelada | no_asistio
    tipo VARCHAR(50) DEFAULT 'primera_vez', -- primera_vez | seguimiento | urgencia
    motivo_consulta TEXT,
    notas_previas TEXT,
    precio DECIMAL(10,2),
    pagado BOOLEAN DEFAULT FALSE,
    metodo_pago VARCHAR(50),
    recordatorio_enviado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SESIONES / CONSULTAS
-- ============================================================
CREATE TABLE IF NOT EXISTS sesiones (
    id SERIAL PRIMARY KEY,
    cita_id INTEGER REFERENCES citas(id),
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id),
    terapeuta_id INTEGER NOT NULL REFERENCES usuarios(id),
    fecha TIMESTAMPTZ DEFAULT NOW(),
    duracion_segundos INTEGER,
    -- Estado de la sesión
    estado VARCHAR(30) DEFAULT 'activa', -- activa | completada | borrador
    -- Evaluación general
    nivel_energia_inicial INTEGER CHECK (nivel_energia_inicial BETWEEN 1 AND 10),
    nivel_energia_final INTEGER CHECK (nivel_energia_final BETWEEN 1 AND 10),
    -- Observaciones
    sintomas_principales TEXT,
    observaciones_generales TEXT,
    plan_siguiente_sesion TEXT,
    recomendaciones TEXT,
    -- Resumen IA generado
    resumen_ia TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PARES ENCONTRADOS EN SESIÓN
-- ============================================================
CREATE TABLE IF NOT EXISTS sesion_pares (
    id SERIAL PRIMARY KEY,
    sesion_id INTEGER NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
    par_id INTEGER NOT NULL REFERENCES pares_biomagneticos(id),
    orden INTEGER, -- orden en que se encontró
    activo BOOLEAN DEFAULT TRUE, -- TRUE=encontrado positivo
    intensidad VARCHAR(20), -- leve | moderado | intenso
    tiempo_impactacion INTEGER, -- segundos con imán
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EVOLUCIÓN / NOTAS DE SEGUIMIENTO
-- ============================================================
CREATE TABLE IF NOT EXISTS evoluciones (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id),
    sesion_id INTEGER REFERENCES sesiones(id),
    terapeuta_id INTEGER NOT NULL REFERENCES usuarios(id),
    fecha TIMESTAMPTZ DEFAULT NOW(),
    tipo VARCHAR(50), -- nota | llamada | mensaje | evaluacion
    contenido TEXT NOT NULL,
    archivos TEXT, -- JSON array de base64
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CATÁLOGO DE EQUIPO / TECNOLOGÍA
-- ============================================================
CREATE TABLE IF NOT EXISTS catalogo_equipo (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    categoria VARCHAR(80), -- imanes | accesorios | tecnologia | formacion
    subcategoria VARCHAR(80),
    descripcion TEXT,
    especificaciones TEXT, -- JSON con specs técnicas
    imagen TEXT, -- base64
    precio DECIMAL(10,2),
    disponible BOOLEAN DEFAULT TRUE,
    destacado BOOLEAN DEFAULT FALSE,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_pacientes_terapeuta ON pacientes(terapeuta_id);
CREATE INDEX IF NOT EXISTS idx_citas_paciente ON citas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_citas_terapeuta ON citas(terapeuta_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_sesiones_paciente ON sesiones(paciente_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_terapeuta ON sesiones(terapeuta_id);
CREATE INDEX IF NOT EXISTS idx_sesion_pares_sesion ON sesion_pares(sesion_id);
CREATE INDEX IF NOT EXISTS idx_pares_categoria ON pares_biomagneticos(categoria);
CREATE INDEX IF NOT EXISTS idx_pares_zona ON pares_biomagneticos(zona_cuerpo);

-- ============================================================
-- DATOS INICIALES — Usuario admin
-- ============================================================
INSERT INTO usuarios (nombre, email, password_hash, rol)
VALUES ('Administrador', 'admin@biomag.pro', '$2b$10$rQnK3jJ5LpN8eM7vXyZ2OuGhTkW1sDfA4cBiPmVnE6oIlJwYqRx0S', 'superadmin')
ON CONFLICT (email) DO NOTHING;
-- Contraseña inicial: BioMag2026#  (cambiar al primer login)

-- ============================================================
-- DATOS INICIALES — Catálogo de equipo (imanes del manual)
-- ============================================================
INSERT INTO catalogo_equipo (nombre, categoria, subcategoria, descripcion, especificaciones, disponible, destacado, orden) VALUES
('Ferrita Dominó', 'imanes', 'ferrita', 
 'El imán más adecuado para rastreo e impactación en Par Biomagnético. Considerado el estándar de referencia por el Dr. Isaac Goiz.',
 '{"medidas": "5 x 2.5 x 1 cm", "potencia": "1000 gauss", "tipo": "Media potencia", "color_positivo": "Rojo", "color_negativo": "Negro"}',
 true, true, 1),
('Neodimio Circular', 'imanes', 'neodimio',
 'Imán de alta potencia utilizable en puntos magnetorresistentes y procesos tumorales.',
 '{"medidas": "Variable", "potencia": ">2000 gauss", "tipo": "Alta potencia", "nota": "Uso con precaución"}',
 true, true, 2),
('Ferrita Inductor', 'imanes', 'ferrita',
 'Indicado para zonas de rastreo con doble polaridad como la escápula.',
 '{"medidas": "8 x 2.5 cm", "potencia": "1000 gauss", "tipo": "Media potencia", "aplicacion": "Doble polaridad"}',
 true, false, 3),
('Kit Iniciación Biomagnetismo', 'equipo', 'kits',
 'Kit completo para iniciar la práctica: par de ferritas dominó, guía de posicionamiento y funda protectora.',
 '{"contenido": ["2 ferritas dominó", "guía rápida", "fundas protectoras"], "nivel": "Principiante"}',
 true, true, 4),
('Camilla Portátil', 'accesorios', 'camillas',
 'Camilla plegable de aluminio con altura regulable, ideal para consultas en domicilio.',
 '{"material": "Aluminio y espuma de alta densidad", "carga_max": "180kg", "dimensiones": "186 x 65 cm", "peso": "8kg"}',
 true, false, 5)
ON CONFLICT DO NOTHING;

-- ============================================================
-- DATOS INICIALES — Pares Biomagnéticos (primeros 30 del manual)
-- ============================================================
INSERT INTO pares_biomagneticos (numero, nombre, nombre_corto, punto_derecho, punto_izquierdo, par_nombre, par_derecho, par_izquierdo, categoria, microorganismo, sintomas, zona_cuerpo, coord_x_der, coord_y_der, coord_x_izq, coord_y_izq) VALUES
(1, 'Timo - Recto', 'Timo-Recto', 'Timo', 'Recto', 'Timo - Recto', 'Timo', 'Recto', 'virus', 'Papiloma Virus (VPH)', 'Verrugas, condilomas, lesiones papilomatosas', 'torax', 50, 35, 50, 75),
(2, 'Hígado - Ovario D / Testículo D', 'Hígado-Gónada D', 'Hígado', 'Ovario Derecho / Testículo Derecho', 'Hígado - Gónada D', 'Hígado', 'Ovario D', 'parasitos', 'Entamoeba Histolytica', 'Amebiasis, diarrea, colitis', 'abdomen', 60, 50, 65, 60),
(3, 'Hígado - Ovario I / Testículo I', 'Hígado-Gónada I', 'Hígado', 'Ovario Izquierdo / Testículo Izquierdo', 'Hígado - Gónada I', 'Hígado', 'Ovario I', 'parasitos', 'Giardia Lamblia', 'Giardiasis, flatulencias, malabsorción', 'abdomen', 60, 50, 40, 60),
(4, 'Bazo - Próstata / Útero', 'Bazo-Próstata/Útero', 'Bazo', 'Próstata / Útero', 'Bazo - Próstata/Útero', 'Bazo', 'Próstata', 'bacterias', 'Brucella', 'Brucelosis, fiebre ondulante, artritis', 'abdomen', 40, 52, 50, 70),
(5, 'Pulmón D - Pulmón I', 'Pulmón D-I', 'Pulmón Derecho', 'Pulmón Izquierdo', 'Pulmón D - Pulmón I', 'Pulmón D', 'Pulmón I', 'bacterias', 'Mycobacterium Tuberculosis', 'Tuberculosis, tos, expectoración', 'torax', 65, 38, 35, 38),
(6, 'Riñón D - Riñón I', 'Riñón D-I', 'Riñón Derecho', 'Riñón Izquierdo', 'Riñón D - Riñón I', 'Riñón D', 'Riñón I', 'bacterias', 'Escherichia Coli', 'Infección urinaria, cistitis, pielonefritis', 'abdomen', 62, 55, 38, 55),
(7, 'Próstata - Útero', 'Próstata-Útero', 'Próstata', 'Útero', 'Próstata - Útero', 'Próstata', 'Útero', 'bacterias', 'Chlamydia Trachomatis', 'Uretritis, cervicitis, infertilidad', 'pelvis', 52, 72, 48, 72),
(8, 'Cerebro D - Cerebro I', 'Cerebro D-I', 'Cerebro Derecho', 'Cerebro Izquierdo', 'Cerebro D - Cerebro I', 'Cerebro D', 'Cerebro I', 'psicoemocional', NULL, 'Depresión, ansiedad, estrés crónico', 'cabeza', 60, 8, 40, 8),
(9, 'Hipófisis D - Hipófisis I', 'Hipófisis', 'Hipófisis Derecha', 'Hipófisis Izquierda', 'Hipófisis D-I', 'Hipófisis D', 'Hipófisis I', 'disfuncion', NULL, 'Alteraciones hormonales, ciclo menstrual irregular', 'cabeza', 52, 10, 48, 10),
(10, 'Hipotálamo D - Hipotálamo I', 'Hipotálamo', 'Hipotálamo Derecho', 'Hipotálamo Izquierdo', 'Hipotálamo D-I', 'Hipotálamo D', 'Hipotálamo I', 'disfuncion', NULL, 'Regulación temperatura, sueño, apetito', 'cabeza', 53, 11, 47, 11),
(11, 'Amígdala D - Amígdala I', 'Amígdalas', 'Amígdala Derecha', 'Amígdala Izquierda', 'Amígdala D-I', 'Amígdala D', 'Amígdala I', 'bacterias', 'Streptococcus Pyogenes', 'Amigdalitis, faringitis, fiebre reumática', 'cabeza', 57, 22, 43, 22),
(12, 'Nariz D - Nariz I', 'Fosas Nasales', 'Fosa Nasal Derecha', 'Fosa Nasal Izquierda', 'Nariz D-I', 'Nariz D', 'Nariz I', 'hongos', 'Candida Albicans', 'Sinusitis, rinitis, candidiasis nasal', 'cabeza', 53, 18, 47, 18),
(13, 'Oído D - Oído I', 'Oídos', 'Oído Derecho', 'Oído Izquierdo', 'Oído D-I', 'Oído D', 'Oído I', 'bacterias', 'Haemophilus Influenzae', 'Otitis, pérdida auditiva', 'cabeza', 62, 16, 38, 16),
(14, 'Parótida D - Parótida I', 'Parótidas', 'Parótida Derecha', 'Parótida Izquierda', 'Parótida D-I', 'Parótida D', 'Parótida I', 'virus', 'Paramyxovirus (Paperas)', 'Parotiditis, inflamación glándulas salivales', 'cabeza', 63, 20, 37, 20),
(15, 'Tiroides Central - Tiroides D-I', 'Tiroides', 'Tiroides Central', 'Tiroides Derecha/Izquierda', 'Tiroides D-I', 'Tiroides D', 'Tiroides I', 'bacterias', 'Yersinia Enterocolitica', 'Hipotiroidismo, hipertiroidismo, bocio', 'cuello', 50, 27, 50, 27),
(16, 'Paratiroides D - Paratiroides I', 'Paratiroides', 'Paratiroides Derecha', 'Paratiroides Izquierda', 'Paratiroides D-I', 'Paratiroides D', 'Paratiroides I', 'bacterias', 'Mycoplasma Pneumoniae', 'Alteraciones calcio, calambres musculares', 'cuello', 53, 28, 47, 28),
(17, 'Timo - Timo', 'Timo', 'Timo', 'Timo', 'Timo', 'Timo', 'Timo', 'virus', 'Epstein-Barr', 'Mononucleosis, fatiga crónica, defensas bajas', 'torax', 50, 33, 50, 33),
(18, 'Mediastino - Mediastino', 'Mediastino', 'Mediastino', 'Mediastino', 'Mediastino', 'Mediastino', 'Mediastino', 'bacterias', 'Nocardia Asteroides', 'Infecciones respiratorias graves, neumonía atípica', 'torax', 50, 36, 50, 36),
(19, 'Cardias - Cardias', 'Cardias', 'Cardias', 'Cardias', 'Cardias', 'Cardias', 'Cardias', 'bacterias', 'Helicobacter Pylori', 'Gastritis, úlcera gástrica, reflujo', 'abdomen', 45, 42, 45, 42),
(20, 'Estómago - Estómago', 'Estómago', 'Estómago', 'Estómago', 'Estómago', 'Estómago', 'Estómago', 'bacterias', 'Helicobacter Pylori', 'Gastritis crónica, dolor epigástrico', 'abdomen', 48, 45, 48, 45),
(21, 'Cabeza de Páncreas - Cab. Páncreas', 'Páncreas Cabeza', 'Cabeza de Páncreas', 'Cabeza de Páncreas', 'Páncreas - Páncreas', 'Cab. Páncreas', 'Cab. Páncreas', 'virus', 'Coxsackievirus B', 'Diabetes tipo 1, pancreatitis, insulinoma', 'abdomen', 55, 47, 55, 47),
(22, 'Cuerpo de Páncreas - Cuerpo Páncreas', 'Páncreas Cuerpo', 'Cuerpo de Páncreas', 'Cuerpo de Páncreas', 'Páncreas - Páncreas', 'Cuerpo Páncreas', 'Cuerpo Páncreas', 'disfuncion', NULL, 'Diabetes tipo 2, resistencia insulina', 'abdomen', 50, 48, 50, 48),
(23, 'Cola de Páncreas - Cola Páncreas', 'Páncreas Cola', 'Cola de Páncreas', 'Cola de Páncreas', 'Páncreas - Páncreas', 'Cola Páncreas', 'Cola Páncreas', 'disfuncion', NULL, 'Hipoglucemia, alteraciones glicémicas', 'abdomen', 45, 48, 45, 48),
(24, 'Punta de Páncreas - Punta Páncreas', 'Páncreas Punta', 'Punta de Páncreas', 'Punta de Páncreas', 'Páncreas - Páncreas', 'Punta Páncreas', 'Punta Páncreas', 'bacterias', 'Klebsiella Pneumoniae', 'Infecciones oportunistas, sepsis', 'abdomen', 42, 49, 42, 49),
(25, 'Ligamento Pancreático - Lig. Pancreático', 'Lig. Pancreático', 'Ligamento Pancreático', 'Ligamento Pancreático', 'Lig. Pancreático', 'Lig. Pancreático D', 'Lig. Pancreático I', 'disfuncion', NULL, 'Dolor pancreático, alteraciones digestivas', 'abdomen', 50, 50, 50, 50),
(26, 'Bazo - Bazo', 'Bazo', 'Bazo', 'Bazo', 'Bazo', 'Bazo', 'Bazo', 'parasitos', 'Plasmodium (Malaria)', 'Esplenomegalia, anemia, paludismo', 'abdomen', 40, 50, 40, 50),
(27, 'Axila D - Axila I', 'Axilas', 'Axila Derecha', 'Axila Izquierda', 'Axila D - Axila I', 'Axila D', 'Axila I', 'bacterias', 'Staphylococcus Aureus', 'Forúnculos, abscesos axilares, mastitis', 'torax', 70, 40, 30, 40),
(28, 'Subclavia D - Subclavia I', 'Subclavias', 'Subclavia Derecha', 'Subclavia Izquierda', 'Subclavia D - Subclavia I', 'Subclavia D', 'Subclavia I', 'bacterias', 'Streptococcus Agalactiae', 'Infecciones neonatales, sepsis, neumonía', 'torax', 65, 32, 35, 32),
(29, 'Supraespinoso D - Supraespinoso I', 'Supraespinosos', 'Supraespinoso Derecho', 'Supraespinoso Izquierdo', 'Supraespinoso D - Supraespinoso I', 'Supraespinoso D', 'Supraespinoso I', 'bacterias', 'Streptococcus Agalactiae', 'Tendinitis, hombro doloroso, dolor pélvico', 'espalda', 68, 35, 32, 35),
(30, 'Riñón D - Vejiga', 'Riñón D-Vejiga', 'Riñón Derecho', 'Vejiga', 'Riñón D - Vejiga', 'Riñón D', 'Vejiga', 'bacterias', 'Proteus Mirabilis', 'Infección urinaria, cálculos renales', 'abdomen', 62, 55, 50, 68)
ON CONFLICT DO NOTHING;
