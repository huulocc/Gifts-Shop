-- CartItems no longer reserve inventory. Restore stock held by carts created
-- before Product.quantity was moved to the Place Order transaction.
UPDATE "products" AS product
SET
  "quantity" = product."quantity" + reserved."quantity",
  "updatedAt" = CURRENT_TIMESTAMP
FROM (
  SELECT "productId", SUM("quantity")::INTEGER AS "quantity"
  FROM "cart_items"
  GROUP BY "productId"
) AS reserved
WHERE product."id" = reserved."productId";
