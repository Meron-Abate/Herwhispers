-- Run prisma/product_category.sql first.
-- Additive: donations go into one shared pool, and stock is then assigned to campaigns.

-- A donation no longer has to belong to a campaign.
ALTER TABLE partner_contributions ALTER COLUMN campaign_id DROP NOT NULL;

-- How much of a product's stock has been assigned to a campaign.
ALTER TABLE campaign_products
  ADD COLUMN assigned_quantity int NOT NULL DEFAULT 0;

-- Keep today's numbers: whatever was donated to a campaign counts as
-- already assigned to it.
UPDATE campaign_products cp
SET assigned_quantity = COALESCE((
  SELECT SUM(pc.quantity)
  FROM partner_contributions pc
  WHERE pc.campaign_id = cp.campaign_id
    AND pc.product_id = cp.product_id
    AND pc.delivery_status = 'DELIVERED'
), 0);
