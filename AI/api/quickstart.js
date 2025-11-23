// quickstart.js
// Purpose: Generate Quick Start Guide
// Location: Temporary workspace

const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs');

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            new Paragraph({
                text: "AI Course Pro",
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: "Quick Start Guide",
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            }),

            new Paragraph({
                text: "🚀 Get Started in 5 Minutes",
                heading: HeadingLevel.HEADING_1,
                spacing: { after: 200 }
            }),

            new Paragraph({
                text: "Step 1: Setup Environment",
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 150 }
            }),
            new Paragraph({
                text: "1. Navigate to the project directory:",
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: "   cd ai_course_pro",
                spacing: { after: 150 }
            }),
            new Paragraph({
                text: "2. Install dependencies:",
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: "   pip install -r requirements.txt",
                spacing: { after: 150 }
            }),
            new Paragraph({
                text: "3. Configure environment:",
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: "   cp .env.example .env",
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: "   # Edit .env and add your OPENAI_API_KEY",
                spacing: { after: 300 }
            }),

            new Paragraph({
                text: "Step 2: Test with CLI",
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 150 }
            }),
            new Paragraph({
                text: "Generate your first course:",
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: "   python -m cli.main generate \"Python Fundamentals\" -d beginner",
                spacing: { after: 200 }
            }),
            new Paragraph({
                text: "You'll see beautiful output with:",
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: "   • Progress indicators",
                spacing: { after: 80 }
            }),
            new Paragraph({
                text: "   • Quality assessment (5 dimensions)",
                spacing: { after: 80 }
            }),
            new Paragraph({
                text: "   • Detailed course content",
                spacing: { after: 80 }
            }),
            new Paragraph({
                text: "   • Recommendations for improvement",
                spacing: { after: 300 }
            }),

            new Paragraph({
                text: "Step 3: Start API Server (Optional)",
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 150 }
            }),
            new Paragraph({
                text: "Start the FastAPI server:",
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: "   uvicorn api.app:app --reload --port 8000",
                spacing: { after: 200 }
            }),
            new Paragraph({
                text: "Access documentation:",
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: "   • Swagger UI: http://localhost:8000/docs",
                spacing: { after: 80 }
            }),
            new Paragraph({
                text: "   • ReDoc: http://localhost:8000/redoc",
                spacing: { after: 300 }
            }),

            new Paragraph({
                text: "📝 Common CLI Commands",
                heading: HeadingLevel.HEADING_1,
                pageBreakBefore: true,
                spacing: { after: 200 }
            }),

            new Paragraph({
                text: "Generate Course:",
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: "   python -m cli.main generate \"Topic\" -d beginner",
                spacing: { after: 80 }
            }),
            new Paragraph({
                text: "   python -m cli.main generate \"Topic\" -d intermediate -v",
                spacing: { after: 200 }
            }),

            new Paragraph({
                text: "List Courses:",
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: "   python -m cli.main list -n 20",
                spacing: { after: 80 }
            }),
            new Paragraph({
                text: "   python -m cli.main list --domain IT",
                spacing: { after: 200 }
            }),

            new Paragraph({
                text: "Show Course:",
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: "   python -m cli.main show abc123def456",
                spacing: { after: 200 }
            }),

            new Paragraph({
                text: "🎯 Quality Standards",
                heading: HeadingLevel.HEADING_1,
                pageBreakBefore: true,
                spacing: { after: 200 }
            }),

            new Paragraph({
                text: "Every course is evaluated on:",
                spacing: { after: 150 }
            }),
            new Paragraph({
                text: "• Depth (30%): Content detail and coverage",
                spacing: { after: 80 }
            }),
            new Paragraph({
                text: "• Clarity (25%): Writing quality and structure",
                spacing: { after: 80 }
            }),
            new Paragraph({
                text: "• Completeness (25%): Examples and exercises",
                spacing: { after: 80 }
            }),
            new Paragraph({
                text: "• Engagement (20%): Variety and interactivity",
                spacing: { after: 200 }
            }),

            new Paragraph({
                text: "Quality Thresholds:",
                spacing: { after: 150 }
            }),
            new Paragraph({
                text: "⭐⭐⭐ 90-100: Excellent (production-ready)",
                spacing: { after: 80 }
            }),
            new Paragraph({
                text: "⭐⭐ 80-89: Good (minor improvements)",
                spacing: { after: 80 }
            }),
            new Paragraph({
                text: "⭐ 70-79: Acceptable (needs work)",
                spacing: { after: 80 }
            }),
            new Paragraph({
                text: "❌ <70: Needs significant improvement",
                spacing: { after: 300 }
            }),

            new Paragraph({
                text: "🔧 Troubleshooting",
                heading: HeadingLevel.HEADING_1,
                pageBreakBefore: true,
                spacing: { after: 200 }
            }),

            new Paragraph({
                text: "MongoDB Connection Failed:",
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: "✓ Don't worry! System automatically uses file cache",
                spacing: { after: 80 }
            }),
            new Paragraph({
                text: "✓ Courses are saved to data/cache/ directory",
                spacing: { after: 200 }
            }),

            new Paragraph({
                text: "OpenAI API Errors:",
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: "✓ Verify OPENAI_API_KEY in .env file",
                spacing: { after: 80 }
            }),
            new Paragraph({
                text: "✓ Check API key has sufficient credits",
                spacing: { after: 80 }
            }),
            new Paragraph({
                text: "✓ Ensure no rate limits are exceeded",
                spacing: { after: 200 }
            }),

            new Paragraph({
                text: "Low Quality Scores:",
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: "✓ Use more specific course titles",
                spacing: { after: 80 }
            }),
            new Paragraph({
                text: "✓ Try different difficulty levels",
                spacing: { after: 80 }
            }),
            new Paragraph({
                text: "✓ Clear cache and regenerate",
                spacing: { after: 300 }
            }),

            new Paragraph({
                text: "📚 Next Steps",
                heading: HeadingLevel.HEADING_1,
                pageBreakBefore: true,
                spacing: { after: 200 }
            }),

            new Paragraph({
                text: "1. Read README.md for comprehensive documentation",
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: "2. Review Technical Documentation for architecture details",
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: "3. Explore API docs at /docs endpoint",
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: "4. Customize prompts in engine/prompts.py for your needs",
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: "5. Deploy to production with gunicorn + MongoDB",
                spacing: { after: 300 }
            }),

            new Paragraph({
                text: "🎓 Happy Course Creating!",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { before: 400 }
            })
        ]
    }]
});

Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync('/mnt/user-data/outputs/Quick_Start_Guide.docx', buffer);
    console.log('Quick Start Guide created!');
});