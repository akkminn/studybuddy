import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Network, Plus, Trash2, Clock, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useMindMaps } from "../hooks/useMindMaps";
import { formatDate } from "../lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { Button } from "../components/ui/Button";

export function MindMapsList() {
  const navigate = useNavigate();
  const { mindMaps, loading, error, deleteMindMap } = useMindMaps();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Your Mind Maps</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your AI-generated concept maps.
          </p>
        </div>
        <Link to="/generate/mindmap">
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm text-sm">
            <Plus size={16} /> New Mind Map
          </button>
        </Link>
      </div>

      {/* States */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-3 p-5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700">
          <AlertCircle size={20} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {!loading && !error && mindMaps.length === 0 && (
        <Card className="p-12 text-center">
          <Network size={48} className="mx-auto mb-4 text-slate-200" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">No mind maps yet</h3>
          <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">Generate a concept map from any of your uploaded documents.</p>
          <Link to="/generate/mindmap">
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm mx-auto">
              <Plus size={16} /> Generate Mind Map
            </button>
          </Link>
        </Card>
      )}

      {!loading && mindMaps.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mindMaps.map((map) => (
            <Card key={map.id} className="group hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-3 right-3 z-10">
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-slate-400 hover:text-destructive hover:bg-destructive/10"
                        title="Delete mind map"
                      />
                    }
                  >
                    <Trash2 size={16} />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-lg">Delete Mind Map</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this mind map? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel size="lg">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        size="lg"
                        onClick={async () => {
                          try {
                            if (deleteMindMap) {
                              await deleteMindMap(map.id);
                              toast.success("Mind map deleted successfully");
                            }
                          } catch (err) {
                            toast.error("Failed to delete mind map");
                            console.error("Failed to delete mind map:", err);
                          }
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <CardHeader className="pr-12">
                <CardTitle className="text-lg group-hover:text-indigo-600 transition-colors">{map.title}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Clock size={14} />
                  {formatDate(map.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-slate-600 mb-6">
                  <span className="flex items-center gap-1.5">
                    <Network size={16} className="text-indigo-500" />
                    {map.data?.children?.length || 0} Branches
                  </span>
                </div>
                <Link to={`/mindmaps/${map.id}`}>
                  <Button variant="outline" className="w-full gap-2">
                    View Network
                    <ArrowRight size={18} />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
