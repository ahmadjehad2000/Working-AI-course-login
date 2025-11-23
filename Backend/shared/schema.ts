import { z } from "zod";

// User roles enum
export const UserRole = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin'
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Difficulty levels enum
export const DifficultyLevel = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced'
} as const;

export type DifficultyLevelType = typeof DifficultyLevel[keyof typeof DifficultyLevel];

// User schemas
export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  role: z.enum(['student', 'instructor', 'admin']).default('student'),
  first_time_login: z.boolean().default(true),
  is_active: z.boolean().default(true),
  profile_image: z.string().optional(), // file upload
  last_login: z.string().optional()
});

export const selectUserSchema = insertUserSchema.extend({
  id: z.string(),
  created: z.string(),
  updated: z.string()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const registerSchema = insertUserSchema.pick({
  email: true,
  first_name: true,
  last_name: true,
  role: true
}).extend({
  password: z.string().min(6),
  password_confirm: z.string().min(6)
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ["password_confirm"]
});

// Course schemas
export const insertCourseSchema = z.object({
  title: z.string().min(1),
  overview: z.string().min(10),
  objective: z.string().min(10),
  thumbnail_url: z.string().url().optional(),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  estimated_duration: z.number().positive(),
  is_published: z.boolean().default(false),
  tags: z.array(z.string()).optional()
});

export const selectCourseSchema = insertCourseSchema.extend({
  id: z.string(),
  created_at: z.string(),
  updated_at: z.string()
});

// Module schemas
export const insertModuleSchema = z.object({
  course_id: z.string(),
  title: z.string().min(1),
  description: z.string().min(10),
  sequence_order: z.number().int().positive(),
  content_url: z.string().url().optional(),
  video_url: z.string().url().optional(),
  duration_minutes: z.number().positive().optional()
});

export const selectModuleSchema = insertModuleSchema.extend({
  id: z.string(),
  created_at: z.string(),
  updated_at: z.string()
});

// Enrollment schemas
export const insertEnrollmentSchema = z.object({
  course_id: z.string(),
  user_id: z.string(),
  progress_percentage: z.number().min(0).max(100).default(0),
  is_completed: z.boolean().default(false),
  certificate_issued: z.boolean().default(false),
  completion_date: z.string().optional(),
  last_accessed_at: z.string().optional()
});

export const selectEnrollmentSchema = insertEnrollmentSchema.extend({
  id: z.string(),
  enrolled_at: z.string(),
  updated_at: z.string()
});

// Quiz schemas
export const insertQuizSchema = z.object({
  module_id: z.string(),
  title: z.string().min(1),
  description: z.string().min(10),
  time_limit_minutes: z.number().positive(),
  passing_score: z.number().min(0).max(100),
  max_attempts: z.number().int().positive(),
  tried_attempts: z.number().int().min(0).default(0),
  is_mandatory: z.boolean().default(false),
  is_completed: z.boolean().default(false),
  questions: z.array(z.object({
    question: z.string(),
    type: z.enum(['multiple_choice', 'true_false', 'short_answer']),
    options: z.array(z.string()).optional(),
    correct_answer: z.string()
  })).optional()
});

export const selectQuizSchema = insertQuizSchema.extend({
  id: z.string(),
  created_at: z.string(),
  updated_at: z.string()
});

// Certificate schemas
export const insertCertificateSchema = z.object({
  user_id: z.string(),
  course_id: z.string(),
  issued_at: z.string(),
  certificate_url: z.string().url(),
  verification_code: z.string().min(8)
});

export const selectCertificateSchema = insertCertificateSchema.extend({
  id: z.string(),
  created: z.string(),
  updated: z.string()
});

// Badge schemas
export const insertBadgeSchema = z.object({
    user_id: z.string(),
    module_id: z.string(),
    awarded_at: z.string(),
    image_url: z.string().optional(), // file upload
    is_visible: z.boolean().default(true)
});

export const selectBadgeSchema = insertBadgeSchema.extend({
  id: z.string(),
  awarded_at: z.string(),
  updated: z.string()
});

// Activity log schemas
export const insertActivitySchema = z.object({
  user_id: z.string(),
  activity_type: z.enum(['login', 'course_view', 'lesson_complete', 'quiz_attempt', 'badge_earned']),
  resource_id: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export const selectActivitySchema = insertActivitySchema.extend({
  id: z.string(),
  created: z.string()
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type SelectCourse = z.infer<typeof selectCourseSchema>;

export type InsertModule = z.infer<typeof insertModuleSchema>;
export type SelectModule = z.infer<typeof selectModuleSchema>;

export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type SelectEnrollment = z.infer<typeof selectEnrollmentSchema>;

export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type SelectQuiz = z.infer<typeof selectQuizSchema>;

export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type SelectCertificate = z.infer<typeof selectCertificateSchema>;

export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type SelectBadge = z.infer<typeof selectBadgeSchema>;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type SelectActivity = z.infer<typeof selectActivitySchema>;
