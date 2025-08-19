-- Database Schema for Inventory Management System
-- Execute these queries in your Supabase SQL editor

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  sku VARCHAR UNIQUE NOT NULL,
  category VARCHAR NOT NULL,
  price DECIMAL(10,2),
  description TEXT,
  specifications JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Warehouses Table
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  location VARCHAR,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 10,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, warehouse_id)
);

-- Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number VARCHAR UNIQUE NOT NULL,
  supplier_name VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ORDERED', 'RECEIVED', 'CANCELLED')),
  total_amount DECIMAL(10,2),
  order_date TIMESTAMP DEFAULT NOW(),
  expected_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Purchase Order Items Table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_inventory_product_warehouse ON inventory(product_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON inventory(quantity);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po ON purchase_order_items(purchase_order_id);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for products table
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data (optional - remove if you don't want sample data)
-- Insert sample warehouses
INSERT INTO warehouses (name, location, address) VALUES
('Main Warehouse', 'New York, NY', '123 Storage St, New York, NY 10001'),
('West Coast Hub', 'Los Angeles, CA', '456 Distribution Ave, Los Angeles, CA 90001')
ON CONFLICT DO NOTHING;

-- Insert sample products
INSERT INTO products (name, sku, category, price, description, specifications) VALUES
('Wireless Headphones', 'WH-001', 'Electronics', 99.99, 'Premium wireless headphones with noise cancellation', '{"color": "Black", "battery_life": "30 hours", "weight": "250g"}'),
('Bluetooth Speaker', 'BS-002', 'Electronics', 49.99, 'Portable Bluetooth speaker with deep bass', '{"color": "Blue", "battery_life": "12 hours", "water_resistant": true}'),
('USB-C Cable', 'UC-003', 'Accessories', 12.99, 'High-speed USB-C charging cable', '{"length": "2m", "color": "White", "fast_charging": true}')
ON CONFLICT DO NOTHING;

-- Insert sample inventory (you'll need to replace the UUIDs with actual product and warehouse IDs)
-- This is just an example - you should insert real UUIDs from your products and warehouses tables
/*
INSERT INTO inventory (product_id, warehouse_id, quantity, reorder_level) 
SELECT 
    p.id as product_id,
    w.id as warehouse_id,
    FLOOR(random() * 100 + 10) as quantity,
    FLOOR(random() * 20 + 5) as reorder_level
FROM products p
CROSS JOIN warehouses w
ON CONFLICT DO NOTHING;
*/
