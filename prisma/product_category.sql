-- Additive only: adds a category to every product.
CREATE TYPE product_category AS ENUM ('DISPOSABLE_PAD', 'REUSABLE_PAD', 'TAMPON', 'OTHER');

ALTER TABLE products
  ADD COLUMN category product_category NOT NULL DEFAULT 'OTHER';

-- Best-effort guess for products that already exist, from their name.
-- Check the Inventory page afterwards and fix any that were guessed wrong.
UPDATE products SET category = 'REUSABLE_PAD'   WHERE name ILIKE '%reusable%';
UPDATE products SET category = 'TAMPON'         WHERE name ILIKE '%tampon%';
UPDATE products SET category = 'DISPOSABLE_PAD'
  WHERE category = 'OTHER' AND (name ILIKE '%pad%' OR name ILIKE '%disposable%');
