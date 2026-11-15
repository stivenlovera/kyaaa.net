-- Nueva columna platform.is_external, ubicada antes de `state`: indica si la plataforma es ajena a
-- nosotros (1 = externa, de un tercero, p. ej. Ko-fi, Patreon, Facebook) o propia (0 = nuestra).
-- Todas las plataformas existentes son de terceros, así que quedan marcadas como externas (1).
-- Ver prisma/schema.prisma (modelo Platform) y data-base/schema.sql.
--
-- Ejecutar una sola vez.

ALTER TABLE `platform`
  ADD COLUMN `is_external` tinyint NOT NULL DEFAULT '1' AFTER `base_url`,
  ADD CONSTRAINT `chk_platform_is_external` CHECK (`is_external` IN (0, 1));

-- El DEFAULT ya rellena las filas existentes con 1; se deja explícito por claridad.
UPDATE `platform` SET `is_external` = 1;
