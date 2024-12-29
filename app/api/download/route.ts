import { NextResponse, NextRequest } from 'next/server';

// 设置 Edge Runtime
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const fileUrl = request.nextUrl.searchParams.get('url');

  if (!fileUrl) {
    return new NextResponse('Missing file URL', { status: 400 });
  }

  try {
    console.log('Attempting to download file from:', fileUrl);

    const response = await fetch(fileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://open.bigmodel.cn/',
        'Origin': 'https://open.bigmodel.cn',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch file:', response.status, response.statusText);
      return new NextResponse(`Failed to fetch file: ${response.status} ${response.statusText}`, { 
        status: response.status 
      });
    }

    const contentType = response.headers.get('Content-Type');
    if (!contentType?.includes('image/') && !contentType?.includes('video/')) {
      console.error('Invalid content type:', contentType);
      return new NextResponse('Invalid content type', { status: 400 });
    }

    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      console.error('Empty response received');
      return new NextResponse('Empty response received', { status: 400 });
    }

    // 设置响应头
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    
    // 根据内容类型设置文件扩展名
    const extension = contentType.includes('video/') ? 'mp4' : 
                     contentType.split('/')[1] || 'bin';
    
    headers.set('Content-Disposition', `attachment; filename="generated-file-${Date.now()}.${extension}"`);
    headers.set('Content-Length', arrayBuffer.byteLength.toString());
    // 允许跨域访问
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET');
    headers.set('Cache-Control', 'no-cache');

    return new NextResponse(arrayBuffer, { headers });
  } catch (error) {
    console.error('Error downloading file:', error);
    return new NextResponse(error instanceof Error ? error.message : 'Failed to download file', { 
      status: 500 
    });
  }
} 