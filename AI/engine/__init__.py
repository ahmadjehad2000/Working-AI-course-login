"""
engine/__init__.py - Engine Package Exports
Purpose: Centralized access to generation engine
Location: ai_course_pro/engine/__init__.py
"""
from .generator import generator, SmartGenerator
from .qa import qa_engine, AdvancedQA
from . import prompts

__all__ = [
    "generator",
    "SmartGenerator",
    "qa_engine",
    "AdvancedQA",
    "prompts"
]