import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navbar from "@/components/navbar";
import { apiGet, apiPost } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { SelectCourse, SelectModule, SelectQuiz } from "@shared/schema";
import { 
  Clock, 
  BookOpen, 
  Users, 
  Award,
  Play,
  CheckCircle,
  Lock,
  AlertCircle,
  ExternalLink,
  TrendingUp
} from "lucide-react";

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  // Fetch course details
  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: ["/api/courses", id],
    queryFn: () => apiGet<{
      course: SelectCourse;
      modules: SelectModule[];
    }>(`/api/courses/${id}`),
    enabled: !!id,
  });

  // Fetch user's enrollment
  const { data: enrollmentData } = useQuery({
    queryKey: ["/api/enrollments"],
    queryFn: () => apiGet<{ enrollments: any[] }>("/api/enrollments"),
    enabled: !!user,
  });

  // Fetch quizzes for selected module
  const { data: quizzesData } = useQuery({
    queryKey: ["/api/modules", selectedModule, "quizzes"],
    queryFn: () => apiGet<{ quizzes: SelectQuiz[] }>(`/api/modules/${selectedModule}/quizzes`),
    enabled: !!selectedModule,
  });

  const course = courseData?.course;
  const modules = courseData?.modules || [];
  const enrollments = enrollmentData?.enrollments || [];
  const currentEnrollment = enrollments.find(e => e.course_id === id);
  const quizzes = quizzesData?.quizzes || [];

  // Enrollment mutation
  const enrollMutation = useMutation({
    mutationFn: () => apiPost<{ enrollment: any }>("/api/enrollments", { course_id: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      toast({
        title: "Enrolled successfully!",
        description: "You can now start learning this course.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Enrollment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Progress update mutation
  const updateProgressMutation = useMutation({
    mutationFn: ({ enrollmentId, progress }: { enrollmentId: string; progress: number }) =>
      apiPost(`/api/enrollments/${enrollmentId}/progress`, { progress_percentage: progress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      toast({
        title: "Progress updated!",
        description: "Your learning progress has been saved.",
      });
    },
  });

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEnroll = () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to enroll in courses.",
        variant: "destructive",
      });
      return;
    }
    enrollMutation.mutate();
  };

  const markModuleComplete = (moduleIndex: number) => {
    if (!currentEnrollment) return;
    
    const totalModules = modules.length;
    const completedModules = moduleIndex + 1;
    const progress = Math.round((completedModules / totalModules) * 100);
    
    updateProgressMutation.mutate({
      enrollmentId: currentEnrollment.id,
      progress
    });
  };

  if (courseLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Course not found or you don't have access to view it.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Course Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Course Info */}
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={getDifficultyColor(course.difficulty_level)}>
                  {course.difficulty_level}
                </Badge>
                {course.is_published ? (
                  <Badge className="bg-green-100 text-green-800">Published</Badge>
                ) : (
                  <Badge variant="secondary">Draft</Badge>
                )}
              </div>
              
              <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
              
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {course.estimated_duration} hours
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {modules.length} modules
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  For {course.difficulty_level} level
                </div>
              </div>
              
              <p className="text-lg text-muted-foreground">{course.overview}</p>
            </div>

            {/* Enrollment Progress */}
            {currentEnrollment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Your Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Course Progress</span>
                        <span>{currentEnrollment.progress_percentage}%</span>
                      </div>
                      <Progress value={currentEnrollment.progress_percentage} className="h-2" />
                    </div>
                    
                    {currentEnrollment.is_completed && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Course completed!</span>
                        {currentEnrollment.certificate_issued && (
                          <Badge className="bg-green-100 text-green-800">
                            <Award className="h-3 w-3 mr-1" />
                            Certified
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Enrollment Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                {course.thumbnail_url && (
                  <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardTitle>Course Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!currentEnrollment ? (
                  <Button 
                    className="w-full" 
                    onClick={handleEnroll}
                    disabled={enrollMutation.isPending}
                    data-testid="button-enroll"
                  >
                    {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button className="w-full" data-testid="button-continue">
                      <Play className="h-4 w-4 mr-2" />
                      Continue Learning
                    </Button>
                    {currentEnrollment.is_completed && !currentEnrollment.certificate_issued && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        data-testid="button-get-certificate"
                      >
                        <Award className="h-4 w-4 mr-2" />
                        Get Certificate
                      </Button>
                    )}
                  </div>
                )}
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>✓ Lifetime access</p>
                  <p>✓ Mobile and desktop</p>
                  <p>✓ Certificate of completion</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Course Content */}
        <Tabs defaultValue="content" className="space-y-6">
          <TabsList>
            <TabsTrigger value="content" data-testid="tab-content">Course Content</TabsTrigger>
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Modules</CardTitle>
                <CardDescription>
                  {modules.length} modules • {course.estimated_duration} hours total
                </CardDescription>
              </CardHeader>
              <CardContent>
                {modules.length > 0 ? (
                  <Accordion type="single" collapsible>
                    {modules.map((module, index) => {
                      const isAccessible = !currentEnrollment || index === 0 || 
                        (currentEnrollment.progress_percentage / modules.length) > index;
                      
                      return (
                        <AccordionItem key={module.id} value={module.id}>
                          <AccordionTrigger 
                            className={`${!isAccessible ? 'opacity-50' : ''}`}
                            onClick={() => setSelectedModule(module.id)}
                            data-testid={`module-${index}`}
                          >
                            <div className="flex items-center gap-3 text-left">
                              {!isAccessible ? (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              ) : currentEnrollment?.progress_percentage && 
                                 (currentEnrollment.progress_percentage / modules.length) > index ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Play className="h-4 w-4 text-primary" />
                              )}
                              <div>
                                <p className="font-medium">
                                  Module {module.sequence_order}: {module.title}
                                </p>
                                {module.duration_minutes && (
                                  <p className="text-sm text-muted-foreground">
                                    {module.duration_minutes} minutes
                                  </p>
                                )}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pt-4">
                              <p className="text-sm text-muted-foreground">
                                {module.description}
                              </p>
                              
                              {module.video_url && (
                                <div className="flex items-center gap-2">
                                  <Play className="h-4 w-4 text-primary" />
                                  <span className="text-sm">Video lesson available</span>
                                </div>
                              )}
                              
                              {module.content_url && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  disabled={!isAccessible}
                                  data-testid={`button-view-content-${index}`}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View Content
                                </Button>
                              )}
                              
                              {selectedModule === module.id && quizzes.length > 0 && (
                                <div className="mt-4 space-y-2">
                                  <h4 className="font-medium">Module Quizzes:</h4>
                                  {quizzes.map((quiz) => (
                                    <div key={quiz.id} className="flex items-center justify-between p-3 border rounded-lg">
                                      <div>
                                        <p className="font-medium">{quiz.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {quiz.time_limit_minutes} minutes • {quiz.passing_score}% to pass
                                        </p>
                                      </div>
                                      <Button 
                                        size="sm" 
                                        disabled={!isAccessible || quiz.is_completed}
                                        data-testid={`button-quiz-${quiz.id}`}
                                      >
                                        {quiz.is_completed ? "Completed" : "Start Quiz"}
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {currentEnrollment && isAccessible && (
                                <Button 
                                  onClick={() => markModuleComplete(index)}
                                  disabled={updateProgressMutation.isPending}
                                  data-testid={`button-complete-module-${index}`}
                                >
                                  Mark as Complete
                                </Button>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No modules available for this course yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Course Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{course.overview}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Learning Objectives</h3>
                  <p className="text-muted-foreground">{course.objective}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Course Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Duration:</span> {course.estimated_duration} hours
                    </div>
                    <div>
                      <span className="font-medium">Level:</span> {course.difficulty_level}
                    </div>
                    <div>
                      <span className="font-medium">Modules:</span> {modules.length}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {course.is_published ? 'Published' : 'Draft'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
