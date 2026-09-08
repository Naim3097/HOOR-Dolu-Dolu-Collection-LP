-- hoor.my/c/Batik Dolu-Dolu lists five pieces (8 Sep 2026); the storefront had three.
-- LILY RIMBUN in Bronze Batik and FLOWER FOREST in Ivory Marble Sage join at RM199,
-- with the store's per-size stock on that date. Renders are in the assets bucket (media/manifest.json).
insert into products (id, name, print, story, note, price_sen, published, position) values
  ('lily-rimbun', 'LILY RIMBUN', 'Bronze floral border batik', 'Small foulard motifs over warm bronze, with a full bed of lilies and roses gathering at the hem and along the sleeve. The warm piece, made for evening light.', null, 19900, true, 4),
  ('flower-forest', 'FLOWER FOREST', 'Wild-stem floral on marbled batik', 'Fine botanical stems climbing from the hem over ivory, marbled sage and tan running down each side, and a scatter of gold at the neckline. The softest piece to look at, and the one that reads like a walk through the garden.', null, 19900, true, 5)
on conflict (id) do nothing;

insert into colourways (product_id, id, name, swatch, video, position) values
  ('lily-rimbun', 'bronze-batik', 'Bronze Batik', '#6E4C3A', null, 1),
  ('flower-forest', 'ivory-marble-sage', 'Ivory Marble Sage', '#D8CEC4', null, 1)
on conflict (product_id, id) do nothing;

insert into product_images (product_id, colourway_id, name, width, height, widths, lqip, position) values
  ('lily-rimbun', 'bronze-batik', 'lily-rimbun_bronze-batik_full_01', 733, 1100, array[480]::int[], 'data:image/webp;base64,UklGRuwAAABXRUJQVlA4IOAAAAAwBQCdASoUAB4APqlEnUmmI6MhMAwAwBUJQBYdsZ8Q9nyXutHDpOG3JMzniEXgSZw+gAD+w/3us0qQSk4pno4WbXnVX4iqNHDn3aCgLvc+eGkG/PbO21Z03TSoFBRk5tqHGjPeQitNjpQVSl3OiFYn5ulmqEYjZD2+1brZozbyN+6DeIxv8nutL/Ypp4benYiCtUm8xBy2xwGcIdfJuUj0JZ9O8TI7UvpZ3FW3aQ1kl+AweeB8diuJYqZf/6Jb/0EIKjivuGNzQveBEb5sI5p0phzmZZyK4N32UifBRAAAAA==', 1),
  ('lily-rimbun', 'bronze-batik', 'lily-rimbun_bronze-batik_full_02', 733, 1100, array[480]::int[], 'data:image/webp;base64,UklGRugAAABXRUJQVlA4INwAAADQBQCdASoUAB4APrVGn0mnI6KhMBgMAOAWiWYAqSchpcMkcEtjeHJWEU1WsLRnlVzWeTMDO/MAAP7TnBJg5UL25jc/O4dKyR4UGM4cL4/hrrwQtylqIJdBnwmjnA5VqfBtGWlq4kpJsum+wzEGUDIKuKK6P/YWsqUT7NoG9KWzTxMTx8xm8Y3+TvwmXwWY3zWl3xB0wq2pYOutw85sXSLBOhxV6Tq0Gnt1IQM21GAQOiYt8K4d8yDDd6ZpS4+1aVaNlJU9tX+boseTH7+4IymlqFD9fPVidfZA4AAA', 2),
  ('lily-rimbun', 'bronze-batik', 'lily-rimbun_bronze-batik_back_01', 1706, 2560, array[480,900,1400]::int[], 'data:image/webp;base64,UklGRsAAAABXRUJQVlA4ILQAAABQBQCdASoUAB4APrFEnUmnI6KhN/VYAOAWCUAW9wixPdbBYBIZXpBHqFBDPUVwMMBLDhwA/q/EbXojiAOon03IRZpCt+DLZ91H+sts53Hzspt6teJaONwnqDu4Td7ePu6f2+PMTbSADUFL5kprhcuJxqiusm1JOckfcAd6rBz5In3piNz3x7VJ5jFXnfcfhuWXswzLiyqpHJt5ozMeBb+AggmSu9Hef5R82dNnWD4Ca/2AAAA=', 3),
  ('lily-rimbun', 'bronze-batik', 'lily-rimbun_bronze-batik_full_03', 733, 1100, array[480]::int[], 'data:image/webp;base64,UklGRvQAAABXRUJQVlA4IOgAAACwBQCdASoUAB4APqlGnkmmJCMhMAwAwBUJZAC4QftjeBcQx6wVK7s/o28E6iPps3SKwwyQDAAA/sP9tyEkugmP29T+nbFr9j5Q8RLqmCryJYLLFwXAhNt4CbQ7W584yfRKvYt7t0fYWkZHYFuCMD9LNOVTYPvRumRaTVk9MJ+Tu+iOMt1cf5JrAHWUzaqrQ5VUYve5gwMDKJea6eZ58Y1bpfKVSkDmM0oRF7jPYNYIZoejq8rBGcJlJHx4F/Iuy7dqYFEfjmOd8UPVICBQopIA25LvlUfI54qw39/4XNgoItktQdQziSAA', 4),
  ('lily-rimbun', 'bronze-batik', 'lily-rimbun_bronze-batik_detail_01', 600, 900, array[480]::int[], 'data:image/webp;base64,UklGRhABAABXRUJQVlA4IAQBAAAwBgCdASoUAB4APrVOpEunJCOhqAqo4BaJQBbe8dNS4zwGHSIHxvxAZSCQHzN+TnsLZ4XSrRbpC7T0AP7D2ieUIiBfr93kMsa27dYn3PbDi7yKFjm2F0fHQCtXNrD/zZtObmpRfjn3my0h/6QqzkloB3vWOYoOoi7PQz3vDPIRU1Nh7KgewKRfkTPQJYjaHokX06Q3LWigkkm2VlXwRfGxMAlqf/Ux8SmHiK+RvjMr5KuwYztd/HwiWyGU9L4Eg7OevOEF4j4auN20Ay5CA3HdQ6CK7WXEd3xBO3y+0ngNDpS2478M5Yj2kkRA/kne1/xxxSf8D08sH06cf2AEHhOw1UiAAA==', 5),
  ('lily-rimbun', 'bronze-batik', 'lily-rimbun_bronze-batik_detail_02', 600, 900, array[480]::int[], 'data:image/webp;base64,UklGRgoBAABXRUJQVlA4IP4AAADwBQCdASoUAB4APrVSok0nJKMiKAgA4BaJQBYj6dgrE7IjJEpaPc4xgruVO+Cc199opMBT6Xn/AAD+aHupY9PZdzetmUC3tlE3IL0PLkXvxC71Ws0VeliD+jXYYL8KOw+VOr0uzFV+Cl7jKEL+/LhfqI06H0Z3tDtylbdWwLPofUBfpCJWFGu06865EmluZkVFaF9LPu+nGc/CUpLk8z3DWQTKrHWL15oW1jfj3UFhzaLOfGQ6a5ODrJGYYliTxQhWnT9FepUpcAPqZG2Xh1TRaTkxUjdN7rUj+rK8FEJandeqd59484PBEW8mbWGqjZwUgNXxRZTjj0QC9wQAAA==', 6),
  ('lily-rimbun', 'bronze-batik', 'lily-rimbun_bronze-batik_detail_03', 600, 900, array[480]::int[], 'data:image/webp;base64,UklGRgIBAABXRUJQVlA4IPYAAAAwBgCdASoUAB4APrVKn0mnJCKhMAgA4BaJQBOnKBuZWyqcxrrCvnDjHj9lhcSY72bq5JNH+GLkqWYAAP7OBxq75cscwpGfpWbKo9YOOdeHM2Kqj3w73nmj9eaWSQsWKBJaLCmmBCwKH9Wyfh+tynm5Nvc3mzphZR1FSzLhLSoaQHt/2+mjasPl6OYjhj2puxNboV8ZhKJdcYB8d4YxpzJnFW8sYGDCNf9MW+pwo/0SBYkTlqdMTHdgyzyLsa6+Xeevjcm6ZzOlZQxewSxwUK1o+TIDYPpqjcrRBtZS9x/wR11VGA+af2Vx+vVTGR++crIsPB0kwAA=', 7),
  ('lily-rimbun', 'bronze-batik', 'lily-rimbun_bronze-batik_lifestyle_01', 1706, 2560, array[480,900,1400]::int[], 'data:image/webp;base64,UklGRtQAAABXRUJQVlA4IMgAAAAwBQCdASoUAB4APrVSo00nJKMiKAgA4BaJQBdgCt02+GbtocRU6Wn4VbPT4C/zjw4UeAD+tdON8TvMilCcY7pYxKKQ2v+cF8eigWNHLH2rP4Dy6RrwnyD9NC5eY0xynLl+t1gDVKsox5HONvW9QqeUbe8BI23CItcZBhNemvHqcKjLXRMsKTtsu30htC+60/GTbbkSQTKhyRsaekzJ4R9WdGJMReFmmhWjrZcncDQhtv74XO3rMrXXPtPeQRq2f3o4JgSG4jwAAA==', 8),
  ('flower-forest', 'ivory-marble-sage', 'flower-forest_ivory-marble-sage_full_01', 600, 900, array[480]::int[], 'data:image/webp;base64,UklGRvYAAABXRUJQVlA4IOoAAADwBQCdASoUAB4APrVIoUunI6MhsBgIAOAWiWUAttn/6lilARRBDf+zYjkNMFkz9cv1pUMf3wu7wAD++Rhy/2GirvpsGpxfult4eUJhgl9EmPr+q9EmSkmp5qxVBpUwBJBwfuM9GeUzwe+0R4ghfgcJOOp4BrXkZiEQWGYuMFaXXsvg7zsVgF2spjGmWWMo4YRoLCpUbXH/ezwvPiGx70mMd62Rdy0/YK/wd51Whw1IrV9JMCjlfN0M21fb1flHh+QFNnGWyGdKwHuN7NpI8uL1mSpuNEvzHY1qWKEdJjkOzXxH9aSDO6kAAAA=', 1),
  ('flower-forest', 'ivory-marble-sage', 'flower-forest_ivory-marble-sage_detail_01', 600, 900, array[480]::int[], 'data:image/webp;base64,UklGRgABAABXRUJQVlA4IPQAAABwBQCdASoUAB4APrVInUmnJCKhMAgA4BaJQBbdF6BFBH1GMZYIuJszY+2X0dtwZJi89e3wAP7hS1xcA6Jn91K3lmOKW4TeOj1UDW3RuBPfFwS+VvG2fOVmyIauhJqjFny8CLran6HjMK/ny44jCeLENYPutUB5UGRbKlkb2+pz/F6mlFW1bmVz8Ddl3AM65zRobz8BkzNcsdQCiUF1G1pFwYTat/OYk1yfmY6biR13BR79lgUn8LBDWfPr6rYhAYgGYSs/RSeG5pudErFiaCnXBI2Jlo7OkKCQjKKCZVFl/tg1jwqBs+5REmiTBu24g5L4IcQA', 2),
  ('flower-forest', 'ivory-marble-sage', 'flower-forest_ivory-marble-sage_back_01', 600, 900, array[480]::int[], 'data:image/webp;base64,UklGRvwAAABXRUJQVlA4IPAAAABQBgCdASoUAB4APrVInUmnJCKhMAgA4BaJZQC/TKAdP+eDGM0OCx+5VPM75GD4okURGKi+DOiF1gJrAAD+3jYqYeGLj6tb0Y5U6rnJ3b3RHY4RLDbTmBUcW/GmLZSEjjG3MbN7xUdrvfvTN4RAOKsen+CVgBahNSiValKNTK3EC1VuYZYj0aI5YIKQ6SvZ8CGjsKDNSQJZTvFkybw7yqBgkIbSEfLeBujERGpELai8TQnZsM5RLrZqJRFhqITRdc+f8jMDYdR+C8oLK/xGjD90gcW2wjlCSega95XBa20B8pcPENzGC/5f61RgtckAAAA=', 3),
  ('flower-forest', 'ivory-marble-sage', 'flower-forest_ivory-marble-sage_detail_02', 600, 900, array[480]::int[], 'data:image/webp;base64,UklGRhIBAABXRUJQVlA4IAYBAAAQBgCdASoUAB4APrVOnksnJCKhsBgIAOAWiUAXZBsUGWDNm6fssomzLerlSfYmiBXWW2yqUvZLjAAA/rfo7wwokVC4ltGxKqZOzjKpUH4+1A5NwgtbVuEl9MoS4cn8XGVU0wMNmYkXNsKUmRpXle8NRLtpWn8Zt7tuz4U7FrotGJV0qqwYmb5Q76r7yIvjHi3WFsNK2FnkBlLrOmWs306oa9SrTbBlYVqjfKxQeyXyrjN3EE1CaIP+Z4nZqTLWAI6rtj3hMipckxaOjzYKi+gsLkSZETxGHcHjuDW6N/31qmaQ3tw2aJaqMn2TREKCWwdrFSOBp0EAXdMZbZOsbn7BjD+bIAAA', 4),
  ('flower-forest', 'ivory-marble-sage', 'flower-forest_ivory-marble-sage_detail_03', 600, 900, array[480]::int[], 'data:image/webp;base64,UklGRiwBAABXRUJQVlA4ICABAACwBgCdASoUAB4APrVIoEunI6MhsBgIAOAWiUAWI3hCf7P/kYA66TOBuc1XBxEfXnP//6wmhtl3V2HlyJ5k4AD++FZ5eDva+GZVNTJPNhH0bvNpfZktV5BP/gr/Efaytr56pz07i0enSIzARGp/JzFOSj3OCc6b991wgCnRKuMJznM7arZfXWOfFLea6+QYulwh/nDmuJy8qFjN57zzsha7MGH3cNC9ETkTV3EiW0lloo/dID6xB99h47aI5pW3YJoEuEJawr4/QT5ldwnP5KliE/CChKm3v7xNMxWs4QB6YjotOrGOXJJHhqyLfRXTBBs43mlv/7ogTAKTCvrg50Zl/6MvWSv/IjmOOETzqB4i6rPEVI3ORStclKSiiTigAAA=', 5),
  ('flower-forest', 'ivory-marble-sage', 'flower-forest_ivory-marble-sage_full_02', 600, 900, array[480]::int[], 'data:image/webp;base64,UklGRgQBAABXRUJQVlA4IPgAAACQBgCdASoUAB4APrVKnkmnJCKhMAgA4BaJZQC7FkAbn+N4Fw2tyAlrtvYkYYsFxGWbcraDsVaKtZ5LBboAAP7xqs7zxW7Ea7j+elZvNogtYQdQyB2gDQm8+NkIpzA6x75WfHFZvq4lO8KbntDoXWza4vlVV9XxcpVjs2WRHwoWGVZ3GQpZXGEiY97PRMvMeXg6rfpWKHgHg4/PDRZRXKTvjf97NZVPiVEbshpxWPpR2bdUTDbCtna24ZTMEjds+PDz10t17+ou6dH2s4nA+U3WGGz2JjwpCLP5nDYt8ekic51o6YLN6ABy2Rkk3pAm+70lp+zokAAAAA==', 6)
on conflict (name) do nothing;

-- Opening stock goes through the ledger so the movement history starts at the import.
with ins as (
  insert into variants (sku, product_id, colourway_id, size, stock) values
    ('LILY-RIMBUN:BRONZE-BATIK:SM', 'lily-rimbun', 'bronze-batik', 'SM', 9),
    ('LILY-RIMBUN:BRONZE-BATIK:LXL', 'lily-rimbun', 'bronze-batik', 'LXL', 18),
    ('LILY-RIMBUN:BRONZE-BATIK:2XL', 'lily-rimbun', 'bronze-batik', '2XL', 7),
    ('LILY-RIMBUN:BRONZE-BATIK:3XL', 'lily-rimbun', 'bronze-batik', '3XL', 6),
    ('LILY-RIMBUN:BRONZE-BATIK:4XL', 'lily-rimbun', 'bronze-batik', '4XL', 2),
    ('FLOWER-FOREST:IVORY-MARBLE-SAGE:SM', 'flower-forest', 'ivory-marble-sage', 'SM', 5),
    ('FLOWER-FOREST:IVORY-MARBLE-SAGE:LXL', 'flower-forest', 'ivory-marble-sage', 'LXL', 9),
    ('FLOWER-FOREST:IVORY-MARBLE-SAGE:2XL', 'flower-forest', 'ivory-marble-sage', '2XL', 6),
    ('FLOWER-FOREST:IVORY-MARBLE-SAGE:3XL', 'flower-forest', 'ivory-marble-sage', '3XL', 2),
    ('FLOWER-FOREST:IVORY-MARBLE-SAGE:4XL', 'flower-forest', 'ivory-marble-sage', '4XL', 1)
  on conflict (sku) do nothing
  returning sku, stock
)
insert into stock_movements (sku, type, qty_delta, reason, actor)
  select sku, 'import', stock, 'opening stock from hoor.my, 8 Sep 2026', 'migration' from ins where stock > 0;
