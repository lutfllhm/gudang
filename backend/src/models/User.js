const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Convert a user row to a JSON-safe plain object (avoids BigInt/Date serialization errors in res.json())
 */
function toPlainUser(row) {
  if (!row) return null;
  const toNum = (v) => (v != null && typeof v === 'bigint') ? Number(v) : (v != null ? Number(v) : v);
  const toStr = (v) => (v instanceof Date) ? v.toISOString() : (v != null ? String(v) : null);
  return {
    id: toNum(row.id),
    nama: row.nama ?? '',
    email: row.email ?? '',
    role: row.role ?? '',
    foto_profil: row.foto_profil ?? null,
    status: row.status ?? '',
    last_login: row.last_login != null ? toStr(row.last_login instanceof Date ? row.last_login : new Date(row.last_login)) : null,
    created_at: row.created_at != null ? toStr(row.created_at instanceof Date ? row.created_at : new Date(row.created_at)) : null
  };
}

class User {
  /**
   * Find user by ID
   */
  static async findById(id) {
    const users = await query(
      'SELECT id, nama, email, role, foto_profil, status, last_login, created_at FROM users WHERE id = ?',
      [id]
    );
    return users[0] || null;
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const users = await query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return users[0] || null;
  }

  /**
   * Get all users with pagination
   */
  static async findAll({ page = 1, limit = 20, search = '', role = null, status = null }) {
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push('(nama LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
      whereConditions.push('role = ?');
      params.push(role);
    }

    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Get total count (Number() avoids BigInt serialization issues in JSON)
    const countResult = await query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );
    const total = Number(countResult?.[0]?.total ?? 0);

    // Get users
    const rows = await query(
      `SELECT id, nama, email, role, foto_profil, status, last_login, created_at 
       FROM users ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const users = Array.isArray(rows) ? rows.map(toPlainUser).filter(Boolean) : [];

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Create new user
   */
  static async create({ nama, email, password, role = 'admin', foto_profil = null }) {
    // Check if email already exists
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new AppError('Email already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (nama, email, password, role, foto_profil, status)
       VALUES (?, ?, ?, ?, ?, 'aktif')`,
      [nama, email, hashedPassword, role, foto_profil]
    );

    logger.info('User created', { userId: result.insertId, email });

    return await this.findById(result.insertId);
  }

  /**
   * Update user
   */
  static async update(id, data) {
    const user = await this.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updates = [];
    const params = [];

    if (data.nama) {
      updates.push('nama = ?');
      params.push(data.nama);
    }

    if (data.email) {
      // Check if email is taken by another user
      const existing = await this.findByEmail(data.email);
      if (existing && existing.id !== id) {
        throw new AppError('Email already exists', 409);
      }
      updates.push('email = ?');
      params.push(data.email);
    }

    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updates.push('password = ?');
      params.push(hashedPassword);
    }

    if (data.role) {
      updates.push('role = ?');
      params.push(data.role);
    }

    if (data.foto_profil !== undefined) {
      updates.push('foto_profil = ?');
      params.push(data.foto_profil);
    }

    if (data.status) {
      updates.push('status = ?');
      params.push(data.status);
    }

    if (updates.length === 0) {
      return user;
    }

    params.push(id);

    await query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    logger.info('User updated', { userId: id });

    return await this.findById(id);
  }

  /**
   * Delete user
   */
  static async delete(id) {
    const user = await this.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Don't allow deleting superadmin
    if (user.role === 'superadmin') {
      throw new AppError('Cannot delete superadmin', 403);
    }

    await query('DELETE FROM users WHERE id = ?', [id]);

    logger.info('User deleted', { userId: id });

    return true;
  }

  /**
   * Verify password
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Update last login
   */
  static async updateLastLogin(id) {
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
  }

  /**
   * Get user statistics
   */
  static async getStats() {
    const stats = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'superadmin' THEN 1 ELSE 0 END) as superadmins,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'nonaktif' THEN 1 ELSE 0 END) as inactive
      FROM users
    `);

    return stats[0];
  }
}

module.exports = User;
