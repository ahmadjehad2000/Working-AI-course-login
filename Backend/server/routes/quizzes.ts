import express from 'express';
import { z } from 'zod';
import { pocketBaseService } from '../services/pocketbase';
import { authenticateToken } from '../middleware/auth';
import { validateParams } from '../middleware/validation';

const router = express.Router();

const paramsSchema = z.object({
  moduleId: z.string().min(1),
  id: z.string().min(1).optional()
});

const attemptSchema = z.object({
  answers: z.record(z.string()),
  time_taken: z.number().positive().optional()
});

/**
 * @swagger
 * /api/modules/{moduleId}/quizzes:
 *   get:
 *     summary: Get quizzes for a module
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of quizzes
 *       404:
 *         description: Module not found
 */
router.get('/modules/:moduleId/quizzes', authenticateToken, validateParams(paramsSchema), async (req, res) => {
  try {
    const { moduleId } = req.params;

    const quizzes = await pocketBaseService.getQuizzesByModuleId(moduleId);

    // Remove correct answers from response for security
    const sanitizedQuizzes = quizzes.map(quiz => ({
      ...quiz,
      questions: quiz.questions?.map(q => ({
        question: q.question,
        type: q.type,
        options: q.options
        // correct_answer is intentionally omitted
      }))
    }));

    res.json({ quizzes: sanitizedQuizzes });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

/**
 * @swagger
 * /api/modules/{moduleId}/quizzes/{id}:
 *   get:
 *     summary: Get quiz by ID
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
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
 *         description: Quiz details
 *       404:
 *         description: Quiz not found
 */
router.get('/modules/:moduleId/quizzes/:id', authenticateToken, validateParams(z.object({ moduleId: z.string(), id: z.string() })), async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await pocketBaseService.getQuizById(id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Remove correct answers from response for security
    const sanitizedQuiz = {
      ...quiz,
      questions: quiz.questions?.map(q => ({
        question: q.question,
        type: q.type,
        options: q.options
        // correct_answer is intentionally omitted
      }))
    };

    res.json({ quiz: sanitizedQuiz });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

/**
 * @swagger
 * /api/modules/{moduleId}/quizzes/{id}/attempt:
 *   post:
 *     summary: Submit quiz attempt
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
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
 *               - answers
 *             properties:
 *               answers:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *               time_taken:
 *                 type: number
 *     responses:
 *       200:
 *         description: Quiz attempt submitted successfully
 *       400:
 *         description: Invalid attempt or max attempts reached
 *       404:
 *         description: Quiz not found
 */
router.post('/modules/:moduleId/quizzes/:id/attempt', authenticateToken, validateParams(z.object({ moduleId: z.string(), id: z.string() })), async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, time_taken } = req.body;

    const quiz = await pocketBaseService.getQuizById(id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check if quiz is already completed
    if (quiz.is_completed) {
      return res.status(400).json({ error: 'Quiz already completed' });
    }

    // Check if max attempts reached
    if (quiz.tried_attempts >= quiz.max_attempts) {
      return res.status(400).json({ error: 'Maximum attempts reached' });
    }

    // Calculate score
    let correctAnswers = 0;
    const totalQuestions = quiz.questions?.length || 0;

    if (quiz.questions && totalQuestions > 0) {
      quiz.questions.forEach((question, index) => {
        const userAnswer = answers[index.toString()];
        if (userAnswer === question.correct_answer) {
          correctAnswers++;
        }
      });
    }

    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const passed = score >= quiz.passing_score;

    // Update quiz attempts
    const updateData = {
      tried_attempts: quiz.tried_attempts + 1,
      is_completed: passed
    };

    await pocketBaseService.updateQuiz(id, updateData);

    // Log quiz attempt activity
    await pocketBaseService.logActivity({
      activity_type: 'quiz_attempt',
      resource_id: id,
      metadata: {
        score,
        passed,
        attempt_number: quiz.tried_attempts + 1,
        time_taken
      }
    });

    res.json({
      score,
      passed,
      correctAnswers,
      totalQuestions,
      attemptsUsed: quiz.tried_attempts + 1,
      maxAttempts: quiz.max_attempts,
      completed: passed
    });
  } catch (error) {
    console.error('Quiz attempt error:', error);
    res.status(500).json({ error: 'Failed to submit quiz attempt' });
  }
});

export default router;
