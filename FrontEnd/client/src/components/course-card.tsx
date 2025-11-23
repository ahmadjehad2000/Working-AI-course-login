import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SelectCourse } from "@shared/schema";
import { 
  Clock, 
  BookOpen, 
  Star,
  TrendingUp,
  Play
} from "lucide-react";

interface CourseCardProps {
  course: SelectCourse;
  variant?: "grid" | "list";
  showProgress?: boolean;
  progress?: number;
  enrollment?: any;
}

export default function CourseCard({ 
  course, 
  variant = "grid", 
  showProgress = false, 
  progress = 0,
  enrollment 
}: CourseCardProps) {
  
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (variant === "list") {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <div className="flex flex-col md:flex-row">
          {/* Thumbnail */}
          {course.thumbnail_url && (
            <div className="md:w-48 h-48 md:h-auto">
              <img 
                src={course.thumbnail_url} 
                alt={course.title}
                className="w-full h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
              />
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1">
            <CardHeader className="pb-4">
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge className={getDifficultyColor(course.difficulty_level)}>
                  {course.difficulty_level}
                </Badge>
                {!course.is_published && (
                  <Badge variant="secondary">Draft</Badge>
                )}
              </div>
              
              <CardTitle className="text-xl hover:text-primary transition-colors">
                <Link href={`/courses/${course.id}`} data-testid={`course-link-${course.id}`}>
                  {course.title}
                </Link>
              </CardTitle>
              
              <CardDescription className="text-base">
                {truncateText(course.overview, 150)}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {course.estimated_duration}h
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  Course
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  4.8 (120 reviews)
                </div>
              </div>
              
              {showProgress && enrollment && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button className="flex-1" data-testid={`button-view-course-${course.id}`}>
                  <Link href={`/courses/${course.id}`} className="flex items-center">
                    {showProgress ? (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Continue Learning
                      </>
                    ) : (
                      "View Course"
                    )}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    );
  }

  // Grid variant (default)
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
      {/* Thumbnail */}
      {course.thumbnail_url ? (
        <div className="aspect-video overflow-hidden">
          <img 
            src={course.thumbnail_url} 
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <BookOpen className="h-12 w-12 text-primary/50" />
        </div>
      )}
      
      <CardHeader className="pb-4">
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge className={getDifficultyColor(course.difficulty_level)}>
            {course.difficulty_level}
          </Badge>
          {!course.is_published && (
            <Badge variant="secondary">Draft</Badge>
          )}
        </div>
        
        <CardTitle className="text-lg group-hover:text-primary transition-colors leading-tight">
          <Link href={`/courses/${course.id}`} data-testid={`course-link-${course.id}`}>
            {truncateText(course.title, 60)}
          </Link>
        </CardTitle>
        
        <CardDescription className="line-clamp-3">
          {truncateText(course.overview, 120)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {course.estimated_duration}h
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            4.8
          </div>
        </div>
        
        {showProgress && enrollment && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        
        <Button className="w-full" data-testid={`button-view-course-${course.id}`}>
          <Link href={`/courses/${course.id}`}>
            {showProgress ? "Continue Learning" : "View Course"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
