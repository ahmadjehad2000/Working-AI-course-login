import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import CourseCard from "@/components/course-card";
import { apiGet } from "@/lib/api";
import type { SelectCourse } from "@shared/schema";
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Award,
  ArrowRight,
  GraduationCap,
  Clock,
  Star
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  // Fetch featured courses
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ["/api/courses", { limit: 6, published: true }],
    queryFn: () => apiGet<{ courses: SelectCourse[] }>("/api/courses?limit=6&published=true"),
  });

  // Fetch user's recent enrollments if logged in
  const { data: enrollmentsData } = useQuery({
    queryKey: ["/api/enrollments"],
    queryFn: () => apiGet<{ enrollments: any[] }>("/api/enrollments"),
    enabled: !!user,
  });

  const featuredCourses = coursesData?.courses || [];
  const recentEnrollments = enrollmentsData?.enrollments?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold leading-tight">
                Master New Skills with
                <span className="block text-white/90">Expert-Led Courses</span>
              </h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                Join thousands of learners worldwide and advance your career with our 
                comprehensive courses designed by industry professionals.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-primary hover:text-primary"
                data-testid="button-browse-courses"
              >
                <Link href="/courses" className="flex items-center">
                  Browse Courses
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              {user?.role !== 'student' && (
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-primary"
                  data-testid="button-create-course"
                >
                  <Link href="/create-course" className="flex items-center">
                    Create Course
                    <GraduationCap className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground">500+</div>
              <div className="text-muted-foreground">Expert Courses</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground">50K+</div>
              <div className="text-muted-foreground">Active Learners</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground">25K+</div>
              <div className="text-muted-foreground">Certificates Issued</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground">95%</div>
              <div className="text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Continue Learning Section (for authenticated users) */}
      {user && recentEnrollments.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Continue Learning</h2>
              <Button variant="outline" data-testid="button-view-dashboard">
                <Link href="/dashboard" className="flex items-center">
                  View Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentEnrollments.map((enrollment) => (
                <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {enrollment.expand?.course_id?.title || 'Course'}
                    </CardTitle>
                    <CardDescription>
                      Progress: {enrollment.progress_percentage}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${enrollment.progress_percentage}%` }}
                        />
                      </div>
                      <Button 
                        className="w-full" 
                        data-testid={`button-continue-${enrollment.course_id}`}
                      >
                        <Link href={`/courses/${enrollment.course_id}`}>
                          Continue Learning
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Courses Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Courses</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover our most popular courses, carefully selected by industry experts 
              to help you succeed in your career.
            </p>
          </div>
          
          {coursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted rounded-lg h-48"></div>
                </div>
              ))}
            </div>
          ) : featuredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {featuredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No courses available</h3>
              <p className="text-muted-foreground">Check back later for new courses.</p>
            </div>
          )}
          
          <div className="text-center">
            <Button size="lg" variant="outline" data-testid="button-view-all-courses">
              <Link href="/courses" className="flex items-center">
                View All Courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our Platform?</h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to succeed in your learning journey
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Expert Instructors</CardTitle>
                <CardDescription>
                  Learn from industry professionals with years of real-world experience
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Flexible Learning</CardTitle>
                <CardDescription>
                  Study at your own pace with lifetime access to course materials
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Verified Certificates</CardTitle>
                <CardDescription>
                  Earn industry-recognized certificates to boost your career prospects
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-xl mb-8 text-white/80">
            Join thousands of professionals who have transformed their careers with our courses
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-primary hover:text-primary"
                data-testid="button-get-started"
              >
                <Link href="/auth">Get Started Today</Link>
              </Button>
            ) : (
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-primary hover:text-primary"
                data-testid="button-browse-courses-cta"
              >
                <Link href="/courses">Browse Courses</Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
