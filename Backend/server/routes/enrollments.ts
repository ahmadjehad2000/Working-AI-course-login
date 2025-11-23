import express from 'express';
import { z } from 'zod';
import { pocketBaseService } from '../services/pocketbase';
import { authenticateToken } from '../middleware/auth';
import { requireOwnershipOrRole } from '../middleware/roles';
import { validateBody, validateParams } from '../middleware/validation';
import { insertEnrollmentSchema } from '@shared/schema';

const router = express.Router();

const paramsSchema = z.object({
  id: z.string().min(1)
});

const enrollmentBodySchema = z.object({
  course_id: z.string().min(1)
});

/**
 * @swagger
 * /api/enrollments:
 *   get:
 *     summary: Get user's enrollments
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user enrollments
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    const enrollments = await pocketBaseService.getEnrollmentsByUserId(userId);

    res.json({ enrollments });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

/**
 * @swagger
 * /api/enrollments:
 *   post:
 *     summary: Enroll in a course
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - course_id
 *             properties:
 *               course_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Enrolled successfully
 *       400:
 *         description: Already enrolled or course not found
 */
router.post('/', authenticateToken, validateBody(enrollmentBodySchema), async (req, res) => {
  try {
    const { course_id } = req.body;
    const userId = req.user!.id;

    // Check if course exists and is published
    const course = await pocketBaseService.getCourseById(course_id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (!course.is_published) {
      return res.status(400).json({ error: 'Course is not published' });
    }

    // Check if already enrolled
    const existingEnrollment = await pocketBaseService.getEnrollmentByUserAndCourse(userId, course_id);
    if (existingEnrollment) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Create enrollment
    const enrollmentData = {
      user_id: userId,
      course_id,
      progress_percentage: 0,
      is_completed: false,
      certificate_issued: false
    };

    const enrollment = await pocketBaseService.createEnrollment(enrollmentData);

    res.status(201).json({ enrollment });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ error: 'Failed to enroll in course' });
  }
});

/**
 * @swagger
 * /api/enrollments/{id}/progress:
 *   put:
 *     summary: Update enrollment progress
 *     tags: [Enrollments]
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
 *             properties:
 *               progress_percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               is_completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Progress updated successfully
 *       404:
 *         description: Enrollment not found
 *       403:
 *         description: Access denied
 */
router.put('/:id/progress', authenticateToken, validateParams(paramsSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { progress_percentage, is_completed } = req.body;

    // Get enrollment to check ownership
    const enrollment = await pocketBaseService.getUserEnrollments(req.user!.id);
    const userEnrollment = enrollment.find(e => e.id === id);

    if (!userEnrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    const updateData: any = {};

    if (progress_percentage !== undefined) {
      updateData.progress_percentage = Math.min(100, Math.max(0, progress_percentage));
    }

    if (is_completed !== undefined) {
      updateData.is_completed = is_completed;
      if (is_completed) {
        updateData.completion_date = new Date().toISOString().split('T')[0];
        updateData.progress_percentage = 100;
      }
    }

    updateData.last_accessed_at = new Date().toISOString();

    const updatedEnrollment = await pocketBaseService.updateEnrollment(id, updateData);

    // Log activity
    await pocketBaseService.logActivity({
      activity_type: 'lesson_complete',
      resource_id: userEnrollment.course_id,
      metadata: { 
        progress: updateData.progress_percentage,
        completed: updateData.is_completed
      }
    });

    res.json({ enrollment: updatedEnrollment });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

/**
 * @swagger
 * /api/enrollments/{id}:
 *   get:
 *     summary: Get enrollment details
 *     tags: [Enrollments]
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
 *         description: Enrollment details
 *       404:
 *         description: Enrollment not found
 *       403:
 *         description: Access denied
 */
router.get('/:id', authenticateToken, validateParams(paramsSchema), async (req, res) => {
  try {
    const { id } = req.params;

    // Get user's enrollments to check ownership
    const enrollments = await pocketBaseService.getUserEnrollments(req.user!.id, 'course_id');
    const enrollment = enrollments.find(e => e.id === id);

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    res.json({ enrollment });
  } catch (error) {
    console.error('Get enrollment error:', error);
    res.status(500).json({ error: 'Failed to fetch enrollment' });
  }
});

export default router;
