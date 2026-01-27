-- PostgreSQL initialization script
-- This runs when the container is first created

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE evplatform TO evplatform;

-- Create schema for better organization (optional)
-- CREATE SCHEMA IF NOT EXISTS ev;
-- SET search_path TO ev, public;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialized successfully';
END $$;
