-- EcoSynTech FarmOS PRO - Complete Data Axis Mapping
-- Version: 5.0.0
-- Maps: crops → plantings → batches → packages → shipments → supply_chain

-- =====================================================
-- CROP DATA AXIS
-- =====================================================

-- Crops (Master Data) - already has no farm_id (global crop catalog)
-- Add crop_category for grouping
ALTER TABLE crops ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'vegetable';

-- Crop Plantings (Farm-specific planting records)
-- Links: crop_id → crops.id, farm_id → farms.id, area_id → areas.id
ALTER TABLE crop_plantings ADD COLUMN IF NOT EXISTS farm_id TEXT;
ALTER TABLE crop_plantings ADD COLUMN IF NOT EXISTS area_id TEXT;
ALTER TABLE crop_plantings ADD COLUMN IF NOT EXISTS season TEXT;
ALTER TABLE crop_plantings ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE crop_plantings ADD COLUMN IF NOT EXISTS plot_number TEXT;

-- Add foreign key relationships (manual - SQLite doesn't enforce FK)
CREATE INDEX IF NOT EXISTS idx_plantings_crop ON crop_plantings(crop_id);
CREATE INDEX IF NOT EXISTS idx_plantings_farm ON crop_plantings(farm_id);
CREATE INDEX IF NOT EXISTS idx_plantings_area ON crop_plantings(area_id);

-- =====================================================
-- SUPPLY CHAIN TO TRACEABILITY LINKAGE
-- =====================================================

-- Supply Chain (Legacy) - Link to crops/plantings
ALTER TABLE supply_chain ADD COLUMN IF NOT EXISTS crop_id TEXT;
ALTER TABLE supply_chain ADD COLUMN IF NOT EXISTS planting_id TEXT;
ALTER TABLE supply_chain ADD COLUMN IF NOT EXISTS area_id TEXT;
ALTER TABLE supply_chain ADD COLUMN IF NOT EXISTS tb_batch_id TEXT;

-- Link supply_chain to tb_batches for traceability
-- One supply_chain batch = One tb_batch (or multiple tb_packages)

-- =====================================================
-- COMPLETE TRACEABILITY DATA AXIS
-- =====================================================

-- Full data flow: farms → areas → plantings → batches → packages → shipment_items → shipments

-- tb_batches already has: farm_id, area_id, season_id
-- Add planting_id linkage
ALTER TABLE tb_batches ADD COLUMN IF NOT EXISTS planting_id TEXT;
ALTER TABLE tb_batches ADD COLUMN IF NOT EXISTS crop_id TEXT;
ALTER TABLE tb_batches ADD COLUMN IF NOT EXISTS supply_chain_id TEXT;

-- Create indexes for data axis
CREATE INDEX IF NOT EXISTS idx_tb_batches_planting ON tb_batches(planting_id);
CREATE INDEX IF NOT EXISTS idx_tb_batches_crop ON tb_batches(crop_id);
CREATE INDEX IF NOT EXISTS idx_tb_batches_supply ON tb_batches(supply_chain_id);

-- tb_batch_events links to: batch_id, related_log_id (from logs table)
-- Add more linkages
ALTER TABLE tb_batch_events ADD COLUMN IF NOT EXISTS planting_id TEXT;
ALTER TABLE tb_batch_events ADD COLUMN IF NOT EXISTS worker_id TEXT;
ALTER TABLE tb_batch_events ADD COLUMN IF NOT EXISTS log_id TEXT;

-- tb_packages already links to batch_id
-- Add more linkages
ALTER TABLE tb_packages ADD COLUMN IF NOT EXISTS planting_id TEXT;
ALTER TABLE tb_packages ADD COLUMN IF NOT EXISTS supply_chain_id TEXT;

-- tb_shipment_items links to: shipment_id, package_id
-- Add quantity tracking
ALTER TABLE tb_shipment_items ADD COLUMN IF NOT EXISTS batch_id TEXT;
ALTER TABLE tb_shipment_items ADD COLUMN IF NOT EXISTS crop_id TEXT;

-- tb_shipments already has: org_id, customer_name, destination
-- Add linkages
ALTER TABLE tb_shipments ADD COLUMN IF NOT EXISTS farm_id TEXT;
ALTER TABLE tb_shipments ADD COLUMN IF NOT EXISTS crop_id TEXT;

-- Quality checks already link to batch_id
-- Enhance with crop info
ALTER TABLE tb_batch_quality_checks ADD COLUMN IF NOT EXISTS crop_id TEXT;
ALTER TABLE tb_batch_quality_checks ADD COLUMN IF NOT EXISTS planting_id TEXT;

-- =====================================================
-- QUANTITIES - YIELD LINKAGE
-- =====================================================

-- Link quantities to crops/plantings/batches
ALTER TABLE quantities ADD COLUMN IF NOT EXISTS planting_id TEXT;
ALTER TABLE quantities ADD COLUMN IF NOT EXISTS batch_id TEXT;
ALTER TABLE quantities ADD COLUMN IF NOT EXISTS crop_id TEXT;

CREATE INDEX IF NOT EXISTS idx_quantities_planting ON quantities(planting_id);
CREATE INDEX IF NOT EXISTS idx_quantities_batch ON quantities(batch_id);
CREATE INDEX IF NOT EXISTS idx_quantities_crop ON quantities(crop_id);

-- =====================================================
-- LOGS - ACTIVITY LINKAGE  
-- =====================================================

-- Link logs to crops/plantings/batches
ALTER TABLE logs ADD COLUMN IF NOT EXISTS crop_id TEXT;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS planting_id TEXT;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS batch_id TEXT;

CREATE INDEX IF NOT EXISTS idx_logs_crop ON logs(crop_id);
CREATE INDEX IF NOT EXISTS idx_logs_planting ON logs(planting_id);
CREATE INDEX IF NOT EXISTS idx_logs_batch ON logs(batch_id);

-- =====================================================
-- AUDIT - COMPLETE TRACEABILITY
-- =====================================================

-- Ensure audit logs track all data changes in the axis
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS farm_id TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS crop_id TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS batch_id TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_farm ON audit_logs(farm_id);
CREATE INDEX IF NOT EXISTS idx_audit_crop ON audit_logs(crop_id);
CREATE INDEX IF NOT EXISTS idx_audit_batch ON audit_logs(batch_id);

-- =====================================================
-- UNIFIED DATA QUERIES (Views for reporting)
-- =====================================================

-- View: Complete Crop History
-- SELECT p.*, c.name as crop_name, c.name_vi as crop_name_vi, f.name as farm_name, a.name as area_name
-- FROM crop_plantings p
-- LEFT JOIN crops c ON p.crop_id = c.id
-- LEFT JOIN farms f ON p.farm_id = f.id
-- LEFT JOIN areas a ON p.area_id = a.id;

-- View: Complete Batch Traceability
-- SELECT b.*, p.product_name as crop_name, f.name as farm_name, a.name as area_name,
--        (SELECT COUNT(*) FROM tb_packages WHERE batch_id = b.id) as package_count,
--        (SELECT SUM(quantity) FROM tb_shipment_items WHERE batch_id = b.id) as shipped_quantity
-- FROM tb_batches b
-- LEFT JOIN crops p ON b.crop_id = p.id
-- LEFT JOIN farms f ON b.farm_id = f.id
-- LEFT JOIN areas a ON b.area_id = a.id;

-- =====================================================
-- DATA INTEGRITY TRIGGERS (Optional - SQLite doesn't support triggers well)
-- =====================================================

-- Instead of triggers, enforce in application logic:
-- 1. When creating batch from planting → link planting_id, crop_id
-- 2. When creating package from batch → link batch_id, crop_id
-- 3. When creating shipment → link all packages and their batches
-- 4. When logging activity → link to applicable crop/planting/batch

-- Complete Data Axis Mapping - DONE