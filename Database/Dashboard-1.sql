SELECT
    o.order_id,
    oi.total_cost,
    oi.item_quantity,
    i.category,
    i.item_name,
    o.created_at,
    a.address1,
    a.address2,
    a.zipcode,
    o.service_type
FROM
    orders o
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    LEFT JOIN item i ON oi.item_id = i.item_id
    LEFT JOIN address a ON o.add_id = a.add_id;
