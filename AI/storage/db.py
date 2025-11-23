"""
storage/db.py - Smart Storage Layer
Purpose: MongoDB with intelligent fallback and caching
Location: ai_course_pro/storage/db.py
"""

import logging
import json
from typing import Optional, List, Dict, Any
from pathlib import Path
from pymongo import MongoClient, DESCENDING
from pymongo.errors import ConnectionFailure, OperationFailure

from core import settings, Course

logger = logging.getLogger(__name__)


class SmartStorage:
    """
    Intelligent storage with:
    - Primary: MongoDB
    - Fallback: JSON file cache
    - Auto-failover on connection issues
    """

    def __init__(self):
        self.client: Optional[MongoClient] = None
        self.db = None
        self.connected = False
        self._file_cache = Path("data/cache")
        self._file_cache.mkdir(parents=True, exist_ok=True)

        # Try MongoDB connection
        self._connect()

    def _connect(self):
        """Connect to MongoDB with error handling"""
        try:
            self.client = MongoClient(
                settings.mongodb_uri,
                serverSelectionTimeoutMS=3000,
                connectTimeoutMS=3000
            )
            # Force a connection test
            self.client.admin.command("ping")
            self.db = self.client[settings.mongodb_db]
            if self.db is not None:
                self._create_indexes()
            self.connected = True
            logger.info("✅ MongoDB connected")
        except (ConnectionFailure, Exception) as e:
            logger.warning(f"⚠️ MongoDB unavailable, using file cache: {e}")
            self.connected = False
            self.db = None

    def _create_indexes(self):
        """Create optimized indexes"""
        if self.db is None:
            return
        try:
            self.db.courses.create_index([("title", 1), ("difficulty", 1)])
            self.db.courses.create_index([("created_at", DESCENDING)])
            self.db.courses.create_index([("domain", 1)])
            logger.info("📊 Indexes created")
        except Exception as e:
            logger.warning(f"Index creation failed: {e}")

    def save_course(self, course: Course) -> bool:
        """Save course with auto-fallback"""
        try:
            course_dict = course.model_dump(mode="json")

            # Try MongoDB first
            if self.connected and self.db is not None:
                try:
                    self.db.courses.update_one(
                        {"id": course.id},
                        {"$set": course_dict},
                        upsert=True
                    )
                    logger.info(f"💾 Saved to MongoDB: {course.id}")
                    return True
                except OperationFailure as e:
                    logger.warning(f"MongoDB save failed: {e}")

            # Fallback to file
            self._save_to_file(course.id, course_dict)
            logger.info(f"💾 Saved to file cache: {course.id}")
            return True

        except Exception as e:
            logger.error(f"Save failed: {e}")
            return False

    def get_course(self, course_id: str) -> Optional[Course]:
        """Retrieve course with auto-fallback"""
        try:
            # Try MongoDB first
            if self.connected and self.db is not None:
                try:
                    doc = self.db.courses.find_one({"id": course_id}, {"_id": 0})
                    if doc:
                        return Course(**doc)
                except Exception as e:
                    logger.warning(f"MongoDB read failed: {e}")

            # Fallback to file
            data = self._load_from_file(course_id)
            if data is not None:
                return Course(**data)

            return None

        except Exception as e:
            logger.error(f"Retrieve failed: {e}")
            return None

    def list_courses(self, limit: int = 20, domain: Optional[str] = None) -> List[Course]:
        """List recent courses"""
        try:
            # Try MongoDB first
            if self.connected and self.db is not None:
                try:
                    query = {"domain": domain} if domain else {}
                    cursor = (
                        self.db.courses.find(query, {"_id": 0})
                        .sort("created_at", DESCENDING)
                        .limit(limit)
                    )
                    return [Course(**doc) for doc in cursor]
                except Exception as e:
                    logger.warning(f"MongoDB list failed: {e}")

            # Fallback to file listing
            courses = []
            for file_path in sorted(self._file_cache.glob("*.json"), reverse=True)[:limit]:
                try:
                    data = json.loads(file_path.read_text())
                    if not domain or data.get("domain") == domain:
                        courses.append(Course(**data))
                except Exception as e:
                    logger.debug(f"Skip corrupted cache file: {e}")
            return courses

        except Exception as e:
            logger.error(f"List failed: {e}")
            return []

    def _save_to_file(self, course_id: str, data: Dict[str, Any]):
        """Save to JSON file cache"""
        file_path = self._file_cache / f"{course_id}.json"
        file_path.write_text(json.dumps(data, indent=2))

    def _load_from_file(self, course_id: str) -> Optional[Dict[str, Any]]:
        """Load from JSON file cache"""
        file_path = self._file_cache / f"{course_id}.json"
        if file_path.exists():
            return json.loads(file_path.read_text())
        return None

    def close(self):
        """Close MongoDB connection"""
        if self.client is not None:
            self.client.close()
            logger.info("🔌 MongoDB connection closed")


# Global instance
storage = SmartStorage()
