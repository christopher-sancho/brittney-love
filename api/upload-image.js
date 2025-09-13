import { put } from '@vercel/blob';

const defaultHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache'
};

export async function POST(request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return new Response(JSON.stringify({ error: 'No image data provided' }), {
        status: 400,
        headers: defaultHeaders
      });
    }

    // Convert base64 to buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate unique filename
    const uniqueFileName = `birthday-images/${Date.now()}-${Math.random()}.jpg`;
    
    // Upload to Vercel Blob
    const blob = await put(uniqueFileName, buffer, {
      access: 'public',
      contentType: image.match(/^data:([^;]+);/)?.[1] || 'image/jpeg',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      allowOverwrite: true
    });

    return new Response(JSON.stringify({ url: blob.url }), {
      status: 200,
      headers: defaultHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to upload image' }), {
      status: 500,
      headers: defaultHeaders
    });
  }
}

export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: defaultHeaders
  });
}