-- Imágenes propias de cada pack para los modales:
--   thanks_image:   modal "Gracias por tu compra" (buy/[code]). Si es NULL se usa /img/thanks.png.
--   register_image: modal "Registrate ahora!" (pack/[code]). Si es NULL el modal no muestra imagen.
-- Guardan la key dentro del bucket static (NEXT_PUBLIC_STATIC_URL_S3), p. ej. `pack/<pack.code>/thanks.webp`,
-- nunca la URL completa. Ver src/app/utils/pack-images.ts (packMediaUrl).
--
-- Ejecutar una sola vez.

ALTER TABLE `pack`
  ADD COLUMN `thanks_image` varchar(255) DEFAULT NULL AFTER `code_free`,
  ADD COLUMN `register_image` varchar(255) DEFAULT NULL AFTER `thanks_image`;
