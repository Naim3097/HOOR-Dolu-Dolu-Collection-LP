-- The client wants JUWITA's four colours on the grid as four separate cards
-- (10 Sep 2026), so the one four-colour product becomes four single-colour
-- products. Storage names (juwita_<colour>_*) are untouched; the image and
-- variant rows just move to the new parents, and the SKU strings keep their
-- original JUWITA:<COLOUR>:<SIZE> shape so the stock ledger stays continuous.
insert into products (id, name, print, story, note, price_sen, published, position) values
  ('juwita-black-green', 'JUWITA', 'Heritage paisley batik', 'A centre column of medallions with paisley falling down each side, in kelarai green over black. The JUWITA print in its darkest telling.', null, 19900, true, 7),
  ('juwita-ash-blue', 'JUWITA', 'Heritage paisley batik', 'The same heritage motifs washed in ash blue and white, lighter on the eye and easy in daylight. The calmest of the JUWITA colours.', null, 19900, true, 8),
  ('juwita-ribena', 'JUWITA', 'Baroque panel batik', 'Deep purple side panels against a pale blue centre, both carrying white baroque scrolls. The boldest JUWITA — the one that gets asked about.', null, 19900, true, 9),
  ('juwita-royal-blue', 'JUWITA', 'Coral bloom batik', 'Coral blooms and trailing stems scattered over royal blue, with a patterned border gathering at the hem. The JUWITA that photographs the brightest.', null, 19900, true, 10)
on conflict (id) do nothing;

insert into colourways (product_id, id, name, swatch, video, position) values
  ('juwita-black-green', 'black-green', 'Black Green', '#26331F', null, 1),
  ('juwita-ash-blue', 'ash-blue', 'Ash Blue', '#5B79B4', null, 1),
  ('juwita-ribena', 'ribena', 'Ribena', '#5C2D5E', null, 1),
  ('juwita-royal-blue', 'royal-blue', 'Royal Blue', '#2743A6', null, 1)
on conflict (product_id, id) do nothing;

update product_images set product_id = 'juwita-' || colourway_id where product_id = 'juwita';
update variants set product_id = 'juwita-' || colourway_id where product_id = 'juwita';

-- Old parent goes last; its colourways are childless by now and cascade away.
delete from products where id = 'juwita';

update products set position = 11 where id = 'jasmin';
update products set position = 12 where id = 'navy-royal';
update products set position = 13 where id = 'olive';
update products set position = 14 where id = 'blackest-black';
update products set position = 15 where id = 'pink-flower';
