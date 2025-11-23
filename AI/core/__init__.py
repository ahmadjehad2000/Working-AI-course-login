"""
core/__init__.py - Core Package Exports
Purpose: Centralized access to core components
Location: ai_course_pro/core/__init__.py
"""
from .config import settings, logger
from .models import (
    Difficulty,
    ContentType,
    Module,
    QualityMetrics,
    Course,
    GenerationRequest,
    GenerationResponse
)

__all__ = [
    "settings",
    "logger",
    "Difficulty",
    "ContentType",
    "Module",
    "QualityMetrics",
    "Course",
    "GenerationRequest",
    "GenerationResponse"
]