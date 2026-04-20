import React from "react";
import { useAuth } from "../hooks/useAuth";
import { UserCircle, Mail, Trophy, Flame, Calendar, Medal } from "lucide-react";
import { Button } from "../components/ui/Button";

export function Profile() {
  const { user, profile } = useAuth();

  if (!user) {
    return <div>Loading profile...</div>;
  }

  // Fallback to user if profile has not fully sync'ed yet
  const displayUser = profile || user;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return "Recently";
    }
  };

  // Determine user level based on points
  const getLevel = (points: number) => Math.floor(points / 100) + 1;
  const level = getLevel(displayUser.points);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your account and view your learning progress.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Identity Card */}
        <div className="md:col-span-1 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6 flex flex-col items-center text-center">
          <div className="w-32 h-32 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-5xl relative">
            {displayUser.email?.[0].toUpperCase()}
            <div className="absolute bottom-0 right-0 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-full border-2 border-white dark:border-slate-800 shadow-sm">
              Lvl {level}
            </div>
          </div>

          <div className="space-y-1 w-full">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate" title={displayUser.email}>
              {displayUser.username}
            </h2>
            <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
              <Mail size={14} className="shrink-0" />
              <span className="truncate">{displayUser.email}</span>
            </div>
          </div>

          <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-700/50">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 dark:text-slate-400">Account Type</span>
              <span className="font-medium capitalize text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700/50 px-2.5 py-0.5 rounded-full">
                {displayUser.role}
              </span>
            </div>
          </div>
        </div>

        {/* Stats & Progress Cards */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between group hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white duration-300">
                  <Trophy size={22} />
                </div>
                <h3 className="font-medium text-slate-700 dark:text-slate-300">Total Points</h3>
              </div>
              <div>
                <div className="text-4xl font-bold text-slate-900 dark:text-white">
                  {displayUser.points.toLocaleString()}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                  <Medal size={14} className="text-amber-500" />
                  <span>{100 - (displayUser.points % 100)} points to next level</span>
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between group hover:border-rose-200 dark:hover:border-rose-800/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-rose-100 dark:bg-rose-900/30 p-2.5 rounded-xl text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white duration-300">
                  <Flame size={22} />
                </div>
                <h3 className="font-medium text-slate-700 dark:text-slate-300">Current Streak</h3>
              </div>
              <div>
                <div className="text-4xl font-bold text-slate-900 dark:text-white flex items-baseline gap-2">
                  {displayUser.streak} <span className="text-lg text-slate-500 text-normal">days</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Keep learning to maintain it!
                </p>
              </div>
            </div>

          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="font-medium text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Calendar size={18} className="text-slate-400" /> Activity Info
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400">Account Created</span>
                <span className="font-medium text-slate-900 dark:text-white">—</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-slate-500 dark:text-slate-400">Last Active</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatDate(displayUser.lastActivity)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
