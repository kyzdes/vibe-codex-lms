"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    Configuration: "Ошибка конфигурации сервера",
    AccessDenied: "Доступ запрещён",
    Verification: "Ссылка для входа истекла или уже использована",
    Default: "Произошла ошибка при авторизации",
  };

  return (
    <p className="text-muted-foreground">
      {errorMessages[error || ""] || errorMessages.Default}
    </p>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Ошибка авторизации</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Suspense fallback={<p className="text-muted-foreground">Загрузка...</p>}>
            <ErrorContent />
          </Suspense>
          <Button asChild>
            <Link href="/auth/signin">Попробовать снова</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
