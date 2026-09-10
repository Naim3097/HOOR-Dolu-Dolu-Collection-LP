-- Eleven new colourways: client's names received over Telegram, 10 Sep 2026.
-- Seven new pieces plus a second DILLA colourway; RM199 across the board, sizes SM-4XL.
-- Camel lace and maroon floral from the same shoot are excluded by the client (15 batik prints total).
-- NOTE: opening stock is a placeholder of 10 per size - replace with store counts when the client confirms.

insert into products (id, name, print, story, note, price_sen, published, position) values
  ('puspa', 'PUSPA', 'Monochrome damask batik', 'White damask diamonds marching down deep black, with baroque scrolls on the side panels and a fine lace border at every edge. The graphic piece — formal without a single colour.', null, 19900, true, 6),
  ('juwita', 'JUWITA', 'Heritage paisley batik', 'Bold heritage motifs — medallions, paisley and trailing blooms — carried across four very different colour stories. The statement pieces of the collection.', null, 19900, true, 7),
  ('jasmin', 'JASMIN', 'Gilded ornament batik', 'A gilded ornamental column running the full length of the front over deep teal, finished with patterned cuffs. The dressed-up piece, made for events after dark.', null, 19900, true, 8),
  ('navy-royal', 'NAVY ROYAL', 'Lace-work batik', 'Pale blue lace-work climbing over deep navy, with fine border columns down each side and the same lace at the cuff. The heirloom print — the one your mother would recognise.', null, 19900, true, 9),
  ('olive', 'OLIVE', 'Mandala medallion batik', 'Lace medallions and mandala rounds over deep olive, gathering into one grand medallion at the hem. The earthy piece, made for daylight.', null, 19900, true, 10),
  ('blackest-black', 'BLACKEST BLACK', 'Night-garden batik', 'Blue night flowers spraying from a white star centre over true black, echoed again at the hem. The deepest black in the collection.', null, 19900, true, 11),
  ('pink-flower', 'PINK FLOWER', 'Blossom wash batik', 'Cream and plum blossom branches over a watercolour lilac wash, met by a plum band at the neckline. The sweetest piece in the collection.', null, 19900, true, 12)
on conflict (id) do nothing;

insert into colourways (product_id, id, name, swatch, video, position) values
  ('dilla', 'navy-blue', 'Navy Blue', '#33406B', null, 2),
  ('puspa', 'black-white', 'Black & White', '#1E1E1E', null, 1),
  ('juwita', 'black-green', 'Black Green', '#26331F', null, 1),
  ('juwita', 'ash-blue', 'Ash Blue', '#5B79B4', null, 2),
  ('juwita', 'ribena', 'Ribena', '#5C2D5E', null, 3),
  ('juwita', 'royal-blue', 'Royal Blue', '#2743A6', null, 4),
  ('jasmin', 'teal-blue', 'Teal Blue', '#2E6B72', null, 1),
  ('navy-royal', 'navy-royal', 'Navy Royal', '#24356B', null, 1),
  ('olive', 'olive', 'Olive', '#55603A', null, 1),
  ('blackest-black', 'blackest-black', 'Blackest Black', '#121212', null, 1),
  ('pink-flower', 'pink-flower', 'Pink Flower', '#C08BC0', null, 1)
on conflict (product_id, id) do nothing;

insert into product_images (product_id, colourway_id, name, width, height, widths, lqip, position) values
  ('dilla', 'navy-blue', 'dilla_navy-blue_full_01', 1086, 1448, array[480,900]::int[], 'data:image/webp;base64,UklGRsIAAABXRUJQVlA4ILYAAABQBQCdASoUABsAPrVOoEqnJCMhsBgIAOAWiWUAsOwN0QMnU1zDQkgc2lHhU9fgQgIGkyAA9REboQBk6TzbCUotyd5mHaRruLatpjAQKtMALR+qM8EFNM/EbzJuCnUjVkUUJ+jOILFU31dsG0+ss81tQxkOeLT8wChrajkqHqY4qYkLOxb8OF9ZFZgDZnLcREjs0bpVY8UWZVvj7Yhi+JznU7NF8KhjtOLnWP7ZfaWZ0V8+Y2AAAA==', 1),
  ('dilla', 'navy-blue', 'dilla_navy-blue_detail_01', 1086, 1448, array[480,900]::int[], 'data:image/webp;base64,UklGRvYAAABXRUJQVlA4IOoAAAAQBgCdASoUABsAPrVKnUmnJCKhMAgA4BaJYgCdMsu7T3+rmNdYSPV5oplN8OkFP2mnfeaSr+K6QMAA/nJButSQY+CipBi6DAjyh+ZJS8J5i1u3vp9jCaFCSonJ7wjsl/L8YPT0B8vsdNLB0od1y2mp0yzqsIB7LkYbD14x1HEKgTQl474fqLgUW6hYPjuZ03qC99bBUsHe3ISE1h8ykmiznYGZgfrd7b20GIFr5ST4R21VxZ9om2xwUWObed+eooJmIr3zo+DQlfy/M5uqSlXnVRYLBHTrJXKrbbBIXzUCPLZMJcDOuCUe4AA=', 2),
  ('puspa', 'black-white', 'puspa_black-white_full_01', 965, 1448, array[480,900]::int[], 'data:image/webp;base64,UklGRroAAABXRUJQVlA4IK4AAACQBQCdASoUAB4APrVQnUqnJKKhsBgIAOAWiWcAuzMYAUNa7sKrXMxqB/+iFGfuii5PewAg0ACpcLKJh+S4b3qnf/xh7lR3xAQPE8ZmHT7WOnCEVlXQzDxfxWZXlKbRvzIUWHs+vvvQ/y53CAAWB78f8CvUQWMCYrvSYaRUxIGv4ia3CF4RkbFYPfoLAhbkBWVWg+ZIngrMwR8wtDkorRk3a593S08UFF9lFOAAAAA=', 1),
  ('puspa', 'black-white', 'puspa_black-white_detail_01', 1086, 1448, array[480,900]::int[], 'data:image/webp;base64,UklGRgQBAABXRUJQVlA4IPgAAACwBQCdASoUABsAPrVKnUmnJCKhMAgA4BaJQBYj4wS2goGxWg/mUMKNULjXHTYTmdpF8h7dGKAA/jLF4jdFnXGZglD4EfJqGEpSrZTRM4TTESQ0T2hDCyo6dj+djqAlAgsg55VImTTZjtrnMTT7Sh/RsC9lL4G4PLdR8OYegsux3nAuvzDcTa5ZF72441YIY68wBYiWX9yuvoT8az3iP7UKjGcBgmsYuAeRNNP1JmDmmLIWxx2d1ThRS2kNCHrbyOrzUlSNOMMVVDRVije2C1tThF0QwB1bnSFJSIescapUGCNhXE2H4g6jKXjd+Ae6MHL8cGnruKOAAA==', 2),
  ('juwita', 'black-green', 'juwita_black-green_full_01', 965, 1448, array[480,900]::int[], 'data:image/webp;base64,UklGRrQAAABXRUJQVlA4IKgAAACQBQCdASoUAB4APrVEoEmnI6MhMBgMAOAWiWMApeW/gWK7afartrxDL3+Vq9pIVLh+zARWmAD4jVeTCI8/3SskkmLVqnBP/KdYqFtZE6N4ENWaWlw5u3cJ2BCFh2UPKmjWgoERD60Ws9elogBJ4tPcg83gogRemNTiFGE2deaeooxyAJ+o+JRDmrf0JeWSTHl+asA/J3PYHsmGrHg1UJQrodcMB6VagAA=', 1),
  ('juwita', 'black-green', 'juwita_black-green_detail_01', 1086, 1448, array[480,900]::int[], 'data:image/webp;base64,UklGRvIAAABXRUJQVlA4IOYAAADQBQCdASoUABsAPrVQo0unJKMhqAqo4BaJZQDCgywTmYPGNXz3Ewggbxy4L5F1R1dYCNZxlELIANmtUfTJaEPFqa0DuM/h5RHww0rlx/+pkL3ICFtEzktCOdatWbtnS6Vr/HqCRaP2oLO+dEfFZk94l0xl6ASEpw3c2ACzPYcZLsD2DBCwG+CRN/pP8StndP+PS7m8cJXODzXSEbPBBWhdVEBaWVQFcfNuMxew29+8+tJqKvfUtIkhSI9lI3WAvyJbbjWE5Jo5xJ4omLcdpf5YWzCsIy68+YY1B1LsKzAnWjW3PxuAAA==', 2),
  ('juwita', 'ash-blue', 'juwita_ash-blue_full_01', 965, 1448, array[480,900]::int[], 'data:image/webp;base64,UklGRqoAAABXRUJQVlA4IJ4AAABQBQCdASoUAB4APrVCoUmnI6MhMBgMAOAWiUAXZmq5E0Ob4qTZKf+V5f0inwTsTLBInwAA+M7S9dJXBNpcvVLhwB+pEcm8kjoVXEInPyKsQvxBf1q+aGOewiM/nYBL+A4QW1OqT9vWzsLcCmbNLljOyKWnZgNjvcbGaAxqeRvuoSCKKw4qvGEOysMebEYXqU47YPKtIjGUxN6zIeAAAA==', 1),
  ('juwita', 'ash-blue', 'juwita_ash-blue_detail_01', 1086, 1448, array[480,900]::int[], 'data:image/webp;base64,UklGRuAAAABXRUJQVlA4INQAAABwBQCdASoUABsAPrVQoEwnJKMiKAqo4BaJQBYj2+Al8RUhCxJKZuueB2zRUTwZI6nmsuJQAM24jyBQGSEb+uFYxYTlwcB9TKxsogk6R6cn4PkDZd2DKDYbpnuVfKInGmIrDVaRlCCsXdyCrwqtuJQJqVr2p3WlDWlL8gNPnNVGNllRdkgnywvSLps7EC21NvPxT9ttnB6PCjVZ4pwXVBtru5LnWy+yHx2ewEuWIDo69vSPYCw6vtz++exYiygC0ctRCRokmatRbM09K/9qsREOj7jgAA==', 2),
  ('juwita', 'ribena', 'juwita_ribena_full_01', 965, 1448, array[480,900]::int[], 'data:image/webp;base64,UklGRt4AAABXRUJQVlA4INIAAADQBQCdASoUAB4APrVKoEunJCMhsBgIAOAWiUAXZmQ11JGlFdwoKIg6N09lZasQ4JQxeqdZ0RgkAO6BHI+h2xHrPCBG/eVSRmFr4DjtphtfBvuezd2lStzMwsOG6hwx2TWfi6R6AnOGxrLDUQCKwufkFQe4axKQ84MCaY/LJTTxTaxy+SRlntaryKSCIhkUbZJogDv4mfepVfYtTTK4tllyqaDM5A6JP3Ltw976iNfMnUZomKzIxPHRw4+JTCXIi4zZOeMGmI2lsGonf9VZDojIAAA=', 1),
  ('juwita', 'ribena', 'juwita_ribena_detail_01', 1086, 1448, array[480,900]::int[], 'data:image/webp;base64,UklGRgoBAABXRUJQVlA4IP4AAADwBQCdASoUABsAPrVMoEsnJCMhsBgIAOAWiWgAnS+wvmcAET+CYs5RTvYxL/Qvn0ViUuNtBL8uIAD+cPFsQ/Ecs1uphXJtg4Z9uj8e0lFd3JtEsnmJEutrY+7YZxPpVbSROBFT9RdKIe2Lpb57S/ceqvBZwFLuLjD0uJep0TP/vrWF91TsQY3XxcEvEetc6H4ixqaCeIjjH74DROuwgXMawcKMcSqHaORTVqAfvnUxwaR6L0MkSZQHICz2Xc+qnXEnQcbb7yqcIQ+oOa1RNdDMc6P/vOzLn8f3gVRUs5NVXSjtYUsIMHpf9z0X05IR09vvfeWxnEb2En7nHAAAAA==', 2),
  ('juwita', 'royal-blue', 'juwita_royal-blue_full_01', 965, 1448, array[480,900]::int[], 'data:image/webp;base64,UklGRrAAAABXRUJQVlA4IKQAAACwBQCdASoUAB4APrVCoUmnI6MhMBgMAOAWiUAYH5EY/SyQYMKN6L30uLqPlAdG0KfjTIRwlAAA+MyfqJPTdoaFnjVXt1h1G0QrmD7ZuGqqtCOnXmeg6Bwy2TvJ0pM/sXzcG4z40JkYOpExFN7vKWEpYdwufPZrp+rVESkTYBLyMAl8E/KXHn0E3lPLxSvonRWYfql1JyqNwBXEfrTC0iCOYBFwAA==', 1),
  ('jasmin', 'teal-blue', 'jasmin_teal-blue_full_01', 965, 1448, array[480,900]::int[], 'data:image/webp;base64,UklGRtoAAABXRUJQVlA4IM4AAADwBQCdASoUAB4APrVInkmnJCKhMBgMAOAWiWIAtRtYQgARVOvT7EkmPUrceWBGihxgxQ5MPQ4AAAD+3pWdhFu+ggaQea2tN2wXBlkXYh5RtNkw3FgfpK7gvKfyDZevXroT9kelpET+c17VWho8Webmx0DW3PByT2OFDdOzJxO5sp5VqQ7KWqKL4nYDL0Z+EXy1d43n7BeLPvhs4m2TItABRU8/BUTh2u9uIC4KvbTWtEP/QMeUVLB8ntgV9GnzWDFcBlIQlHkDZiLOuQAAAA==', 1),
  ('jasmin', 'teal-blue', 'jasmin_teal-blue_detail_01', 1086, 1448, array[480,900]::int[], 'data:image/webp;base64,UklGRhABAABXRUJQVlA4IAQBAAAQBgCdASoUABsAPrVMn0unJCKhsBgIAOAWiWYAnTKDyqqVwaWQbi/oV0Bf/XOK75pGqWdm6h3dpwAA9vb4jitiFrgdK7w8/rvsEDGjSYco0mdKSAFZlnibyTsGClEOjhlYWxSsfh/9bRiv6Q4tXvTWh6FR9wE7eBnigybYjJOMiqYk0h6MVP2hgcQSL/oNxtl4L4EM9WwWy14++kdCRxLT1DAlqOoIR4rkxH9ihMM1kshNXG8x9aB7bT5STPW3l4i0OD8E2gvCHePQBlGFsa2nw0DQ7vlaEXVPZKJ81lxd1/dfogVWo3SyJtYONgltvI9pMFtmvan6+dJkVzoaGx5OyAAAAA==', 2),
  ('navy-royal', 'navy-royal', 'navy-royal_navy-royal_full_01', 1706, 2560, array[480,900,1400]::int[], 'data:image/webp;base64,UklGRvoAAABXRUJQVlA4IO4AAADQBQCdASoUAB4APrVGn0mnI6KhMBgMAOAWiWQAqPgIAfFdT1TPv7KBNSipvDszEwha5KB0H8QAAPyre58/pGFuYsTfVBu3hwtEU5PQjiBW6H6W0hDN2yc6HOqEft5s+eC+enz5uakuVk9NsYpU52WbOb3+ZdA85MaeAYugwlkCyfj22DWYxKxqvc85jV91hxBUSkMz7s8qbPYX5yyK8r0tJHfGLB5MKeM6+UtENi6M9bugq6EmMMBlwzujheS0yiS0af0q3lg0Vqsb8qkw/O/shHu7xCnBv3UqJfJSrGeE01aQi8Tk/8BP6OR4AAAA', 1),
  ('navy-royal', 'navy-royal', 'navy-royal_navy-royal_detail_01', 1706, 2560, array[480,900,1400]::int[], 'data:image/webp;base64,UklGRmwBAABXRUJQVlA4IGABAAAQBwCdASoUAB4APrVGnEmnI6KhMAgA4BaJbACdMoR9D48ImkeB7qDbWfBbxaX3e9J4McyMULxRS5w5JDRBlTRnAADZ6oPIcDxXnDNMKGtiCeJ6wtAqGNcs9JW8vewYF0lPmoxvevYpRiul5K/ZNjfaLzXdbrs4ld5XBbNanicpC0kre08J3KVdYCDTVIpMMQASoTMbkCXD7bJQPUxpYy1tVWzhbHA5btQN3LBD53xpOYtGlMq2vDT4OE0fNjjixOHtlWDWRNcvawL7qJVbgzlcUMvLmBhW0tlDyRgBkc4FkWt+gfinG8U53LWtGf6Zg73OsSqyDr5/emPzNyB7QN5z8abrb+B+R3uBpIm3/knZJ56Xbe0Ma56Kr0tN8WvRcy/JXgMVp05xiKoxQrfk9/7BJE+i26ROazJPwZ4aRfEEvGSv2f+PvzdNekr/JP8HF9VDsoT1Yz063WNy/deAi4AA', 2),
  ('navy-royal', 'navy-royal', 'navy-royal_navy-royal_detail_02', 1706, 2560, array[480,900,1400]::int[], 'data:image/webp;base64,UklGRiQBAABXRUJQVlA4IBgBAADwBgCdASoUAB4APrVOn0snJCKhsBgIAOAWiWwAnTLs+n+quNebrZoCV2tyA9GK4sILhFksF2BhMZCeYF+4ML6AAP5YiPpb3DGRVGR/65LlW7ueaB+tADNAQgX3vvUfDYd/aQb0tgpPvstR/B6rjVn+TymalQKWRKZV66rrwlEt/Ck7ZA2camdagRzjIKUQq4wCJIwA6El470zTWcicmCLtC6WBRfNYjyNAdgqe7lx3RVEJffmjBLAx16OOWpaSNjTAcMBzQPx0tZ9Yn5EXjUNV/RlDoAfvdJLfNX6N3MQR0n/iOXgezHQwVjUzgWIciznNccfAWsrfPMKpWOw/Yh7UiouS1NB4bplt4rJyt9PmsjlCtXtbgAAA', 3),
  ('olive', 'olive', 'olive_olive_full_01', 965, 1448, array[480,900]::int[], 'data:image/webp;base64,UklGRsgAAABXRUJQVlA4ILwAAABwBQCdASoUAB4APrVInUonJCKhsBgMAOAWiUATpmvopD+VPj+bgdlA4lxNAEt9PWeuUmOgAP7ez3PMtec6bU46pOq8SuPwcrpwNvZ/abzfNbDpeyy+5AmUeXDGDd4KVdVKeJqZhSPh9MqdUWh19vtn5h5KVQaxh/QbMZvwzlEivRxkJsT6LlJWreVLRb58/DoCU4xjCWz+c7JFrqzHhIa1xHq10blMzAWXFPNNw8nWOz/PGGa86pYUEqwAAA==', 1),
  ('olive', 'olive', 'olive_olive_detail_01', 1086, 1448, array[480,900]::int[], 'data:image/webp;base64,UklGRuoAAABXRUJQVlA4IN4AAAAQBgCdASoUABsAPrVOn0qnJCKhsBgIAOAWiUATpnJngdoCkICMWuRa+pEO3vxhWQYluJCFhuBccAAA/tJcf6zaxexZ0WklRpsZOPG/TsWv7P/5tjXsqep2DCbw3iObxJZhDXll47CbAsKHcAlerN3O90JQ6OnZ0k7RSPjmrKMFEb73kfQp4SlRFPJZi0gZateol6Ht1IB6J5t4lhfTtYfViu895sp2E2wli7WIjzZwRx4wlb8Dn20jFAx8Z9p1oEUYH3aRsB3wnItLrIK04LtrjLyjVQ6qPnok2NLgAAA=', 2),
  ('blackest-black', 'blackest-black', 'blackest-black_blackest-black_full_01', 965, 1448, array[480,900]::int[], 'data:image/webp;base64,UklGRrgAAABXRUJQVlA4IKwAAABwBQCdASoUAB4APrVMn0onJCKhsAgA4BaJZwCC5njwXAqpNfXABamd/nc2RiQ6Fs1886QAAM0K0zUlziB5sWxBYVEBtQIH1M1r9KC9kV3oyrFPZkTIwVXNW0/2Bvxf+uJzNVEqCkfWbEWFYA/Iael8tP8HI6/CuRYx85sWsUf+goHBxwqdztKpWDXbP1vyHooMJSAktZt2mDAUYSNDCQ01zEKmKxkO20KDgAAA', 1),
  ('blackest-black', 'blackest-black', 'blackest-black_blackest-black_detail_01', 1086, 1448, array[480,900]::int[], 'data:image/webp;base64,UklGRgYBAABXRUJQVlA4IPoAAAAwBgCdASoUABsAPrVQoEynJKMiKAqo4BaJYwCdMoMzG0jEruh3X6T5mXdmlWUUCzEJXmqHreSMJw8AAPb8z3XBSiVMUKwrPiMgCV6GEaqvAL4wY9oJq7o3uKiJyh+/gBm1IEF50TdZfrRia1RyKWMc6MHLyZqwDCOMJBUCDu8rCfVEsd8GdzDJu7/vGhqyYMdVrvDtnVP0Of6Y1+EWUzvvr3T8r+ZfOCWs/CzQDP28mrBO0SirrPUaH4pqM7Mh4aKtsMDX+b87tm+q7+oQQm54ZRhFic9uo3bj/akXNTrpOljLqblRKt5nY2kXh7SwOT01Z+T8dni+QAAA', 2),
  ('blackest-black', 'blackest-black', 'blackest-black_blackest-black_detail_02', 1086, 1448, array[480,900]::int[], 'data:image/webp;base64,UklGRuAAAABXRUJQVlA4INQAAACwBQCdASoUABsAPrVMn0unJCKhsBgIAOAWiUAWHbGLC6xCXbkqACHrv2d9gp5F0ZAbD6GmQ8gA/qmtCHBaA0EYqDbEiL9VFr5LSDTHJ8I4OlTrihJXc3ggpoKMJMk/bDjcCEomRjmndLHj6nYYg9cvep3pvxrDhWwYPm8mGHnmPFZAW08TTRMVbZ8jmIVttes9+2Rqd/MdhtCleKj5drKfUSyhAbhB/rQvS/HYDacDAjTg9em5jSCqQMWFypODZ5YDbzTdQBsAnC6nGndcDZyZgMLgAA==', 3),
  ('pink-flower', 'pink-flower', 'pink-flower_pink-flower_full_01', 1254, 1254, array[480,900]::int[], 'data:image/webp;base64,UklGRrAAAABXRUJQVlA4IKQAAADQBACdASoUABQAPrVSn0ynJKKiKAqo4BaJQBOmW+A3gNY7bvMjad441sfDWlpi4AD+9byrFNuuF8gGb+OSsD15wDdkGbgSYDIP/GwsKHqT+sfGks31VmaZigEJ96bxXT1Pg2KRNiU+Opm55slnC+AGVKLsMqvVvkw0ekuEtPChG02KgmPBXieWGnAYUfG5Hx9rI3+lLjZqUNEjLKV4/ER+vyXAAA==', 1),
  ('pink-flower', 'pink-flower', 'pink-flower_pink-flower_detail_01', 1254, 1254, array[480,900]::int[], 'data:image/webp;base64,UklGRq4AAABXRUJQVlA4IKIAAADwBACdASoUABQAPrVSok0nJKMiKAgA4BaJQBYj42bzg+KZ4FcrfmGg8UHi+JfQFZAA/b5Do5DRC6m6sMNNeeqk/cS6CKyYZxFe/BMfOHpRAFSvE6hNW9inX7mNJtKuTZoQwyWDhdMS+G2imPiQk3zlVEJqT7/OaBEm3OK9mxYA+vMajEcaPQeE5o0GZSgpZdwEIUzI6ihXs8O5U4iAAKuIgAA=', 2),
  ('pink-flower', 'pink-flower', 'pink-flower_pink-flower_detail_02', 1086, 1448, array[480,900]::int[], 'data:image/webp;base64,UklGRtYAAABXRUJQVlA4IMoAAADQBQCdASoUABsAPrVInkmnJCKhMBgMAOAWiWIAsR9V70AMh+j+nVsNknOAL8bxm6EzixBd3GsAAPcmyaGOU65G4RVdNuYpEAmEABNY0b7Ro4xvsBvWsoMhmC7CVxwQ7wbw1OHyRgw44ACsMBopxg2C9laYg5pP8C3bnrdEKSVy4laBSffoVdDAAfN8NcTeRUxmsP/T2LX+AiCTlrj+Ez2ERsJJpOTFtAgPpFFtZOeQfxsCBoQStQSW9LRm9JkkP5gY2/oShxDIwAAA', 3)
on conflict (name) do nothing;

-- Opening stock through the ledger, as always.
with ins as (
  insert into variants (sku, product_id, colourway_id, size, stock) values
    ('DILLA:NAVY-BLUE:SM', 'dilla', 'navy-blue', 'SM', 10),
    ('DILLA:NAVY-BLUE:LXL', 'dilla', 'navy-blue', 'LXL', 10),
    ('DILLA:NAVY-BLUE:2XL', 'dilla', 'navy-blue', '2XL', 10),
    ('DILLA:NAVY-BLUE:3XL', 'dilla', 'navy-blue', '3XL', 10),
    ('DILLA:NAVY-BLUE:4XL', 'dilla', 'navy-blue', '4XL', 10),
    ('PUSPA:BLACK-WHITE:SM', 'puspa', 'black-white', 'SM', 10),
    ('PUSPA:BLACK-WHITE:LXL', 'puspa', 'black-white', 'LXL', 10),
    ('PUSPA:BLACK-WHITE:2XL', 'puspa', 'black-white', '2XL', 10),
    ('PUSPA:BLACK-WHITE:3XL', 'puspa', 'black-white', '3XL', 10),
    ('PUSPA:BLACK-WHITE:4XL', 'puspa', 'black-white', '4XL', 10),
    ('JUWITA:BLACK-GREEN:SM', 'juwita', 'black-green', 'SM', 10),
    ('JUWITA:BLACK-GREEN:LXL', 'juwita', 'black-green', 'LXL', 10),
    ('JUWITA:BLACK-GREEN:2XL', 'juwita', 'black-green', '2XL', 10),
    ('JUWITA:BLACK-GREEN:3XL', 'juwita', 'black-green', '3XL', 10),
    ('JUWITA:BLACK-GREEN:4XL', 'juwita', 'black-green', '4XL', 10),
    ('JUWITA:ASH-BLUE:SM', 'juwita', 'ash-blue', 'SM', 10),
    ('JUWITA:ASH-BLUE:LXL', 'juwita', 'ash-blue', 'LXL', 10),
    ('JUWITA:ASH-BLUE:2XL', 'juwita', 'ash-blue', '2XL', 10),
    ('JUWITA:ASH-BLUE:3XL', 'juwita', 'ash-blue', '3XL', 10),
    ('JUWITA:ASH-BLUE:4XL', 'juwita', 'ash-blue', '4XL', 10),
    ('JUWITA:RIBENA:SM', 'juwita', 'ribena', 'SM', 10),
    ('JUWITA:RIBENA:LXL', 'juwita', 'ribena', 'LXL', 10),
    ('JUWITA:RIBENA:2XL', 'juwita', 'ribena', '2XL', 10),
    ('JUWITA:RIBENA:3XL', 'juwita', 'ribena', '3XL', 10),
    ('JUWITA:RIBENA:4XL', 'juwita', 'ribena', '4XL', 10),
    ('JUWITA:ROYAL-BLUE:SM', 'juwita', 'royal-blue', 'SM', 10),
    ('JUWITA:ROYAL-BLUE:LXL', 'juwita', 'royal-blue', 'LXL', 10),
    ('JUWITA:ROYAL-BLUE:2XL', 'juwita', 'royal-blue', '2XL', 10),
    ('JUWITA:ROYAL-BLUE:3XL', 'juwita', 'royal-blue', '3XL', 10),
    ('JUWITA:ROYAL-BLUE:4XL', 'juwita', 'royal-blue', '4XL', 10),
    ('JASMIN:TEAL-BLUE:SM', 'jasmin', 'teal-blue', 'SM', 10),
    ('JASMIN:TEAL-BLUE:LXL', 'jasmin', 'teal-blue', 'LXL', 10),
    ('JASMIN:TEAL-BLUE:2XL', 'jasmin', 'teal-blue', '2XL', 10),
    ('JASMIN:TEAL-BLUE:3XL', 'jasmin', 'teal-blue', '3XL', 10),
    ('JASMIN:TEAL-BLUE:4XL', 'jasmin', 'teal-blue', '4XL', 10),
    ('NAVY-ROYAL:NAVY-ROYAL:SM', 'navy-royal', 'navy-royal', 'SM', 10),
    ('NAVY-ROYAL:NAVY-ROYAL:LXL', 'navy-royal', 'navy-royal', 'LXL', 10),
    ('NAVY-ROYAL:NAVY-ROYAL:2XL', 'navy-royal', 'navy-royal', '2XL', 10),
    ('NAVY-ROYAL:NAVY-ROYAL:3XL', 'navy-royal', 'navy-royal', '3XL', 10),
    ('NAVY-ROYAL:NAVY-ROYAL:4XL', 'navy-royal', 'navy-royal', '4XL', 10),
    ('OLIVE:OLIVE:SM', 'olive', 'olive', 'SM', 10),
    ('OLIVE:OLIVE:LXL', 'olive', 'olive', 'LXL', 10),
    ('OLIVE:OLIVE:2XL', 'olive', 'olive', '2XL', 10),
    ('OLIVE:OLIVE:3XL', 'olive', 'olive', '3XL', 10),
    ('OLIVE:OLIVE:4XL', 'olive', 'olive', '4XL', 10),
    ('BLACKEST-BLACK:BLACKEST-BLACK:SM', 'blackest-black', 'blackest-black', 'SM', 10),
    ('BLACKEST-BLACK:BLACKEST-BLACK:LXL', 'blackest-black', 'blackest-black', 'LXL', 10),
    ('BLACKEST-BLACK:BLACKEST-BLACK:2XL', 'blackest-black', 'blackest-black', '2XL', 10),
    ('BLACKEST-BLACK:BLACKEST-BLACK:3XL', 'blackest-black', 'blackest-black', '3XL', 10),
    ('BLACKEST-BLACK:BLACKEST-BLACK:4XL', 'blackest-black', 'blackest-black', '4XL', 10),
    ('PINK-FLOWER:PINK-FLOWER:SM', 'pink-flower', 'pink-flower', 'SM', 10),
    ('PINK-FLOWER:PINK-FLOWER:LXL', 'pink-flower', 'pink-flower', 'LXL', 10),
    ('PINK-FLOWER:PINK-FLOWER:2XL', 'pink-flower', 'pink-flower', '2XL', 10),
    ('PINK-FLOWER:PINK-FLOWER:3XL', 'pink-flower', 'pink-flower', '3XL', 10),
    ('PINK-FLOWER:PINK-FLOWER:4XL', 'pink-flower', 'pink-flower', '4XL', 10)
  on conflict (sku) do nothing
  returning sku, stock
)
insert into stock_movements (sku, type, qty_delta, reason, actor)
  select sku, 'import', stock, 'opening stock placeholder, 10 Sep 2026 - client to confirm counts', 'migration' from ins where stock > 0;
