import random
from datetime import datetime, timedelta
from faker import Faker

fake = Faker()

# Configuration
NUM_CUSTOMERS = 100
NUM_ORDERS_TOTAL = 300
DAYS_OF_HISTORY = 30

def generate_sql_script():
    print("Generating SQL script...")
    sql_statements = []

    # 1. Clear existing data (except staff to preserve Chefs 1-4)
    sql_statements.append("-- 1. Clean up old data")
    sql_statements.append("TRUNCATE TABLE payment, order_items, orders, stock_log, rota RESTART IDENTITY CASCADE;\n")

    # 2. STAFF (Insert Waiters 5-11 & Receptionists 12-13. Chefs 1-4 are preserved)
    sql_statements.append("-- 2. Insert Staff (Waiters & Receptionists)")
    staff_values = []
    for i in range(5, 12):
        staff_values.append(f"({i}, '{fake.first_name()}', '{fake.last_name()}', 'Waiter', {round(random.uniform(15.0, 20.0), 2)})")
    
    staff_values.append("(12, 'Melissa', 'Jones', 'Receptionist', 20.00)")
    staff_values.append("(13, 'Randy', 'Ball', 'Receptionist', 20.00)")
    
    sql_statements.append(
        "INSERT INTO staff (staff_id, first_name, last_name, position, hourly_rate) "
        "OVERRIDING SYSTEM VALUE VALUES\n" + ",\n".join(staff_values) + ";\n"
    )

    # Reference Data for Items & Recipes
    items_data = {
        1: {'price': 12.00, 'recipe': [(1,1), (2,1), (3,1)]},
        2: {'price': 15.00, 'recipe': [(1,1), (2,1), (3,1), (4,2)]},
        3: {'price': 14.00, 'recipe': [(1,1), (2,1), (3,1), (5,2), (6,2)]},
        4: {'price': 16.00, 'recipe': [(1,1), (2,1), (7,1), (8,2), (6,1)]},
        5: {'price': 5.00,  'recipe': [(1,1), (2,1)]}
    }

    start_date = datetime.now() - timedelta(days=DAYS_OF_HISTORY)
    rota_id_counter = 1
    order_id_counter = 1
    order_item_row_id = 1
    stock_log_id = 1
    payment_id = 1

    rota_values = []
    order_values = []
    order_item_values = []
    stock_log_values = []
    payment_values = []

    for day in range(DAYS_OF_HISTORY):
        current_date = start_date + timedelta(days=day)
        date_str = current_date.strftime('%Y-%m-%d')
        
        daily_shift_map = {}
        
        # A. Assign Chefs (1-4) & Waiters (5-11)
        for staff_id in list(range(1, 5)) + list(range(5, 12)):
            rota_values.append(f"({rota_id_counter}, {staff_id}, '{date_str} 09:00:00', '{date_str} 18:00:00', '{date_str}')")
            rota_id_counter += 1

        # B. Assign Receptionists to shifts
        shifts = [
            (12, '08:00:00', '12:30:00'),
            (13, '12:30:00', '17:00:00'),
            (12, '17:00:00', '21:00:00')
        ]
        
        for shift_idx, (rec_id, s_time, e_time) in enumerate(shifts, start=1):
            rota_values.append(f"({rota_id_counter}, {rec_id}, '{date_str} {s_time}', '{date_str} {e_time}', '{date_str}')")
            daily_shift_map[shift_idx] = {'rota_id': rota_id_counter, 'staff_id': rec_id}
            
            # Restock logic (Only shift 1)
            if shift_idx == 1:
                for ing_id in range(1, 9):
                    stock_log_values.append(f"({stock_log_id}, {ing_id}, {rota_id_counter}, 200, '{date_str} {s_time}')")
                    stock_log_id += 1
            
            rota_id_counter += 1

        # C. Generate Orders
        orders_today = NUM_ORDERS_TOTAL // DAYS_OF_HISTORY
        for _ in range(orders_today):
            hour = random.randint(8, 20)
            minute = random.randint(0, 59)
            order_time = current_date.replace(hour=hour, minute=minute, second=0)
            ot_str = order_time.strftime('%Y-%m-%d %H:%M:%S')

            if hour < 12 or (hour == 12 and minute < 30): shift = 1
            elif (hour == 12 and minute >= 30) or (13 <= hour < 17): shift = 2
            else: shift = 3
                
            active_rota = daily_shift_map[shift]
            cust_id = random.randint(1, NUM_CUSTOMERS)
            add_id = cust_id + 1
            has_coupon = random.random() > 0.8
            discount = 10.00 if has_coupon else 0.00
            coupon_str = "1" if has_coupon else "NULL"
            service = random.choice(['Dine-In', 'Takeaway'])
            
            order_values.append(f"({order_id_counter}, {cust_id}, {add_id}, {active_rota['rota_id']}, {active_rota['staff_id']}, {coupon_str}, '{ot_str}', 'Completed', '{service}', {discount})")

            order_total = 0
            for _ in range(random.randint(1, 3)):
                item_id = random.randint(1, 5)
                qty = random.randint(1, 2)
                item_price = items_data[item_id]['price']
                total_price = item_price * qty
                order_total += total_price
                
                order_item_values.append(f"({order_item_row_id}, {order_id_counter}, {item_id}, {qty}, {total_price:.2f})")
                order_item_row_id += 1
                
                for ing_id, ing_qty in items_data[item_id]['recipe']:
                    change = -(ing_qty * qty)
                    stock_log_values.append(f"({stock_log_id}, {ing_id}, {active_rota['rota_id']}, {change}, '{ot_str}')")
                    stock_log_id += 1

            final_amount = max(0, order_total - discount)
            method = random.choice(['Card', 'Cash'])
            payment_values.append(f"({payment_id}, {order_id_counter}, {final_amount:.2f}, 'Paid', '{method}')")
            
            payment_id += 1
            order_id_counter += 1

    # 3. Build remaining SQL blocks using OVERRIDING SYSTEM VALUE
    sql_statements.append("-- 3. Insert Rota")
    sql_statements.append("INSERT INTO rota (rota_id, staff_id, start_time, end_time, work_date) OVERRIDING SYSTEM VALUE VALUES\n" + ",\n".join(rota_values) + ";\n")

    sql_statements.append("-- 4. Insert Orders")
    sql_statements.append("INSERT INTO orders (order_id, cust_id, add_id, rota_id, staff_id, coupon_id, created_at, status, service_type, total_discount) OVERRIDING SYSTEM VALUE VALUES\n" + ",\n".join(order_values) + ";\n")

    sql_statements.append("-- 5. Insert Order Items")
    sql_statements.append("INSERT INTO order_items (row_id, order_id, item_id, item_quantity, total_price) OVERRIDING SYSTEM VALUE VALUES\n" + ",\n".join(order_item_values) + ";\n")

    sql_statements.append("-- 6. Insert Stock Log")
    sql_statements.append("INSERT INTO stock_log (log_id, ing_id, rota_id, change_amount, created_at) OVERRIDING SYSTEM VALUE VALUES\n" + ",\n".join(stock_log_values) + ";\n")

    sql_statements.append("-- 7. Insert Payments")
    sql_statements.append("INSERT INTO payment (transaction_id, order_id, amount, status, method) OVERRIDING SYSTEM VALUE VALUES\n" + ",\n".join(payment_values) + ";\n")

    # Write everything to a .sql file
    with open('seed_data.sql', 'w') as f:
        f.write("\n".join(sql_statements))
    
    print("Success! 'seed_data.sql' has been created.")

if __name__ == "__main__":
    generate_sql_script()