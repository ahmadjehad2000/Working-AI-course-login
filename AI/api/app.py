"""
api/app.py - FastAPI Application
Purpose: RESTful API with comprehensive documentation and error handling
Location: ai_course_pro/api/app.py
"""
import logging
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List
from contextlib import asynccontextmanager

from core import settings, GenerationRequest, GenerationResponse, Course, Difficulty
from engine import generator
from storage import storage

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    logger.info("🚀 Starting AI Course Pro API")
    yield
    logger.info("🛑 Shutting down AI Course Pro API")
    storage.close()

# Create FastAPI app with auto-docs
app = FastAPI(
    title="AI Course Pro API",
    description="""
    🎓 **AI Course Pro** - Professional Course Generation API
    
    ## Features
    - 🧠 Smart AI-powered course generation
    - 📊 Advanced quality assurance (5 dimensions)
    - 🎯 Content type detection (technical, practical, business, creative, academic)
    - 💾 Dual storage (MongoDB + file fallback)
    - ⚡ Intelligent caching
    - 📈 Superior content quality
    
    ## Quality Metrics
    Our QA system evaluates:
    - **Depth**: Content detail and coverage
    - **Clarity**: Writing quality and structure
    - **Completeness**: Examples, exercises, components
    - **Engagement**: Learner interaction potential
    
    ## Content Standards
    - Minimum 5 comprehensive modules
    - 500+ words per module
    - Real-world examples
    - Hands-on exercises
    - Progressive difficulty
    """,
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_methods=["*"],
    allow_headers=["*"]
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )

@app.get("/")
async def root():
    """API health check and info"""
    return {
        "name": "AI Course Pro API",
        "version": "2.0.0",
        "status": "operational",
        "features": [
            "Smart course generation",
            "Advanced QA (5 dimensions)",
            "Content type detection",
            "Dual storage with fallback"
        ],
        "docs": "/docs"
    }

@app.post(
    "/generate",
    response_model=GenerationResponse,
    summary="Generate a new course",
    description="""
    Generate a high-quality course with advanced QA.
    
    **Quality Standards:**
    - 5-7 comprehensive modules
    - 500+ words per module
    - 2+ examples per module
    - 2+ exercises per module
    - Progressive learning path
    
    **Returns:**
    - Complete course structure
    - Quality metrics (0-100 scale)
    - Recommendations for improvement
    """,
    responses={
        200: {
            "description": "Course generated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "course": {
                            "title": "Python Fundamentals",
                            "difficulty": "beginner",
                            "quality_score": 87.5
                        },
                        "quality": {
                            "overall_score": 87.5,
                            "depth_score": 90.0,
                            "clarity_score": 85.0
                        }
                    }
                }
            }
        },
        400: {"description": "Invalid request"},
        500: {"description": "Generation failed"}
    }
)
async def generate_course(request: GenerationRequest):
    """
    Generate a professional-quality course
    
    - **title**: Course topic (5-200 characters)
    - **difficulty**: beginner, intermediate, or advanced
    """
    try:
        logger.info(f"📝 API Request: {request.title} ({request.difficulty})")
        
        # Generate course with QA
        course, quality, gen_time = generator.generate(
            request.title, 
            request.difficulty
        )
        
        # Attach quality to course
        course.quality = quality
        
        # Save to storage
        saved = storage.save_course(course)
        if not saved:
            logger.warning("Failed to persist course")
        
        return GenerationResponse(
            success=True,
            course=course,
            quality=quality,
            generation_time=gen_time
        )
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Generation error: {e}", exc_info=True)
        return GenerationResponse(
            success=False,
            error=str(e)
        )

@app.get(
    "/courses/{course_id}",
    response_model=Course,
    summary="Get a specific course",
    description="Retrieve a course by its unique ID"
)
async def get_course(course_id: str):
    """Retrieve a specific course by ID"""
    course = storage.get_course(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@app.get(
    "/courses",
    response_model=List[Course],
    summary="List recent courses",
    description="""
    List recently generated courses with optional filtering.
    
    **Parameters:**
    - **limit**: Max courses to return (1-100)
    - **domain**: Filter by domain (IT, Business, Science, etc.)
    """
)
async def list_courses(
    limit: int = Query(20, ge=1, le=100, description="Maximum courses to return"),
    domain: Optional[str] = Query(None, description="Filter by domain")
):
    """List recent courses with optional filtering"""
    courses = storage.list_courses(limit=limit, domain=domain)
    return courses

@app.delete(
    "/cache",
    summary="Clear generation cache",
    description="Clear the in-memory course generation cache"
)
async def clear_cache():
    """Clear the generation cache"""
    generator.clear_cache()
    return {"message": "Cache cleared successfully"}

@app.get(
    "/health",
    summary="Detailed health check",
    description="Check API and dependency health status"
)
async def health_check():
    """Comprehensive health check"""
    return {
        "api": "healthy",
        "mongodb": "connected" if storage.connected else "disconnected (using fallback)",
        "cache_enabled": settings.cache_enabled,
        "model": settings.openai_model
    }

# Run with: uvicorn api.app:app --reload --host 0.0.0.0 --port 8000