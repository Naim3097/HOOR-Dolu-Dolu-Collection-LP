-- The live collection (hoor.my/c/Batik Dolu-Dolu, 3 Sep 2026) is three pieces.
-- Stock mirrors the store's per-size quantities on that date.
insert into variants (sku, product_id, colourway_id, size, stock) values
  ('DILLA:SOFT-PEACH:SM','dilla','soft-peach','SM',15),
  ('DILLA:SOFT-PEACH:LXL','dilla','soft-peach','LXL',22),
  ('DILLA:SOFT-PEACH:2XL','dilla','soft-peach','2XL',5),
  ('DILLA:SOFT-PEACH:3XL','dilla','soft-peach','3XL',6),
  ('DILLA:SOFT-PEACH:4XL','dilla','soft-peach','4XL',2),
  ('DILLA-SENJA:BLACK-BATIK:SM','dilla-senja','black-batik','SM',4),
  ('DILLA-SENJA:BLACK-BATIK:LXL','dilla-senja','black-batik','LXL',11),
  ('DILLA-SENJA:BLACK-BATIK:2XL','dilla-senja','black-batik','2XL',2),
  ('DILLA-SENJA:BLACK-BATIK:3XL','dilla-senja','black-batik','3XL',0),
  ('DILLA-SENJA:BLACK-BATIK:4XL','dilla-senja','black-batik','4XL',1),
  ('THALIA-PUSAKA:TEAL-GREEN:SM','thalia-pusaka','teal-green','SM',12),
  ('THALIA-PUSAKA:TEAL-GREEN:LXL','thalia-pusaka','teal-green','LXL',20),
  ('THALIA-PUSAKA:TEAL-GREEN:2XL','thalia-pusaka','teal-green','2XL',6),
  ('THALIA-PUSAKA:TEAL-GREEN:3XL','thalia-pusaka','teal-green','3XL',3),
  ('THALIA-PUSAKA:TEAL-GREEN:4XL','thalia-pusaka','teal-green','4XL',2)
on conflict (sku) do update set stock = excluded.stock, updated_at = now();

-- Retire the sixteen earlier products, keeping any variant an order already references.
delete from variants v
 where v.product_id not in ('dilla','dilla-senja','thalia-pusaka')
   and not exists (select 1 from order_items oi where oi.sku = v.sku);
