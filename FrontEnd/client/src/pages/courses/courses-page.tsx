import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import CourseCard from "@/components/course-card";
import { apiGet } from "@/lib/api";
import type { SelectCourse } from "@shared/schema";
import { 
  Search, 
  Filter, 
  BookOpen,
  Plus,
  Grid,
  List
} from "lucide-react";

export default function CoursesPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  // Build query parameters
  const queryParams = new URLSearchParams();
  queryParams.set("page", page.toString());
  queryParams.set("limit", "12");
  if (searchTerm) queryParams.set("search", searchTerm);
  if (difficulty) queryParams.set("difficulty", difficulty);

  // Fetch courses
  const { data: coursesData, isLoading, error } = useQuery({
    queryKey: ["/api/courses", searchTerm, difficulty, page],
    queryFn: () => apiGet<{
      courses: SelectCourse[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/api/courses?${queryParams.toString()}`),
  });

  const courses = coursesData?.courses || [];
  const pagination = coursesData?.pagination;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
  };

  const handleDifficultyChange = (value: string) => {
    setDifficulty(value === "all" ? "" : value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">All Courses</h1>
            <p className="text-muted-foreground">
              Discover courses to advance your skills and career
            </p>
          </div>
          
          {user?.role !== 'student' && (
            <Button data-testid="button-create-course">
              <Link href="/create-course" className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Link>
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-courses"
                  />
                </div>
              </form>

              {/* Difficulty Filter */}
              <Select value={difficulty || "all"} onValueChange={handleDifficultyChange}>
                <SelectTrigger className="w-full lg:w-48" data-testid="select-difficulty">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex border rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  data-testid="button-grid-view"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  data-testid="button-list-view"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Active Filters */}
            {(searchTerm || difficulty) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {searchTerm && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Search: {searchTerm}
                    <button 
                      onClick={() => setSearchTerm("")}
                      className="ml-1 hover:text-destructive"
                      data-testid="button-clear-search"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {difficulty && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Level: {difficulty}
                    <button 
                      onClick={() => setDifficulty("")}
                      className="ml-1 hover:text-destructive"
                      data-testid="button-clear-difficulty"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Count */}
        {pagination && (
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-muted-foreground">
              Showing {courses.length} of {pagination.total} courses
            </p>
          </div>
        )}

        {/* Courses Grid/List */}
        {isLoading ? (
          <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-lg h-64"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-destructive">Failed to load courses. Please try again.</p>
            </CardContent>
          </Card>
        ) : courses.length > 0 ? (
          <>
            <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
              {courses.map((course) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  variant={viewMode}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <Button
                        key={pageNumber}
                        variant={page === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNumber)}
                        data-testid={`button-page-${pageNumber}`}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  disabled={page === pagination.pages}
                  onClick={() => setPage(page + 1)}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No courses found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || difficulty 
                  ? "Try adjusting your search criteria"
                  : "No courses are available at the moment"
                }
              </p>
              {(searchTerm || difficulty) && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setDifficulty("");
                  }}
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
