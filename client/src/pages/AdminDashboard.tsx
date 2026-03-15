import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BarChart, Users, FileText, MessageSquare, Shield, LogOut, Plus, Edit, Trash2, Database } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { user, isAdmin, logout, isLoading: authLoading } = useCustomAuth();
  const { toast } = useToast();
  const [showNewBlogForm, setShowNewBlogForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "Programming",
    slug: "",
  });
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    document.title = "Admin Panel | Chrispine Mndala";
    if (!authLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can access this panel.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAdmin, authLoading, navigate, toast]);

  if (authLoading) {
    return (
      <div className="p-8 space-y-8">
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="text-center space-y-6">
          <Shield className="w-16 h-16 text-primary mx-auto" />
          <h1 className="text-4xl font-bold text-white">Access Restricted</h1>
          <p className="text-muted-foreground max-w-md">
            This admin panel is only accessible to authorized administrators.
          </p>
          <Button onClick={() => navigate("/login")}>Return to Login</Button>
        </div>
      </div>
    );
  }

  const { data: stats, isLoading } = useQuery<{
    totalPosts: number;
    totalSubscribers: number;
    totalContacts: number;
  }>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: seedStatus } = useQuery({
    queryKey: ["/api/admin/seed-status"],
  });

  const { data: blogs, isLoading: blogsLoading } = useQuery({
    queryKey: ["/api/blog"],
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/admin/seed-database", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error("Seeding failed");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Database Seeded",
        description: `Added ${data.blogsAdded} blogs and ${data.projectsAdded} projects`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seed-status"] });
    },
    onError: () => {
      toast({
        title: "Seeding Failed",
        variant: "destructive",
      });
    },
  });

  const createBlogMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create blog");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      toast({ title: "Blog created successfully" });
      setShowNewBlogForm(false);
      setFormData({ title: "", excerpt: "", content: "", category: "Programming", slug: "" });
    },
  });

  const deleteBlogMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/blog/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete blog");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      toast({ title: "Blog deleted successfully" });
    },
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSaveBlog = () => {
    if (!formData.title || !formData.slug || !formData.content) {
      toast({
        title: "Validation Error",
        description: "Title, slug, and content are required",
        variant: "destructive",
      });
      return;
    }
    createBlogMutation.mutate(formData);
  };

  if (isLoading || blogsLoading) {
    return (
      <div className="p-8 space-y-8">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0c14] p-8 space-y-8">
      {/* Header with Logout */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome, {user?.email}</p>
        </div>
        <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPosts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Newsletter Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSubscribers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contact Requests</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalContacts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Seeding Section */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Seeding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Seed Status: {seedStatus?.totalBlogsSeeded || 0} blogs, {seedStatus?.totalProjectsSeeded || 0} projects</p>
          </div>
          <Button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="bg-primary hover:bg-primary/90"
            data-testid="button-seed-database"
          >
            {seedMutation.isPending ? "Seeding..." : "Populate with Sample Content"}
          </Button>
        </CardContent>
      </Card>

      {/* Blog Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Blog Management</h2>
          <Button onClick={() => setShowNewBlogForm(!showNewBlogForm)} data-testid="button-add-blog">
            <Plus className="w-4 h-4 mr-2" />
            New Blog Post
          </Button>
        </div>

        {showNewBlogForm && (
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>Create New Blog Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Blog Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                data-testid="input-blog-title"
              />
              <Input
                placeholder="Slug (e.g., my-blog-post)"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                data-testid="input-blog-slug"
              />
              <Input
                placeholder="Excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                data-testid="input-blog-excerpt"
              />
              <Textarea
                placeholder="Blog Content (markdown supported)"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                data-testid="input-blog-content"
                className="min-h-40"
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveBlog} disabled={createBlogMutation.isPending} data-testid="button-save-blog">
                  {createBlogMutation.isPending ? "Saving..." : "Save Blog"}
                </Button>
                <Button variant="outline" onClick={() => setShowNewBlogForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Blog List */}
        <div className="grid gap-4">
          {blogs && blogs.length > 0 ? (
            blogs.map((blog: any) => (
              <Card key={blog.id} className="bg-card/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{blog.title}</CardTitle>
                      <Badge className="mt-2">{blog.category}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" data-testid={`button-edit-blog-${blog.id}`}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteBlogMutation.mutate(blog.id)}
                        data-testid={`button-delete-blog-${blog.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{blog.excerpt}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground">No blog posts yet. Create one to get started!</p>
          )}
        </div>
      </div>
    </div>
  );
}
