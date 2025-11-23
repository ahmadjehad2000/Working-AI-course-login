"""
engine/qa.py - Advanced Quality Assurance System
Purpose: Multi-dimensional quality assessment outperforming basic checks
Location: ai_course_pro/engine/qa.py
"""
import logging
from typing import List, Tuple
from core.models import Course, Module, QualityMetrics
import re

logger = logging.getLogger(__name__)

class AdvancedQA:
    """
    Advanced QA system with multiple quality dimensions
    Uses weighted scoring and statistical analysis
    """
    
    # Quality thresholds (raised for competitive edge)
    MIN_MODULE_CONTENT = 500  # Chars per module
    MIN_MODULES = 5
    MAX_MODULES = 8
    MIN_OBJECTIVES = 4
    MIN_EXAMPLES_PER_MODULE = 2
    MIN_EXERCISES_PER_MODULE = 2
    
    # Scoring weights
    WEIGHTS = {
        'depth': 0.30,        # Content depth and detail
        'clarity': 0.25,      # Writing quality and structure
        'completeness': 0.25, # All components present
        'engagement': 0.20    # Examples, exercises, variety
    }
    
    def assess(self, course: Course) -> QualityMetrics:
        """
        Comprehensive quality assessment
        Returns detailed metrics and recommendations
        """
        logger.info(f"🔍 Assessing quality: {course.title}")
        
        issues = []
        recommendations = []
        
        # 1. Depth Assessment (30%)
        depth_score, depth_issues = self._assess_depth(course)
        issues.extend(depth_issues)
        
        # 2. Clarity Assessment (25%)
        clarity_score, clarity_issues = self._assess_clarity(course)
        issues.extend(clarity_issues)
        
        # 3. Completeness Assessment (25%)
        completeness_score, completeness_issues = self._assess_completeness(course)
        issues.extend(completeness_issues)
        
        # 4. Engagement Assessment (20%)
        engagement_score, engagement_issues = self._assess_engagement(course)
        issues.extend(engagement_issues)
        
        # Calculate weighted overall score
        overall = (
            depth_score * self.WEIGHTS['depth'] +
            clarity_score * self.WEIGHTS['clarity'] +
            completeness_score * self.WEIGHTS['completeness'] +
            engagement_score * self.WEIGHTS['engagement']
        )
        
        # Generate smart recommendations
        recommendations = self._generate_recommendations(
            overall, depth_score, clarity_score, 
            completeness_score, engagement_score
        )
        
        metrics = QualityMetrics(
            overall_score=round(overall, 2),
            depth_score=round(depth_score, 2),
            clarity_score=round(clarity_score, 2),
            completeness_score=round(completeness_score, 2),
            engagement_score=round(engagement_score, 2),
            issues=issues,
            recommendations=recommendations
        )
        
        logger.info(f"✅ Quality: {overall:.1f}/100 | Depth: {depth_score:.1f} | Clarity: {clarity_score:.1f}")
        return metrics
    
    def _assess_depth(self, course: Course) -> Tuple[float, List[str]]:
        """Assess content depth and detail"""
        issues = []
        score = 100.0
        
        # Module count check
        if len(course.modules) < self.MIN_MODULES:
            issues.append(f"Only {len(course.modules)} modules (recommended: {self.MIN_MODULES}+)")
            score -= 15
        
        # Content length analysis
        avg_content_length = sum(len(m.content) for m in course.modules) / max(len(course.modules), 1)
        if avg_content_length < self.MIN_MODULE_CONTENT:
            issues.append(f"Shallow content (avg {int(avg_content_length)} chars, need {self.MIN_MODULE_CONTENT}+)")
            score -= 20
        
        # Topic coverage
        avg_topics = sum(len(m.topics) for m in course.modules) / max(len(course.modules), 1)
        if avg_topics < 3:
            issues.append("Insufficient topic coverage per module")
            score -= 10
        
        # Overview quality
        if len(course.overview) < 100:
            issues.append("Overview too brief")
            score -= 5
        
        return max(score, 0), issues
    
    def _assess_clarity(self, course: Course) -> Tuple[float, List[str]]:
        """Assess writing quality and structure"""
        issues = []
        score = 100.0
        
        # Check for proper structure
        if not course.objectives:
            issues.append("Missing learning objectives")
            score -= 25
        elif len(course.objectives) < self.MIN_OBJECTIVES:
            issues.append(f"Need more objectives (have {len(course.objectives)}, want {self.MIN_OBJECTIVES}+)")
            score -= 10
        
        # Module description quality
        poor_descriptions = sum(1 for m in course.modules if len(m.description) < 50)
        if poor_descriptions > 0:
            issues.append(f"{poor_descriptions} modules have weak descriptions")
            score -= poor_descriptions * 5
        
        # Check for filler words (low quality indicator)
        filler_pattern = r'\b(very|really|quite|basically|actually)\b'
        filler_count = sum(
            len(re.findall(filler_pattern, m.content, re.IGNORECASE)) 
            for m in course.modules
        )
        if filler_count > len(course.modules) * 3:
            issues.append("Excessive filler words detected")
            score -= 10
        
        return max(score, 0), issues
    
    def _assess_completeness(self, course: Course) -> Tuple[float, List[str]]:
        """Assess component completeness"""
        issues = []
        score = 100.0
        
        # Examples check
        modules_without_examples = sum(1 for m in course.modules if len(m.examples) < self.MIN_EXAMPLES_PER_MODULE)
        if modules_without_examples > 0:
            issues.append(f"{modules_without_examples} modules lack sufficient examples")
            score -= modules_without_examples * 8
        
        # Exercises check
        modules_without_exercises = sum(1 for m in course.modules if len(m.exercises) < self.MIN_EXERCISES_PER_MODULE)
        if modules_without_exercises > 0:
            issues.append(f"{modules_without_exercises} modules lack sufficient exercises")
            score -= modules_without_exercises * 8
        
        # Domain and tags
        if not course.domain:
            issues.append("Missing domain classification")
            score -= 10
        
        if len(course.tags) < 3:
            issues.append("Insufficient tags for discoverability")
            score -= 5
        
        return max(score, 0), issues
    
    def _assess_engagement(self, course: Course) -> Tuple[float, List[str]]:
        """Assess learner engagement potential"""
        issues = []
        score = 100.0
        
        # Variety in examples
        total_examples = sum(len(m.examples) for m in course.modules)
        if total_examples < len(course.modules) * 2:
            issues.append("Need more diverse examples")
            score -= 15
        
        # Hands-on exercises
        total_exercises = sum(len(m.exercises) for m in course.modules)
        if total_exercises < len(course.modules) * 2:
            issues.append("Need more hands-on exercises")
            score -= 15
        
        # Content variety (check for repetitive titles)
        unique_words_in_titles = len(set(
            word.lower() for m in course.modules 
            for word in m.title.split()
        ))
        if unique_words_in_titles < len(course.modules) * 2:
            issues.append("Module titles too repetitive")
            score -= 10
        
        return max(score, 0), issues
    
    def _generate_recommendations(self, overall: float, depth: float, 
                                 clarity: float, completeness: float, 
                                 engagement: float) -> List[str]:
        """Generate smart improvement recommendations"""
        recs = []
        
        if overall < 70:
            recs.append("⚠️ PRIORITY: Overall quality below professional standard")
        
        if depth < 70:
            recs.append("📚 Add more detailed content to each module (target 500+ words)")
            recs.append("🎯 Include more topics per module (4-6 recommended)")
        
        if clarity < 70:
            recs.append("✍️ Improve writing clarity - remove filler words")
            recs.append("🎓 Add more specific learning objectives (4-6 recommended)")
        
        if completeness < 70:
            recs.append("🔧 Add 2-3 real examples per module")
            recs.append("💪 Include 2-3 practical exercises per module")
        
        if engagement < 70:
            recs.append("🎨 Increase content variety and interactivity")
            recs.append("🚀 Add more diverse, real-world scenarios")
        
        if overall >= 90:
            recs.append("⭐ Excellent quality! Ready for production")
        elif overall >= 80:
            recs.append("✅ Good quality. Minor improvements will make it excellent")
        
        return recs

# Global instance
qa_engine = AdvancedQA()