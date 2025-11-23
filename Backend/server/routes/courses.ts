import express from 'express';
import { z } from 'zod';
import { pocketBaseService } from '../services/pocketbase';
import { authenticateToken } from '../middleware/auth';
import { requireInstructorOrAdmin } from '../middleware/roles';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { insertCourseSchema } from '@shared/schema';

const router = express.Router();

const querySchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  search: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  published: z.string().transform(val => val === 'true').optional()
});

const paramsSchema = z.object({
  id: z.string().min(1)
});

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get courses with pagination and filtering
 *     tags: [Courses]
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
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *       - in: query
 *         name: published
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of courses
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, difficulty, published } = req.query as any;

    let filter = '';
    const conditions = [];

    if (published !== undefined) {
      conditions.push(`is_published = ${published}`);
    } else {
      // Default to only published courses for non-authenticated users
      if (!req.user || req.user.role === 'student') {
        conditions.push('is_published = true');
      }
    }

    if (search) {
      conditions.push(`(title ~ "${search}" || overview ~ "${search}")`);
    }

    if (difficulty) {
      conditions.push(`difficulty_level = "${difficulty}"`);
    }

    filter = conditions.join(' && ');

    const result = await pocketBaseService.getAllCourses();

    res.json({
      courses: result,
      pagination: {
        page,
        limit,
        total: result.length,
        pages: Math.ceil(result.length / limit)
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course details
 *       404:
 *         description: Course not found
 */
router.get('/:id', validateParams(paramsSchema), async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await pocketBaseService.getCourseById(id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if user can access unpublished courses
    if (!course.is_published && (!req.user || req.user.role === 'student')) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Get course modules
      const modules = await pocketBaseService.getModulesByCourseId(id);

    // Log course view activity
    if (req.user) {
      await pocketBaseService.logActivity({
        activity_type: 'course_view',
        resource_id: id,
        metadata: { course_title: course.title }
      });
    }

    res.json({
      course,
      modules
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - overview
 *               - objective
 *               - difficulty_level
 *               - estimated_duration
 *             properties:
 *               title:
 *                 type: string
 *               overview:
 *                 type: string
 *               objective:
 *                 type: string
 *               difficulty_level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               estimated_duration:
 *                 type: number
 *               thumbnail_url:
 *                 type: string
 *                 format: uri
 *               is_published:
 *                 type: boolean
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Course created successfully
 *       403:
 *         description: Insufficient permissions
 */
router.post('/', authenticateToken, requireInstructorOrAdmin(), validateBody(insertCourseSchema), async (req, res) => {
  try {
    const courseData = req.body;
    
    const course = await pocketBaseService.createCourse(courseData);

    res.status(201).json({ course });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Update course
 *     tags: [Courses]
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
 *         description: Course updated successfully
 *       404:
 *         description: Course not found
 *       403:
 *         description: Insufficient permissions
 */
router.put('/:id', authenticateToken, requireInstructorOrAdmin(), validateParams(paramsSchema), validateBody(insertCourseSchema.partial()), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existingCourse = await pocketBaseService.getCourseById(id);
    if (!existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = await pocketBaseService.updateCourse(id, updateData);

    res.json({ course });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Delete course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Course deleted successfully
 *       404:
 *         description: Course not found
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/:id', authenticateToken, requireInstructorOrAdmin(), validateParams(paramsSchema), async (req, res) => {
  try {
    const { id } = req.params;

    const existingCourse = await pocketBaseService.getCourseById(id);
    if (!existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }

    await pocketBaseService.deleteCourse(id);

    res.status(204).send();
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

export default router;
