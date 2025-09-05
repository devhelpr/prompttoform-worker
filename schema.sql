-- Database schema for form-generator-worker
-- This file contains the SQL schema for the D1 database

-- Create the forms table to store JSON form data
CREATE TABLE IF NOT EXISTS forms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forms_created_at ON forms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forms_updated_at ON forms(updated_at DESC);

-- Optional: Create a view for easier querying of JSON data
-- This can be useful if you want to extract specific fields from the JSON
-- CREATE VIEW IF NOT EXISTS forms_view AS
-- SELECT 
--     id,
--     json_extract(data, '$.name') as name,
--     json_extract(data, '$.email') as email,
--     json_extract(data, '$.message') as message,
--     created_at,
--     updated_at
-- FROM forms;
