ALTER TABLE sales_orders
ADD COLUMN invoice_created_by VARCHAR(255) NULL
COMMENT 'Nama user Accurate yang membuat Sales Invoice terkait SO'
AFTER status;

