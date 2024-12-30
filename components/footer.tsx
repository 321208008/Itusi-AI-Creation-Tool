import { Github, Twitter, Globe } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n/use-translations';
import { translations } from '@/lib/i18n/translations';

export function Footer() {
  const language = useI18nStore((state: { language: 'en' | 'zh' }) => state.language);
  const t = translations[language];
  const currentYear = new Date().getFullYear();

  return (
    <footer className="fixed bottom-0 left-0 right-0 py-6 border-t bg-background">
      <div className="max-w-screen-xl mx-auto px-4 flex flex-col items-center justify-center gap-4">
        <div className="flex items-center justify-center gap-6">
          <a
            href="https://github.com/321208008"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-5 w-5" />
          </a>
          <a
            href="https://twitter.com/zyailive"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Twitter className="h-5 w-5" />
          </a>
          <a
            href="https://itusi.cn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Globe className="h-5 w-5" />
          </a>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>{t.footer.copyright.replace('{year}', currentYear.toString())}</p>
        </div>
      </div>
    </footer>
  );
} 