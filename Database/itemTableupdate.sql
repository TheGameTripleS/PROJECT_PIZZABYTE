-- We need to store the URL of the image for each item.
ALTER TABLE item ADD COLUMN image_url VARCHAR(255) DEFAULT NULL;