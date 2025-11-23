"""
storage/__init__.py - Storage Package Exports
Purpose: Centralized access to storage layer
Location: ai_course_pro/storage/__init__.py
"""
from .db import storage, SmartStorage

__all__ = ["storage", "SmartStorage"]