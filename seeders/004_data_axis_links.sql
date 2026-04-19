-- EcoSynTech FarmOS PRO - Seeder 004: Data Axis Links
-- Version: 5.0.0
-- Links sample data across the complete data axis

-- Link sample crop_plantings to farms and areas
UPDATE crop_plantings SET farm_id = 'farm-demo', area_id = 'area-a1' WHERE farm_id IS NULL;

-- Link sample supply_chain to crops and areas
UPDATE supply_chain SET 
  crop_id = 'crop-rau-muong',
  area_id = 'area-a1',
  farm_id = 'farm-demo'
WHERE crop_id IS NULL;

-- Link sample tb_batches to crops and farms
UPDATE tb_batches SET
  farm_id = 'farm-demo',
  crop_id = 'crop-rau-muong'
WHERE farm_id IS NULL;

-- Link sample tb_packages to crops
UPDATE tb_packages SET
  crop_id = (SELECT crop_id FROM tb_batches WHERE id = tb_packages.batch_id)
WHERE crop_id IS NULL;

-- Link sample tb_shipments to farms
UPDATE tb_shipments SET
  farm_id = 'farm-demo'
WHERE farm_id IS NULL;

-- Link sample quantities to crops
UPDATE quantities SET
  crop_id = 'crop-rau-muong'
WHERE crop_id IS NULL;

-- Link sample logs to crops
UPDATE logs SET
  crop_id = 'crop-rau-muong',
  farm_id = 'farm-demo',
  area_id = 'area-a1'
WHERE crop_id IS NULL;

-- Seeder Complete - Data Axis Linked