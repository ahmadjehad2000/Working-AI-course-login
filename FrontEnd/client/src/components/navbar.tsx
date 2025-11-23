import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  BookOpen, 
  LayoutDashboard, 
  Plus,
  User, 
  LogOut, 
  Menu,
  Settings
} from "lucide-react";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };

  const NavLinks = () => (
    <>
      <Link href="/" className={`hover:text-primary transition-colors ${isActive('/') ? 'text-primary font-medium' : ''}`} data-testid="nav-home">
        Home
      </Link>
      <Link href="/courses" className={`hover:text-primary transition-colors ${isActive('/courses') ? 'text-primary font-medium' : ''}`} data-testid="nav-courses">
        Courses
      </Link>
      {user && (
        <Link href="/dashboard" className={`hover:text-primary transition-colors ${isActive('/dashboard') ? 'text-primary font-medium' : ''}`} data-testid="nav-dashboard">
          Dashboard
        </Link>
      )}
    </>
  );

  const UserInitials = () => {
    if (!user) return "U";
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" data-testid="nav-logo">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">Courses Platform</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLinks />
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Create Course Button (Instructors & Admins) */}
                {user.role !== 'student' && (
                  <Button variant="outline" size="sm" className="hidden sm:flex" data-testid="nav-create-course">
                    <Link href="/create-course" className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Course
                    </Link>
                  </Button>
                )}

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full" data-testid="nav-user-menu">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url} alt={`${user.first_name} ${user.last_name}`} />
                        <AvatarFallback>{UserInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        <Badge variant="secondary" className="w-fit text-xs">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild data-testid="nav-dashboard-menu">
                      <Link href="/dashboard" className="flex items-center">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild data-testid="nav-profile-menu">
                      <Link href="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
                      <DropdownMenuItem asChild data-testid="nav-admin-menu">
                        <Link href="/admin" className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="text-red-600 focus:text-red-600"
                      data-testid="nav-logout"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Button variant="ghost" data-testid="nav-login">
                  <Link href="/auth">Log in</Link>
                </Button>
                <Button data-testid="nav-signup">
                  <Link href="/auth">Sign up</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden" data-testid="nav-mobile-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  <div className="flex flex-col space-y-3">
                    <NavLinks />
                  </div>
                  
                  {user ? (
                    <div className="pt-4 border-t">
                      <div className="flex items-center space-x-3 mb-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url} alt={`${user.first_name} ${user.last_name}`} />
                          <AvatarFallback>{UserInitials()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.first_name} {user.last_name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <Badge variant="secondary" className="text-xs">
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        {user.role !== 'student' && (
                          <Button variant="outline" className="justify-start" data-testid="nav-mobile-create-course">
                            <Link href="/create-course" className="flex items-center">
                              <Plus className="h-4 w-4 mr-2" />
                              Create Course
                            </Link>
                          </Button>
                        )}
                        <Button variant="outline" className="justify-start" data-testid="nav-mobile-profile">
                          <Link href="/profile" className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            Profile
                          </Link>
                        </Button>
                        {user.role === 'admin' && (
                          <Button variant="outline" className="justify-start" data-testid="nav-mobile-admin">
                            <Link href="/admin" className="flex items-center">
                              <Settings className="h-4 w-4 mr-2" />
                              Admin Panel
                            </Link>
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          className="justify-start text-red-600 hover:text-red-600"
                          onClick={handleLogout}
                          data-testid="nav-mobile-logout"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Log out
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 border-t space-y-2">
                      <Button className="w-full justify-start" data-testid="nav-mobile-login">
                        <Link href="/auth">Log in</Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" data-testid="nav-mobile-signup">
                        <Link href="/auth">Sign up</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
