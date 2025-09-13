import fs from 'fs';
import { fetch } from 'undici';
import { put, del, list } from '@vercel/blob';

// Helper function to compress image client-side style
function compressImageData(base64Data, quality = 0.7) {
    return new Promise((resolve) => {
        // Create a canvas to compress the image
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calculate new dimensions (max 800px width/height)
            const maxSize = 800;
            let { width, height } = img;
            
            if (width > height && width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
            } else if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);
            const compressedData = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedData);
        };
        img.src = base64Data;
    });
}

async function optimizeImages() {
    try {
        console.log('Fetching current messages...');
        const response = await fetch('https://brittney-love.vercel.app/api/messages');
        const messages = await response.json();
        
        console.log('Getting blob storage info...');
        const { blobs } = await list();
        const imageBlobs = blobs.filter(blob => blob.pathname.startsWith('image-'));
        
        console.log(`Found ${imageBlobs.length} images in storage`);
        
        // Find large images (>500KB)
        const largeImages = imageBlobs.filter(blob => blob.size > 500 * 1024);
        console.log(`Large images (>500KB): ${largeImages.length}`);
        
        if (largeImages.length > 0) {
            console.log('Large images to optimize:');
            largeImages.forEach(blob => {
                console.log(`- ${blob.pathname}: ${Math.round(blob.size/1024)}KB`);
            });
        }
        
        // For now, let's focus on adding image optimization to the upload process
        // and implementing lazy loading in the frontend
        
        console.log('\nImage optimization recommendations:');
        console.log('1. Images >500KB should be compressed');
        console.log('2. Implement lazy loading for better performance');
        console.log('3. Add image caching headers');
        
        // Let's update the frontend to add lazy loading
        console.log('\nNext: Update frontend with lazy loading and image optimization...');
        
    } catch (error) {
        console.error('Error during image optimization:', error);
    }
}

optimizeImages();
