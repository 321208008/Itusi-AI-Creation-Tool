'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { ImageGenerator } from '@/components/creator/image-generator';
import { VideoGenerator } from '@/components/creator/video-generator';
import { useI18nStore } from '@/lib/i18n/use-translations';
import { translations } from '@/lib/i18n/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2 } from 'lucide-react';
import { useState } from 'react';
import { Footer } from '@/components/footer';

export default function Home() {
  const language = useI18nStore((state: { language: 'en' | 'zh' }) => state.language);
  const t = translations[language];
  const [activeTab, setActiveTab] = useState('image');

  const getTitle = () => {
    if (activeTab === 'image') {
      return language === 'zh' ? 'AI 图像创作' : 'AI Image Creation';
    }
    return language === 'zh' ? 'AI 视频创作' : 'AI Video Creation';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <Wand2 className="w-8 h-8 text-primary animate-pulse" />
            <h1 className="text-3xl font-bold">{t.common.title}</h1>
          </div>
          <div className="flex gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                {getTitle()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="image" className="space-y-4" onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="image">{t.creator.imageTab}</TabsTrigger>
                  <TabsTrigger value="video">{t.creator.videoTab}</TabsTrigger>
                </TabsList>
                <TabsContent value="image">
                  <ImageGenerator />
                </TabsContent>
                <TabsContent value="video">
                  <VideoGenerator />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}