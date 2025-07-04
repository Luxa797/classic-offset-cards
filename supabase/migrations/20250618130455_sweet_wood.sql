-- Migration to fix the ambiguous created_at column reference in order_status_log

-- Drop the existing view if it exists
DROP VIEW IF EXISTS public.order_summary_with_dues;

-- Create the updated view with explicit column references
CREATE OR REPLACE VIEW public.order_summary_with_dues AS
SELECT
    o.id AS order_id,
    o.customer_id,
    c.name AS customer_name,
    o.total_amount,
    o.date AS date,
    o.delivery_date,
    COALESCE(p.amount_paid, 0) AS amount_paid,
    (o.total_amount - COALESCE(p.amount_paid, 0)) AS balance_due,
    osl.status,
    CASE 
        WHEN (o.total_amount - COALESCE(p.amount_paid, 0)) <= 0 THEN 'Paid'
        WHEN o.delivery_date < CURRENT_DATE AND (o.total_amount - COALESCE(p.amount_paid, 0)) > 0 THEN 'Overdue'
        WHEN o.delivery_date = CURRENT_DATE AND (o.total_amount - COALESCE(p.amount_paid, 0)) > 0 THEN 'Due Soon'
        ELSE 'Due'
    END AS due_status
FROM
    orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN (
    SELECT
        order_id,
        SUM(amount_paid) AS amount_paid
    FROM
        payments
    GROUP BY
        order_id
) p ON o.id = p.order_id
LEFT JOIN LATERAL (
    SELECT status
    FROM order_status_log
    WHERE order_id = o.id
    -- Fix: Use updated_at instead of created_at as suggested in the error hint
    ORDER BY order_status_log.updated_at DESC
    LIMIT 1
) osl ON true
WHERE
    (o.is_deleted = false OR o.is_deleted IS NULL)
    AND (o.total_amount - COALESCE(p.amount_paid, 0)) > 0;