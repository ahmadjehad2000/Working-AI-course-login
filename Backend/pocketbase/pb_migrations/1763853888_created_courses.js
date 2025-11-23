/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "courses_col",
    "created": "2025-11-22 23:24:48.369Z",
    "updated": "2025-11-22 23:24:48.369Z",
    "name": "courses",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "courses_title",
        "name": "title",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 255,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "courses_overview",
        "name": "overview",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "courses_objective",
        "name": "objective",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "courses_thumbnail_url",
        "name": "thumbnail_url",
        "type": "file",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "mimeTypes": [
            "image/jpeg",
            "image/png",
            "image/webp"
          ],
          "thumbs": [
            "200x200",
            "400x400"
          ],
          "maxSelect": 1,
          "maxSize": 5242880,
          "protected": false
        }
      },
      {
        "system": false,
        "id": "courses_difficulty_level",
        "name": "difficulty_level",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "beginner",
            "intermediate",
            "advanced"
          ]
        }
      },
      {
        "system": false,
        "id": "courses_estimated_duration",
        "name": "estimated_duration",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "courses_is_published",
        "name": "is_published",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      }
    ],
    "indexes": [],
    "listRule": "is_published = true || @request.auth.role = \"admin\" || @request.auth.role = \"instructor\"",
    "viewRule": "is_published = true || @request.auth.role = \"admin\" || @request.auth.role = \"instructor\"",
    "createRule": "@request.auth.role = \"admin\" || @request.auth.role = \"instructor\"",
    "updateRule": "@request.auth.role = \"admin\"",
    "deleteRule": "@request.auth.role = \"admin\"",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("courses_col");

  return dao.deleteCollection(collection);
})
