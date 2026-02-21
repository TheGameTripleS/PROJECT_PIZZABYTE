import random
from datetime import datetime, timedelta
from faker import Faker

fake = Faker()

# Configuration
NUM_CUSTOMERS = 100
NUM_ORDERS = 300
DAYS_OF_HISTORY = 30

def generate_sql():
    sql = ["-- =========================================="]
    sql.append("-- MOCK DATA GENERATION SCRIPT (UPDATED STAFFING)")
    sql.append("-- ==========================================\n")
    
    # Optional: Clear existing data
    sql.append("TRUNCATE TABLE payment, order_items, order_staff, stock_log, recipe, orders, customers, rota, coupons, item, ingredients, staff, address RESTART IDENTITY CASCADE;\n")

    # 1. ADDRESSES (1 for Shop + Customers)
    sql.append("-- 1. ADDRESSES")
    addresses = [f"('123 Main Shop St', '', '10001')"] # Shop Address is ID 1
    for _ in range(NUM_CUSTOMERS):
        addresses.append(f"('{fake.street_address()[:90]}', '', '{fake.zipcode()}')")
    sql.append("INSERT INTO address (address1, address2, zipcode) VALUES\n" + ",\n".join(addresses) + ";\n")

    # 2. STAFF (3 Chefs, 8 Waiters, 2 Receptionists)
    sql.append("-- 2. STAFF")
    staff = []
    staff_roles = {}
    staff_id_counter = 1
    
    # Generate 3 Chefs
    for _ in range(3):
        staff.append(f"('{fake.first_name()}', '{fake.last_name()}', 'Chef', {round(random.uniform(30.0, 45.0), 2)})")
        staff_roles[staff_id_counter] = 'Chef'
        staff_id_counter += 1
        
    # Generate 8 Waiters
    for _ in range(8):
        staff.append(f"('{fake.first_name()}', '{fake.last_name()}', 'Waiter', {round(random.uniform(15.0, 20.0), 2)})")
        staff_roles[staff_id_counter] = 'Waiter'
        staff_id_counter += 1
        
    # Generate 2 Receptionists
    for _ in range(2):
        staff.append(f"('{fake.first_name()}', '{fake.last_name()}', 'Receptionist', {round(random.uniform(18.0, 25.0), 2)})")
        staff_roles[staff_id_counter] = 'Receptionist'
        staff_id_counter += 1

    sql.append("INSERT INTO staff (first_name, last_name, position, hourly_rate) VALUES\n" + ",\n".join(staff) + ";\n")

    # 3. INGREDIENTS
    sql.append("-- 3. INGREDIENTS")
    ingredients_data = [
        ('Pizza Dough', 250, 'g', 1.00), ('Mozzarella', 150, 'g', 1.50),
        ('Marinara Sauce', 100, 'ml', 0.50), ('Pepperoni', 50, 'g', 2.00),
        ('Mushrooms', 50, 'g', 0.80), ('Onions', 30, 'g', 0.40),
        ('BBQ Sauce', 100, 'ml', 0.75), ('Chicken', 100, 'g', 2.50)
    ]
    ing_vals = [f"('{n}', {w}, '{m}', {p})" for n, w, m, p in ingredients_data]
    sql.append("INSERT INTO ingredients (ing_name, weight, meas, ing_price) VALUES\n" + ",\n".join(ing_vals) + ";\n")

    # 4. ITEMS & RECIPES
    sql.append("-- 4. ITEMS")
    items_data = [
        ('PZ-MARG', 'Margherita Pizza', 'Pizza', 'Large', 12.00, [(1,1), (2,1), (3,1)]),
        ('PZ-PEP', 'Pepperoni Pizza', 'Pizza', 'Large', 15.00, [(1,1), (2,1), (3,1), (4,2)]),
        ('PZ-VEG', 'Veggie Supreme', 'Pizza', 'Large', 14.00, [(1,1), (2,1), (3,1), (5,2), (6,2)]),
        ('PZ-BBQ', 'BBQ Chicken', 'Pizza', 'Large', 16.00, [(1,1), (2,1), (7,1), (8,2), (6,1)]),
        ('SD-GAR', 'Garlic Bread', 'Side', 'Regular', 5.00, [(1,1), (2,1)]),
    ]
    
    item_vals = []
    recipes = []
    item_prices = {}
    item_recipes = {} 
    
    for idx, item in enumerate(items_data, start=1):
        sku, name, cat, size, price, rec = item
        item_vals.append(f"('{sku}', '{name}', '{cat}', '{size}', {price})")
        item_prices[idx] = price
        item_recipes[idx] = rec
        for ing_id, qty in rec:
            recipes.append(f"({idx}, {ing_id}, {qty})")
            
    sql.append("INSERT INTO item (sku, item_name, category, size, item_price) VALUES\n" + ",\n".join(item_vals) + ";\n")
    sql.append("-- 5. RECIPES\nINSERT INTO recipe (item_id, ing_id, ing_amount) VALUES\n" + ",\n".join(recipes) + ";\n")

    # 6. CUSTOMERS
    sql.append("-- 6. CUSTOMERS")
    customers = []
    for i in range(2, NUM_CUSTOMERS + 2): 
        customers.append(f"({i}, '{fake.first_name()}', '{fake.last_name()}', '{fake.email()}', '{fake.numerify('###-###-####')}')")
    sql.append("INSERT INTO customers (add_id, first_name, last_name, email, phone) VALUES\n" + ",\n".join(customers) + ";\n")

    # 7. COUPONS
    sql.append("-- 7. COUPONS")
    sql.append("INSERT INTO coupons (code, discount_percent, min_order_amount, start_date, end_date, is_active) VALUES")
    sql.append("('WELCOME10', 10.00, 20.00, '2020-01-01', '2030-12-31', TRUE), ('SAVE20', 20.00, 50.00, '2020-01-01', '2030-12-31', TRUE);\n")

    # DATA GENERATION LOOP
    rotas = []
    stock_logs = []
    orders = []
    order_items = []
    order_staff = []
    payments = []
    
    start_date = datetime.now() - timedelta(days=DAYS_OF_HISTORY)
    rota_id_counter = 1
    order_id_counter = 1
    
    chefs = [k for k, v in staff_roles.items() if v == 'Chef']
    waiters = [k for k, v in staff_roles.items() if v == 'Waiter']
    receptionists = [k for k, v in staff_roles.items() if v == 'Receptionist']

    for day in range(DAYS_OF_HISTORY):
        current_date = start_date + timedelta(days=day)
        date_str = current_date.strftime('%Y-%m-%d')
        
        # 8. DAILY ROTAS (Schedule 2 Chefs, 4 Waiters, 1 Receptionist per day)
        daily_chefs = random.sample(chefs, 2)
        daily_waiters = random.sample(waiters, 4)
        daily_receptionist = random.sample(receptionists, 1)
        
        daily_staff = daily_chefs + daily_waiters + daily_receptionist
        daily_rota_map = {} # Maps staff_id to their specific rota_id for today
        
        for s_id in daily_staff:
            rotas.append(f"({s_id}, '{date_str} 09:00:00', '{date_str} 22:00:00', '{date_str}')")
            daily_rota_map[s_id] = rota_id_counter
            
            # Morning Restock (Done by the first chef of the day)
            if s_id == daily_chefs[0]:
                for ing_id in range(1, len(ingredients_data) + 1):
                    stock_logs.append(f"({ing_id}, {rota_id_counter}, 500, '{date_str} 08:30:00')") 
            rota_id_counter += 1
            
        # 9. DAILY ORDERS
        orders_today = NUM_ORDERS // DAYS_OF_HISTORY
        for _ in range(orders_today):
            cust_id = random.randint(1, NUM_CUSTOMERS)
            add_id = cust_id + 1 
            order_time = current_date + timedelta(hours=random.randint(11, 21), minutes=random.randint(0, 59))
            ot_str = order_time.strftime('%Y-%m-%d %H:%M:%S')
            
            service = random.choice(['Delivery', 'Dine-In'])
            coupon = "1" if random.random() > 0.8 else "NULL"
            
            # The Receptionist takes the order
            receptionist_rota_id = daily_rota_map[daily_receptionist[0]]
            orders.append(f"({cust_id}, {add_id}, {receptionist_rota_id}, {coupon}, '{ot_str}', 'Delivered', '{service}')")
            
            # Order Items & Deduct Stock
            num_items = random.randint(1, 4)
            order_total = 0
            
            # Pick a Chef and Waiter for this specific order
            assigned_chef = random.choice(daily_chefs)
            assigned_waiter = random.choice(daily_waiters)
            
            for _ in range(num_items):
                i_id = random.randint(1, len(items_data))
                qty = random.randint(1, 3)
                order_items.append(f"({order_id_counter}, {i_id}, {qty})")
                order_total += (item_prices[i_id] * qty)
                
                # DEDUCT STOCK (Assigned to the Chef who cooked it)
                chef_rota_id = daily_rota_map[assigned_chef]
                for ing_id, ing_qty in item_recipes[i_id]:
                    total_used = ing_qty * qty
                    stock_logs.append(f"({ing_id}, {chef_rota_id}, -{total_used}, '{ot_str}')")
                    
            # Log the Chef and Waiter in order_staff
            order_staff.append(f"({order_id_counter}, {assigned_chef}, 'Chef')")
            order_staff.append(f"({order_id_counter}, {assigned_waiter}, 'Waiter')")
            
            # Payment
            discount = 0.9 if coupon == "1" else 1.0
            final_amount = round(order_total * discount, 2)
            payments.append(f"({order_id_counter}, {final_amount}, 'Paid', '{random.choice(['Credit Card', 'Cash'])}')")
            
            order_id_counter += 1

    # Compile Final SQL
    sql.append("-- 8. ROTA")
    sql.append("INSERT INTO rota (staff_id, start_time, end_time, work_date) VALUES\n" + ",\n".join(rotas) + ";\n")
    
    sql.append("-- 9. ORDERS (Linked to Receptionist Rota)")
    sql.append("INSERT INTO orders (cust_id, add_id, rota_id, coupon_id, created_at, status, service_type) VALUES\n" + ",\n".join(orders) + ";\n")
    
    sql.append("-- 10. ORDER ITEMS")
    sql.append("INSERT INTO order_items (order_id, item_id, item_quantity) VALUES\n" + ",\n".join(order_items) + ";\n")
    
    sql.append("-- 11. ORDER STAFF (Links specific Chef & Waiter)")
    sql.append("INSERT INTO order_staff (order_id, staff_id, role) VALUES\n" + ",\n".join(order_staff) + ";\n")
    
    sql.append("-- 12. PAYMENTS")
    sql.append("INSERT INTO payment (order_id, amount, status, method) VALUES\n" + ",\n".join(payments) + ";\n")
    
    sql.append("-- 13. STOCK LOG")
    sql.append("INSERT INTO stock_log (ing_id, rota_id, change_amount, created_at) VALUES\n" + ",\n".join(stock_logs) + ";\n")

    # Write to file
    with open('mock_pizza_data.sql', 'w') as f:
        f.write("\n".join(sql))
        
    print("Success! Generated mock_pizza_data.sql with exact staffing rules: 3 Chefs, 8 Waiters, 2 Receptionists.")

if __name__ == "__main__":
    generate_sql()