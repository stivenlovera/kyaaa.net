-- Cupones canjeables por un pack (p. ej. vendidos en Ko-fi y enviados a mano al comprador).
-- Cada código sirve para un único pack, se usa una sola vez y caduca en `expires_at`.
-- Al canjearlo (/redeem, src/app/repositories/coupon.repository.ts) se marca con el usuario y se
-- inserta una fila en buy_pack con method_buy_id = 2 ('cupon'), que es lo que da acceso al pack.
--
-- `code` se guarda sin prefijo ni guiones (12 caracteres de un alfabeto sin 0/O/1/I); en pantalla
-- se muestra como KYA-XXXX-XXXX-XXXX.
--
-- Ejecutar una sola vez (el INSERT de method_buy es idempotente).

INSERT IGNORE INTO `method_buy` (`method_buy_id`, `name`) VALUES (2, 'cupon');

CREATE TABLE `coupon` (
  `coupon_id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(32) NOT NULL,
  `pack_id` int NOT NULL,
  `expires_at` datetime NOT NULL,
  `note` varchar(250) DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `redeemed_at` datetime DEFAULT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`coupon_id`),
  UNIQUE KEY `uq_coupon_code` (`code`),
  KEY `pack_id` (`pack_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `coupon_ibfk_1` FOREIGN KEY (`pack_id`) REFERENCES `pack` (`pack_id`),
  CONSTRAINT `coupon_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
