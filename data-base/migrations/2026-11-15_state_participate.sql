-- Catálogo de estados de una participación (votación de packs), usado por el CRUD de /admin/votes
-- (src/app/repositories/participate.repository.ts). La tabla ya existía pero sin filas, y
-- participate.state_participate_id es obligatorio, así que sin estas filas no se puede crear ninguna.
--
-- Idempotente: INSERT IGNORE no duplica si los ids ya existen.

INSERT IGNORE INTO `state_participate` (`state_participate_id`, `name`) VALUES
  (1, 'borrador'),
  (2, 'en curso'),
  (3, 'finalizado');
