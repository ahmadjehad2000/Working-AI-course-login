import express from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { pocketBaseService } from '../services/pocketbase';
import { authenticateToken } from '../middleware/auth';
import { requireInstructorOrAdmin } from '../middleware/roles';
import { validateParams } from '../middleware/validation';

const router = express.Router();

const paramsSchema = z.object({
  id: z.string().min(1)
});

const verificationSchema = z.object({
  code: z.string().min(8)
});

/**
 * @swagger
 * /api/certificates:
 *   get:
 *     summary: Get user's certificates
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user certificates
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    const certificates = await pocketBaseService.getCertificatesByUserId(userId);

    res.json({ certificates });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

/**
 * @swagger
 * /api/certificates/issue/{enrollmentId}:
 *   post:
 *     summary: Issue certificate for completed course
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Certificate issued successfully
 *       400:
 *         description: Course not completed or certificate already issued
 *       404:
 *         description: Enrollment not found
 */
router.post('/issue/:enrollmentId', authenticateToken, validateParams(z.object({ enrollmentId: z.string() })), async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const userId = req.user!.id;

    // Get user enrollments to verify ownership and completion
    const enrollments = await pocketBaseService.getUserEnrollments(userId, 'course_id');
    const enrollment = enrollments.find(e => e.id === enrollmentId);

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    if (!enrollment.is_completed) {
      return res.status(400).json({ error: 'Course must be completed before issuing certificate' });
    }

    if (enrollment.certificate_issued) {
      return res.status(400).json({ error: 'Certificate already issued for this course' });
    }

    // Generate verification code
    const verificationCode = crypto.randomBytes(16).toString('hex').toUpperCase();

    // Create certificate
    const certificateData = {
      user_id: userId,
      course_id: enrollment.course_id,
      issued_at: new Date().toISOString().split('T')[0],
      certificate_url: `https://certificates.example.com/${verificationCode}.pdf`, // Replace with actual certificate generation
      verification_code: verificationCode
    };

    const certificate = await pocketBaseService.createCertificate(certificateData);

    // Update enrollment to mark certificate as issued
    await pocketBaseService.updateEnrollment(enrollmentId, {
      certificate_issued: true
    });

    // Log badge earned activity
    await pocketBaseService.logActivity({
      activity_type: 'badge_earned',
      resource_id: certificate.id,
      metadata: {
        certificate_code: verificationCode,
        course_id: enrollment.course_id
      }
    });

    res.status(201).json({ certificate });
  } catch (error) {
    console.error('Issue certificate error:', error);
    res.status(500).json({ error: 'Failed to issue certificate' });
  }
});

/**
 * @swagger
 * /api/certificates/verify:
 *   post:
 *     summary: Verify certificate by verification code
 *     tags: [Certificates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Certificate verification result
 *       404:
 *         description: Certificate not found
 */
router.post('/verify', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || code.length < 8) {
      return res.status(400).json({ error: 'Valid verification code required' });
    }

    const certificate = await pocketBaseService.getCertificateByVerificationCode(code);

    if (!certificate) {
      return res.status(404).json({ 
        valid: false,
        error: 'Certificate not found' 
      });
    }

    // Get additional details
    const user = await pocketBaseService.getUserById(certificate.user_id);
    const course = await pocketBaseService.getCourseById(certificate.course_id);

    res.json({
      valid: true,
      certificate: {
        id: certificate.id,
        issued_at: certificate.issued_at,
        verification_code: certificate.verification_code,
        certificate_url: certificate.certificate_url
      },
      user: user ? {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email
      } : null,
      course: course ? {
        title: course.title,
        difficulty_level: course.difficulty_level
      } : null
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({ error: 'Failed to verify certificate' });
  }
});

/**
 * @swagger
 * /api/certificates/{id}:
 *   get:
 *     summary: Get certificate details
 *     tags: [Certificates]
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
 *         description: Certificate details
 *       404:
 *         description: Certificate not found
 *       403:
 *         description: Access denied
 */
router.get('/:id', authenticateToken, validateParams(paramsSchema), async (req, res) => {
  try {
    const { id } = req.params;

    // Get user's certificates to check ownership
    const certificates = await pocketBaseService.getCertificatesByUser(req.user!.id, 'course_id');
    const certificate = certificates.find(c => c.id === id);

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.json({ certificate });
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
});

export default router;
