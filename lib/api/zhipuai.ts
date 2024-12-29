import axios from 'axios';

const API_KEY = process.env.NEXT_PUBLIC_ZHIPU_API_KEY;
const API_ENDPOINT = process.env.NEXT_PUBLIC_ZHIPU_API_ENDPOINT || 'https://open.bigmodel.cn/api/paas/v4';
const IMAGE_MODEL = process.env.NEXT_PUBLIC_ZHIPU_IMAGE_MODEL || 'cogview-3-flash';
const VIDEO_MODEL = process.env.NEXT_PUBLIC_ZHIPU_VIDEO_MODEL || 'cogvideox-flash';

interface ImageGenerationResponse {
  created: string;
  data: Array<{ url: string }>;
  content_filter?: Array<{
    role: string;
    level: number;
  }>;
}

interface VideoGenerationResponse {
  id: string;
  request_id: string;
  model: string;
  task_status: 'PROCESSING' | 'SUCCESS' | 'FAIL';
}

interface VideoResultResponse {
  model: string;
  request_id: string;
  task_status: 'PROCESSING' | 'SUCCESS' | 'FAIL';
  video_result?: Array<{
    url: string;
    cover_image_url: string;
  }>;
}

export async function generateImage(prompt: string): Promise<string> {
  try {
    const response = await axios.post<ImageGenerationResponse>(
      `${API_ENDPOINT}/images/generations`,
      {
        model: IMAGE_MODEL,
        prompt,
        size: '1024x1024',
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.data && response.data.data[0]) {
      return response.data.data[0].url;
    }
    throw new Error('No image URL in response');
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

export async function generateVideo(
  prompt: string,
  imageUrl?: string,
  options: {
    with_audio?: boolean;
    size?: string;
    duration?: 5 | 10;
    fps?: 30 | 60;
  } = {}
): Promise<string> {
  try {
    console.log('Sending video generation request with:', {
      prompt,
      imageUrl,
      options,
    });

    const requestBody = {
      model: VIDEO_MODEL,
      prompt,
      ...(imageUrl ? { image_url: imageUrl } : {}),
      with_audio: options.with_audio ?? false,
      size: options.size ?? '1920x1080',
      duration: options.duration ?? 5,
      fps: options.fps ?? 30,
      request_id: `video_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    };

    console.log('Request body:', requestBody);

    const response = await axios.post<VideoGenerationResponse>(
      `${API_ENDPOINT}/videos/generations`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('API response:', response.data);

    if (!response.data.id) {
      throw new Error('No task ID in response');
    }

    return response.data.id;
  } catch (error) {
    console.error('Error generating video:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('API error response:', error.response.data);
      throw new Error(error.response.data.error?.message || error.message);
    }
    throw error;
  }
}

export async function getVideoResult(id: string): Promise<VideoResultResponse> {
  try {
    const response = await axios.get<VideoResultResponse>(
      `${API_ENDPOINT}/async-result/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error getting video result:', error);
    throw error;
  }
}