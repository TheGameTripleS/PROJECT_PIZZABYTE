ALTER TABLE item 
ADD COLUMN status VARCHAR(20) DEFAULT 'continued' 
CHECK (status IN ('continued', 'discontinued', 'hold'));