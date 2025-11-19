import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let pool: Pool;
let isDatabaseAvailable = false;

// Initialize database connection pool
function initializePool() {
  try {
    pool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'smartfarm',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
    });

    // Test connection
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      isDatabaseAvailable = false;
    });
  } catch (error) {
    console.warn('Failed to create database pool:', error);
    isDatabaseAvailable = false;
    // Create a dummy pool that will fail gracefully
    pool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'smartfarm',
      user: 'postgres',
      password: 'postgres',
    });
  }
}

// Initialize pool on module load
initializePool();

// Get pool instance
export function getPool(): Pool {
  return pool;
}

// Export pool for backward compatibility
export { pool };

// Check if database is available
export function isDbAvailable(): boolean {
  return isDatabaseAvailable;
}

// Initialize database schema
export async function initializeDatabase(): Promise<boolean> {
  if (!pool) {
    initializePool();
  }

  if (!pool) {
    console.warn('Database pool not initialized. Running in mock mode.');
    return false;
  }

  try {
    const client = await pool.connect();
    try {
    // Sensors table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sensors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        location VARCHAR(255),
        unit VARCHAR(20),
        description TEXT,
        mqtt_topic VARCHAR(255),
        sampling_interval INTEGER DEFAULT 60,
        min_value NUMERIC,
        max_value NUMERIC,
        alarm_threshold_min NUMERIC,
        alarm_threshold_max NUMERIC,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Actuators table
    await client.query(`
      CREATE TABLE IF NOT EXISTS actuators (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        location VARCHAR(255),
        description TEXT,
        status VARCHAR(20) DEFAULT 'off',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Rules table (with description field for 영농 시나리오)
    await client.query(`
      CREATE TABLE IF NOT EXISTS rules (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        condition_json JSONB NOT NULL,
        action_json JSONB NOT NULL,
        enabled BOOLEAN DEFAULT true,
        priority INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Alarms table
    await client.query(`
      CREATE TABLE IF NOT EXISTS alarms (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        sensor_id INTEGER REFERENCES sensors(id),
        status VARCHAR(20) DEFAULT 'unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP
      )
    `);

    // Robots table
    await client.query(`
      CREATE TABLE IF NOT EXISTS robots (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'idle',
        battery_level INTEGER DEFAULT 100,
        location JSONB,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // API Keys table
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER REFERENCES users(id),
        key_hash VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        scopes TEXT[] DEFAULT ARRAY[]::TEXT[],
        status VARCHAR(20) DEFAULT 'active',
        quota_daily INTEGER DEFAULT 1000,
        quota_used INTEGER DEFAULT 0,
        quota_reset_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used_at TIMESTAMP
      )
    `);

    // Audit logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        actor_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50),
        resource_id INTEGER,
        payload JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // OPEN API Applications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS openapi_applications (
        id SERIAL PRIMARY KEY,
        organization VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        purpose VARCHAR(50) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        api_key VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP
      )
    `);

    // Datasets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS datasets (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        crop_type VARCHAR(100),
        data_type VARCHAR(50),
        fields JSONB,
        license VARCHAR(100),
        samples_url TEXT,
        file_url TEXT,
        file_size BIGINT,
        record_count INTEGER,
        date_range_start DATE,
        date_range_end DATE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // AI Jobs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_jobs (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        dataset_id INTEGER REFERENCES datasets(id),
        model_id INTEGER,
        parameters JSONB,
        result JSONB,
        logs TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

    // AI Models table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_models (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        version VARCHAR(50) NOT NULL,
        type VARCHAR(50),
        metrics JSONB,
        artifact_url TEXT,
        job_id INTEGER REFERENCES ai_jobs(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Images table
    await client.query(`
      CREATE TABLE IF NOT EXISTS images (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_size BIGINT,
        mime_type VARCHAR(100),
        metadata JSONB,
        camera_id INTEGER,
        facility_id INTEGER,
        uploaded_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Image Labels table
    await client.query(`
      CREATE TABLE IF NOT EXISTS image_labels (
        id SERIAL PRIMARY KEY,
        image_id INTEGER REFERENCES images(id) ON DELETE CASCADE,
        label VARCHAR(100) NOT NULL,
        bbox JSONB,
        confidence DECIMAL(5, 4),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

      console.log('Database schema initialized');
      isDatabaseAvailable = true;
      return true;
    } catch (error) {
      console.error('Error initializing database:', error);
      isDatabaseAvailable = false;
      return false;
    } finally {
      client.release();
    }
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.warn('PostgreSQL is not available. Running in mock mode.');
      console.warn('To use database features, please start PostgreSQL server.');
      isDatabaseAvailable = false;
      return false;
    }
    console.error('Database connection error:', error);
    isDatabaseAvailable = false;
    return false;
  }
}
