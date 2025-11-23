#!/usr/bin/env node

/**
 * PocketBase Collection Setup Script
 * 
 * This script initializes all required collections in PocketBase for the AI Course Platform.
 * Run this script after starting PocketBase for the first time.
 * 
 * Usage: node setup-collections.js
 */

import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@admin.com';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || 'Admin123456!';

const pb = new PocketBase(POCKETBASE_URL);

// Collection schemas
const collections = [
  // Note: 'users' collection is created by PocketBase by default as an auth collection
  // We'll update it with additional fields instead of creating it
  {
    name: 'users',
    type: 'auth', // Use PocketBase's built-in auth collection
    update: true, // Flag to update instead of create
    schema: [
      { name: 'first_name', type: 'text', required: true },
      { name: 'last_name', type: 'text', required: true },
      { name: 'role', type: 'select', required: true, options: { maxSelect: 1, values: ['student', 'instructor', 'admin'] } },
      { name: 'is_active', type: 'bool', required: false },
      { name: 'avatar_url', type: 'url', required: false },
      { name: 'bio', type: 'text', required: false },
      { name: 'last_login', type: 'date', required: false },
      { name: 'first_time_login', type: 'bool', required: false }
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '',
    updateRule: '@request.auth.id = id',
    deleteRule: '@request.auth.role = "admin"'
  },
  {
    name: 'courses',
    type: 'base',
    schema: [
      { name: 'title', type: 'text', required: true },
      { name: 'overview', type: 'text', required: true },
      { name: 'objective', type: 'text', required: true },
      { name: 'thumbnail_url', type: 'url', required: false },
      { name: 'difficulty_level', type: 'select', required: true, options: { maxSelect: 1, values: ['beginner', 'intermediate', 'advanced'] } },
      { name: 'estimated_duration', type: 'number', required: true },
      { name: 'is_published', type: 'bool', required: false },
      { name: 'tags', type: 'json', required: false }
    ],
    listRule: 'is_published = true || @request.auth.role = "admin" || @request.auth.role = "instructor"',
    viewRule: 'is_published = true || @request.auth.role = "admin" || @request.auth.role = "instructor"',
    createRule: '@request.auth.role = "admin" || @request.auth.role = "instructor"',
    updateRule: '@request.auth.role = "admin" || @request.auth.role = "instructor"',
    deleteRule: '@request.auth.role = "admin"'
  },
  {
    name: 'modules',
    type: 'base',
    schema: [
      { name: 'course_id', type: 'relation', required: true, options: { collectionId: 'courses', cascadeDelete: true } },
      { name: 'title', type: 'text', required: true },
      { name: 'description', type: 'text', required: true },
      { name: 'sequence_order', type: 'number', required: true },
      { name: 'content_url', type: 'url', required: false },
      { name: 'video_url', type: 'url', required: false },
      { name: 'duration_minutes', type: 'number', required: false }
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin" || @request.auth.role = "instructor"',
    updateRule: '@request.auth.role = "admin" || @request.auth.role = "instructor"',
    deleteRule: '@request.auth.role = "admin"'
  },
  {
    name: 'enrollments',
    type: 'base',
    schema: [
      { name: 'course_id', type: 'relation', required: true, options: { collectionId: 'courses', cascadeDelete: true } },
      { name: 'user_id', type: 'relation', required: true, options: { collectionId: 'users', cascadeDelete: true } },
      { name: 'progress_percentage', type: 'number', required: false },
      { name: 'is_completed', type: 'bool', required: false },
      { name: 'certificate_issued', type: 'bool', required: false },
      { name: 'completion_date', type: 'date', required: false },
      { name: 'last_accessed_at', type: 'date', required: false }
    ],
    indexes: ['CREATE UNIQUE INDEX idx_enrollments_user_course ON enrollments (user_id, course_id)'],
    listRule: '@request.auth.id = user_id || @request.auth.role = "admin"',
    viewRule: '@request.auth.id = user_id || @request.auth.role = "admin"',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id = user_id || @request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"'
  },
  {
    name: 'quizzes',
    type: 'base',
    schema: [
      { name: 'module_id', type: 'relation', required: true, options: { collectionId: 'modules', cascadeDelete: true } },
      { name: 'title', type: 'text', required: true },
      { name: 'description', type: 'text', required: true },
      { name: 'time_limit_minutes', type: 'number', required: true },
      { name: 'passing_score', type: 'number', required: true },
      { name: 'max_attempts', type: 'number', required: true },
      { name: 'tried_attempts', type: 'number', required: false },
      { name: 'is_mandatory', type: 'bool', required: false },
      { name: 'is_completed', type: 'bool', required: false },
      { name: 'questions', type: 'json', required: false }
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin" || @request.auth.role = "instructor"',
    updateRule: '@request.auth.role = "admin" || @request.auth.role = "instructor"',
    deleteRule: '@request.auth.role = "admin"'
  },
  {
    name: 'certificates',
    type: 'base',
    schema: [
      { name: 'user_id', type: 'relation', required: true, options: { collectionId: 'users', cascadeDelete: true } },
      { name: 'course_id', type: 'relation', required: true, options: { collectionId: 'courses', cascadeDelete: true } },
      { name: 'issued_at', type: 'date', required: true },
      { name: 'certificate_url', type: 'url', required: true },
      { name: 'verification_code', type: 'text', required: true }
    ],
    indexes: ['CREATE UNIQUE INDEX idx_certificates_verification ON certificates (verification_code)'],
    listRule: '@request.auth.id = user_id || @request.auth.role = "admin"',
    viewRule: '@request.auth.id = user_id || @request.auth.role = "admin"',
    createRule: '@request.auth.role = "admin" || @request.auth.role = "instructor"',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"'
  },
  {
    name: 'badges',
    type: 'base',
    schema: [
      { name: 'user_id', type: 'relation', required: true, options: { collectionId: 'users', cascadeDelete: true } },
      { name: 'module_id', type: 'relation', required: true, options: { collectionId: 'modules', cascadeDelete: true } },
      { name: 'image_url', type: 'url', required: true },
      { name: 'is_visible', type: 'bool', required: false }
    ],
    listRule: '@request.auth.id = user_id || @request.auth.role = "admin"',
    viewRule: '@request.auth.id = user_id || @request.auth.role = "admin"',
    createRule: '@request.auth.role = "admin" || @request.auth.role = "instructor"',
    updateRule: '@request.auth.id = user_id || @request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"'
  },
  {
    name: 'activities',
    type: 'base',
    schema: [
      { name: 'activity_type', type: 'select', required: true, options: { maxSelect: 1, values: ['login', 'registration', 'course_view', 'lesson_complete', 'quiz_attempt', 'badge_earned'] } },
      { name: 'resource_id', type: 'text', required: false },
      { name: 'metadata', type: 'json', required: false }
    ],
    listRule: '@request.auth.role = "admin"',
    viewRule: '@request.auth.role = "admin"',
    createRule: '',
    updateRule: '',
    deleteRule: '@request.auth.role = "admin"'
  }
];

async function authenticate() {
  try {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✓ Authenticated as admin');
    return true;
  } catch (error) {
    console.error('✗ Authentication failed:', error.message);
    console.log('\n📋 Troubleshooting steps:');
    console.log('1. Ensure PocketBase is running at', POCKETBASE_URL);
    console.log('2. Visit', POCKETBASE_URL + '/_/', 'to check admin status');
    console.log('3. If no admin exists, create one with:');
    console.log('   Email:', ADMIN_EMAIL);
    console.log('   Password:', ADMIN_PASSWORD);
    console.log('4. If admin exists with different credentials, update Backend/.env file');
    console.log('\n💡 Tip: The admin is created when you first access the PocketBase UI');
    return false;
  }
}

async function deleteCollection(name) {
  try {
    const collections = await pb.collections.getFullList();
    const existing = collections.find(c => c.name === name);
    if (existing && name !== 'users') { // Never delete the users collection
      await pb.collections.delete(existing.id);
      console.log(`  ✓ Deleted existing collection: ${name}`);
    }
  } catch (error) {
    // Collection doesn't exist, that's fine
  }
}

async function updateUsersCollection(collectionData) {
  try {
    const collections = await pb.collections.getFullList();
    const usersCollection = collections.find(c => c.name === 'users');
    
    if (!usersCollection) {
      console.error('  ✗ Users collection not found!');
      return null;
    }

    // Merge existing schema with new fields
    const existingFields = usersCollection.schema || [];
    const newFields = collectionData.schema;
    
    // Only add fields that don't exist
    const fieldsToAdd = newFields.filter(newField => 
      !existingFields.some(existing => existing.name === newField.name)
    );
    
    const updatedSchema = [...existingFields, ...fieldsToAdd];
    
    // Update the collection
    const updated = await pb.collections.update(usersCollection.id, {
      schema: updatedSchema,
      listRule: collectionData.listRule,
      viewRule: collectionData.viewRule,
      createRule: collectionData.createRule,
      updateRule: collectionData.updateRule,
      deleteRule: collectionData.deleteRule
    });
    
    console.log(`  ✓ Updated collection: users (added ${fieldsToAdd.length} new fields)`);
    return updated;
  } catch (error) {
    console.error('  ✗ Failed to update users collection:', error.message);
    throw error;
  }
}

async function createCollection(collectionData) {
  try {
    // Special handling for users collection (update instead of create)
    if (collectionData.name === 'users' && collectionData.update) {
      return await updateUsersCollection(collectionData);
    }

    // Delete existing collection if it exists
    await deleteCollection(collectionData.name);

    // Create new collection
    const collection = await pb.collections.create(collectionData);
    console.log(`  ✓ Created collection: ${collectionData.name}`);
    return collection;
  } catch (error) {
    console.error(`  ✗ Failed to create collection ${collectionData.name}:`, error.message);
    throw error;
  }
}

async function setupCollections() {
  console.log('\n📦 Setting up PocketBase collections...\n');

  // Process collections that don't depend on others first
  const independentCollections = collections.filter(c => 
    !c.schema.some(field => field.type === 'relation')
  );
  
  const dependentCollections = collections.filter(c => 
    c.schema.some(field => field.type === 'relation')
  );

  // Create independent collections first
  for (const collectionData of independentCollections) {
    await createCollection(collectionData);
  }

  // Create dependent collections
  for (const collectionData of dependentCollections) {
    // Get collection IDs for relations
    const allCollections = await pb.collections.getFullList();
    
    for (const field of collectionData.schema) {
      if (field.type === 'relation' && field.options) {
        const relatedCollection = allCollections.find(c => c.name === field.options.collectionId);
        if (relatedCollection) {
          field.options.collectionId = relatedCollection.id;
        }
      }
    }
    
    await createCollection(collectionData);
  }

  console.log('\n✅ All collections created successfully!\n');
}

async function main() {
  console.log('🚀 PocketBase Collection Setup\n');
  console.log('Connecting to:', POCKETBASE_URL);
  
  const authenticated = await authenticate();
  if (!authenticated) {
    process.exit(1);
  }

  try {
    await setupCollections();
    console.log('✅ Setup complete! You can now start using the application.\n');
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
