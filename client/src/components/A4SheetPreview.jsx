import React, { useRef, useEffect, useCallback } from 'react';

const A4SheetPreview = ({ processedImage, finalSheetURL, imagesPerRow, dispatch }) => {
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
      // Passport photo dimensions: 3.5cm x 4.5cm at 300 DPI
      // 1 inch = 2.54 cm
      // 3.5 cm = 1.378 inches => 1.378 * 300 DPI = 413.4 pixels
      // 4.5 cm = 1.772 inches => 1.772 * 300 DPI = 531.6 pixels
      const photoWidth = 413; // pixels for 3.5cm
      const photoHeight = 531; // pixels for 4.5cm

      const calculatedPhotosPerRow = imagesPerRow; // Use user-defined value directly

      // Use a smaller fixed margin to allow more rows
      const fixedMargin = 20; // Reduced margin in pixels

      // Calculate dynamic horizontal spacing to fill the width
      const totalPhotoWidth = calculatedPhotosPerRow * photoWidth;
      const horizontalSpaceRemaining = A4_WIDTH_PX - totalPhotoWidth;
      const photoHorizontalSpacing = horizontalSpaceRemaining / (calculatedPhotosPerRow + 1);

      // Calculate how many rows can fit with the fixed vertical margin
      const maxPhotosInColumn = Math.floor((A4_HEIGHT_PX - fixedMargin) / (photoHeight + fixedMargin));
      const totalPhotosToDraw = calculatedPhotosPerRow * maxPhotosInColumn;

      let currentX = photoHorizontalSpacing;
      let currentY = fixedMargin;
      let rowCount = 0;

      for (let i = 0; i < totalPhotosToDraw; i++) {
        ctx.drawImage(img, currentX, currentY, photoWidth, photoHeight);

        // Draw black border
        ctx.strokeStyle = '#000000'; // Black color
        ctx.lineWidth = 2; // 2-pixel border
        ctx.strokeRect(currentX, currentY, photoWidth, photoHeight);

        currentX += photoWidth + photoHorizontalSpacing;
        rowCount++;

        if (rowCount >= calculatedPhotosPerRow) {
          currentX = photoHorizontalSpacing; // Start from the first horizontal margin
          currentY += photoHeight + fixedMargin; // Use fixedMargin for vertical spacing
          rowCount = 0;
          if (currentY + photoHeight + fixedMargin > A4_HEIGHT_PX) { // Use fixedMargin for vertical check
            break; // Stop if no more space on the sheet
          }
        }
      }
      dispatch({ type: 'SET_FINAL_SHEET', payload: canvas.toDataURL('image/jpeg', 0.9) });
    };
  }, [processedImage, imagesPerRow, dispatch]);

  useEffect(() => {
    generateA4Sheet();
  }, [processedImage, imagesPerRow, generateA4Sheet]);

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
          <button
            onClick={() => dispatch({ type: 'RESET_STATE' })}
            className="w-full px-4 py-2 mt-2 bg-red-600 text-white rounded-md font-semibold transition-colors hover:bg-red-700"
          >
            Start Over
          </button>
        </>
      ) : (
        <p className="text-gray-600">Upload and process an image to generate the A4 sheet.</p>
      )}
    </div>
  );
};

export default A4SheetPreview;
