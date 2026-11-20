-- `pack.code` pasa a ser único. Es la carpeta raíz del pack en los buckets (`<code>/<size>/<num>.<ext>`)
-- y markwater-kyaaa identifica el pack con el que trabaja por su code (PACK_CODE), así que dos packs con
-- el mismo code mezclarían imágenes. La app ya lo validaba al crear/editar (repositoryPack.findByCode);
-- esto lo garantiza también en la BD.
--
-- Antes de ejecutarlo, esta consulta debe devolver 0 filas (si no, corregir los codes repetidos o vacíos):
--   SELECT code, COUNT(*) AS n, GROUP_CONCAT(pack_id) AS ids FROM pack
--   GROUP BY code HAVING n > 1 OR code = '';
--
-- Ejecutar una sola vez.

ALTER TABLE `pack` ADD UNIQUE KEY `uq_pack_code` (`code`);
