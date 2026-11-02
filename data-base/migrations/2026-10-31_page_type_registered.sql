-- Nuevo tipo de página: 3 = registrados (muestra sin censura para usuarios logueados).
--   1 free:       la ve cualquiera; los anónimos, censurada (bucket público), y los logueados, sin censura (privado).
--   3 registered: solo usuarios logueados, sin censura (bucket privado).
--   2 buy:        solo quien compra el pack, sin censura (bucket privado).
-- Ver src/app/utils/page-access.ts y src/app/repositories/pages.repository.ts.
--
-- Ejecutar una sola vez.

INSERT INTO `page_type` (`page_type_id`, `name`) VALUES (3, 'registered');
