import express from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validation';
import {
  AiGenerationResponse,
  generateCourseWithAI,
} from '../services/ai';

const router = express.Router();

const generateSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
});

const buildPrefillFromAi = (aiResponse: AiGenerationResponse) => {
  const course = aiResponse.course;
  if (!course) return undefined;

  const safeEstimatedDuration =
    course.estimated_hours && course.estimated_hours > 0
      ? course.estimated_hours
      : Math.max(course.modules?.length || 1, 1);

  const overview =
    course.overview ||
    course.modules?.[0]?.description ||
    '';

  const objective = course.objectives?.length
    ? course.objectives.map((line) => `- ${line}`).join('\n')
    : '';

  return {
    title: course.title,
    overview,
    objective,
    tags: course.tags || [],
    difficulty_level: course.difficulty,
    estimated_duration: safeEstimatedDuration,
  };
};

router.post(
  '/ai/generate',
  validateBody(generateSchema),
  async (req, res) => {
    const { title, difficulty } = req.body as z.infer<typeof generateSchema>;

    try {
      const aiResponse = await generateCourseWithAI({ title, difficulty });

      if (!aiResponse.success) {
        return res.status(500).json({
          success: false,
          error: aiResponse.error || 'AI generation failed',
          message: 'The AI service was unable to generate a course. Please try again.',
        });
      }

      const prefill = buildPrefillFromAi(aiResponse);

      res.json({
        success: true,
        ...aiResponse,
        prefill,
      });
    } catch (error: any) {
      console.error('AI generation error:', error);

      // Provide helpful error messages based on error type
      let userMessage = 'Failed to generate course with AI';
      let statusCode = 500;

      if (error.message?.includes('timed out')) {
        userMessage = 'The AI service is taking too long to respond. Please try again.';
        statusCode = 504;
      } else if (error.message?.includes('ECONNREFUSED') || error.message?.includes('Failed to contact')) {
        userMessage = 'Cannot connect to AI service. Please ensure the AI service is running.';
        statusCode = 503;
      } else if (error.message?.includes('API key')) {
        userMessage = 'AI service configuration error. Please contact support.';
        statusCode = 500;
      }

      res.status(statusCode).json({
        success: false,
        error: userMessage,
        message: error?.message || 'Unknown error occurred',
      });
    }
  }
);

export default router;
