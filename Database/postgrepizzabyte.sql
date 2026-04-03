-- ---------------------------------------------------------
-- 1. Staff, Rota & Roles
-- ---------------------------------------------------------

CREATE TABLE staff (
    staff_id      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name    VARCHAR(50),
    last_name     VARCHAR(50),
    position      VARCHAR(50),
    hourly_rate   NUMERIC(10,2)
);

CREATE TABLE rota (
    rota_id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    staff_id   INT NOT NULL,
    start_time TIMESTAMP,
    end_time   TIMESTAMP,
    work_date  DATE,
    
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id)
);

-- ---------------------------------------------------------
-- 2. Address & Customers
-- ---------------------------------------------------------

CREATE TABLE address (
    add_id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    address1  VARCHAR(100),
    address2  VARCHAR(100),
    zipcode   VARCHAR(20)
);

CREATE TABLE customers (
    cust_id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    add_id     INT,
    first_name VARCHAR(50),
    last_name  VARCHAR(50),
    email      VARCHAR(100),
    phone      VARCHAR(30),
    
    FOREIGN KEY (add_id) REFERENCES address(add_id)
);

-- ---------------------------------------------------------
-- 3. Menu & Inventory
-- ---------------------------------------------------------

CREATE TABLE item (
    item_id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sku        VARCHAR(50) UNIQUE,
    item_name  VARCHAR(100),
    category   VARCHAR(50),
    size       VARCHAR(20),
    item_price NUMERIC(10,2)
);

CREATE TABLE ingredients (
    ing_id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ing_name  VARCHAR(100),
    weight    INT,
    meas      VARCHAR(20),
    ing_price NUMERIC(10,2)
);

CREATE TABLE recipe (
    row_id       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    item_id      INT NOT NULL,
    ing_id       INT NOT NULL,
    ing_amount   INT,
    cost_per_ing NUMERIC(10,2),
    
    FOREIGN KEY (item_id) REFERENCES item(item_id),
    FOREIGN KEY (ing_id) REFERENCES ingredients(ing_id)
);

CREATE TABLE stock_log (
    log_id        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ing_id        INT NOT NULL,
    rota_id       INT,
    change_amount INT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ing_id) REFERENCES ingredients(ing_id),
    FOREIGN KEY (rota_id) REFERENCES rota(rota_id)
);

-- ---------------------------------------------------------
-- 4. Orders & Staff Participation
-- ---------------------------------------------------------

CREATE TABLE coupons (
    coupon_id        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code             VARCHAR(50) UNIQUE,
    discount_percent NUMERIC(10,2),
    min_order_amount NUMERIC(10,2),
    start_date       DATE,
    end_date         DATE,
    is_active        BOOLEAN DEFAULT TRUE
);

CREATE TABLE orders (
    order_id       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cust_id        INT NOT NULL,
    add_id         INT,
    rota_id        INT,
    coupon_id      INT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status         VARCHAR(30),
    service_type   VARCHAR(30),
    total_discount NUMERIC(10,2),
    
    FOREIGN KEY (cust_id) REFERENCES customers(cust_id),
    FOREIGN KEY (add_id) REFERENCES address(add_id),
    FOREIGN KEY (rota_id) REFERENCES rota(rota_id),
    FOREIGN KEY (coupon_id) REFERENCES coupons(coupon_id)
);

-- Handles 'Served' relationship where Staff = Waiter, Chef, etc.
CREATE TABLE order_staff (
    row_id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id INT NOT NULL,
    staff_id INT NOT NULL,
    role     VARCHAR(50),
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id)
);

CREATE TABLE order_items (
    row_id        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id      INT NOT NULL,
    item_id       INT NOT NULL,
    item_quantity INT,
    total_price   NUMERIC(10,2),
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (item_id) REFERENCES item(item_id)
);

CREATE TABLE payment (
    transaction_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id       INT NOT NULL,
    amount         NUMERIC(10,2),
    status         VARCHAR(30),
    method         VARCHAR(30),
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

-- Daily income from completed orders only (based on orders.created_at date)
CREATE OR REPLACE FUNCTION daily_income(target_date DATE)
RETURNS NUMERIC(12,2)
LANGUAGE SQL
AS $$
    SELECT COALESCE(SUM(p.amount), 0)::NUMERIC(12,2)
    FROM orders o
    JOIN payment p ON p.order_id = o.order_id
    WHERE o.created_at::date = target_date
      AND LOWER(COALESCE(o.status, '')) = 'completed';
$$;