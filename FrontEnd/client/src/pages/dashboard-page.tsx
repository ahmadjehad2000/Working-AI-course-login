import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/navbar";
import { apiGet } from "@/lib/api";
import { 
  BookOpen, 
  Award, 
  TrendingUp, 
  Clock,
  CheckCircle,
  Star,
  Calendar,
  ExternalLink
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  // Fetch user profile with stats
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/users/profile"],
    queryFn: () => apiGet<{
      user: any;
      stats: any;
      badges: any[];
      certificates: any[];
      enrollments: any[];
    }>("/api/users/profile"),
  });

  // Fetch user's enrollments
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["/api/enrollments"],
    queryFn: () => apiGet<{ enrollments: any[] }>("/api/enrollments"),
  });

  // Fetch user's certificates
  const { data: certificatesData, isLoading: certificatesLoading } = useQuery({
    queryKey: ["/api/certificates"],
    queryFn: () => apiGet<{ certificates: any[] }>("/api/certificates"),
  });

  const enrollments = enrollmentsData?.enrollments || [];
  const certificates = certificatesData?.certificates || [];
  const stats = profileData?.stats || {
    enrollments: 0,
    completedCourses: 0,
    certificates: 0,
    badges: 0
  };

  const inProgressCourses = enrollments.filter(e => !e.is_completed);
  const completedCourses = enrollments.filter(e => e.is_completed);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="text-muted-foreground">
            Track your progress and continue your learning journey
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-enrollments">
                {stats.enrollments}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Courses</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-completed">
                {stats.completedCourses}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Certificates Earned</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-certificates">
                {stats.certificates}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-badges">
                {stats.badges}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="progress" data-testid="tab-progress">Learning Progress</TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">Completed</TabsTrigger>
            <TabsTrigger value="certificates" data-testid="tab-certificates">Certificates</TabsTrigger>
          </TabsList>

          {/* In Progress Courses */}
          <TabsContent value="progress" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Courses in Progress</h2>
              <Button data-testid="button-browse-courses">
                <Link href="/courses">Browse More Courses</Link>
              </Button>
            </div>

            {enrollmentsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted rounded-lg h-32"></div>
                  </div>
                ))}
              </div>
            ) : inProgressCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {inProgressCourses.map((enrollment) => (
                  <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {enrollment.expand?.course_id?.title || 'Course'}
                          </CardTitle>
                          <CardDescription>
                            {enrollment.expand?.course_id?.difficulty_level && (
                              <Badge variant="secondary" className="mt-1">
                                {enrollment.expand.course_id.difficulty_level}
                              </Badge>
                            )}
                          </CardDescription>
                        </div>
                        {enrollment.expand?.course_id?.estimated_duration && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            {enrollment.expand.course_id.estimated_duration}h
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progress</span>
                            <span>{enrollment.progress_percentage}%</span>
                          </div>
                          <Progress value={enrollment.progress_percentage} className="h-2" />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            className="flex-1" 
                            data-testid={`button-continue-${enrollment.course_id}`}
                          >
                            <Link href={`/courses/${enrollment.course_id}`}>
                              Continue Learning
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No courses in progress</h3>
                  <p className="text-muted-foreground mb-4">
                    Start your learning journey by enrolling in a course
                  </p>
                  <Button data-testid="button-browse-courses-empty">
                    <Link href="/courses">Browse Courses</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Completed Courses */}
          <TabsContent value="completed" className="space-y-6">
            <h2 className="text-2xl font-bold">Completed Courses</h2>

            {completedCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {completedCourses.map((enrollment) => (
                  <Card key={enrollment.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {enrollment.expand?.course_id?.title || 'Course'}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Completed on {new Date(enrollment.completion_date).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        {enrollment.certificate_issued && (
                          <Badge className="bg-green-100 text-green-800">
                            <Award className="h-3 w-3 mr-1" />
                            Certified
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          data-testid={`button-view-${enrollment.course_id}`}
                        >
                          <Link href={`/courses/${enrollment.course_id}`}>
                            View Course
                          </Link>
                        </Button>
                        {enrollment.certificate_issued && (
                          <Button 
                            variant="secondary"
                            data-testid={`button-certificate-${enrollment.id}`}
                          >
                            <Award className="h-4 w-4 mr-2" />
                            Certificate
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No completed courses yet</h3>
                  <p className="text-muted-foreground">
                    Complete your enrolled courses to see them here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Certificates */}
          <TabsContent value="certificates" className="space-y-6">
            <h2 className="text-2xl font-bold">Your Certificates</h2>

            {certificatesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted rounded-lg h-32"></div>
                  </div>
                ))}
              </div>
            ) : certificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {certificates.map((certificate) => (
                  <Card key={certificate.id} className="border-2 border-primary/20">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center">
                            <Award className="h-5 w-5 text-primary mr-2" />
                            {certificate.expand?.course_id?.title || 'Course Certificate'}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Issued on {new Date(certificate.issued_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-sm">
                          <p className="font-medium">Verification Code:</p>
                          <code className="bg-muted px-2 py-1 rounded text-xs">
                            {certificate.verification_code}
                          </code>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            data-testid={`button-view-certificate-${certificate.id}`}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Certificate
                          </Button>
                          <Button 
                            variant="secondary"
                            onClick={() => navigator.clipboard.writeText(certificate.verification_code)}
                            data-testid={`button-copy-code-${certificate.id}`}
                          >
                            Copy Code
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No certificates yet</h3>
                  <p className="text-muted-foreground">
                    Complete courses to earn verified certificates
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
