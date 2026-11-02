-- Rol de administrador: las páginas /admin y las APIs de administración (crear/editar/borrar packs,
-- páginas, autores, personajes, series y etiquetas) exigen que el usuario tenga este rol en user_rol.
-- Ver ROL en src/app/utils/page-access.ts y adminDenied/getCurrentAdmin en src/app/utils/auth.ts.
--
-- Ejecutar una sola vez. Para dar el rol a otra cuenta, repetir el segundo INSERT con su email.

INSERT INTO `rol` (`rol_id`, `name`) VALUES (1, 'admin');

INSERT INTO `user_rol` (`rol_id`, `user_id`)
SELECT 1, `user_id` FROM `user` WHERE `email` = 'stivenlovera@gmail.com';
