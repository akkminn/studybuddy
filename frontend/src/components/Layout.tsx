import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, FileUp, Trophy, LogOut, GraduationCap, Menu, X, ChevronLeft, ChevronRight, MessageSquare, Sun, Moon, Monitor } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "./ThemeProvider";
import { useStudyContext } from "../hooks/useStudyContext";
import { Button } from "./ui/Button";
import { cn } from "../lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { contextTitle } = useStudyContext();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = React.useState(false);

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Upload", icon: FileUp, path: "/upload" },
    { label: "Chat Assistant", icon: MessageSquare, path: "/chat" },
    { label: "Quizzes", icon: Trophy, path: "/quizzes" },
    { label: "Flashcards", icon: BookOpen, path: "/flashcards" },
  ];

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 md:translate-x-0 flex flex-col",
        isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full w-64",
        isDesktopCollapsed ? "md:w-20" : "md:w-64"
      )}>
        <div className="h-full flex flex-col relative">
          
          {/* Collapse Toggle Button */}
          <Button 
            variant="outline" 
            size="icon" 
            className="absolute -right-4 top-8 rounded-full shadow-sm bg-white dark:bg-slate-800 disabled hidden md:flex h-8 w-8 z-50 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
          >
            {isDesktopCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>

          <div className={cn(
            "p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 h-20",
            isDesktopCollapsed ? "justify-center px-0" : ""
          )}>
            <div className="bg-indigo-600 p-2 rounded-xl text-white shrink-0">
              <GraduationCap size={24} />
            </div>
            {!isDesktopCollapsed && (
              <span className="text-lg font-bold text-slate-900 dark:text-white whitespace-nowrap overflow-hidden transition-all">
                StudyBuddy
              </span>
            )}
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-x-hidden">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 py-3 rounded-xl transition-colors",
                  isDesktopCollapsed ? "justify-center px-0" : "px-4",
                  location.pathname === item.path
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
                title={isDesktopCollapsed ? item.label : undefined}
              >
                <item.icon size={20} className="shrink-0" />
                {!isDesktopCollapsed && (
                  <span className="whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            {isDesktopCollapsed ? (
              <div className="flex flex-col items-center gap-4 mb-2">
                <Link to="/profile" className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0 hover:ring-2 hover:ring-indigo-500 transition-all">
                  {user.email?.[0].toUpperCase()}
                </Link>
                <div className="flex flex-col gap-1 items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full">
                   <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-1.5 rounded-full hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                   </button>
                </div>
                <Button variant="ghost" size="icon" className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950" onClick={logout} title="Sign Out">
                  <LogOut size={20} />
                </Button>
              </div>
            ) : (
              <>
                <Link to="/profile" className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0 group-hover:ring-2 group-hover:ring-indigo-500 transition-all">
                    {user.email?.[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{user.email}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{profile?.role || "Student"}</p>
                  </div>
                </Link>
                
                <div className="flex items-center justify-between px-2 mb-4 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                  <button onClick={() => setTheme('light')} className={cn("flex-1 py-1.5 rounded-lg flex justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors", theme === 'light' && "bg-white dark:bg-slate-700 shadow-sm text-foreground")}>
                     <Sun size={16} />
                  </button>
                  <button onClick={() => setTheme('dark')} className={cn("flex-1 py-1.5 rounded-lg flex justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors", theme === 'dark' && "bg-white dark:bg-slate-700 shadow-sm text-foreground")}>
                     <Moon size={16} />
                  </button>
                  <button onClick={() => setTheme('system')} className={cn("flex-1 py-1.5 rounded-lg flex justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors", theme === 'system' && "bg-white dark:bg-slate-700 shadow-sm text-foreground")}>
                     <Monitor size={16} />
                  </button>
                </div>

                <Button variant="ghost" className="w-full justify-start gap-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 hover:text-rose-700 dark:hover:text-rose-300" onClick={logout}>
                  <LogOut size={20} className="shrink-0" />
                  <span className="whitespace-nowrap">Sign Out</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 min-h-screen flex flex-col transition-all duration-300",
        isDesktopCollapsed ? "md:ml-20" : "md:ml-64"
      )}>
        {/* Mobile Header */}
        <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <GraduationCap size={20} />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">StudyBuddy</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </header>

        <div className="p-6 md:p-10 flex-1 w-full max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
