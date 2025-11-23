import PocketBase from 'pocketbase';
import type { 
  InsertUser, SelectUser, InsertCourse, SelectCourse,
  InsertModule, SelectModule, InsertEnrollment, SelectEnrollment,
  InsertQuiz, SelectQuiz, InsertCertificate, SelectCertificate,
  InsertBadge, SelectBadge, InsertActivity, SelectActivity
} from '@shared/schema';

export class PocketBaseService {
  private pb: PocketBase;
  private isAuthenticated = false;

  constructor() {
    this.pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');
  }

  async authenticate(): Promise<void> {
    if (this.isAuthenticated) return;

    try {
      // Check if PocketBase is reachable
      const health = await this.pb.health.check();
      if (health.code !== 200) {
        throw new Error(`PocketBase health check failed with code ${health.code}`);
      }

      try {
        const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@admin.com';
        const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || 'Admin123456!';
        
        const authData = await this.pb.send('/api/admins/auth-with-password', {
            method: 'POST',
            body: {
                identity: adminEmail,
                password: adminPassword,
            }
        });
        this.pb.authStore.save(authData.token, authData.admin);
        this.isAuthenticated = true;
        console.log('✓ PocketBase admin authenticated');
        return;
      } catch (manualError: any) {
         console.error('Manual auth failed, trying SDK method:', manualError?.message || manualError);
      }

      await this.pb.admins.authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL || 'admin@admin.com',
        process.env.POCKETBASE_ADMIN_PASSWORD || 'Admin123456!'
      );
      this.isAuthenticated = true;
      console.log('✓ PocketBase admin authenticated');
    } catch (error: any) {
      console.error('✗ PocketBase authentication failed:', error?.message || error);
      // If it's a connection error, provide a more helpful message
      if (error?.cause?.code === 'ECONNREFUSED') {
        throw new Error('PocketBase is not running or not reachable at ' + this.pb.baseUrl);
      }
      throw new Error('Failed to authenticate with PocketBase: ' + (error?.message || 'Unknown error'));
    }
  }

  // Authenticate a user (for login)
  async authenticateUser(email: string, password: string): Promise<any> {
    try {
      const authData = await this.pb.collection('app_users').authWithPassword(email, password);
      return authData;
    } catch (error: any) {
      console.error('User authentication failed:', error);
      return null;
    }
  }

  // User operations
  async createUser(userData: any): Promise<SelectUser> {
    try {
      // Create user directly in app_users collection (auth collection)
      // PocketBase will handle password hashing automatically
      const password = userData.password || userData.password_hash || 'defaultPassword123!';
      const pbUserData = {
        email: userData.email,
        password: password,
        passwordConfirm: password,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role || 'student',
        verified: userData.verified ?? false,
        first_time_login: userData.first_time_login ?? true,
        is_active: userData.is_active ?? true,
        profile_image: userData.profile_image, // file upload
        last_login: userData.last_login
      };
      const user = await this.pb.collection('app_users').create(pbUserData);
      return user as unknown as SelectUser;
    } catch (error: any) {
      console.error('Error creating user:', error);
      throw new Error(error?.message || 'Failed to create user');
    }
  }

  async getUserById(id: string): Promise<SelectUser | null> {
    await this.authenticate();
    try {
      const user = await this.pb.collection('app_users').getOne(id);
      return user as unknown as SelectUser;
    } catch {
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<SelectUser | null> {
    await this.authenticate();
    try {
      const records = await this.pb.collection('app_users').getFullList({
        filter: `email = "${email}"`
      });
      return records.length > 0 ? records[0] as unknown as SelectUser : null;
    } catch {
      return null;
    }
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<SelectUser> {
    await this.authenticate();
    try {
      const user = await this.pb.collection('app_users').update(id, userData);
      return user as unknown as SelectUser;
    } catch (error: any) {
      console.error('Error updating user:', error);
      throw new Error(error?.message || 'Failed to update user');
    }
  }

  async getAllUsers(): Promise<SelectUser[]> {
    await this.authenticate();
    try {
      const users = await this.pb.collection('app_users').getFullList();
      return users as unknown as SelectUser[];
    } catch (error: any) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  // Course operations
  async createCourse(courseData: Omit<InsertCourse, 'id' | 'created_at' | 'updated_at'>): Promise<SelectCourse> {
    await this.authenticate();
    try {
      // Map file upload field
      const pbCourseData = {
        ...courseData,
        thumbnail_url: courseData.thumbnail_url
      };
      const course = await this.pb.collection('courses').create(pbCourseData);
      return course as unknown as SelectCourse;
    } catch (error: any) {
      console.error('Error creating course:', error);
      throw new Error(error?.message || 'Failed to create course');
    }
  }

  async getCourseById(id: string): Promise<SelectCourse | null> {
    await this.authenticate();
    try {
      const course = await this.pb.collection('courses').getOne(id);
      return course as unknown as SelectCourse;
    } catch {
      return null;
    }
  }

  async getAllCourses(): Promise<SelectCourse[]> {
    await this.authenticate();
    try {
      const courses = await this.pb.collection('courses').getFullList();
      return courses as unknown as SelectCourse[];
    } catch (error: any) {
      console.error('Error getting courses:', error);
      return [];
    }
  }

  async updateCourse(id: string, courseData: Partial<InsertCourse>): Promise<SelectCourse> {
    await this.authenticate();
    try {
      const course = await this.pb.collection('courses').update(id, courseData);
      return course as unknown as SelectCourse;
    } catch (error: any) {
      console.error('Error updating course:', error);
      throw new Error(error?.message || 'Failed to update course');
    }
  }

  async deleteCourse(id: string): Promise<boolean> {
    await this.authenticate();
    try {
      await this.pb.collection('courses').delete(id);
      return true;
    } catch (error: any) {
      console.error('Error deleting course:', error);
      return false;
    }
  }

  // Module operations
  async createModule(moduleData: Omit<InsertModule, 'id' | 'created_at' | 'updated_at'>): Promise<SelectModule> {
    await this.authenticate();
    try {
      const module = await this.pb.collection('modules').create(moduleData);
      return module as unknown as SelectModule;
    } catch (error: any) {
      console.error('Error creating module:', error);
      throw new Error(error?.message || 'Failed to create module');
    }
  }

  async getModulesByCourseId(courseId: string): Promise<SelectModule[]> {
    await this.authenticate();
    try {
      const modules = await this.pb.collection('modules').getFullList({
        filter: `course_id = "${courseId}"`,
        sort: 'sequence_order'
      });
      return modules as unknown as SelectModule[];
    } catch (error: any) {
      console.error('Error getting modules:', error);
      return [];
    }
  }

  async updateModule(id: string, moduleData: Partial<InsertModule>): Promise<SelectModule> {
    await this.authenticate();
    try {
      const module = await this.pb.collection('modules').update(id, moduleData);
      return module as unknown as SelectModule;
    } catch (error: any) {
      console.error('Error updating module:', error);
      throw new Error(error?.message || 'Failed to update module');
    }
  }

  async deleteModule(id: string): Promise<boolean> {
    await this.authenticate();
    try {
      await this.pb.collection('modules').delete(id);
      return true;
    } catch (error: any) {
      console.error('Error deleting module:', error);
      return false;
    }
  }

  // Enrollment operations
  async createEnrollment(enrollmentData: Omit<InsertEnrollment, 'id' | 'enrolled_at' | 'updated_at'>): Promise<SelectEnrollment> {
    await this.authenticate();
    try {
      const enrollment = await this.pb.collection('course_enrollments').create(enrollmentData);
      return enrollment as unknown as SelectEnrollment;
    } catch (error: any) {
      console.error('Error creating enrollment:', error);
      throw new Error(error?.message || 'Failed to create enrollment');
    }
  }

  async getEnrollmentsByUserId(userId: string): Promise<SelectEnrollment[]> {
    await this.authenticate();
    try {
      const enrollments = await this.pb.collection('course_enrollments').getFullList({
        filter: `user_id = "${userId}"`
      });
      return enrollments as unknown as SelectEnrollment[];
    } catch (error: any) {
      console.error('Error getting enrollments:', error);
      return [];
    }
  }

  async updateEnrollment(id: string, enrollmentData: Partial<InsertEnrollment>): Promise<SelectEnrollment> {
    await this.authenticate();
    try {
      const enrollment = await this.pb.collection('enrollments').update(id, enrollmentData);
      return enrollment as unknown as SelectEnrollment;
    } catch (error: any) {
      console.error('Error updating enrollment:', error);
      throw new Error(error?.message || 'Failed to update enrollment');
    }
  }

  // Quiz operations
  async createQuiz(quizData: Omit<InsertQuiz, 'id' | 'created_at' | 'updated_at'>): Promise<SelectQuiz> {
    await this.authenticate();
    try {
      const quiz = await this.pb.collection('quizzes').create(quizData);
      return quiz as unknown as SelectQuiz;
    } catch (error: any) {
      console.error('Error creating quiz:', error);
      throw new Error(error?.message || 'Failed to create quiz');
    }
  }

  async getQuizzesByModuleId(moduleId: string): Promise<SelectQuiz[]> {
    await this.authenticate();
    try {
      const quizzes = await this.pb.collection('quizzes').getFullList({
        filter: `module_id = "${moduleId}"`
      });
      return quizzes as unknown as SelectQuiz[];
    } catch (error: any) {
      console.error('Error getting quizzes:', error);
      return [];
    }
  }

  async updateQuiz(id: string, quizData: Partial<InsertQuiz>): Promise<SelectQuiz> {
    await this.authenticate();
    try {
      const quiz = await this.pb.collection('quizzes').update(id, quizData);
      return quiz as unknown as SelectQuiz;
    } catch (error: any) {
      console.error('Error updating quiz:', error);
      throw new Error(error?.message || 'Failed to update quiz');
    }
  }

  // Certificate operations
  async createCertificate(certificateData: Omit<InsertCertificate, 'id' | 'created' | 'updated'>): Promise<SelectCertificate> {
    await this.authenticate();
    try {
      // Map file upload field
      const pbCertificateData = {
        ...certificateData,
        certificate_url: certificateData.certificate_url
      };
      const certificate = await this.pb.collection('certificates').create(pbCertificateData);
      return certificate as unknown as SelectCertificate;
    } catch (error: any) {
      console.error('Error creating certificate:', error);
      throw new Error(error?.message || 'Failed to create certificate');
    }
  }

  async getCertificatesByUserId(userId: string): Promise<SelectCertificate[]> {
    await this.authenticate();
    try {
      const certificates = await this.pb.collection('certificates').getFullList({
        filter: `user_id = "${userId}"`
      });
      return certificates as unknown as SelectCertificate[];
    } catch (error: any) {
      console.error('Error getting certificates:', error);
      return [];
    }
  }

  // Badge operations
  async createBadge(badgeData: Omit<InsertBadge, 'id' | 'awarded_at' | 'updated'>): Promise<SelectBadge> {
    await this.authenticate();
    try {
      // Map file upload field
      const pbBadgeData = {
        ...badgeData,
        image_url: badgeData.image_url
      };
      const badge = await this.pb.collection('user_badges').create(pbBadgeData);
      return badge as unknown as SelectBadge;
    } catch (error: any) {
      console.error('Error creating badge:', error);
      throw new Error(error?.message || 'Failed to create badge');
    }
  }

  async getBadgesByUserId(userId: string): Promise<SelectBadge[]> {
    await this.authenticate();
    try {
      const badges = await this.pb.collection('user_badges').getFullList({
        filter: `user_id = "${userId}"`
      });
      return badges as unknown as SelectBadge[];
    } catch (error: any) {
      console.error('Error getting badges:', error);
      return [];
    }
  }

  // Activity log operations
  async logActivity(activityData: Omit<InsertActivity, 'id' | 'created'>): Promise<SelectActivity> {
    await this.authenticate();
    try {
      const activity = await this.pb.collection('user_activity_logs').create(activityData);
      return activity as unknown as SelectActivity;
    } catch (error: any) {
      console.error('Error logging activity:', error);
      throw new Error(error?.message || 'Failed to log activity');
    }
  }

  async getActivitiesByUserId(userId: string): Promise<SelectActivity[]> {
    await this.authenticate();
    try {
      const activities = await this.pb.collection('user_activity_logs').getFullList({
        filter: `user_id = "${userId}"`,
        sort: '-created'
      });
      return activities as unknown as SelectActivity[];
    } catch (error: any) {
      console.error('Error getting activities:', error);
      return [];
    }
  }
}

export const pocketBaseService = new PocketBaseService();
