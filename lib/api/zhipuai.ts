import axios from 'axios';

const getEnvVar = (key: string, defaultValue: string = '') => {
  const value = process.env[key];
  return value === undefined ? defaultValue : value;
};

const API_KEY = getEnvVar('NEXT_PUBLIC_ZHIPU_API_KEY');
const API_ENDPOINT = getEnvVar('NEXT_PUBLIC_ZHIPU_API_ENDPOINT', 'https://open.bigmodel.cn/api/paas/v4');
const IMAGE_MODEL = getEnvVar('NEXT_PUBLIC_ZHIPU_IMAGE_MODEL', 'cogview-3-flash');
const VIDEO_MODEL = getEnvVar('NEXT_PUBLIC_ZHIPU_VIDEO_MODEL', 'cogvideox-flash');

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
  if (!API_KEY) {
    throw new Error('API key is not configured');
  }

  try {
    const response = await axios.post<ImageGenerationResponse>(
      API_ENDPOINT + '/images/generations',
      {
        model: IMAGE_MODEL,
        prompt,
        size: '1024x1024',
      },
      {
        headers: {
          Authorization: 'Bearer ' + API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && response.data.data && response.data.data[0] && response.data.data[0].url) {
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
  if (!API_KEY) {
    throw new Error('API key is not configured');
  }

  try {
    const requestId = 'video_' + Date.now() + '_' + Math.random().toString(36).substring(2);
    const requestBody = {
      model: VIDEO_MODEL,
      prompt: prompt,
      image_url: imageUrl || undefined,
      with_audio: options.with_audio || false,
      size: options.size || '1920x1080',
      duration: options.duration || 5,
      fps: options.fps || 30,
      request_id: requestId,
    };

    const response = await axios.post<VideoGenerationResponse>(
      API_ENDPOINT + '/videos/generations',
      requestBody,
      {
        headers: {
          Authorization: 'Bearer ' + API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && response.data.id) {
      return response.data.id;
    }
    throw new Error('No task ID in response');
  } catch (error) {
    console.error('Error generating video:', error);
    if (axios.isAxiosError(error) && error.response && error.response.data) {
      const message = error.response.data.error && error.response.data.error.message;
      throw new Error(message || error.message);
    }
    throw error;
  }
}

export async function getVideoResult(id: string): Promise<VideoResultResponse> {
  if (!API_KEY) {
    throw new Error('API key is not configured');
  }

  try {
    const response = await axios.get<VideoResultResponse>(
      API_ENDPOINT + '/async-result/' + id,
      {
        headers: {
          Authorization: 'Bearer ' + API_KEY,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error getting video result:', error);
    throw error;
  }
}