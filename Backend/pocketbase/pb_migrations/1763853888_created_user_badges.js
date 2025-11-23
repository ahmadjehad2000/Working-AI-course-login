/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "user_badges_col",
    "created": "2025-11-22 23:24:48.370Z",
    "updated": "2025-11-22 23:24:48.370Z",
    "name": "user_badges",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "ub_user_id",
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
        "id": "ub_module_id",
        "name": "module_id",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "modules_col",
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
        "id": "ub_awarded_at",
        "name": "awarded_at",
        "type": "date",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "ub_image_url",
        "name": "image_url",
        "type": "file",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "mimeTypes": [
            "image/png",
            "image/svg+xml",
            "image/webp"
          ],
          "thumbs": [
            "100x100"
          ],
          "maxSelect": 1,
          "maxSize": 2097152,
          "protected": false
        }
      },
      {
        "system": false,
        "id": "ub_is_visible",
        "name": "is_visible",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      }
    ],
    "indexes": [],
    "listRule": "is_visible = true || @request.auth.id = user_id || @request.auth.role = \"admin\"",
    "viewRule": "is_visible = true || @request.auth.id = user_id || @request.auth.role = \"admin\"",
    "createRule": "@request.auth.role = \"admin\"",
    "updateRule": "@request.auth.id = user_id || @request.auth.role = \"admin\"",
    "deleteRule": "@request.auth.role = \"admin\"",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("user_badges_col");

  return dao.deleteCollection(collection);
})
