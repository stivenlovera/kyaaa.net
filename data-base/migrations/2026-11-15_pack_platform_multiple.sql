-- Permite varios pósters del mismo pack en la misma plataforma (p. ej. dos publicaciones de Ko-fi).
-- Se quita el índice único uq_pack_platform (pack_id, platform_id); cada póster pasa a identificarse
-- solo por pack_platform_id. Las imágenes nuevas se guardan con nombre propio en el bucket static
-- (`packs/<code>/poster/<slug>-<timestamp>.<ext>`) para que no se pisen entre sí.
-- Ver src/app/api/pack/platform/route.tsx y src/app/repositories/platform.repository.ts.
--
-- La FK pack_platform_ibfk_1 (pack_id) usaba uq_pack_platform como índice: primero se crea un índice
-- normal sobre pack_id y después se quita el único, en la misma sentencia.
--
-- Ejecutar una sola vez.

ALTER TABLE `pack_platform`
  ADD KEY `pack_id` (`pack_id`),
  DROP INDEX `uq_pack_platform`;
