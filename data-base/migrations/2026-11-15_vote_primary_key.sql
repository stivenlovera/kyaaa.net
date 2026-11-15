-- Clave primaria de `vote` (participate_pack_id, user_id): un usuario solo puede votar una vez cada pack
-- de una votación. prisma/schema.prisma ya la declaraba (@@id), pero la tabla se creó sin ella.
-- La regla "un voto por votación" la aplica la API (src/app/repositories/participate.repository.ts,
-- toggleVote); esta clave es la red de seguridad en la base.
--
-- Ejecutar una sola vez. Se puede revisar antes si hay duplicados:
--   SELECT participate_pack_id, user_id, COUNT(*) FROM vote GROUP BY participate_pack_id, user_id HAVING COUNT(*) > 1;

-- 1) Quita duplicados (mismo pack y usuario), conservando la fecha del primer voto.
CREATE TEMPORARY TABLE `vote_dedupe` AS
  SELECT `participate_pack_id`, `user_id`, MIN(`create_at`) AS `create_at`, MIN(`update_at`) AS `update_at`
  FROM `vote`
  GROUP BY `participate_pack_id`, `user_id`;

DELETE FROM `vote`;

INSERT INTO `vote` (`participate_pack_id`, `user_id`, `create_at`, `update_at`)
  SELECT `participate_pack_id`, `user_id`, `create_at`, `update_at` FROM `vote_dedupe`;

DROP TEMPORARY TABLE `vote_dedupe`;

-- 2) Clave primaria.
ALTER TABLE `vote`
  ADD PRIMARY KEY (`participate_pack_id`, `user_id`);
