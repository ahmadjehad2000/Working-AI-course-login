"""
engine/prompts.py - Optimized Prompts for Competitive Content
Purpose: High-quality prompts that outperform text-based course platforms
Location: ai_course_pro/engine/prompts.py
"""

# Advanced classification prompt with content detection
CLASSIFY_PROMPT = """You are an expert educational content classifier.

Analyze the course title and difficulty, then classify into:
1. Domain: IT, Business, Science, Health, Creative, Language, Personal, Other
2. Content Type: technical, practical, business, creative, academic
3. Tags: 3-5 specific, relevant tags (no generic terms)

Return ONLY valid JSON:
{
    "domain": "domain name",
    "content_type": "type",
    "tags": ["tag1", "tag2", "tag3"]
}

Title: {title}
Difficulty: {difficulty}"""

# Superior course generation prompt
GENERATE_COURSE_PROMPT = """You are an elite instructional designer creating world-class educational content.

Create a comprehensive {difficulty} course on: "{title}"

Requirements for SUPERIOR QUALITY:
1. DEPTH: Each module must have substantial, actionable content (500+ words)
2. CLARITY: Crystal clear explanations with real-world examples
3. ENGAGEMENT: Interesting, relatable content that keeps learners motivated
4. PRACTICALITY: Hands-on exercises and real applications
5. COMPLETENESS: Cover all essential aspects progressively

Content Type: {content_type}
Domain: {domain}

Structure Requirements:
- 5-7 comprehensive modules
- 4-6 specific learning objectives
- Rich module content with examples
- Practical exercises for each module
- Progressive difficulty building

Return ONLY valid JSON:
{{
    "overview": "Compelling 2-3 sentence overview",
    "objectives": ["objective 1", "objective 2", "objective 3", "objective 4"],
    "modules": [
        {{
            "title": "Module title",
            "description": "What learners will master",
            "topics": ["topic 1", "topic 2", "topic 3"],
            "content": "Detailed, engaging content with examples and explanations (500+ words)",
            "examples": ["real example 1", "real example 2"],
            "exercises": ["hands-on exercise 1", "hands-on exercise 2"]
        }}
    ],
    "estimated_hours": estimated_hours_as_integer
}}

Focus on creating content that rivals or exceeds Coursera, Udemy, and LinkedIn Learning quality."""

# Content type specific enhancements
CONTENT_ENHANCEMENTS = {
    "technical": """
Technical Enhancement:
- Include code snippets and commands
- Explain architecture and design patterns
- Add debugging tips and best practices
- Reference official documentation
- Include performance considerations""",
    
    "practical": """
Practical Enhancement:
- Step-by-step instructions
- Materials/tools needed
- Common mistakes and solutions
- Variations and alternatives
- Safety/quality considerations""",
    
    "business": """
Business Enhancement:
- Real company case studies
- Industry statistics and trends
- ROI and KPI frameworks
- Strategic frameworks
- Implementation roadmaps""",
    
    "creative": """
Creative Enhancement:
- Technique demonstrations
- Style analysis and examples
- Creative exercises and prompts
- Portfolio building tips
- Industry standards""",
    
    "academic": """
Academic Enhancement:
- Theoretical foundations
- Research methods
- Critical analysis frameworks
- Citations and references
- Discussion questions"""
}