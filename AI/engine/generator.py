"""
engine/generator.py - Smart Course Generation Engine
Purpose: Lean, high-performance course generation with superior quality
Location: ai_course_pro/engine/generator.py
"""
import logging
import json
import hashlib
from typing import Dict, Tuple, Optional
from datetime import datetime
from openai import OpenAI

from core import settings, Course, Module, Difficulty, ContentType, QualityMetrics
from .prompts import CLASSIFY_PROMPT, GENERATE_COURSE_PROMPT, CONTENT_ENHANCEMENTS
from .qa import qa_engine

logger = logging.getLogger(__name__)

class SmartGenerator:
    """
    Lean generation engine with:
    - Intelligent content classification
    - Superior prompt engineering
    - Advanced quality assurance
    - Smart caching
    """
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)
        self._cache: Dict[str, Course] = {}  # Simple in-memory cache
        logger.info("🧠 Smart Generator initialized")
    
    def generate(self, title: str, difficulty: Difficulty) -> Tuple[Course, QualityMetrics, float]:
        """
        Generate high-quality course with full QA
        Returns: (course, quality_metrics, generation_time)
        """
        start = datetime.utcnow()
        logger.info(f"🎯 Generating: '{title}' ({difficulty})")
        
        # Check cache
        cache_key = self._get_cache_key(title, difficulty)
        if cache_key in self._cache and settings.cache_enabled:
            logger.info("⚡ Cache hit!")
            course = self._cache[cache_key]
            quality = qa_engine.assess(course)
            return course, quality, 0.0
        
        try:
            # Step 1: Classify content (smart detection)
            domain, content_type, tags = self._classify(title, difficulty)
            logger.info(f"📊 Classified: {domain} | {content_type} | {tags}")
            
            # Step 2: Generate superior course content
            course = self._generate_course(title, difficulty, domain, content_type, tags)
            
            # Step 3: Advanced QA
            quality = qa_engine.assess(course)
            
            # Cache if quality is good
            if quality.overall_score >= 70:
                self._cache[cache_key] = course
                logger.info(f"💾 Cached (quality: {quality.overall_score:.1f})")
            
            elapsed = (datetime.utcnow() - start).total_seconds()
            logger.info(f"✅ Generated in {elapsed:.2f}s | Quality: {quality.overall_score:.1f}/100")
            
            return course, quality, elapsed
            
        except Exception as e:
            logger.error(f"❌ Generation failed: {e}", exc_info=True)
            raise
    
    def _classify(self, title: str, difficulty: Difficulty) -> Tuple[str, ContentType, list]:
        """Smart content classification using AI"""
        try:
            prompt = CLASSIFY_PROMPT.format(
                title=title, 
                difficulty=difficulty.value if hasattr(difficulty, 'value') else str(difficulty)
            )
            
            response = self.client.chat.completions.create(
                model=settings.openai_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=200,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content.strip()
            
            # Handle potential markdown wrapping
            if content.startswith('```'):
                # Remove markdown code blocks
                lines = content.split('\n')
                # Remove first and last lines (```)
                content = '\n'.join(lines[1:-1])
                # Remove 'json' if present
                if content.startswith('json'):
                    content = content[4:].strip()
            
            data = json.loads(content)
            
            domain = data.get("domain", "Other")
            content_type_str = data.get("content_type", "academic")
            
            # Safe ContentType conversion
            try:
                content_type = ContentType(content_type_str.lower())
            except ValueError:
                logger.warning(f"Unknown content type '{content_type_str}', defaulting to ACADEMIC")
                content_type = ContentType.ACADEMIC
            
            tags = data.get("tags", [])
            
            return domain, content_type, tags
            
        except json.JSONDecodeError as e:
            logger.warning(f"Classification JSON parse failed: {e}, using defaults")
            return "Other", ContentType.ACADEMIC, []
        except Exception as e:
            logger.warning(f"Classification failed: {e}, using defaults")
            return "Other", ContentType.ACADEMIC, []
    
    def _generate_course(self, title: str, difficulty: Difficulty, 
                        domain: str, content_type: ContentType, 
                        tags: list) -> Course:
        """Generate superior course content"""
        try:
            # Get difficulty as string
            difficulty_str = difficulty.value if hasattr(difficulty, 'value') else str(difficulty)
            content_type_str = content_type.value if hasattr(content_type, 'value') else str(content_type)
            
            # Build enhanced prompt
            base_prompt = GENERATE_COURSE_PROMPT.format(
                title=title,
                difficulty=difficulty_str,
                content_type=content_type_str,
                domain=domain
            )
            
            # Add content-specific enhancements
            enhancement = CONTENT_ENHANCEMENTS.get(content_type_str, "")
            full_prompt = f"{base_prompt}\n\n{enhancement}"
            
            # Generate with optimized settings
            response = self.client.chat.completions.create(
                model=settings.openai_model,
                messages=[{"role": "user", "content": full_prompt}],
                temperature=0.7,  # Balanced creativity
                max_tokens=settings.max_tokens,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content.strip()
            
            # Handle potential markdown wrapping
            if content.startswith('```'):
                lines = content.split('\n')
                content = '\n'.join(lines[1:-1])
                if content.startswith('json'):
                    content = content[4:].strip()
            
            data = json.loads(content)
            
            # Build course object
            modules = [Module(**m) for m in data.get("modules", [])]
            
            course = Course(
                id=self._generate_id(title, difficulty),
                title=title,
                difficulty=difficulty,
                content_type=content_type,
                overview=data.get("overview", ""),
                objectives=data.get("objectives", []),
                modules=modules,
                domain=domain,
                tags=tags,
                estimated_hours=data.get("estimated_hours", len(modules) * 2)
            )
            
            return course
            
        except json.JSONDecodeError as e:
            logger.error(f"Course generation JSON parse failed: {e}")
            raise ValueError(f"Failed to parse course content: {e}")
        except Exception as e:
            logger.error(f"Course generation failed: {e}")
            raise
    
    def _get_cache_key(self, title: str, difficulty: Difficulty) -> str:
        """Generate deterministic cache key"""
        difficulty_str = difficulty.value if hasattr(difficulty, 'value') else str(difficulty)
        key = f"{title.lower().strip()}|{difficulty_str}"
        return hashlib.md5(key.encode()).hexdigest()[:16]
    
    def _generate_id(self, title: str, difficulty: Difficulty) -> str:
        """Generate unique course ID"""
        timestamp = datetime.utcnow().isoformat()
        difficulty_str = difficulty.value if hasattr(difficulty, 'value') else str(difficulty)
        key = f"{title}|{difficulty_str}|{timestamp}"
        return hashlib.sha256(key.encode()).hexdigest()[:12]
    
    def clear_cache(self):
        """Clear generation cache"""
        self._cache.clear()
        logger.info("🗑️ Cache cleared")

# Global instance
generator = SmartGenerator()