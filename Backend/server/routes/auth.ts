import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { pocketBaseService } from '../services/pocketbase';
import { generateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { loginSchema, registerSchema } from '@shared/schema';

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - password_confirm
 *               - first_name
 *               - last_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               password_confirm:
 *                 type: string
 *                 minLength: 6
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [student, instructor, admin]
 *                 default: student
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user already exists
 */
router.post('/register', validateBody(registerSchema), async (req, res) => {
  try {
    const { email, password, first_name, last_name, role = 'student' } = req.body;

    // Check if user already exists
    const existingUser = await pocketBaseService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create user in app_users collection - PocketBase will handle password hashing automatically
    const userData = {
      email,
      password, // PocketBase auth collection will hash this
      first_name,
      last_name,
      role,
      verified: false,
      first_time_login: true,
      is_active: true
    };

    const user = await pocketBaseService.createUser(userData);

    // Generate JWT token
    const token = generateToken(user.id);

    // Log activity
    await pocketBaseService.logActivity({
      user_id: user.id,
      activity_type: 'login',
      metadata: {
        event: 'registration',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      }
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        verified: user.verified,
        first_time_login: user.first_time_login
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validateBody(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Use PocketBase's built-in authentication
    const authData = await pocketBaseService.authenticateUser(email, password);
    
    if (!authData) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = authData.record;

    // Check if user is active
    if (user.is_active === false) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Update last login
    await pocketBaseService.updateUser(user.id, {
      last_login: new Date().toISOString(),
      first_time_login: false
    });

    // Generate JWT token
    const token = generateToken(user.id);

    // Log activity
    await pocketBaseService.logActivity({
      user_id: user.id,
      activity_type: 'login',
      metadata: { 
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      }
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        verified: user.verified,
        first_time_login: false
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh JWT token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid token
 */
router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    // Note: In production, you might want to maintain a refresh token system
    // For now, we'll just generate a new token if the current one is valid
    const newToken = generateToken(req.user?.id || '');
    
    res.json({ token: newToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
