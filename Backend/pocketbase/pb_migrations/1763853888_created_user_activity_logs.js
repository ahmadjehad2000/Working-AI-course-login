/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "user_activity_logs_col",
    "created": "2025-11-22 23:24:48.370Z",
    "updated": "2025-11-22 23:24:48.370Z",
    "name": "user_activity_logs",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "ual_user_id",
        "name": "user_id",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "app_users_col",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": [
            "email"
          ]
        }
      },
      {
        "system": false,
        "id": "ual_activity_type",
        "name": "activity_type",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "login",
            "course_view",
            "lesson_complete",
            "quiz_attempt",
            "badge_earned"
          ]
        }
      },
      {
        "system": false,
        "id": "ual_resource_id",
        "name": "resource_id",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 36,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "ual_metadata",
        "name": "metadata",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 2000000
        }
      }
    ],
    "indexes": [],
    "listRule": "@request.auth.id = user_id || @request.auth.role = \"admin\"",
    "viewRule": "@request.auth.id = user_id || @request.auth.role = \"admin\"",
    "createRule": "@request.auth.id = user_id",
    "updateRule": "",
    "deleteRule": "@request.auth.role = \"admin\"",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("user_activity_logs_col");

  return dao.deleteCollection(collection);
})
