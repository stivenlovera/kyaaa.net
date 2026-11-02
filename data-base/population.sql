-- Datos de ejemplo para la base ia_kyaaa: catálogos base y dos packs de prueba.
-- Requiere que schema.sql ya se haya ejecutado (crea las tablas primero).

use `ia_kyaaa`;

#POBLACION
insert into `type` (type_id,name) values (1,'de pago');
insert into `type` (type_id,name) values (2,'gratis');
insert into page_type (page_type_id,name) values (1,'free'),(2,'buy'),(3,'registered');
insert into rol (rol_id,name) values (1,'admin');
insert into size (size_id, name, extension)
values
(1,'tumb','avif'),
(2,'medium','avif'),
(3,'web','avif'),
(4,'premium-web','avif'),
(5,'meta','jpeg'),
(6,'og','jpeg');

insert into label (label_id, name) values
 (1,'ahegao'),
 (2,'lolicon'),
 (3,'ray-x'),
 (4,'no penetration'),
 (5,'rape'),
 (6,'nakadashi'),
 (7,'twintails'),
 (8,'ponytail'),
 (9,'stomach deformation'),
 (10,'anal'),
 (11,'bukkake');

insert into serie (serie_id, name)
values
(1,'original'),
(2,'love live project'),
(3,'love live sunshine'),
(4,'jujutsu kaisen'),
(5,'demashita! powerpuff girls Z'),
(6,'houkago no pleiades'),
(7,'shion murasaki');

insert into `character` (character_id, name)
values
(1,'momoko akatsutsumi'),
(2,'nishikino maki'),
(3,'niko yazawa'),
(4,'yoshiko tsushima'),
(5,'utahime iori'),
(6,'mao mao'),
(7,'shinonome akira'),
(8,'mizuki-ia'),
(9,'honoka kosaka'),
(10,'kotori minami'),
(11,'murasaki shion');

insert into `author` (author_id,name) values
(1,'iaKyaaa'),
(2,'zeroRealistic');
insert into `language` (name) values ('solo imagen');
insert into state_pack (state_pack_id, name) values (1,'publicado'),(2,'próximamente'),(3,'borrador');
insert into platform (name, slug, base_url) values ('Ko-fi','ko-fi','https://ko-fi.com/'),('Patreon','patreon','https://www.patreon.com/'),('Facebook','facebook','https://www.facebook.com/'),('Instagram','instagram','https://www.instagram.com/'),('X','x','https://x.com/'),('Gumroad','gumroad','https://gumroad.com/');

#POBLACION te encontre
insert into pack (name,code,price_list) values ('te encontre','20260128202950',7.0);
insert into pack_type (type_id, pack_id) values (2,1);
insert into pack_label (label_id, pack_id) values (1,1),(2,1),(3,1),(6,1),(8,1),(9,1);
insert into pack_serie (serie_id, pack_id) values (5,1);
insert into pack_character (character_id,pack_id) values (1,1);
insert into pack_author (author_id,pack_id) values (1,1);
insert into pack_language (language_id,pack_id) values (1,1);

#POBLACION nico anal
insert into pack (name,code,price_list) values ('nicoAnal','20260128202951',7.0);
insert into pack_type (type_id, pack_id) values (1,2);
insert into pack_label (label_id, pack_id) values (1,2),(2,2),(3,2),(5,2),(6,2),(7,2),(9,2),(10,2),(11,2);
insert into pack_serie (serie_id, pack_id) values (2,2);
insert into pack_character (character_id,pack_id) values (3,2);
insert into pack_author (author_id,pack_id) values (2,2);
insert into pack_language (language_id,pack_id) values (1,2);


select * from page;
select * from serie;
select * from label;
select * from `character`;

#PAGINAS GRATIS (page_type 1 = free, 2 = buy). Se ejecuta después de cargar las páginas de cada pack.
#te encontre es gratuito: todas sus páginas son gratis.
update page set page_type_id = 1 where pack_id = 1;
#nico anal es de pago: solo estas páginas son gratis.
update page set page_type_id = 1
 where pack_id = 2
   and cast(num as unsigned) in (1,2,4,5,8,9,15,16,19,20,22,24,28,30,36,39,40,43,46,48,51,52,56,59);
