-- Dos estados nuevos en el catálogo state_pack (además de 1 publicado, 2 próximamente, 3 borrador):
--   4 estreno       → pack recién estrenado.
--   5 por votación  → pack que participa en las votaciones de /participate.
-- Ver STATE_PACK en src/app/utils/page-access.ts.
--
-- Idempotente: INSERT IGNORE no duplica si los ids ya existen.

INSERT IGNORE INTO `state_pack` (`state_pack_id`, `name`) VALUES
  (4, 'estreno'),
  (5, 'por votación');
