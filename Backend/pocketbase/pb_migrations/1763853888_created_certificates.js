/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "certificates_col",
    "created": "2025-11-22 23:24:48.370Z",
    "updated": "2025-11-22 23:24:48.370Z",
    "name": "certificates",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "cert_user_id",
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
        "id": "cert_course_id",
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
        "id": "cert_issued_at",
        "name": "issued_at",
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
        "id": "cert_certificate_url",
        "name": "certificate_url",
        "type": "file",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "mimeTypes": [
            "application/pdf",
            "image/png"
          ],
          "thumbs": [],
          "maxSelect": 1,
          "maxSize": 10485760,
          "protected": false
        }
      },
      {
        "system": false,
        "id": "cert_verification_code",
        "name": "verification_code",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 100,
          "pattern": ""
        }
      }
    ],
    "indexes": [],
    "listRule": "@request.auth.id = user_id || @request.auth.role = \"admin\"",
    "viewRule": "@request.auth.id = user_id || @request.auth.role = \"admin\"",
    "createRule": "@request.auth.role = \"admin\"",
    "updateRule": "@request.auth.role = \"admin\"",
    "deleteRule": "@request.auth.role = \"admin\"",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("certificates_col");

  return dao.deleteCollection(collection);
})
