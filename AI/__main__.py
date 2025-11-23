"""
ai_course_pro/__main__.py - Package entrypoint
Run the CLI with: `python -m ai_course_pro`
"""

from cli.main import cli


def main():
  cli(prog_name="ai-course-pro")


if __name__ == "__main__":
  main()
