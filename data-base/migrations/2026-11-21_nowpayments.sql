-- Pagos con criptomonedas por NOWPayments (página de pago alojada, "invoice").
--
-- A diferencia de PayPal, el pago no se confirma al volver del checkout: NOWPayments avisa por webhook
-- (IPN, /api/buy-pack/nowpayments-ipn) cuando la red confirma la transacción. Por eso cada intento de pago
-- se guarda antes en `payment_order` (quién compra qué y por cuánto) y el webhook lo busca por su id
-- (`order_id` en NOWPayments). Cuando llega `finished` se crea la fila de buy_pack con method_buy_id = 3.
--
-- - status: último payment_status recibido de NOWPayments ('created' hasta el primer aviso).
-- - external_id: id del invoice; payment_id: id del pago (llega con el primer IPN).
-- - content: último JSON del IPN.
--
-- Ejecutar una sola vez (el INSERT de method_buy es idempotente).

INSERT IGNORE INTO `method_buy` (`method_buy_id`, `name`) VALUES (3, 'nowpayments');

CREATE TABLE `payment_order` (
  `payment_order_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `pack_id` int NOT NULL,
  `method_buy_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` char(3) NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'created',
  `external_id` varchar(100) DEFAULT NULL,
  `payment_id` varchar(100) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_order_id`),
  KEY `user_id` (`user_id`),
  KEY `pack_id` (`pack_id`),
  KEY `method_buy_id` (`method_buy_id`),
  CONSTRAINT `payment_order_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `payment_order_ibfk_2` FOREIGN KEY (`pack_id`) REFERENCES `pack` (`pack_id`),
  CONSTRAINT `payment_order_ibfk_3` FOREIGN KEY (`method_buy_id`) REFERENCES `method_buy` (`method_buy_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
