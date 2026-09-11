CREATE TABLE IF NOT EXISTS usuarios (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'empleado', 'usuario') NOT NULL DEFAULT 'empleado',
  debe_cambiar_contrasena TINYINT(1) NOT NULL DEFAULT 0,
  foto_url VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY usuarios_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
