import express from 'express';
import { z } from 'zod';
import { pocketBaseService } from '../services/pocketbase';
import { authenticateToken } from '../middleware/auth';
import { requireInstructorOrAdmin } from '../middleware/roles';
import { validateBody, validateParams } from '../middleware/validation';
import { insertModuleSchema } from '@shared/schema';

const router = express.Router();

const paramsSchema = z.object({
  courseId: z.string().min(1),
  id: z.string().min(1).optional()
});

/**
 * @swagger
 * /api/courses/{courseId}/modules:
 *   get:
 *     summary: Get modules for a course
 *     tags: [Modules]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of modules
 *       404:
 *         description: Course not found
 */
router.get('/courses/:courseId/modules', validateParams(paramsSchema), async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if course exists
    const course = await pocketBaseService.getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check access permissions for unpublished courses
    if (!course.is_published && (!req.user || req.user.role === 'student')) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const modules = await pocketBaseService.getModulesByCourseId(courseId);

    res.json({ modules });
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

/**
 * @swagger
 * /api/courses/{courseId}/modules:
 *   post:
 *     summary: Create a new module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
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
 *               - title
 *               - description
 *               - sequence_order
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               sequence_order:
 *                 type: integer
 *               content_url:
 *                 type: string
 *                 format: uri
 *               video_url:
 *                 type: string
 *                 format: uri
 *               duration_minutes:
 *                 type: number
 *     responses:
 *       201:
 *         description: Module created successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Course not found
 */
router.post('/courses/:courseId/modules', authenticateToken, requireInstructorOrAdmin(), validateParams(paramsSchema), validateBody(insertModuleSchema.omit({ course_id: true })), async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if course exists
    const course = await pocketBaseService.getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const moduleData = {
      ...req.body,
      course_id: courseId
    };

    const module = await pocketBaseService.createModule(moduleData);

    res.status(201).json({ module });
  } catch (error) {
    console.error('Create module error:', error);
    res.status(500).json({ error: 'Failed to create module' });
  }
});

/**
 * @swagger
 * /api/courses/{courseId}/modules/{id}:
 *   put:
 *     summary: Update module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Module updated successfully
 *       404:
 *         description: Module or course not found
 *       403:
 *         description: Insufficient permissions
 */
router.put('/courses/:courseId/modules/:id', authenticateToken, requireInstructorOrAdmin(), validateParams(z.object({ courseId: z.string(), id: z.string() })), validateBody(insertModuleSchema.omit({ course_id: true }).partial()), async (req, res) => {
  try {
    const { courseId, id } = req.params;

    // Check if course exists
    const course = await pocketBaseService.getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const updateData = req.body;
    const module = await pocketBaseService.updateModule(id, updateData);

    res.json({ module });
  } catch (error) {
    console.error('Update module error:', error);
    res.status(500).json({ error: 'Failed to update module' });
  }
});

/**
 * @swagger
 * /api/courses/{courseId}/modules/{id}:
 *   delete:
 *     summary: Delete module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Module deleted successfully
 *       404:
 *         description: Module or course not found
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/courses/:courseId/modules/:id', authenticateToken, requireInstructorOrAdmin(), validateParams(z.object({ courseId: z.string(), id: z.string() })), async (req, res) => {
  try {
    const { courseId, id } = req.params;

    // Check if course exists
    const course = await pocketBaseService.getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    await pocketBaseService.deleteModule(id);

    res.status(204).send();
  } catch (error) {
    console.error('Delete module error:', error);
    res.status(500).json({ error: 'Failed to delete module' });
  }
});

export default router;
