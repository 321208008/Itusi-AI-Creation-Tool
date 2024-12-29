export async function downloadFile(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function downloadImage(imageUrl: string, filename: string, retries = 3) {
  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      // 如果不是第一次尝试，等待一段时间再重试
      if (i > 0) {
        await delay(1000 * i); // 逐步增加等待时间
      }

      const proxyUrl = `/api/download?url=${encodeURIComponent(imageUrl)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const contentType = response.headers.get('Content-Type');
      if (!contentType?.startsWith('image/')) {
        throw new Error('Invalid content type: ' + contentType);
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Empty response received');
      }

      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      // 如果成功，直接返回
      return;
    } catch (error) {
      console.error(`Download attempt ${i + 1} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // 如果是最后一次尝试，抛出错误
      if (i === retries - 1) {
        throw new Error(`Failed to download after ${retries} attempts: ${lastError.message}`);
      }
    }
  }
}