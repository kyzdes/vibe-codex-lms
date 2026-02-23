import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function VerifyRequestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Проверьте почту</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Ссылка для входа отправлена на ваш email. Перейдите по ней, чтобы
            войти в VibeLearn.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
