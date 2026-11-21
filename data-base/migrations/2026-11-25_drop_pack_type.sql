-- Se eliminan `pack_type` y `type`. Solo se usaban para marcar un pack como gratuito para todos
-- (type_id 2), algo que no encaja con la idea de incentivar el registro; "de pago" (type_id 1) no lo
-- leía nadie. El modo de un pack sale ahora solo de los tipos de sus páginas (page_type):
--   - de pago: tiene páginas "De pago";
--   - gratis para registrados: ninguna página "De pago" (repositoryPage.isFreeForRegistered);
--   - los anónimos ven las páginas "Gratis", censuradas.
--
-- Antes de ejecutarlo, esta consulta debe devolver 0: si no, hay packs gratuitos para todos que
-- pasarían a ser de pago (sus páginas "De pago" quedarían bloqueadas).
--   SELECT COUNT(*) FROM pack_type WHERE type_id = 2;
--
-- Requiere desplegar antes (o a la vez) la versión de kyaaa.net que ya no usa estas tablas, y la de
-- markwater-kyaaa cuyo modo ZIP ya no las consulta. Irreversible sin el respaldo (kyaaa-backup).
--
-- Ejecutar una sola vez.

DROP TABLE IF EXISTS `pack_type`;
DROP TABLE IF EXISTS `type`;
