-- Nuevo tamaño 6 = og: imagen para redes sociales (og:image / twitter:image).
--   JPEG 1200x630 recortado desde arriba, censurado, solo de la primera página gratis del pack.
--   Lo genera markwater-kyaaa en la ejecución PUBLIC y se sirve desde el bucket público
--   (<code>/og/<num>.jpeg), cuya política permite */og/* sin Referer para los rastreadores.
-- Ver src/app/repositories/pack.repository.ts (findPackMeta).
--
-- Ejecutar una sola vez.

INSERT INTO `size` (`size_id`, `name`, `extension`) VALUES (6, 'og', 'jpeg');
