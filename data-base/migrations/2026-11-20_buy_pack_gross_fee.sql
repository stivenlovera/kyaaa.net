-- Importes de cada venta para /admin/sales. Hasta ahora buy_pack.price solo guardaba el neto (lo que
-- queda tras la comisión de PayPal); el bruto y la comisión estaban solo dentro de `content` (la
-- respuesta de PayPal en JSON).
--
-- - gross: lo que pagó el comprador. fee: comisión de PayPal. price sigue siendo el neto (gross - fee).
-- - currency: moneda de la captura (USD).
-- - Cupones (method_buy_id = 2): gross y fee a 0.
-- Las ventas nuevas los guardan desde /api/buy-pack/order-capture. Las filas cuyo JSON no tenga los
-- datos quedan con NULL (en la vista se usa el neto como bruto y comisión 0).
--
-- Ejecutar una sola vez.

ALTER TABLE `buy_pack`
  ADD COLUMN `gross` decimal(10,2) DEFAULT NULL AFTER `price`,
  ADD COLUMN `fee` decimal(10,2) DEFAULT NULL AFTER `gross`,
  ADD COLUMN `currency` char(3) DEFAULT NULL AFTER `fee`,
  ADD KEY `create_at` (`create_at`);

UPDATE `buy_pack`
SET
  `gross` = JSON_VALUE(`content`, '$.purchase_units[0].payments.captures[0].seller_receivable_breakdown.gross_amount.value'),
  `fee` = JSON_VALUE(`content`, '$.purchase_units[0].payments.captures[0].seller_receivable_breakdown.paypal_fee.value'),
  `currency` = JSON_VALUE(`content`, '$.purchase_units[0].payments.captures[0].seller_receivable_breakdown.gross_amount.currency_code')
WHERE `method_buy_id` = 1 AND JSON_VALID(`content`);

UPDATE `buy_pack` SET `gross` = 0, `fee` = 0 WHERE `method_buy_id` = 2;
