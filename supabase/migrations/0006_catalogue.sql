-- Catalogue moves into the database so the back office can edit it.
create table if not exists products (
  id         text primary key,                 -- slug, e.g. 'dilla-senja'
  name       text not null,
  print      text not null default '',
  story      text not null default '',
  note       text,
  price_sen  integer not null check (price_sen >= 0),
  published  boolean not null default true,
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists colourways (
  product_id text not null references products(id) on delete cascade,
  id         text not null,
  name       text not null,
  swatch     text not null default '#888888',
  video      text,                              -- film base name in the bucket, or null
  position   integer not null default 0,
  primary key (product_id, id)
);
create table if not exists product_images (
  id           bigserial primary key,
  product_id   text not null,
  colourway_id text not null,
  name         text not null unique,            -- base name in the bucket: img/<name>-<w>.webp
  width        integer not null,
  height       integer not null,
  widths       integer[] not null,
  lqip         text not null,
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  foreign key (product_id, colourway_id) references colourways(product_id, id) on delete cascade
);
create index if not exists product_images_cw on product_images (product_id, colourway_id, position);

-- Order lines keep the names as sold, so a renamed or retired piece still reads right.
alter table order_items
  add column if not exists product_name text,
  add column if not exists colour_name  text;

insert into products (id, name, print, story, note, price_sen, published, position) values
  ('dilla', 'DILLA', 'Painted floral batik', 'Watercolour blooms in coral and rose drifting over soft peach. The lightest piece in the collection to look at, and the one that photographs like spring.', null, 19900, true, 1),
  ('dilla-senja', 'DILLA · SENJA', 'Night floral batik', 'Painted peonies and iris climbing from the hem on near-black, with the same bloom carried across the sleeve. The evening piece.', null, 19900, true, 2),
  ('thalia-pusaka', 'THALIA · PUSAKA', 'Heirloom medallion batik', 'A tile-work medallion running the full length of the front panel, edged with the fine scrolling border you used to see on a good tablecloth.', null, 19900, true, 3)
on conflict (id) do nothing;

insert into colourways (product_id, id, name, swatch, video, position) values
  ('dilla', 'soft-peach', 'Soft Peach', '#D3BDCA', null, 1),
  ('dilla-senja', 'black-batik', 'Black Batik', '#1B2527', 'senja_midnight', 1),
  ('thalia-pusaka', 'teal-green', 'Teal Green', '#2A4A58', 'pusaka_deep-teal', 1)
on conflict (product_id, id) do nothing;

insert into product_images (product_id, colourway_id, name, width, height, widths, lqip, position) values
  ('dilla', 'soft-peach', 'dilla_soft-peach_full_01', 1706, 2560, array[480,900,1400]::int[], 'data:image/webp;base64,UklGRgwBAABXRUJQVlA4IAABAADwBQCdASoUAB4APrVQo0unJKMhqAqo4BaJQBOmbOT2JgHXGZFd6O2l2jqheWlrGEwaXMGe6S58AAD5c4xfZY2WpSFB2O55+myy/Japml7MhbqoucUGeX/TU01Z0TTcT7gGrHGwnpSL0M/Ebus6z2+aMus+xIvwTdjjETxrJv/tu+jGLSIJEE4alK67C5IaDC+j67Ndc02zHMW1dGqK5BC6vMV/dbfDblZJC74V+6lcJOIanvoIGzwFBZG0RcZIsla7yQ7shq3d/hE19HXO0C7DWZfuJWdfq7eQuLPHjubk2k0Ma3p3ZPasX3XtYP8dVVFxVrvznYA64rz2I/G8EAAA', 1),
  ('dilla', 'soft-peach', 'dilla_soft-peach_back_01', 600, 900, array[480]::int[], 'data:image/webp;base64,UklGRi4BAABXRUJQVlA4ICIBAACQBwCdASoUAB4APrVKoEsnJCMhsBgIAOAWiUATplBmvZAGMs3imAGk7aHCyv7exsGB5pOyC3dcjgyoE72Wg3MAuFXWHHAA/sQ6y3n+EHmLo78T/PsDdH3gVh6Tqp2CGlOq8JSzD1SEWvYVYin2t3WW8i6u/XJVdeyHZKDRO3aFXz01Xe8Rf2IgOWE5UaVYz4MGbjaqHjoTXNPJsIsd2XbBOjPCv7ZFls2kUnYW3+kbkto3J0TCQbShNCKYhmeFcFrj34aAN1Wu3epSEz/YqzfBnY7ASpuEbui+iyW0owityxgVIrNiBafssu+kTJqvJReWZVfeC9ev/YHzFLtt2mpcGmx8E9M7uPHZioNjVT2Uef/nc7xaWoyHv93CivoBtQAAAA==', 2),
  ('dilla', 'soft-peach', 'dilla_soft-peach_full_02', 1706, 2560, array[480,900,1400]::int[], 'data:image/webp;base64,UklGRioBAABXRUJQVlA4IB4BAAAwBgCdASoUAB4APrVKnkmnJCKhMAgA4BaJQBYj4wS4AwDYU1Ty1rZukF3W0wS/Sf34wdiD+VkFDRwAAP5ZfgB+doSokJkGRe9QycPJMbBB3OXGi/oR7zVpzI7AaszfRQVc0LT6ewu3QYHwt8QMJsA2S0fUGKGef6bYuzMpbHnVxJ2Wd94OfjlaessGbQkHExz1oPT4kCSlBjlPfTUrOqF3SAeJXYvClt6X9HdbIJbuM77WZkYT266ldqF//Lg7FTufSeYLZm/ViFvUQDjnTKK7dW5ixZGAkbjkwCS9RYKMTdOElZw/Vr0NbKI5A9jufbABOPFVf7XZwTTX9rFz+uChGKq5XqZGcAzVSBi8yfVvpoVBfLc3pqk5XKoOsAAA', 3),
  ('dilla', 'soft-peach', 'dilla_soft-peach_detail_01', 1706, 2560, array[480,900,1400]::int[], 'data:image/webp;base64,UklGRiYBAABXRUJQVlA4IBoBAAAwBgCdASoUAB4APrVSok0nJKMiKAgA4BaJQBOmZl2TTdDeBcSBeOEwcD8us+YtmWS9tFkJNn7cQC7AAM4xaLdtqB8RuFpaAKyW773heFKjiHP+I/sZwx40oUtIdhrlJxbBecOfrDDKnaLZYyEzzYxGm09/q9Y0UhYnsH/NHg37U3vJO4s2dz7EnNPtqj4fvTTCtuvTf8lhGPlgd6GIAnFFrCBoUTQdMU/vQTRyvSuRtIKwEhyU+ynNYAtqSoB2r4j+n5IqF2yWpXXZfDrJ4/OvgVJwVnJM7jeEfwOfBFqM5Pj03iLf1fa0SJw1NEixm3aQNLAtsIgJ3/zbu5pVwyYsGQFmN6ZvqS0YF9oqu8fLCnDlbVa67Oi4AAA=', 4),
  ('dilla', 'soft-peach', 'dilla_soft-peach_full_03', 600, 900, array[480]::int[], 'data:image/webp;base64,UklGRgABAABXRUJQVlA4IPQAAADQBQCdASoUAB4APrVMn0mnJCKhMAgA4BaJQBOmUDX/y7nWCh02B9nmm/4XHF9NJAq5N6GkqMX4AP7TlyJ/98jcy2PHZ00xkqQGlIuYqUql3ZpulYdjr35sczPIB+dyy0nB54PAn9liwejBkWIYXfbklAm6fVlDevBpWdm0Ld33q/HIdPJnwV8138UDynPhQ6U/XhXzrrO62GQetolFvw97mZfR5bKeVgfUb3LBuMzf5uwRjtZ+NrVJuCD73H7KtK6YYVtYkL1hgMiG6zcZIq6tbfZLWGY6RiV8XKmb4AqRCqor0dHZBwOuHJBl9OWjNXestAAA', 5),
  ('dilla-senja', 'black-batik', 'dilla-senja_black-batik_full_01', 1706, 2560, array[480,900,1400]::int[], 'data:image/webp;base64,UklGRgQBAABXRUJQVlA4IPgAAABQBgCdASoUAB4APrVKn0unI6KhsBgIAOAWiWMAnTOR9vZ/xvQt5+Um6zbsaFpFkv+Ry69vfCMsLLJHgADONr2AjazYtA7ZKZp9b/+Delx6H97ZoUKuIJ0DsoBA5EaZ8n0LsfOqrrbz1G+Q/a9HPh0rLL6vFpalIWlNOq080GpG+L5tRsK6+A3AWnTmOPhFIfsXSuvAcOB5p7kAdcD8sGZLBVPQWhLWZXr8D3k4Lv14zzuTj+ixgZhkpHMw9S8DcSluETB8+GNxMagd6R8iOclxyOd/zbSHnyPFvrmiQJJwa8qqUC9XXkvlSh1OALhwXzW89E6LfgAAAA==', 1),
  ('dilla-senja', 'black-batik', 'dilla-senja_black-batik_full_02', 533, 800, array[480]::int[], 'data:image/webp;base64,UklGRhgBAABXRUJQVlA4IAwBAABQBgCdASoUAB4APrVQn0qnJSKhsBgIAOAWiUAVhAmNSp74Vkl1z99avT+eHmuqmw/TUunRE0HJRmCUAAD+4aeoHfttn6jTu0fTbDLh8m5Hzxdsh4bjpAYwRtFK/cXFu+lZVL3wJa1sI9P2KBWR7gWGkGaP5+wyDaaNMyB7lkqqhlaol0qduxL3wLdth9iWy/PHZsBe55siOgPAy9oLoTGVaAI3InWmmYrwU6YWITmz4rWpBYhez23Nvuwzb9vsNZ1kQ4AZxsMSW5OrTn5ZzxlUSkpLF/SR5Tx68RZr5nR0oPaxJBtoL6TYlV1TMVozI1p1aSW54PhtNw1bHDFew1zhXk3SllFTfvrPRwAA', 2),
  ('dilla-senja', 'black-batik', 'dilla-senja_black-batik_detail_01', 1706, 2560, array[480,900,1400]::int[], 'data:image/webp;base64,UklGRkgBAABXRUJQVlA4IDwBAAAwBwCdASoUAB4APrVOo0unJCMhqAqo4BaJYwCdM5Hmq8A7wI8EMw8iYs6Oqpqyc1jZLrGmvw+TOr8/KC1r0dsWdsAA/mQjLoUcASmYJOUq3V/ca7dNmOSPQQk/zOM8eKQVnFbRel7Pv8gkzrA5hEpkj47JGEp8QRxrWyIYqpxcQz/y2aCvZiSplgilsSq4goYuZO7C99Mo+muuaENshyjzHh5nwSApGrD4fdBE08pf57u3yro/ZZkXEitD81nZ2n6AlYeaecpqguxzMXw7ZGEKBMF/3Z0jZMV3ldCCl0P+rHqcF5hlg/JRo8+dMno0odjDAImJkgp5U2EkM2Xm+gZnUgChJE4Esb4eR2c09C9zxtRlWiKyRdXbzfpB73ugn8eJREhoB7dfaKd3QxdKKhES512fMk5zyYG7QAAA', 3),
  ('dilla-senja', 'black-batik', 'dilla-senja_black-batik_detail_02', 1706, 2560, array[480,900,1400]::int[], 'data:image/webp;base64,UklGRhgBAABXRUJQVlA4IAwBAAAwBgCdASoUAB4APrVInUmnJCKhMAgA4BaJQBOmY5BWtAKRCoPRAlb5680TwwYldjpKuK21oZcM1RsAAP4Bc3ZWddfn400coa95wjhQGAqnhL3hC5Ab1O/exrDCw2bfr3HBOzHHabAL6PwMrLb2tPlFB5oPmkdgYgiXLjJKoUpo5RBUl+jWep0/tk75/IMRqsZg9T3dTUoMyn7JsnuFrOytgO/e0+fhAxjgOa8dEhCdPoY0oH32adXaWKBvDhsJSw8wpe4VmNkxJnBnGRi3P95Uv0vm/h32+/EjnDM5ElYt9HqU7XJbPURZpT8jzybu2cGMA30c+kL/GVMXvgAxjYT/OT6IOiQAQywPgAAA', 4),
  ('dilla-senja', 'black-batik', 'dilla-senja_black-batik_full_03', 533, 800, array[480]::int[], 'data:image/webp;base64,UklGRhgBAABXRUJQVlA4IAwBAADwBQCdASoUAB4APrVKnkmnJCKhMAgA4BaJQBOmY5BWtACB7C6sIpXnz7GU84e7Np+VcB6iace2gAD+aKtQumY6cDE+mwiW/eCf7NccoUBzft6tDSgNbv6WZUBilVSBnyw+u47WQbRL810dm46r3eu5DRk67MlLqiAmpaPRB6jhmkO3T9zfXXtotI6KpRN9ivQwP10wNb8gm/PmGjNKSwpvtTOPzIEu6McBzXjokITp9DGk/+eTugKM6Ah2PnWPGLhYKsSZjsNSlmSJHRc0BG7rtKPjofwEE7OmhaPIBfRbqZ5X4dDL3TyjckGoSwKVFWhm22FNJmxsCnaMgR87bg7mXYsfmT0GD2l6wAAA', 5),
  ('dilla-senja', 'black-batik', 'dilla-senja_black-batik_back_01', 533, 800, array[480]::int[], 'data:image/webp;base64,UklGRhQBAABXRUJQVlA4IAgBAABwBgCdASoUAB4APrVQnkqnJSKhsBgIAOAWiUATpmOA2U+nKuNFENCTu1ZJdLozCRuMatwQF3cE/JXD6AAA/sj8vU8evnw8U2fYyYzT4biv6bMq4uXixekn4YtKjRULAywcvMdNgkiaH/eisMuhaUa0PU4MpbXXerUWn2OXByPpfFNi53M4/j2icJQkgVevZ1qIVh4OKH8tcnrWaXWYOL8SpUDeFGiuhHqwZdGA1KSb9oELR9+XTRvM1nPSqd0mdxCXb/lE/ukDdPloUwTNhQjcs+Jv48roxbppaveq0t0Hlz/vdbMjcc2OfxUq8I2BhOVxceU+xmd/jWOCzokFZOi16iun068AAAA=', 6),
  ('thalia-pusaka', 'teal-green', 'thalia-pusaka_teal-green_full_01', 1706, 2560, array[480,900,1400]::int[], 'data:image/webp;base64,UklGRiABAABXRUJQVlA4IBQBAAAwBgCdASoUAB4APrVQoUwnJKMiKAqo4BaJQBdmXqYwfQNaSx3wnYwBN0RtJGEIjNTGOqx+Gxc4Co0AAPpOH8E0PZ1zXRVutH/60FrNj4toGA4su8ktrrPpFNzBqulwKhqIC2jYJcdiyoPBIWIbnV/KrqCPFKvNoEsBIdd2Gkw2uEmiiiYYEOC0Pc/WY0CL9mB52+k2fpQ1HqkzHkPa9j6x1AmXMnL2Xvr6/q0p9CT57GIMecspG7jH7eUAEty1JPwxnrVmCkXfrObGJddLfAaPUuOPLbVdSw9OlXJVOYInC7NdRzq/QJNeAAjeFDPt8klOONiUgBGlg6jURPSjDu0toYeUi7yi5iPheF7UJ2/0DdWYAAA=', 1),
  ('thalia-pusaka', 'teal-green', 'thalia-pusaka_teal-green_full_02', 900, 1350, array[480,900]::int[], 'data:image/webp;base64,UklGRt4AAABXRUJQVlA4INIAAACQBQCdASoUAB4APrVMnkonJKKhsAgA4BaJQBdiP/xbKijDHNws93BHg7hjBrdnRm7QBnxyQAD+9Xv6svUPe5o2aJafcQ1ApIweeQ2lK2e5k1q3qVv2R3LmTymMwSVnvNEwZbY2Hrp0EPsw24nQiDfXGXXCxWtPxHCLlM78lXCrvgKAHRc4d7b4zsMy20v2GDjMHboLNfBG3w5dQiJFdsS8seo17/1VRmt130s8xLoJADc2SdCjq5UmqbfYqdrqCHZlwyEEudkB8QQfvg1/2xxmgAA=', 2),
  ('thalia-pusaka', 'teal-green', 'thalia-pusaka_teal-green_back_01', 792, 1188, array[480]::int[], 'data:image/webp;base64,UklGRvIAAABXRUJQVlA4IOYAAACwBQCdASoUAB4APrVOpEunJCOhqAqo4BaJYwCxHvU34HAszc32hfQmx8ZRHQJb4ZIh/xolWAAA/vkYfoNkO/O94eOCPaKy87MqFGYdQZMrInqar50a8WIoIeg9/BjzZ2vrPkyyIoCXcJqefjfStuayVrhoQ0YlCluK6/j4kwPyKenNitv48iisQSvbCKvEngpY/XkwViglKFXYaSoKBkS0Leq13NeL0gKR7vysG17k++nwIvoyCkoIgeGDOJu94mkKQRh7MnxWxovuAijP3aXoXCjfhkkGn9tB3O0V3GQTtZwjSzgAAA==', 3),
  ('thalia-pusaka', 'teal-green', 'thalia-pusaka_teal-green_detail_01', 1706, 2560, array[480,900,1400]::int[], 'data:image/webp;base64,UklGRgYBAABXRUJQVlA4IPoAAADQBQCdASoUAB4APrVOoEsnJCMhsBgIAOAWiUATpmHIzuwK/ogJx9E3vEnOs1p5xtkkuwQ5958AAP73gnxjiY4xsIYhkke+E4V0/zKTVb+7GYC6tAK10UwoE46JWJCybq0cXxgXs0mvc00lcgB7jDr/4hlR3+Pxm75V5HJKF/tP0ad0NYVME6vhUPiyLVqvbo3bTUX7q097pP9Y7r1exU1riQF/s/dRRxVczE++4KhOU+5xsv3YxhqzJ4aKoJ4p1v1Uh4htX/N/nQEPX1tfgg2mOX0Dz4Go77gaDLl67z5cRZFcAyZ8fUO4ngcZG8yTVtaPLOwE3LQzTUAA', 4),
  ('thalia-pusaka', 'teal-green', 'thalia-pusaka_teal-green_detail_02', 1706, 2560, array[480,900,1400]::int[], 'data:image/webp;base64,UklGRiQBAABXRUJQVlA4IBgBAADwBQCdASoUAB4APrVKoUunI6MhsBgIAOAWiUATpmHHZ76pmgZYJ00JNwPgSFWJhL8YtTmXOE9L8AD974Gx6zHhdwiy96t/blRj8X9PPAJv4XHhu69UEAUfYhMYaCaYlHipellDqrbLWgozBziiqZmXImD4dyZF6eD/IqVvfqc7K1v+stXPVPcoulbucYViQz8FO3Yn0vbDl8bmxhwUraABiJsEIwlLkxQCLnSiHqrVY1pT5DaEnUsykRzHXwfevU2numuuSQhjvyOuyF6XHIMeXNDvSEhpz4UtZHnX4r+mMCwxgWVk6LZKrDMZK47U+CNEr+eKDw+kKazDHbeXwUy8nGWjy2eHixR7+q+wypzAd8KISTrsgAAA', 5)
on conflict (name) do nothing;

alter table variants
  add constraint variants_colourway_fk foreign key (product_id, colourway_id) references colourways(product_id, id) on delete cascade;

alter table products enable row level security;
alter table colourways enable row level security;
alter table product_images enable row level security;
drop policy if exists "public read products" on products;
create policy "public read products" on products for select using (published);
drop policy if exists "public read colourways" on colourways;
create policy "public read colourways" on colourways for select using (true);
drop policy if exists "public read images" on product_images;
create policy "public read images" on product_images for select using (true);
drop trigger if exists products_touch on products;
create trigger products_touch before update on products for each row execute function touch_updated_at();
