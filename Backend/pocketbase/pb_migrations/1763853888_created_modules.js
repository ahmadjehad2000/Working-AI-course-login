/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "modules_col",
    "created": "2025-11-22 23:24:48.370Z",
    "updated": "2025-11-22 23:24:48.370Z",
    "name": "modules",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "modules_course_id",
        "name": "course_id",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "courses_col",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": [
            "title"
          ]
        }
      },
      {
        "system": false,
        "id": "modules_title",
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
        "id": "modules_description",
        "name": "description",
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
        "id": "modules_sequence_order",
        "name": "sequence_order",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": true
        }
      }
    ],
    "indexes": [],
    "listRule": "@request.auth.id != \"\"",
    "viewRule": "@request.auth.id != \"\"",
    "createRule": "@request.auth.role = \"admin\" || @request.auth.role = \"instructor\"",
    "updateRule": "@request.auth.role = \"admin\" || @request.auth.role = \"instructor\"",
    "deleteRule": "@request.auth.role = \"admin\"",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("modules_col");

  return dao.deleteCollection(collection);
})
