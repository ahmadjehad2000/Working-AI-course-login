import express from 'express';
import { z } from 'zod';
import { pocketBaseService } from '../services/pocketbase';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/roles';
import { validateQuery, validateParams } from '../middleware/validation';

const router = express.Router();

const querySchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  search: z.string().optional(),
  role: z.enum(['student', 'instructor', 'admin']).optional(),
  active: z.string().transform(val => val === 'true').optional()
});

const paramsSchema = z.object({
  id: z.string().min(1)
});

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = req.user!;

    // Get user's badges
    const badges = await pocketBaseService.getBadgesByUserId(user.id);

    // Get user's certificates
    const certificates = await pocketBaseService.getCertificatesByUserId(user.id);

    // Get user's enrollments
    const enrollments = await pocketBaseService.getEnrollmentsByUserId(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        profile_image: user.profile_image,
        first_time_login: user.first_time_login,
        is_active: user.is_active,
        last_login: user.last_login,
        created: user.created
      },
      stats: {
        enrollments: enrollments.length,
        completedCourses: enrollments.filter(e => e.is_completed).length,
        certificates: certificates.length,
        badges: badges.length
      },
      badges,
      certificates: certificates.slice(0, 5), // Latest 5 certificates
      enrollments: enrollments.slice(0, 5) // Latest 5 enrollments
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [student, instructor, admin]
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Admin access required
 */
router.get('/', authenticateToken, requireAdmin(), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, active } = req.query as any;

    let filter = '';
    const conditions = [];

    if (active !== undefined) {
      conditions.push(`is_active = ${active}`);
    }

    if (search) {
      conditions.push(`(first_name ~ "${search}" || last_name ~ "${search}" || email ~ "${search}")`);
    }

    if (role) {
      conditions.push(`role = "${role}"`);
    }

    filter = conditions.join(' && ');

    const result = await pocketBaseService.getAllUsers();

    // Remove sensitive data
    const sanitizedUsers = result.map(user => ({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      profile_image: user.profile_image,
      first_time_login: user.first_time_login,
      is_active: user.is_active,
      last_login: user.last_login,
      created: user.created
    }));

    res.json({
      users: sanitizedUsers,
      pagination: {
        page,
        limit,
        total: result.length,
        pages: Math.ceil(result.length / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 *       403:
 *         description: Admin access required
 */
router.get('/:id', authenticateToken, requireAdmin(), validateParams(paramsSchema), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await pocketBaseService.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's enrollments
    const enrollments = await pocketBaseService.getEnrollmentsByUserId(id);

    // Get user's certificates
    const certificates = await pocketBaseService.getCertificatesByUserId(id);

    // Get user's badges
    const badges = await pocketBaseService.getBadgesByUserId(id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        profile_image: user.profile_image,
        first_time_login: user.first_time_login,
        is_active: user.is_active,
        last_login: user.last_login,
        created: user.created
      },
      enrollments,
      certificates,
      badges
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * @swagger
 * /api/users/{id}/activate:
 *   put:
 *     summary: Activate/deactivate user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_active
 *             properties:
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User status updated
 *       404:
 *         description: User not found
 *       403:
 *         description: Admin access required
 */
router.put('/:id/activate', authenticateToken, requireAdmin(), validateParams(paramsSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const existingUser = await pocketBaseService.getUserById(id);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await pocketBaseService.updateUser(id, { is_active });

    res.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        role: updatedUser.role,
        is_active: updatedUser.is_active
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

export default router;
