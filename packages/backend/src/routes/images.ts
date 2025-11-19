import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getPool, isDbAvailable } from '../services/database';
import { optionalAuth, AuthRequest } from '../middleware/auth';

export const imagesRouter = Router();

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads', 'images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  },
});

// Upload image
imagesRouter.post('/upload', optionalAuth, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      // In production, save to cloud storage (S3, Azure Blob, etc.)
      return res.json({
        id: Date.now(),
        filename: req.file.filename,
        file_path: `/uploads/images/${req.file.filename}`,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        message: 'Image uploaded (mock mode)',
      });
    }

    const { camera_id, facility_id, metadata } = req.body;
    const userId = req.user?.userId || null;

    const result = await pool.query(
      `INSERT INTO images (filename, file_path, file_size, mime_type, metadata, camera_id, facility_id, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.file.filename,
        `/uploads/images/${req.file.filename}`,
        req.file.size,
        req.file.mimetype,
        metadata ? JSON.stringify(metadata) : null,
        camera_id ? parseInt(camera_id) : null,
        facility_id ? parseInt(facility_id) : null,
        userId,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Get all images
imagesRouter.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.json([]);
    }

    const { camera_id, facility_id, limit = 50 } = req.query;
    let query = 'SELECT * FROM images WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (camera_id) {
      query += ` AND camera_id = $${paramIndex++}`;
      params.push(camera_id);
    }
    if (facility_id) {
      query += ` AND facility_id = $${paramIndex++}`;
      params.push(facility_id);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++}`;
    params.push(parseInt(limit as string));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Get image by ID
imagesRouter.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const { id } = req.params;
    const result = await pool.query('SELECT * FROM images WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

// Get image file
imagesRouter.get('/:id/file', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const { id } = req.params;
    const result = await pool.query('SELECT file_path FROM images WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const filePath = path.join(process.cwd(), result.rows[0].file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Image file not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving image file:', error);
    res.status(500).json({ error: 'Failed to serve image file' });
  }
});

// Get labels for image
imagesRouter.get('/:id/labels', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.json([]);
    }

    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM image_labels WHERE image_id = $1 ORDER BY created_at DESC',
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching image labels:', error);
    res.status(500).json({ error: 'Failed to fetch image labels' });
  }
});

// Create/Update label for image
imagesRouter.post('/:id/labels', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { id } = req.params;
    const { label, bbox, confidence } = req.body;
    const userId = req.user?.userId || null;

    if (!label) {
      return res.status(400).json({ error: 'Label is required' });
    }

    const result = await pool.query(
      `INSERT INTO image_labels (image_id, label, bbox, confidence, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, label, JSON.stringify(bbox || {}), confidence || null, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating label:', error);
    res.status(500).json({ error: 'Failed to create label' });
  }
});

// Update label
imagesRouter.put('/labels/:labelId', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { labelId } = req.params;
    const { label, bbox, confidence } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (label !== undefined) {
      updates.push(`label = $${paramIndex++}`);
      values.push(label);
    }
    if (bbox !== undefined) {
      updates.push(`bbox = $${paramIndex++}`);
      values.push(JSON.stringify(bbox));
    }
    if (confidence !== undefined) {
      updates.push(`confidence = $${paramIndex++}`);
      values.push(confidence);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(labelId);

    const result = await pool.query(
      `UPDATE image_labels SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Label not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating label:', error);
    res.status(500).json({ error: 'Failed to update label' });
  }
});

// Delete label
imagesRouter.delete('/labels/:labelId', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { labelId } = req.params;
    await pool.query('DELETE FROM image_labels WHERE id = $1', [labelId]);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting label:', error);
    res.status(500).json({ error: 'Failed to delete label' });
  }
});

// Delete image
imagesRouter.delete('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { id } = req.params;
    const result = await pool.query('SELECT file_path FROM images WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete file
    const filePath = path.join(process.cwd(), result.rows[0].file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database (cascade will delete labels)
    await pool.query('DELETE FROM images WHERE id = $1', [id]);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

