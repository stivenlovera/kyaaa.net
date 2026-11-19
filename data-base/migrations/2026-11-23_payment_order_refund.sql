-- Devoluciones manuales de pagos con cripto (/admin/crypto → "Marcar como devuelto").
--
-- La devolución se hace fuera de kyaaa.net (panel de NOWPayments o retiro desde el exchange); aquí solo se deja
-- constancia: status pasa a 'refunded' y se guardan el TxID de la devolución, una nota opcional y la fecha.
-- Una orden devuelta no entrega el pack aunque llegue después otro aviso de NOWPayments.
--
-- Ejecutar una sola vez.

ALTER TABLE `payment_order`
  ADD COLUMN `refund_txid` varchar(150) DEFAULT NULL AFTER `completed_at`,
  ADD COLUMN `refund_note` varchar(250) DEFAULT NULL AFTER `refund_txid`,
  ADD COLUMN `refunded_at` datetime DEFAULT NULL AFTER `refund_note`;
