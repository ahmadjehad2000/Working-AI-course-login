"""
cli/main.py - Beautiful CLI Interface
Purpose: Command-line interface for testing and course generation
Location: ai_course_pro/cli/main.py
"""
import click
import sys
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.markdown import Markdown

# Add project to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from core import Difficulty
from engine import generator
from storage import storage

console = Console()

@click.group()
def cli():
    """🎓 AI Course Pro - Professional Course Generator CLI"""
    pass

@cli.command()
@click.argument('title')
@click.option(
    '--difficulty', '-d',
    type=click.Choice(['beginner', 'intermediate', 'advanced'], case_sensitive=False),
    default='beginner',
    help='Course difficulty level'
)
@click.option('--save/--no-save', default=True, help='Save course to storage')
@click.option('--verbose', '-v', is_flag=True, help='Show detailed output')
def generate(title: str, difficulty: str, save: bool, verbose: bool):
    """
    Generate a new course
    
    Example: python -m cli.main generate "Python Basics" -d beginner
    """
    console.print(Panel.fit(
        f"🎯 [bold cyan]Generating Course[/bold cyan]\n"
        f"Title: [yellow]{title}[/yellow]\n"
        f"Difficulty: [green]{difficulty}[/green]",
        border_style="cyan"
    ))
    
    try:
        # Generate with progress indicator
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task("🧠 Generating course...", total=None)
            
            diff = Difficulty(difficulty.lower())
            course, quality, gen_time = generator.generate(title, diff)
            
            progress.update(task, description="✅ Generation complete!")
        
        # Display results
        _display_course(course, quality, gen_time, verbose)
        
        # Save if requested
        if save:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=console
            ) as progress:
                task = progress.add_task("💾 Saving course...", total=None)
                saved = storage.save_course(course)
                if saved:
                    progress.update(task, description="✅ Course saved!")
                    console.print(f"\n[green]Course ID:[/green] {course.id}")
                else:
                    console.print("\n[yellow]⚠️  Failed to save course[/yellow]")
        
    except Exception as e:
        console.print(f"\n[red]❌ Error:[/red] {e}")
        sys.exit(1)

@cli.command()
@click.argument('course_id')
@click.option('--verbose', '-v', is_flag=True, help='Show full content')
def show(course_id: str, verbose: bool):
    """
    Show course details
    
    Example: python -m cli.main show abc123def456
    """
    try:
        course = storage.get_course(course_id)
        
        if not course:
            console.print(f"[red]❌ Course not found:[/red] {course_id}")
            sys.exit(1)
        
        _display_course(course, course.quality, 0, verbose)
        
    except Exception as e:
        console.print(f"[red]❌ Error:[/red] {e}")
        sys.exit(1)

@cli.command()
@click.option('--limit', '-n', default=10, help='Number of courses to show')
@click.option('--domain', '-d', help='Filter by domain')
def list(limit: int, domain: str):
    """
    List recent courses
    
    Example: python -m cli.main list -n 20
    """
    try:
        courses = storage.list_courses(limit=limit, domain=domain)
        
        if not courses:
            console.print("[yellow]No courses found[/yellow]")
            return
        
        # Create table
        table = Table(title=f"📚 Recent Courses ({len(courses)})", show_header=True)
        table.add_column("ID", style="cyan")
        table.add_column("Title", style="yellow")
        table.add_column("Difficulty", style="green")
        table.add_column("Domain", style="blue")
        table.add_column("Modules", justify="right")
        table.add_column("Quality", justify="right", style="magenta")
        
        for course in courses:
            quality_str = f"{course.quality.overall_score:.1f}" if course.quality else "N/A"
            table.add_row(
                course.id,
                course.title[:40] + "..." if len(course.title) > 40 else course.title,
                course.difficulty.value,
                course.domain,
                str(len(course.modules)),
                quality_str
            )
        
        console.print(table)
        
    except Exception as e:
        console.print(f"[red]❌ Error:[/red] {e}")
        sys.exit(1)

@cli.command()
def clear_cache():
    """Clear the generation cache"""
    try:
        generator.clear_cache()
        console.print("[green]✅ Cache cleared successfully[/green]")
    except Exception as e:
        console.print(f"[red]❌ Error:[/red] {e}")
        sys.exit(1)

def _display_course(course, quality, gen_time, verbose):
    """Display course information beautifully"""
    
    # Header
    console.print("\n" + "="*80)
    console.print(f"[bold cyan]{course.title}[/bold cyan]")
    console.print("="*80 + "\n")
    
    # Metadata
    info_table = Table(show_header=False, box=None)
    info_table.add_column(style="bold")
    info_table.add_column()
    
    # Handle both enum and string types
    difficulty_str = course.difficulty.value if hasattr(course.difficulty, 'value') else str(course.difficulty)
    content_type_str = course.content_type.value if hasattr(course.content_type, 'value') else str(course.content_type)
    
    info_table.add_row("🎯 Difficulty:", f"[green]{difficulty_str.title()}[/green]")
    info_table.add_row("📂 Domain:", f"[blue]{course.domain}[/blue]")
    info_table.add_row("🏷️  Content Type:", f"[yellow]{content_type_str.title()}[/yellow]")
    info_table.add_row("🏷️  Tags:", ", ".join(course.tags))
    info_table.add_row("⏱️  Estimated:", f"{course.estimated_hours} hours")
    info_table.add_row("📦 Modules:", f"{len(course.modules)}")
    
    if gen_time > 0:
        info_table.add_row("⚡ Generated in:", f"{gen_time:.2f}s")
    
    console.print(info_table)
    console.print()
    
    # Overview
    console.print(Panel(course.overview, title="📖 Overview", border_style="blue"))
    console.print()
    
    # Objectives
    console.print("[bold]🎯 Learning Objectives:[/bold]")
    for i, obj in enumerate(course.objectives, 1):
        console.print(f"  {i}. {obj}")
    console.print()
    
    # Quality Metrics
    if quality:
        console.print("[bold]📊 Quality Assessment:[/bold]")
        
        metrics_table = Table(show_header=True, box=None)
        metrics_table.add_column("Metric", style="bold")
        metrics_table.add_column("Score", justify="right")
        metrics_table.add_column("Grade", justify="center")
        
        def get_grade(score):
            if score >= 90:
                return "[green]⭐⭐⭐[/green]"
            elif score >= 80:
                return "[green]⭐⭐[/green]"
            elif score >= 70:
                return "[yellow]⭐[/yellow]"
            else:
                return "[red]❌[/red]"
        
        metrics_table.add_row("Overall", f"{quality.overall_score:.1f}/100", get_grade(quality.overall_score))
        metrics_table.add_row("Depth", f"{quality.depth_score:.1f}/100", get_grade(quality.depth_score))
        metrics_table.add_row("Clarity", f"{quality.clarity_score:.1f}/100", get_grade(quality.clarity_score))
        metrics_table.add_row("Completeness", f"{quality.completeness_score:.1f}/100", get_grade(quality.completeness_score))
        metrics_table.add_row("Engagement", f"{quality.engagement_score:.1f}/100", get_grade(quality.engagement_score))
        
        console.print(metrics_table)
        console.print()
        
        # Issues
        if quality.issues:
            console.print("[bold yellow]⚠️  Issues:[/bold yellow]")
            for issue in quality.issues:
                console.print(f"  • {issue}")
            console.print()
        
        # Recommendations
        if quality.recommendations:
            console.print("[bold cyan]💡 Recommendations:[/bold cyan]")
            for rec in quality.recommendations:
                console.print(f"  • {rec}")
            console.print()
    
    # Modules
    console.print("[bold]📚 Course Modules:[/bold]\n")
    
    for i, module in enumerate(course.modules, 1):
        console.print(f"[bold cyan]Module {i}: {module.title}[/bold cyan]")
        console.print(f"[dim]{module.description}[/dim]")
        
        if verbose:
            console.print(f"\n[bold]Topics:[/bold] {', '.join(module.topics)}")
            
            if module.content:
                console.print(f"\n[bold]Content:[/bold]")
                console.print(Panel(module.content[:300] + "..." if len(module.content) > 300 else module.content, border_style="dim"))
            
            if module.examples:
                console.print(f"\n[bold]Examples:[/bold]")
                for ex in module.examples:
                    console.print(f"  • {ex}")
            
            if module.exercises:
                console.print(f"\n[bold]Exercises:[/bold]")
                for ex in module.exercises:
                    console.print(f"  • {ex}")
        
        console.print()


if __name__ == '__main__':
    cli()