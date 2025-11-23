"""
core/models.py - Lean Data Models
Purpose: Pydantic models for validation and serialization
Location: ai_course_pro/core/models.py
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class Difficulty(str, Enum):
    """Course difficulty levels"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class ContentType(str, Enum):
    """Smart content classification"""
    TECHNICAL = "technical"
    PRACTICAL = "practical"
    BUSINESS = "business"
    CREATIVE = "creative"
    ACADEMIC = "academic"

class Module(BaseModel):
    """Course module"""
    title: str
    description: str
    topics: List[str] = Field(default_factory=list)
    content: str = ""
    examples: List[str] = Field(default_factory=list)
    exercises: List[str] = Field(default_factory=list)
    
    @validator('content')
    def validate_content_length(cls, v):
        if len(v) > 0 and len(v) < 200:
            raise ValueError("Content too short, minimum 200 chars")
        return v

class QualityMetrics(BaseModel):
    """Advanced quality assessment"""
    overall_score: float = Field(ge=0, le=100)
    depth_score: float = Field(ge=0, le=100)
    clarity_score: float = Field(ge=0, le=100)
    completeness_score: float = Field(ge=0, le=100)
    engagement_score: float = Field(ge=0, le=100)
    issues: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)

class Course(BaseModel):
    """Complete course model"""
    id: str
    title: str
    difficulty: Difficulty
    content_type: ContentType
    overview: str = ""
    objectives: List[str] = Field(default_factory=list)
    modules: List[Module] = Field(default_factory=list)
    domain: str = ""
    tags: List[str] = Field(default_factory=list)
    estimated_hours: int = 0
    quality: Optional[QualityMetrics] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    @validator('modules')
    def validate_modules(cls, v):
        if len(v) < 3:
            raise ValueError("Minimum 3 modules required")
        return v
    
    class Config:
        use_enum_values = True

class GenerationRequest(BaseModel):
    """API request for course generation"""
    title: str = Field(min_length=5, max_length=200)
    difficulty: Difficulty
    
    @validator('title')
    def clean_title(cls, v):
        return v.strip()

class GenerationResponse(BaseModel):
    """API response with course and metadata"""
    success: bool
    course: Optional[Course] = None
    quality: Optional[QualityMetrics] = None
    generation_time: float = 0
    error: Optional[str] = None