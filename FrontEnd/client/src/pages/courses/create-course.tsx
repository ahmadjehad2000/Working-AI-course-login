import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import { apiPost } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { insertCourseSchema } from "@shared/schema";
import { 
  BookOpen, 
  Clock, 
  Target,
  Image,
  Hash,
  Loader2,
  X,
  Sparkles,
  ListChecks
} from "lucide-react";

type AiModulePreview = {
  title: string;
  description?: string;
  topics?: string[];
  content?: string;
  examples?: string[];
  exercises?: string[];
};

type AiQuality = {
  overall_score?: number;
  depth_score?: number;
  clarity_score?: number;
  completeness_score?: number;
  engagement_score?: number;
  issues?: string[];
  recommendations?: string[];
};

type AiCoursePreview = {
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  overview?: string;
  objectives?: string[];
  modules?: AiModulePreview[];
  tags?: string[];
  estimated_hours?: number;
  quality?: AiQuality;
};

type PrefillCoursePayload = {
  title?: string;
  overview?: string;
  objective?: string;
  tags?: string[];
  difficulty_level: "beginner" | "intermediate" | "advanced";
  estimated_duration: number;
};

type AiGenerationResponse = {
  success: boolean;
  course?: AiCoursePreview;
  quality?: AiQuality;
  generation_time?: number;
  error?: string;
  prefill?: PrefillCoursePayload;
};

const createCourseSchema = insertCourseSchema.extend({
  tags: z.array(z.string()).optional()
});

export default function CreateCourse() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [tagInput, setTagInput] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [aiPreview, setAiPreview] = useState<AiGenerationResponse | null>(null);

  const form = useForm<z.infer<typeof createCourseSchema>>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      title: "",
      overview: "",
      objective: "",
      thumbnail_url: "",
      difficulty_level: "beginner",
      estimated_duration: 1,
      is_published: false,
      tags: []
    }
  });

  const watchedTags = form.watch("tags") || [];

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: (courseData: z.infer<typeof createCourseSchema>) =>
      apiPost<{ course: any }>("/api/courses", courseData),
    onSuccess: ({ course }) => {
      toast({
        title: "Course created successfully!",
        description: "Your course has been created and can be found in your dashboard.",
      });
      setLocation(`/courses/${course.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const applyPrefill = (prefill: PrefillCoursePayload) => {
    if (prefill.title) {
      form.setValue("title", prefill.title);
      setAiTopic(prefill.title);
    }
    if (prefill.overview) {
      form.setValue("overview", prefill.overview);
    }
    if (prefill.objective) {
      form.setValue("objective", prefill.objective);
    }
    if (prefill.tags) {
      form.setValue("tags", prefill.tags);
    }
    if (prefill.difficulty_level) {
      form.setValue("difficulty_level", prefill.difficulty_level);
      setAiDifficulty(prefill.difficulty_level);
    }
    if (prefill.estimated_duration) {
      form.setValue("estimated_duration", prefill.estimated_duration);
    }
  };

  const buildPrefillFromCourse = (course?: AiCoursePreview | null): PrefillCoursePayload | undefined => {
    if (!course) return undefined;
    const overview = course.overview || course.modules?.[0]?.description || "";
    const objective = course.objectives?.length
      ? course.objectives.map((item) => `- ${item}`).join("\n")
      : "";
    const estimatedDuration =
      course.estimated_hours && course.estimated_hours > 0
        ? course.estimated_hours
        : Math.max(course.modules?.length || 1, 1);

    return {
      title: course.title,
      overview,
      objective,
      tags: course.tags || [],
      difficulty_level: course.difficulty,
      estimated_duration: estimatedDuration,
    };
  };

  const aiGenerateMutation = useMutation({
    mutationFn: (payload: { title: string; difficulty: "beginner" | "intermediate" | "advanced" }) =>
      apiPost<AiGenerationResponse>("/api/ai/generate", payload),
    onSuccess: (data) => {
      setAiPreview(data);
      const prefillPayload = data.prefill || buildPrefillFromCourse(data.course);
      if (prefillPayload) {
        applyPrefill(prefillPayload);
      }

      toast({
        title: data.success ? "AI course draft ready" : "AI service responded",
        description: data.error
          ? data.error
          : "We pre-filled the form with the AI-generated outline. Review and tweak before publishing.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "AI generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Redirect if not instructor or admin
  if (user?.role === 'student') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                Only instructors and administrators can create courses.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleAiGenerate = () => {
    const topic = (aiTopic || form.getValues("title")).trim();
    const difficulty = (aiDifficulty || form.getValues("difficulty_level") || "beginner") as
      | "beginner"
      | "intermediate"
      | "advanced";

    if (!topic) {
      toast({
        title: "Enter a topic first",
        description: "Add a course title to generate an outline with AI.",
        variant: "destructive",
      });
      return;
    }

    aiGenerateMutation.mutate({ title: topic, difficulty });
  };

  const onSubmit = (data: z.infer<typeof createCourseSchema>) => {
    createCourseMutation.mutate(data);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.getValues("tags")?.includes(tag)) {
      const currentTags = form.getValues("tags") || [];
      form.setValue("tags", [...currentTags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue("tags", currentTags.filter(tag => tag !== tagToRemove));
  };

  const topicValue = aiTopic || form.watch("title") || "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create New Course</h1>
            <p className="text-muted-foreground">
              Create an engaging course to share your knowledge with learners worldwide
            </p>
          </div>

          {/* Course Creation Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* AI Course Builder */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Generate with AI
                  </CardTitle>
                  <CardDescription>
                    Use the AI engine from the root project to draft a course outline, then refine it before publishing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <FormLabel>Course topic</FormLabel>
                      <Input
                        placeholder="e.g., Building AI-driven Products"
                        value={topicValue}
                        onChange={(e) => {
                          setAiTopic(e.target.value);
                          form.setValue("title", e.target.value);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <FormLabel>Difficulty for AI draft</FormLabel>
                      <Select
                        value={aiDifficulty}
                        onValueChange={(value) => {
                          const asDifficulty = value as "beginner" | "intermediate" | "advanced";
                          setAiDifficulty(asDifficulty);
                          form.setValue("difficulty_level", asDifficulty);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      onClick={handleAiGenerate}
                      disabled={aiGenerateMutation.isPending}
                    >
                      {aiGenerateMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Talking to AI...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate with AI
                        </>
                      )}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      We will call the FastAPI service in the repository root and prefill the form with the suggested outline.
                    </p>
                  </div>

                  {aiPreview?.quality && (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="secondary">
                        Quality score: {Math.round(aiPreview.quality.overall_score || 0)}%
                      </Badge>
                      {aiPreview.quality.depth_score !== undefined && (
                        <span className="text-muted-foreground">
                          Depth {Math.round(aiPreview.quality.depth_score ?? 0)} · Clarity {Math.round(aiPreview.quality.clarity_score ?? 0)} · Completeness {Math.round(aiPreview.quality.completeness_score ?? 0)}
                        </span>
                      )}
                    </div>
                  )}

                  {aiPreview?.course?.modules && aiPreview.course.modules.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <ListChecks className="h-4 w-4" />
                        Modules draft (preview)
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                        {aiPreview.course.modules.map((module, index) => (
                          <div key={index} className="rounded-md border bg-background p-3">
                            <div className="font-semibold">Module {index + 1}: {module.title}</div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                              {module.description || module.content || "Module description will appear here."}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>
                    Provide the essential details about your course
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Complete Web Development Bootcamp"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setAiTopic(e.target.value);
                            }}
                            data-testid="input-course-title"
                          />
                        </FormControl>
                        <FormDescription>
                          Choose a clear, descriptive title that reflects what students will learn
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="overview"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Overview</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide a comprehensive overview of what this course covers..."
                            className="min-h-[120px]"
                            {...field}
                            data-testid="textarea-course-overview"
                          />
                        </FormControl>
                        <FormDescription>
                          Describe what the course is about and what students can expect to learn
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="objective"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Learning Objectives</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="By the end of this course, students will be able to..."
                            className="min-h-[100px]"
                            {...field}
                            data-testid="textarea-course-objective"
                          />
                        </FormControl>
                        <FormDescription>
                          Specify the key skills and knowledge students will gain
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Course Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Course Details
                  </CardTitle>
                  <CardDescription>
                    Configure the technical aspects of your course
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="difficulty_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty Level</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            setAiDifficulty(value as "beginner" | "intermediate" | "advanced");
                          }}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-difficulty-level">
                              <SelectValue placeholder="Select difficulty level" />
                            </SelectTrigger>
                          </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Target audience skill level
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estimated_duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (Hours)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0.5"
                              step="0.5"
                              placeholder="e.g., 12.5"
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                              data-testid="input-course-duration"
                            />
                          </FormControl>
                          <FormDescription>
                            Estimated time to complete
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="thumbnail_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Thumbnail URL</FormLabel>
                        <FormControl>
                          <Input 
                            type="url"
                            placeholder="https://example.com/course-thumbnail.jpg"
                            {...field}
                            data-testid="input-thumbnail-url"
                          />
                        </FormControl>
                        <FormDescription>
                          A compelling image that represents your course (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Tags and Publishing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Tags & Publishing
                  </CardTitle>
                  <CardDescription>
                    Add tags to help students find your course and set publishing status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <FormLabel>Course Tags</FormLabel>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Add a tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        data-testid="input-course-tags"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={addTag}
                        data-testid="button-add-tag"
                      >
                        Add
                      </Button>
                    </div>
                    {watchedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {watchedTags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-destructive"
                              data-testid={`button-remove-tag-${index}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">
                      Add relevant tags to help students discover your course
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="is_published"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Publish Course
                          </FormLabel>
                          <FormDescription>
                            Make this course visible to students. You can change this later.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-publish-course"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={createCourseMutation.isPending}
                  data-testid="button-create-course"
                >
                  {createCourseMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Course...
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Create Course
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setLocation('/courses')}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
