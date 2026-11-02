-- Pósters por plataforma: imágenes aptas para redes/tiendas sin contenido adulto (Ko-fi, Facebook…)
-- que se muestran debajo del botón comprar del pack y redirigen a la publicación de ese pack en la plataforma.
--   platform:      catálogo de plataformas.
--   pack_platform: un póster por pack y plataforma (uq_pack_platform). `poster` guarda la key dentro del
--                  bucket static (NEXT_PUBLIC_STATIC_URL_S3), p. ej. `packs/<pack.code>/poster/ko-fi.webp`,
--                  nunca la URL completa. `sort` ordena los pósters (ascendente) y `clicks` cuenta las
--                  redirecciones hechas desde /api/pack/platform/go.
-- Ver src/app/repositories/platform.repository.ts.
--
-- Ejecutar una sola vez.

CREATE TABLE `platform` (
  `platform_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `base_url` varchar(255) DEFAULT NULL,
  `state` tinyint NOT NULL DEFAULT '1',
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`platform_id`),
  UNIQUE KEY `uq_platform_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pack_platform` (
  `pack_platform_id` int NOT NULL AUTO_INCREMENT,
  `pack_id` int NOT NULL,
  `platform_id` int NOT NULL,
  `poster` varchar(255) NOT NULL,
  `url` varchar(500) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `sort` int NOT NULL DEFAULT '0',
  `clicks` int NOT NULL DEFAULT '0',
  `state` tinyint NOT NULL DEFAULT '1',
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`pack_platform_id`),
  UNIQUE KEY `uq_pack_platform` (`pack_id`,`platform_id`),
  KEY `platform_id` (`platform_id`),
  CONSTRAINT `pack_platform_ibfk_1` FOREIGN KEY (`pack_id`) REFERENCES `pack` (`pack_id`),
  CONSTRAINT `pack_platform_ibfk_2` FOREIGN KEY (`platform_id`) REFERENCES `platform` (`platform_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `platform` (`name`, `slug`, `base_url`) VALUES
  ('Ko-fi', 'ko-fi', 'https://ko-fi.com/'),
  ('Patreon', 'patreon', 'https://www.patreon.com/'),
  ('Facebook', 'facebook', 'https://www.facebook.com/'),
  ('Instagram', 'instagram', 'https://www.instagram.com/'),
  ('X', 'x', 'https://x.com/'),
  ('Gumroad', 'gumroad', 'https://gumroad.com/');
