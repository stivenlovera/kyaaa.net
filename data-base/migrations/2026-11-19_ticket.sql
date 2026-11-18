-- Tickets de soporte: los usuarios reportan problemas (pagos, cupones, descargas, cuenta, contenido)
-- desde /support y el admin los gestiona en /admin/ticket (src/app/repositories/ticket.repository.ts).
--
-- `code` es el código público (6 caracteres del alfabeto de los cupones; en pantalla TCK-XXXXXX).
-- `access_token` permite abrir el ticket desde el enlace del correo sin iniciar sesión; es la única
-- forma de seguir un ticket anónimo (solo se permiten en la categoría 'cuenta').
-- `category` y `status` son claves de texto validadas en la app (src/app/types/ticket.types.ts).
--
-- Ejecutar una sola vez.

CREATE TABLE `ticket` (
  `ticket_id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(16) NOT NULL,
  `access_token` varchar(64) NOT NULL,
  `user_id` int DEFAULT NULL,
  `email` varchar(250) NOT NULL,
  `category` varchar(32) NOT NULL,
  `subject` varchar(150) NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'abierto',
  `pack_id` int DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ticket_id`),
  UNIQUE KEY `uq_ticket_code` (`code`),
  KEY `user_id` (`user_id`),
  KEY `pack_id` (`pack_id`),
  KEY `status` (`status`),
  CONSTRAINT `ticket_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `ticket_ibfk_2` FOREIGN KEY (`pack_id`) REFERENCES `pack` (`pack_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ticket_message` (
  `ticket_message_id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `is_staff` tinyint(1) NOT NULL DEFAULT '0',
  `body` text NOT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ticket_message_id`),
  KEY `ticket_id` (`ticket_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `ticket_message_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `ticket` (`ticket_id`) ON DELETE CASCADE,
  CONSTRAINT `ticket_message_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
