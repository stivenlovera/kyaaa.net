-- Nueva columna platform.is_payment, ubicada después de `is_external`: indica si la plataforma tiene
-- pasarela de pago (1 = se puede comprar ahí, p. ej. Ko-fi, Patreon, Gumroad) o es una red social
-- (0 = solo para seguirnos, p. ej. Facebook, Instagram, X).
-- En la ficha del pack (/pack/<code>) separa los pósters en "Compra también por" (1) y "Síguenos en" (0).
-- Ver prisma/schema.prisma (modelo Platform) y src/app/[locale]/pack/[code]/_components/pack-platforms.tsx.
--
-- Ejecutar una sola vez (después de 2026-11-15_platform_is_external.sql).

ALTER TABLE `platform`
  ADD COLUMN `is_payment` tinyint NOT NULL DEFAULT '0' AFTER `is_external`,
  ADD CONSTRAINT `chk_platform_is_payment` CHECK (`is_payment` IN (0, 1));

-- Plataformas con pasarela de pago del catálogo inicial; el resto queda como red social (0).
UPDATE `platform` SET `is_payment` = 1 WHERE `slug` IN ('ko-fi', 'patreon', 'gumroad');
