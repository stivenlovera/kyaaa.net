-- Neto y comisión reales de las ventas con cripto (NOWPayments) ya registradas.
--
-- Hasta ahora esas filas de buy_pack guardaban price = gross = precio del pack y fee NULL. Desde este cambio
-- el webhook guarda, como en PayPal:
--   gross = actually_paid_at_fiat (lo que envió el comprador, en USD)
--   price = outcome_amount (lo que llega a la billetera de retiro; neto)
--   fee   = gross - price
-- Este script recalcula las ventas anteriores a partir del JSON del IPN guardado en `content`. Solo toca las
-- que se cobraron en un dólar estable (outcome_currency usdt…/usdc…), donde outcome_amount equivale a USD;
-- las demás (y las registradas a mano sin JSON) se quedan como están.
--
-- Se puede ejecutar más de una vez (da el mismo resultado). Revisa primero el SELECT.

SELECT user_id, pack_id, price, gross, fee,
       ROUND(JSON_VALUE(content, '$.actually_paid_at_fiat'), 2) AS nuevo_bruto,
       ROUND(LEAST(JSON_VALUE(content, '$.outcome_amount'), JSON_VALUE(content, '$.actually_paid_at_fiat')), 2) AS nuevo_neto
FROM buy_pack
WHERE method_buy_id = 3
  AND JSON_VALID(content)
  AND JSON_VALUE(content, '$.actually_paid_at_fiat') IS NOT NULL
  AND JSON_VALUE(content, '$.outcome_amount') IS NOT NULL
  AND (LOWER(JSON_VALUE(content, '$.outcome_currency')) LIKE 'usdt%' OR LOWER(JSON_VALUE(content, '$.outcome_currency')) LIKE 'usdc%');

UPDATE buy_pack
SET gross = ROUND(JSON_VALUE(content, '$.actually_paid_at_fiat'), 2),
    price = ROUND(LEAST(JSON_VALUE(content, '$.outcome_amount'), JSON_VALUE(content, '$.actually_paid_at_fiat')), 2),
    fee   = ROUND(JSON_VALUE(content, '$.actually_paid_at_fiat'), 2)
          - ROUND(LEAST(JSON_VALUE(content, '$.outcome_amount'), JSON_VALUE(content, '$.actually_paid_at_fiat')), 2)
WHERE method_buy_id = 3
  AND JSON_VALID(content)
  AND JSON_VALUE(content, '$.actually_paid_at_fiat') IS NOT NULL
  AND JSON_VALUE(content, '$.outcome_amount') IS NOT NULL
  AND (LOWER(JSON_VALUE(content, '$.outcome_currency')) LIKE 'usdt%' OR LOWER(JSON_VALUE(content, '$.outcome_currency')) LIKE 'usdc%');
