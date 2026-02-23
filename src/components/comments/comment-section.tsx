"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { MessageCircle, Reply, Send, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CommentUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: CommentUser;
  parentId: string | null;
  replies?: Comment[];
}

interface CommentSectionProps {
  lessonId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "только что";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin} ${plural(diffMin, "минуту", "минуты", "минут")} назад`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `${diffHours} ${plural(diffHours, "час", "часа", "часов")} назад`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays} ${plural(diffDays, "день", "дня", "дней")} назад`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths} ${plural(diffMonths, "месяц", "месяца", "месяцев")} назад`;
  }

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} ${plural(diffYears, "год", "года", "лет")} назад`;
}

function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const lastDigit = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (lastDigit > 1 && lastDigit < 5) return few;
  if (lastDigit === 1) return one;
  return many;
}

function getInitial(name: string | null): string {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Avatar({ user }: { user: CommentUser }) {
  if (user.image) {
    return (
      <img
        src={user.image}
        alt={user.name ?? ""}
        className="h-8 w-8 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
      {getInitial(user.name)}
    </div>
  );
}

function CommentItem({
  comment,
  isReply,
  isAuthenticated,
  onReplySubmit,
}: {
  comment: Comment;
  isReply?: boolean;
  isAuthenticated: boolean;
  onReplySubmit: (parentId: string, content: string) => Promise<void>;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      await onReplySubmit(comment.id, replyContent.trim());
      setReplyContent("");
      setShowReplyForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={isReply ? "ml-10 mt-3" : ""}>
      <div className="flex gap-3">
        <Avatar user={comment.user} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {comment.user.name ?? "Аноним"}
            </span>
            <span className="text-xs text-muted-foreground">
              {relativeTime(comment.createdAt)}
            </span>
          </div>
          <p className="mt-1 text-sm whitespace-pre-wrap break-words">
            {comment.content}
          </p>
          {!isReply && isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 h-7 px-2 text-xs text-muted-foreground"
              onClick={() => setShowReplyForm((v) => !v)}
            >
              <Reply className="mr-1 h-3 w-3" />
              Ответить
            </Button>
          )}

          {showReplyForm && (
            <div className="mt-2 space-y-2">
              <Textarea
                placeholder="Напишите ответ..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSubmitReply}
                  disabled={submitting || !replyContent.trim()}
                >
                  {submitting ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="mr-1 h-3 w-3" />
                  )}
                  Отправить
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent("");
                  }}
                >
                  Отмена
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isReply
              isAuthenticated={isAuthenticated}
              onReplySubmit={onReplySubmit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CommentSection({ lessonId }: CommentSectionProps) {
  const { data: session, status: sessionStatus } = useSession();
  const isAuthenticated = !!session?.user;

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?lessonId=${lessonId}`);
      if (!res.ok) throw new Error("Ошибка загрузки комментариев");
      const json = await res.json();
      setComments(json.data);
    } catch {
      toast.error("Не удалось загрузить комментарии");
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmitNew = async () => {
    if (!newContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, content: newContent.trim() }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Ошибка отправки");
      }
      setNewContent("");
      toast.success("Комментарий добавлен");
      await fetchComments();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Не удалось отправить комментарий"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: string, content: string) => {
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, content, parentId }),
    });
    if (!res.ok) {
      const json = await res.json();
      toast.error(json.error ?? "Не удалось отправить ответ");
      throw new Error("Reply failed");
    }
    toast.success("Ответ добавлен");
    await fetchComments();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5" />
          Комментарии
          {!loading && (
            <span className="text-sm font-normal text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New comment form */}
        {sessionStatus === "loading" ? null : isAuthenticated ? (
          <div className="space-y-2">
            <Textarea
              placeholder="Напишите комментарий..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitNew}
                disabled={submitting || !newContent.trim()}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Отправить
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            <User className="mx-auto mb-2 h-5 w-5" />
            <Link href="/auth/signin" className="text-primary hover:underline">
              Войдите, чтобы оставить комментарий
            </Link>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && <CommentSkeleton />}

        {/* Empty state */}
        {!loading && comments.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Комментариев пока нет. Будьте первым!
          </p>
        )}

        {/* Comments list */}
        {!loading && comments.length > 0 && (
          <div className="space-y-5">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                isAuthenticated={isAuthenticated}
                onReplySubmit={handleReply}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
