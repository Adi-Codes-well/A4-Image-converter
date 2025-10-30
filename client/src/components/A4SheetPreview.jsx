import React, { useRef, useEffect, useCallback } from 'react';

const A4SheetPreview = ({ processedImage, finalSheetURL, dispatch }) => {
  const canvasRef = useRef(null);

  const generateA4Sheet = useCallback(() => {
    if (!processedImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // A4 size at 300 DPI: 2480 x 3508 pixels
    const A4_WIDTH_PX = 2480;
    const A4_HEIGHT_PX = 3508;
    canvas.width = A4_WIDTH_PX;
    canvas.height = A4_HEIGHT_PX;

    ctx.fillStyle = '#f0f0f0'; // Light gray background for the A4 sheet
    ctx.fillRect(0, 0, A4_WIDTH_PX, A4_HEIGHT_PX);

    const img = new Image();
    img.src = processedImage;

    img.onload = () => {
      const photoWidth = img.width; // Should be 2 inches * 300 DPI = 600px
      const photoHeight = img.height; // Should be 2 inches * 300 DPI = 600px

      const margin = 50; // Pixels for spacing
      const photosPerRow = Math.floor((A4_WIDTH_PX - 2 * margin) / photoWidth);
      const photosPerColumn = Math.floor((A4_HEIGHT_PX - 2 * margin) / photoHeight);

      const totalPhotos = photosPerRow * photosPerColumn;

      let currentX = margin;
      let currentY = margin;

      for (let i = 0; i < totalPhotos; i++) {
        ctx.drawImage(img, currentX, currentY, photoWidth, photoHeight);

        // Draw light cut lines
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(currentX, currentY, photoWidth, photoHeight);

        currentX += photoWidth + margin;
        if (currentX + photoWidth + margin > A4_WIDTH_PX) {
          currentX = margin;
          currentY += photoHeight + margin;
        }
      }
      dispatch({ type: 'SET_FINAL_SHEET', payload: canvas.toDataURL('image/jpeg', 0.9) });
    };
  }, [processedImage, dispatch]);

  useEffect(() => {
    generateA4Sheet();
  }, [processedImage, generateA4Sheet]);

  const handleDownload = () => {
    if (finalSheetURL) {
      const link = document.createElement('a');
      link.href = finalSheetURL;
      link.download = 'passport_photos_A4.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <h3 className="text-xl font-semibold mb-4">Preview & Generate A4 Sheet</h3>
      {processedImage ? (
        <>
          <div className="mb-4 border p-2 rounded-md flex justify-center">
            <canvas ref={canvasRef} className="max-w-full h-auto shadow-md"></canvas>
          </div>
          <button
            onClick={handleDownload}
            className={`w-full px-4 py-2 rounded-md text-white font-semibold transition-colors ${
              !finalSheetURL
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={!finalSheetURL}
          >
            Download A4 Sheet (JPG)
          </button>
        </>
      ) : (
        <p className="text-gray-600">Upload and process an image to generate the A4 sheet.</p>
      )}
    </div>
  );
};

export default A4SheetPreview;
