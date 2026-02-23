UPDATE item
SET sku = sku || '-' || UPPER(LEFT(size, 1))
WHERE sku NOT LIKE '%-' || UPPER(LEFT(size, 1));