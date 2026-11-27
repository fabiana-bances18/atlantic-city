-- =====================================================================
-- Atlantic City - Sistema de Gestion de Clientes
-- Base de datos relacional (MySQL 8) normalizada hasta 3FN
-- =====================================================================

CREATE DATABASE atlantic_city
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE atlantic_city;

-- ---------------------------------------------------------------------
-- Seguridad: roles y usuarios (RF01, RF13)
-- ---------------------------------------------------------------------
CREATE TABLE rol (
  id_rol   TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre   VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE usuario (
  id_usuario         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_rol             TINYINT UNSIGNED NOT NULL,
  nombre_usuario     VARCHAR(50)  NOT NULL UNIQUE,
  contrasena_hash    VARCHAR(255) NOT NULL,      -- nunca en texto plano (RNF01)
  nombre_completo    VARCHAR(100) NOT NULL,
  activo             BOOLEAN      NOT NULL DEFAULT TRUE,
  intentos_fallidos  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  bloqueado_hasta    DATETIME NULL,              -- bloqueo tras 5 intentos
  CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES rol (id_rol)
);

-- ---------------------------------------------------------------------
-- Clientes, preferencias y visitas (RF02 a RF06)
-- ---------------------------------------------------------------------
CREATE TABLE cliente (
  id_cliente           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_usuario           INT UNSIGNED NULL UNIQUE, -- cuenta de acceso del cliente (RF14)
  documento_identidad  VARCHAR(15)  NOT NULL UNIQUE,  -- evita duplicados (RNF06)
  nombres              VARCHAR(80)  NOT NULL,
  apellidos            VARCHAR(80)  NOT NULL,
  direccion            VARCHAR(150),
  telefono             VARCHAR(20),
  correo               VARCHAR(100),
  activo               BOOLEAN  NOT NULL DEFAULT TRUE,
  fecha_registro       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cliente_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
);

CREATE TABLE preferencia (
  id_preferencia  SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(50) NOT NULL UNIQUE     -- por ejemplo: Ruleta, Restaurante
);

CREATE TABLE visita (
  id_visita      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_cliente     INT UNSIGNED NOT NULL,
  fecha_visita   DATETIME NOT NULL,
  monto_gastado  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  CONSTRAINT fk_visita_cliente FOREIGN KEY (id_cliente) REFERENCES cliente (id_cliente),
  CONSTRAINT chk_visita_monto CHECK (monto_gastado >= 0)
);

-- Relacion N:M: una visita puede mostrar varias preferencias
CREATE TABLE visita_preferencia (
  id_visita       INT UNSIGNED NOT NULL,
  id_preferencia  SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (id_visita, id_preferencia),
  CONSTRAINT fk_vp_visita FOREIGN KEY (id_visita) REFERENCES visita (id_visita),
  CONSTRAINT fk_vp_preferencia FOREIGN KEY (id_preferencia) REFERENCES preferencia (id_preferencia)
);

-- ---------------------------------------------------------------------
-- Segmentacion y promociones (RF07 a RF09)
-- ---------------------------------------------------------------------
CREATE TABLE segmento (
  id_segmento      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre           VARCHAR(80) NOT NULL UNIQUE,
  descripcion      VARCHAR(255),
  min_visitas_mes  SMALLINT UNSIGNED NULL,        -- criterio: frecuencia
  min_gasto        DECIMAL(10,2) NULL,            -- criterio: nivel de gasto
  id_preferencia   SMALLINT UNSIGNED NULL,        -- criterio: preferencia
  fecha_creacion   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_segmento_preferencia FOREIGN KEY (id_preferencia) REFERENCES preferencia (id_preferencia)
);

CREATE TABLE segmento_cliente (
  id_segmento       INT UNSIGNED NOT NULL,
  id_cliente        INT UNSIGNED NOT NULL,
  fecha_asignacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_segmento, id_cliente),
  CONSTRAINT fk_sc_segmento FOREIGN KEY (id_segmento) REFERENCES segmento (id_segmento),
  CONSTRAINT fk_sc_cliente FOREIGN KEY (id_cliente) REFERENCES cliente (id_cliente)
);

CREATE TABLE promocion (
  id_promocion  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  descripcion   VARCHAR(255),
  fecha_inicio  DATE NOT NULL,
  fecha_fin     DATE NOT NULL,
  estado        ENUM('ACTIVA','INACTIVA','VENCIDA') NOT NULL DEFAULT 'ACTIVA',
  CONSTRAINT chk_promocion_fechas CHECK (fecha_fin >= fecha_inicio)
);

-- Historial de promociones recibidas por cada cliente (RF09)
CREATE TABLE promocion_cliente (
  id_promocion      INT UNSIGNED NOT NULL,
  id_cliente        INT UNSIGNED NOT NULL,
  id_segmento       INT UNSIGNED NULL,            -- grupo desde el que se asigno
  fecha_asignacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_promocion, id_cliente),
  CONSTRAINT fk_pc_promocion FOREIGN KEY (id_promocion) REFERENCES promocion (id_promocion),
  CONSTRAINT fk_pc_cliente FOREIGN KEY (id_cliente) REFERENCES cliente (id_cliente),
  CONSTRAINT fk_pc_segmento FOREIGN KEY (id_segmento) REFERENCES segmento (id_segmento)
);

-- ---------------------------------------------------------------------
-- Atencion al cliente (RF12)
-- ---------------------------------------------------------------------
CREATE TABLE incidencia (
  id_incidencia        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_cliente           INT UNSIGNED NOT NULL,
  id_usuario_registro  INT UNSIGNED NOT NULL,     -- empleado que la registro
  descripcion          VARCHAR(500) NOT NULL,
  estado               ENUM('ABIERTA','EN_PROCESO','CERRADA') NOT NULL DEFAULT 'ABIERTA',
  solucion             VARCHAR(500) NULL,
  fecha_registro       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre         DATETIME NULL,
  CONSTRAINT fk_inc_cliente FOREIGN KEY (id_cliente) REFERENCES cliente (id_cliente),
  CONSTRAINT fk_inc_usuario FOREIGN KEY (id_usuario_registro) REFERENCES usuario (id_usuario)
);

-- ---------------------------------------------------------------------
-- Datos iniciales (catalogos)
-- ---------------------------------------------------------------------
INSERT INTO rol (nombre) VALUES
  ('Administrador'),
  ('Atencion al Cliente'),
  ('Gerente de Marketing'),
  ('Cliente');

INSERT INTO preferencia (nombre) VALUES
  ('Tragamonedas'),
  ('Ruleta'),
  ('Poker'),
  ('Restaurante'),
  ('Shows y eventos');
