-- =========================================================
-- 0. CLEANUP (RESET EVERYTHING)
-- =========================================================
-- TRUNCATE TABLE payment, order_items, order_staff, stock_log, recipe, orders, customers, rota, coupons, item, ingredients, staff, address RESTART IDENTITY CASCADE;

-- =========================================================
-- PHASE 1: STORE SETUP
-- =========================================================

-- 1. Create Ingredients
INSERT INTO ingredients (ing_name, weight, meas, ing_price) VALUES
('Pizza Dough Ball', 250, 'g', 1.00),  -- ID 1
('Marinara Sauce', 100, 'ml', 0.50),   -- ID 2
('Mozzarella', 150, 'g', 1.50),        -- ID 3
('Pepperoni', 50, 'g', 2.00);          -- ID 4

-- 2. Create Menu Items
INSERT INTO item (sku, item_name, category, size, item_price) VALUES
('PIZ-MARG-L', 'Margherita', 'Pizza', 'Large', 14.00),       -- ID 1
('PIZ-PEPP-L', 'Pepperoni Feast', 'Pizza', 'Large', 18.00);  -- ID 2

-- 3. Define Recipes
INSERT INTO recipe (item_id, ing_id, ing_amount, cost_per_ing) VALUES
-- Margherita (ID 1)
(1, 1, 1, 1.00), 
(1, 2, 1, 0.50), 
(1, 3, 1, 1.50), 
-- Pepperoni Feast (ID 2)
(2, 1, 1, 1.00), 
(2, 2, 1, 0.50), 
(2, 3, 1, 1.50), 
(2, 4, 2, 4.00); 

-- 4. Hire Staff (NO DELIVERY DRIVER)
INSERT INTO staff (first_name, last_name, position, hourly_rate) VALUES
('Gordon', 'Ramsay', 'Chef', 50.00),   -- ID 1
('Sarah', 'Jenkins', 'Waiter', 18.00); -- ID 2

-- 5. Define Addresses
INSERT INTO address (address1, address2, zipcode) VALUES
('123 Pizza HQ', 'Kitchen 1', '90001'),       -- ID 1 (Shop)
('10 Downing Street', 'Apt 5', 'SW1A 2AA');   -- ID 2 (Customer)

-- =========================================================
-- PHASE 2: OPENING FOR BUSINESS
-- =========================================================

-- 6. START SHIFT (Rota)
INSERT INTO rota (staff_id, start_time, end_time, work_date) VALUES
(1, '2024-02-01 10:00:00', '2024-02-01 22:00:00', '2024-02-01'), -- ID 1 (Gordon/Chef)
(2, '2024-02-01 11:00:00', '2024-02-01 20:00:00', '2024-02-01'); -- ID 2 (Sarah/Waiter)

-- 7. INITIAL STOCK UP
-- Gordon (Chef) signs for the delivery truck.
INSERT INTO stock_log (ing_id, rota_id, change_amount, created_at) VALUES
(1, 1, 100, NOW()), -- Added 100 Dough
(2, 1, 500, NOW()), -- Added 500 Sauce
(3, 1, 200, NOW()), -- Added 200 Cheese
(4, 1, 50,  NOW()); -- Added 50 Pepperoni

-- 8. CUSTOMER REGISTRATION
INSERT INTO customers (add_id, first_name, last_name, email, phone) VALUES
(2, 'Boris', 'Johnson', 'boris@example.com', '555-9999'); -- ID 1

-- =========================================================
-- PHASE 3: THE TRANSACTION
-- =========================================================

-- 9. Create the Order
INSERT INTO orders (cust_id, add_id, rota_id, created_at, status, service_type, total_discount) VALUES
(1, 2, 2, NOW(), 'Delivered', 'Delivery', 0.00); 
-- Note: Rota ID 2 (Sarah) took the phone call/order.

-- 10. Link Items (2 Pepperoni Pizzas)
INSERT INTO order_items (order_id, item_id, item_quantity, total_price) VALUES
(1, 2, 2, 36.00); 

-- 11. ASSIGN STAFF ROLES (The Change!)
-- Gordon cooks it, but Sarah (Waiter) grabs the keys and delivers it.
INSERT INTO order_staff (order_id, staff_id, role) VALUES
(1, 1, 'Chef');            -- Gordon cooked it

-- 12. Process Payment
INSERT INTO payment (order_id, amount, status, method) VALUES
(1, 36.00, 'Paid', 'Credit Card');

-- =========================================================
-- PHASE 4: INVENTORY DEPLETION
-- =========================================================
-- Deducting ingredients for 2 Pepperoni Pizzas
INSERT INTO stock_log (ing_id, rota_id, change_amount, created_at) VALUES
(1, 1, -2, NOW()), -- Used 2 Dough
(2, 1, -2, NOW()), -- Used 2 Sauce
(3, 1, -2, NOW()), -- Used 2 Cheese
(4, 1, -4, NOW()); -- Used 4 Pepperoni (Double portion x 2 pizzas)