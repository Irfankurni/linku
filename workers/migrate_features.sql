-- Drop products table
DROP TABLE IF EXISTS products;

-- Reset theme for free users to default
UPDATE users
SET theme = 'default'
WHERE plan = 'free' AND theme != 'default';
