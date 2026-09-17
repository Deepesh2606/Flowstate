export const getBrightness = (imageUrl) => {
  return new Promise((resolve) => {
    if (!imageUrl) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Downscale for faster processing
      const scale = Math.min(1, 100 / Math.max(img.width, img.height));
      canvas.width = Math.floor(img.width * scale);
      canvas.height = Math.floor(img.height * scale);
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let r, g, b, avg;
        let colorSum = 0;
        let count = 0;
        
        // Process every 4th pixel for speed (since we already scaled down)
        for (let x = 0; x < data.length; x += 16) {
          r = data[x];
          g = data[x + 1];
          b = data[x + 2];
          avg = (r + g + b) / 3;
          colorSum += avg;
          count++;
        }
        
        const brightness = Math.floor(colorSum / count);
        resolve(brightness);
      } catch (e) {
        console.warn('CORS issue calculating brightness', e);
        resolve(null);
      }
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = imageUrl;
  });
};
