'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useI18nStore } from '@/lib/i18n/use-translations';
import { translations } from '@/lib/i18n/translations';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { generateImage } from '@/lib/api/zhipuai';
import { downloadImage } from '@/lib/utils/file';
import { toast } from 'sonner';

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const language = useI18nStore((state) => state.language);
  const t = translations[language];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error(language === 'zh' ? '请输入描述文本' : 'Please enter a description');
      return;
    }

    setGenerating(true);
    setProgress(0);
    setError(null);
    
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 5, 95));
    }, 500);

    try {
      const imageUrl = await generateImage(prompt);
      setResult(imageUrl);
      setProgress(100);
      toast.success(
        language === 'zh' ? '图片生成成功！' : 'Image generated successfully!'
      );
    } catch (error) {
      setError(
        language === 'zh' 
          ? '生成图片时出错，请重试' 
          : 'Error generating image, please try again'
      );
      toast.error(
        language === 'zh' 
          ? '生成图片失败' 
          : 'Failed to generate image'
      );
    } finally {
      clearInterval(progressInterval);
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (result && !downloading) {
      setDownloading(true);
      try {
        const timestamp = new Date().getTime();
        await downloadImage(result, `generated-image-${timestamp}.png`);
        toast.success(
          language === 'zh' ? '图片下载成功' : 'Image downloaded successfully'
        );
      } catch (error) {
        toast.error(
          language === 'zh' ? '下载图片失败' : 'Failed to download image'
        );
      } finally {
        setDownloading(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          placeholder={t.creator.prompt}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[120px] max-h-[300px]"
          disabled={generating}
        />
      </div>

      {generating && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-center text-muted-foreground">
            {t.creator.generating} ({progress}%)
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-center text-destructive">{error}</p>
      )}

      <div className="flex justify-center">
        <Button
          onClick={handleGenerate}
          disabled={!prompt || generating}
          className="w-full"
        >
          {t.common.generate}
        </Button>
      </div>

      {result && (
        <Card className="p-4 space-y-4">
          <div className="aspect-square overflow-hidden rounded-lg">
            <img
              src={result}
              alt="Generated"
              className="w-full h-full object-cover"
            />
          </div>
          <Button 
            onClick={handleDownload} 
            className="w-full"
            disabled={downloading}
          >
            {downloading 
              ? (language === 'zh' ? '正在下载...' : 'Downloading...') 
              : t.creator.downloadImage
            }
          </Button>
        </Card>
      )}
    </div>
  );
}