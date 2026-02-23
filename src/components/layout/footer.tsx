import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <span className="font-semibold">VibeLearn</span>
        </div>
        <nav className="flex gap-4 text-sm text-muted-foreground md:ml-auto">
          <Link href="/about" className="hover:text-foreground">О платформе</Link>
          <Link href="/privacy" className="hover:text-foreground">Конфиденциальность</Link>
          <Link href="/terms" className="hover:text-foreground">Условия</Link>
        </nav>
      </div>
    </footer>
  );
}
