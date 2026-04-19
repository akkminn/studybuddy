import React from "react";
import { useAuth } from "../hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Link } from "react-router-dom";
import { formatDate } from "../lib/utils";
import { BookOpen, Clock, Zap, ArrowRight, Trash2 } from "lucide-react";
import { useFlashcardSets } from "../hooks/useFlashcardSets";
import { toast } from "sonner";
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

export function FlashcardsList() {
  const { user } = useAuth();
  const { sets, loading, deleteSet } = useFlashcardSets(user?.uid);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Flashcards</h1>
          <p className="text-sm text-slate-500">Master key concepts with digital flashcards.</p>
        </div>
        <Link to="/generate/flashcards">
          <Button className="gap-2">
            <Zap size={18} />
            Generate New
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : sets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sets.map((set) => (
            <Card key={set.id} className="group hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-3 right-3 z-10">
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-slate-400 hover:text-destructive hover:bg-destructive/10"
                        title="Delete flashcards"
                      />
                    }
                  >
                    <Trash2 size={16} />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-lg">Delete Flashcards</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete these flashcards? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel size="lg">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        size="lg"
                        onClick={async () => {
                          try {
                            if (deleteSet) {
                              await deleteSet(set.id);
                              toast.success("Flashcards deleted successfully");
                            }
                          } catch (err) {
                            toast.error("Failed to delete flashcards");
                            console.error("Failed to delete flashcards:", err);
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
                <CardTitle className="text-lg group-hover:text-indigo-600 transition-colors">{set.title}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Clock size={14} />
                  {formatDate(set.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-slate-600 mb-6">
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={16} className="text-indigo-500" />
                    {set.flashcards?.length || 0} Cards
                  </span>
                </div>
                <Link to={`/flashcards/${set.id}`}>
                  <Button variant="outline" className="w-full gap-2">
                    Study Cards
                    <ArrowRight size={18} />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-slate-200" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">No flashcards yet</h3>
          <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">Generate flashcards from any of your uploaded documents.</p>
          <Link to="/generate/flashcards">
            <Button>Generate Flashcards</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
