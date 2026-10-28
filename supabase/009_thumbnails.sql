-- ============================================================
-- Cut Scenes · migration 009
-- Light thumbnails for the catalogue grid. The home page now shows
-- these small copies (served by Vercel) and only downloads the full
-- still when someone opens that film. Saves most of Supabase's
-- monthly transfer.
-- Run ONCE in Supabase → SQL Editor → New query → paste → Run.
-- Safe to run again.
-- ============================================================

alter table public.films add column if not exists thumb_url text;

update public.films f set thumb_url = v.t
from (values
  ('2039ed16-2b8e-4145-815e-b4c8c6a3f3b9'::uuid, 'thumbs/2039ed16-2b8e-4145-815e-b4c8c6a3f3b9.webp'),  -- The Royal Hotel
  ('c95142e7-f3c4-47c5-933b-d8c6969c3bd5'::uuid, 'thumbs/c95142e7-f3c4-47c5-933b-d8c6969c3bd5.webp'),  -- In Time
  ('7a40dd06-9654-4e93-b5b2-eefc549916a3'::uuid, 'thumbs/7a40dd06-9654-4e93-b5b2-eefc549916a3.webp'),  -- The Call
  ('a024704d-1fb5-4f9f-a7bb-e7a8cb19c409'::uuid, 'thumbs/a024704d-1fb5-4f9f-a7bb-e7a8cb19c409.webp'),  -- Charade
  ('ddf9491c-e7b9-4101-ad84-b545a9967c5e'::uuid, 'thumbs/ddf9491c-e7b9-4101-ad84-b545a9967c5e.webp'),  -- The Tale of the Princess Kaguya
  ('5a19f081-75be-4d3c-a608-0638b9c99078'::uuid, 'thumbs/5a19f081-75be-4d3c-a608-0638b9c99078.webp'),  -- La bola negra
  ('b54e1be6-b51a-4bef-8f29-585e4ba292d5'::uuid, 'thumbs/b54e1be6-b51a-4bef-8f29-585e4ba292d5.webp'),  -- The Little Mermaid
  ('cd7c1126-7593-442e-b88d-12c17320fce8'::uuid, 'thumbs/cd7c1126-7593-442e-b88d-12c17320fce8.webp'),  -- The Witches
  ('628c5a64-bf9e-4bce-a17c-5d876dea6e76'::uuid, 'thumbs/628c5a64-bf9e-4bce-a17c-5d876dea6e76.webp'),  -- Conan the Destroyer
  ('ae45f450-d06f-48ff-92df-ef7cfd90f77c'::uuid, 'thumbs/ae45f450-d06f-48ff-92df-ef7cfd90f77c.webp'),  -- Fleabag
  ('5a746779-544e-494e-b85a-f41439ce56d0'::uuid, 'thumbs/5a746779-544e-494e-b85a-f41439ce56d0.webp'),  -- Amélie
  ('f542ddaf-1ec4-489d-aad0-a43094f009a9'::uuid, 'thumbs/f542ddaf-1ec4-489d-aad0-a43094f009a9.webp'),  -- Lady Bird
  ('b5c34da1-a5c0-4a74-8380-a40bb0b97fa9'::uuid, 'thumbs/b5c34da1-a5c0-4a74-8380-a40bb0b97fa9.webp'),  -- Eyimofe
  ('3cb517a8-4d5c-4a15-a50b-a97a31224827'::uuid, 'thumbs/3cb517a8-4d5c-4a15-a50b-a97a31224827.webp'),  -- House of Games
  ('70813a21-b3d3-4c20-aecb-a8d0bfa93c93'::uuid, 'thumbs/70813a21-b3d3-4c20-aecb-a8d0bfa93c93.webp'),  -- Stalker
  ('9bed832a-e206-4582-95c4-087350f1443e'::uuid, 'thumbs/9bed832a-e206-4582-95c4-087350f1443e.webp'),  -- Mikey and Nicky
  ('3ac3c271-d010-4b54-9b24-b0f47881a291'::uuid, 'thumbs/3ac3c271-d010-4b54-9b24-b0f47881a291.webp'),  -- Metropolis
  ('3f56a82a-2192-4ed7-b8d7-b0c8d440278b'::uuid, 'thumbs/3f56a82a-2192-4ed7-b8d7-b0c8d440278b.webp'),  -- Dr. Strangelove
  ('0c0c6efe-ac90-4a62-a200-e679f7c1748a'::uuid, 'thumbs/0c0c6efe-ac90-4a62-a200-e679f7c1748a.webp'),  -- The Godfather
  ('311fa98b-ca54-4461-8983-283e3a64f4c8'::uuid, 'thumbs/311fa98b-ca54-4461-8983-283e3a64f4c8.webp'),  -- The Texas Chain Saw Massacre
  ('2ce1666f-9af6-4f1f-8f1b-7623e90093f6'::uuid, 'thumbs/2ce1666f-9af6-4f1f-8f1b-7623e90093f6.webp'),  -- Stop Making Sense
  ('abf77dab-972a-4990-8ec8-6281be47de05'::uuid, 'thumbs/abf77dab-972a-4990-8ec8-6281be47de05.webp'),  -- Hard Boiled
  ('a10ab7c6-3228-48ba-a915-bd0afdca4398'::uuid, 'thumbs/a10ab7c6-3228-48ba-a915-bd0afdca4398.webp'),  -- Three Colors: Blue
  ('fcac1e5c-0b9a-4dd4-ac44-5d3d8f95b16f'::uuid, 'thumbs/fcac1e5c-0b9a-4dd4-ac44-5d3d8f95b16f.webp'),  -- Crash
  ('1c2f8995-6156-4a04-be27-23bb6df08f94'::uuid, 'thumbs/1c2f8995-6156-4a04-be27-23bb6df08f94.webp'),  -- The Red Shoes
  ('d7c4cc6e-fc81-4f7c-8d3c-ab3c262866cc'::uuid, 'thumbs/d7c4cc6e-fc81-4f7c-8d3c-ab3c262866cc.webp'),  -- The Passion of Joan of Arc
  ('54d3606e-98e6-44ed-891f-55c28823655c'::uuid, 'thumbs/54d3606e-98e6-44ed-891f-55c28823655c.webp'),  -- Design for Living
  ('65ca03f0-ef5d-4d52-99ff-2d7c5b2723e8'::uuid, 'thumbs/65ca03f0-ef5d-4d52-99ff-2d7c5b2723e8.webp'),  -- Stagecoach
  ('6abb1ae1-3558-4954-99ba-18a4c8730a25'::uuid, 'thumbs/6abb1ae1-3558-4954-99ba-18a4c8730a25.webp'),  -- High and Low
  ('92726c53-fa4b-46d6-ae39-8fef42dd28c6'::uuid, 'thumbs/92726c53-fa4b-46d6-ae39-8fef42dd28c6.webp'),  -- Persona
  ('c8e23ba5-0cc6-4921-8735-93bb1430d6c7'::uuid, 'thumbs/c8e23ba5-0cc6-4921-8735-93bb1430d6c7.webp'),  -- Memories of Underdevelopment
  ('e2908f0f-5e7c-4b90-9a2f-5734f639722d'::uuid, 'thumbs/e2908f0f-5e7c-4b90-9a2f-5734f639722d.webp'),  -- Sherlock Jr.
  ('23ce7251-40da-4df4-beba-197c8f343760'::uuid, 'thumbs/23ce7251-40da-4df4-beba-197c8f343760.webp'),  -- Life of Brian
  ('92c7626d-7169-427f-8353-0de9368326d0'::uuid, 'thumbs/92c7626d-7169-427f-8353-0de9368326d0.webp'),  -- Reds
  ('405f923e-ca62-4e18-8320-7fb14fdd22f1'::uuid, 'thumbs/405f923e-ca62-4e18-8320-7fb14fdd22f1.webp'),  -- Happy Together
  ('dded4ddc-a654-422f-8ec7-d329728d175d'::uuid, 'thumbs/dded4ddc-a654-422f-8ec7-d329728d175d.webp'),  -- The Man Without a Past
  ('5f80b286-b649-44bb-9bfa-f9e82de0013b'::uuid, 'thumbs/5f80b286-b649-44bb-9bfa-f9e82de0013b.webp'),  -- Sympathy for Lady Vengeance
  ('b8462b4b-439b-442d-9684-10aaac46b562'::uuid, 'thumbs/b8462b4b-439b-442d-9684-10aaac46b562.webp'),  -- The Zone of Interest
  ('2a1619dc-c10d-407a-b618-05bd6740daad'::uuid, 'thumbs/2a1619dc-c10d-407a-b618-05bd6740daad.webp'),  -- A Nightmare on Elm Street
  ('908ee372-44df-4be2-b0f4-c4892c0a131f'::uuid, 'thumbs/908ee372-44df-4be2-b0f4-c4892c0a131f.webp')   -- The Rocky Horror Picture Show
) as v(id, t)
where f.id = v.id and f.thumb_url is null;

select count(*) as films_with_thumbnail from public.films where thumb_url is not null;
