DROP DATABASE IF EXISTS `ia_kyaaa`;
CREATE DATABASE `ia_kyaaa` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

use `ia_kyaaa`;

-- Estructura generada desde la base ia_kyaaa (MySQL 8.0.30) el 2026-09-20.
-- Las tablas van ordenadas por dependencia de claves foráneas.
-- Los datos de ejemplo (catálogos y los dos packs de prueba) están en population.sql, que se ejecuta después.

DROP TABLE IF EXISTS `author`;
CREATE TABLE `author` (
  `author_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(512) NOT NULL,
  `slug` varchar(512) NOT NULL,
  `state` tinyint(1) NOT NULL DEFAULT '1',
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`author_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `character`;
CREATE TABLE `character` (
  `character_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(512) NOT NULL,
  `slug` varchar(512) NOT NULL,
  `state` tinyint(1) NOT NULL DEFAULT '1',
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`character_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `label`;
CREATE TABLE `label` (
  `label_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(512) NOT NULL,
  `slug` varchar(512) NOT NULL,
  `state` tinyint(1) NOT NULL DEFAULT '1',
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`label_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `language`;
CREATE TABLE `language` (
  `language_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(512) NOT NULL,
  `slug` varchar(512) NOT NULL,
  `state` tinyint(1) NOT NULL DEFAULT '1',
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`language_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `method_buy`;
CREATE TABLE `method_buy` (
  `method_buy_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL DEFAULT '',
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`method_buy_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `state_pack`;
CREATE TABLE `state_pack` (
  `state_pack_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(250) NOT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`state_pack_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `pack`;
CREATE TABLE `pack` (
  `pack_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(4500) NOT NULL DEFAULT '',
  `code` varchar(20) NOT NULL DEFAULT '',
  `code_pay` varchar(20) DEFAULT '',
  `price_list` decimal(10,2) NOT NULL,
  `code_free` varchar(20) DEFAULT '',
  `thanks_image` varchar(255) DEFAULT NULL,
  `register_image` varchar(255) DEFAULT NULL,
  `state` tinyint(1) NOT NULL DEFAULT '1',
  `state_pack_id` int NOT NULL DEFAULT '1',
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`pack_id`),
  KEY `state_pack_id` (`state_pack_id`),
  CONSTRAINT `pack_ibfk_1` FOREIGN KEY (`state_pack_id`) REFERENCES `state_pack` (`state_pack_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `platform`;
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

DROP TABLE IF EXISTS `page_type`;
CREATE TABLE `page_type` (
  `page_type_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL DEFAULT '',
  `state` tinyint NOT NULL DEFAULT '1',
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`page_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `rol`;
CREATE TABLE `rol` (
  `rol_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(250) NOT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`rol_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `serie`;
CREATE TABLE `serie` (
  `serie_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(512) NOT NULL,
  `slug` varchar(512) NOT NULL,
  `state` tinyint(1) NOT NULL DEFAULT '1',
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`serie_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `size`;
CREATE TABLE `size` (
  `size_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `extension` varchar(10) NOT NULL,
  `state` tinyint(1) NOT NULL DEFAULT '1',
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`size_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `state_participate`;
CREATE TABLE `state_participate` (
  `state_participate_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(250) NOT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`state_participate_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `type`;
CREATE TABLE `type` (
  `type_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(512) NOT NULL,
  `slug` varchar(512) NOT NULL,
  `state` tinyint(1) NOT NULL DEFAULT '1',
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(150) NOT NULL,
  `verified_email` datetime DEFAULT NULL,
  `name` varchar(250) NOT NULL,
  `nick` varchar(100) NOT NULL,
  `image` varchar(250) DEFAULT NULL,
  `password` text NOT NULL,
  `state` tinyint(1) NOT NULL DEFAULT '1',
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `buy_pack`;
CREATE TABLE `buy_pack` (
  `pack_id` int NOT NULL,
  `user_id` int NOT NULL,
  `method_buy_id` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `transaction` varchar(200) NOT NULL,
  `content` text NOT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`pack_id`,`user_id`,`method_buy_id`),
  KEY `user_id` (`user_id`),
  KEY `method_buy_id` (`method_buy_id`),
  CONSTRAINT `buy_pack_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `buy_pack_ibfk_2` FOREIGN KEY (`pack_id`) REFERENCES `pack` (`pack_id`),
  CONSTRAINT `buy_pack_ibfk_3` FOREIGN KEY (`method_buy_id`) REFERENCES `method_buy` (`method_buy_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `favorite_pack`;
CREATE TABLE `favorite_pack` (
  `pack_id` int NOT NULL,
  `user_id` int NOT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `user_id` (`user_id`),
  KEY `pack_id` (`pack_id`),
  CONSTRAINT `favorite_pack_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `favorite_pack_ibfk_2` FOREIGN KEY (`pack_id`) REFERENCES `pack` (`pack_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `like_pack`;
CREATE TABLE `like_pack` (
  `pack_id` int NOT NULL,
  `user_id` int NOT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`pack_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `like_pack_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `like_pack_ibfk_2` FOREIGN KEY (`pack_id`) REFERENCES `pack` (`pack_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `pack_author`;
CREATE TABLE `pack_author` (
  `author_id` int NOT NULL,
  `pack_id` int NOT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `author_id` (`author_id`),
  KEY `pack_id` (`pack_id`),
  CONSTRAINT `pack_author_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `author` (`author_id`),
  CONSTRAINT `pack_author_ibfk_2` FOREIGN KEY (`pack_id`) REFERENCES `pack` (`pack_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `pack_character`;
CREATE TABLE `pack_character` (
  `character_id` int NOT NULL,
  `pack_id` int NOT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `character_id` (`character_id`),
  KEY `pack_id` (`pack_id`),
  CONSTRAINT `pack_character_ibfk_1` FOREIGN KEY (`character_id`) REFERENCES `character` (`character_id`),
  CONSTRAINT `pack_character_ibfk_2` FOREIGN KEY (`pack_id`) REFERENCES `pack` (`pack_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `pack_label`;
CREATE TABLE `pack_label` (
  `label_id` int NOT NULL,
  `pack_id` int NOT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `label_id` (`label_id`),
  KEY `pack_id` (`pack_id`),
  CONSTRAINT `pack_label_ibfk_1` FOREIGN KEY (`label_id`) REFERENCES `label` (`label_id`),
  CONSTRAINT `pack_label_ibfk_2` FOREIGN KEY (`pack_id`) REFERENCES `pack` (`pack_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `pack_language`;
CREATE TABLE `pack_language` (
  `language_id` int NOT NULL,
  `pack_id` int NOT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `language_id` (`language_id`),
  KEY `pack_id` (`pack_id`),
  CONSTRAINT `pack_language_ibfk_1` FOREIGN KEY (`language_id`) REFERENCES `language` (`language_id`),
  CONSTRAINT `pack_language_ibfk_2` FOREIGN KEY (`pack_id`) REFERENCES `pack` (`pack_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `pack_serie`;
CREATE TABLE `pack_serie` (
  `serie_id` int NOT NULL,
  `pack_id` int NOT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `serie_id` (`serie_id`),
  KEY `pack_id` (`pack_id`),
  CONSTRAINT `pack_serie_ibfk_1` FOREIGN KEY (`serie_id`) REFERENCES `serie` (`serie_id`),
  CONSTRAINT `pack_serie_ibfk_2` FOREIGN KEY (`pack_id`) REFERENCES `pack` (`pack_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `pack_type`;
CREATE TABLE `pack_type` (
  `type_id` int NOT NULL,
  `pack_id` int NOT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `type_id` (`type_id`),
  KEY `pack_id` (`pack_id`),
  CONSTRAINT `pack_type_ibfk_1` FOREIGN KEY (`type_id`) REFERENCES `type` (`type_id`),
  CONSTRAINT `pack_type_ibfk_2` FOREIGN KEY (`pack_id`) REFERENCES `pack` (`pack_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `page`;
CREATE TABLE `page` (
  `page_id` int NOT NULL AUTO_INCREMENT,
  `pack_id` int NOT NULL,
  `num` varchar(5) NOT NULL,
  `page_type_id` int NOT NULL DEFAULT '2',
  `state` tinyint NOT NULL DEFAULT '1',
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`page_id`),
  UNIQUE KEY `uq_page_pack_num` (`pack_id`,`num`),
  KEY `pack_id` (`pack_id`),
  KEY `page_type_id` (`page_type_id`),
  CONSTRAINT `page_ibfk_1` FOREIGN KEY (`pack_id`) REFERENCES `pack` (`pack_id`),
  CONSTRAINT `page_ibfk_2` FOREIGN KEY (`page_type_id`) REFERENCES `page_type` (`page_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `pack_platform`;
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

DROP TABLE IF EXISTS `participate`;
CREATE TABLE `participate` (
  `participate_id` int NOT NULL AUTO_INCREMENT,
  `state_participate_id` int NOT NULL,
  `name` varchar(250) NOT NULL,
  `start_date` date NOT NULL,
  `start_end` date NOT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`participate_id`),
  KEY `state_participate_id` (`state_participate_id`),
  CONSTRAINT `participate_ibfk_1` FOREIGN KEY (`state_participate_id`) REFERENCES `state_participate` (`state_participate_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user_rol`;
CREATE TABLE `user_rol` (
  `rol_id` int NOT NULL,
  `user_id` int NOT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `rol_id` (`rol_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_rol_ibfk_1` FOREIGN KEY (`rol_id`) REFERENCES `rol` (`rol_id`),
  CONSTRAINT `user_rol_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `page_size`;
CREATE TABLE `page_size` (
  `page_id` int NOT NULL,
  `size_id` int NOT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `page_id` (`page_id`),
  KEY `size_id` (`size_id`),
  CONSTRAINT `page_size_ibfk_1` FOREIGN KEY (`page_id`) REFERENCES `page` (`page_id`),
  CONSTRAINT `page_size_ibfk_2` FOREIGN KEY (`size_id`) REFERENCES `size` (`size_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `participate_pack`;
CREATE TABLE `participate_pack` (
  `participate_pack_id` int NOT NULL AUTO_INCREMENT,
  `pack_id` int NOT NULL,
  `participate_id` int NOT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`participate_pack_id`),
  KEY `pack_id` (`pack_id`),
  KEY `participate_id` (`participate_id`),
  CONSTRAINT `participate_pack_ibfk_1` FOREIGN KEY (`pack_id`) REFERENCES `pack` (`pack_id`),
  CONSTRAINT `participate_pack_ibfk_2` FOREIGN KEY (`participate_id`) REFERENCES `participate` (`participate_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `vote`;
CREATE TABLE `vote` (
  `participate_pack_id` int NOT NULL,
  `user_id` int NOT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `participate_pack_id` (`participate_pack_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `vote_ibfk_1` FOREIGN KEY (`participate_pack_id`) REFERENCES `participate_pack` (`participate_pack_id`),
  CONSTRAINT `vote_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
