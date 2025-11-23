"""
cli/__main__.py - Run the course generator CLI
Usage: python -m cli [command]
"""

from .main import cli


def main():
  cli(prog_name="ai-course-cli")


if __name__ == "__main__":
  main()
