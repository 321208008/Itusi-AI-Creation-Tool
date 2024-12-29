'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useI18nStore } from '@/lib/i18n/use-translations';
import { translations } from '@/lib/i18n/translations';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { generateVideo, getVideoResult } from '@/lib/api/zhipuai';
import { downloadFile, readFileAsDataURL } from '@/lib/utils/file';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const VIDEO_SIZES = [
  { value: '720x480', label: 'SD (720x480)' },
  { value: '1024x1024', label: 'Square (1024x1024)' },
  { value: '1280x960', label: 'HD (1280x960)' },
  { value: '960x1280', label: 'HD Portrait (960x1280)' },
  { value: '1920x1080', label: 'Full HD (1920x1080)' },
  { value: '1080x1920', label: 'Full HD Portrait (1080x1920)' },
  { value: '2048x1080', label: '2K (2048x1080)' },
  { value: '3840x2160', label: '4K (3840x2160)' },
] as const;

export function VideoGenerator() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; cover: string } | null>(null);
  const [size, setSize] = useState('1920x1080');
  const [error, setError] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [withAudio, setWithAudio] = useState(false);
  const [duration, setDuration] = useState<5 | 10>(5);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout>();
  const taskIdRef = useRef<string | null>(null);

  const language = useI18nStore((state) => state.language);
  const t = translations[language];

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(language === 'zh' ? '图片大小不能超过5MB' : 'Image size cannot exceed 5MB');
        return;
      }
      try {
        const imageUrl = await readFileAsDataURL(file);
        setSourceImage(imageUrl);
      } catch (error) {
        toast.error(language === 'zh' ? '读取图片失败' : 'Failed to read image');
      }
    }
  };

  const startPolling = async (taskId: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    const poll = async () => {
      try {
        const result = await getVideoResult(taskId);
        console.log('Poll result:', result);

        if (result.task_status === 'SUCCESS' && result.video_result?.[0]) {
          setResult({
            url: result.video_result[0].url,
            cover: result.video_result[0].cover_image_url,
          });
          setGenerating(false);
          setProgress(100);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
          toast.success(language === 'zh' ? '视频生成成功！' : 'Video generated successfully!');
        } else if (result.task_status === 'FAIL') {
          setError(
            language === 'zh'
              ? '生成视频失败，请重试'
              : 'Failed to generate video, please try again'
          );
          setGenerating(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
        } else if (result.task_status === 'PROCESSING') {
          // 更新进度条，根据轮询次数计算进度
          setProgress((prev) => {
            if (prev < 95) {
              return prev + 5;
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Error polling video result:', error);
        setError(
          language === 'zh'
            ? '获取视频结果失败，请重试'
            : 'Failed to get video result, please try again'
        );
        setGenerating(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      }
    };

    // 立即执行一次
    await poll();
    // 每 3 秒轮询一次
    pollIntervalRef.current = setInterval(poll, 3000);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !sourceImage) {
      toast.error(
        language === 'zh'
          ? '请输入描述文本或上传图片'
          : 'Please enter a description or upload an image'
      );
      return;
    }

    setGenerating(true);
    setProgress(0);
    setError(null);
    setResult(null);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 90) {
          return prev + 1;
        }
        return prev;
      });
    }, 3000);

    try {
      console.log('Generating video with options:', {
        prompt,
        sourceImage,
        withAudio,
        size: sourceImage ? size : undefined,
        duration,
        fps: 30,
      });

      const taskId = await generateVideo(prompt, sourceImage || undefined, {
        with_audio: withAudio,
        size: sourceImage ? size : undefined,
        duration,
        fps: 30,
      });

      taskIdRef.current = taskId;
      await startPolling(taskId);
    } catch (error) {
      console.error('Error generating video:', error);
      setError(
        language === 'zh'
          ? '生成视频时出错，请重试'
          : 'Error generating video, please try again'
      );
      toast.error(
        language === 'zh'
          ? '生成视频失败'
          : 'Failed to generate video'
      );
      setGenerating(false);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const handleDownload = async () => {
    if (!result?.url) return;
    
    try {
      // 使用下载 API 下载视频
      const downloadUrl = `/api/download?url=${encodeURIComponent(result.url)}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `generated-video-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading video:', error);
      toast.error(
        language === 'zh'
          ? '视频下载失败，请重试'
          : 'Failed to download video, please try again'
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          placeholder={sourceImage ? t.creator.prompt : t.creator.videoPrompt}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[120px] max-h-[300px]"
          disabled={generating}
        />
        
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          disabled={generating}
        />

        {sourceImage ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
            <img
              src={sourceImage}
              alt="Source"
              className="w-full h-full object-cover"
            />
            <Button
              variant="secondary"
              className="absolute top-2 right-2"
              onClick={() => setSourceImage(null)}
              disabled={generating}
            >
              {language === 'zh' ? '移除' : 'Remove'}
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full h-32"
            onClick={() => fileInputRef.current?.click()}
            disabled={generating}
          >
            {t.creator.uploadImage}
          </Button>
        )}

        <div className="grid grid-cols-2 gap-4">
          {sourceImage && (
            <div className="space-y-2">
              <Label>{language === 'zh' ? '视频尺寸' : 'Video Size'}</Label>
              <Select
                value={size}
                onValueChange={setSize}
                disabled={generating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_SIZES.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>{language === 'zh' ? '视频时长' : 'Duration'}</Label>
            <Select
              value={duration.toString()}
              onValueChange={(value) => setDuration(parseInt(value) as 5 | 10)}
              disabled={generating}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 {language === 'zh' ? '秒' : 'seconds'}</SelectItem>
                <SelectItem value="10">10 {language === 'zh' ? '秒' : 'seconds'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Switch
              checked={withAudio}
              onCheckedChange={setWithAudio}
              disabled={generating}
            />
            <Label>{language === 'zh' ? '生成音效' : 'Generate Audio'}</Label>
          </div>
        </div>
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
          disabled={(!prompt && !sourceImage) || generating}
          className="w-full"
        >
          {t.common.generate}
        </Button>
      </div>

      {result && (
        <Card className="p-4 space-y-4">
          <div className="aspect-video overflow-hidden rounded-lg">
            <video
              src={result.url}
              poster={result.cover}
              controls
              className="w-full h-full object-cover"
            />
          </div>
          <Button onClick={handleDownload} className="w-full">
            {t.creator.downloadVideo}
          </Button>
        </Card>
      )}
    </div>
  );
}