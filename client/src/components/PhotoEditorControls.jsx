import React, { useState } from "react";
import { SketchPicker } from "react-color";
import axios from "axios";

// Helper function to safely convert Data URI (Base64 string) to a Blob
const dataURIToBlob = (dataURI) => {
  // Use modern Blob constructor for safer Data URI handling
  const byteString = atob(dataURI.split(',')[1]);
  const mimeMatch = dataURI.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], { type: mime });
};

const PhotoEditorControls = ({
  alignedImage,
  backgroundColor,
  imagesPerRow,
  dispatch,
  loading,
  error,
}) => {
  const [displayColorPicker, setDisplayColorPicker] = useState(false);

  const handleClick = () => setDisplayColorPicker(!displayColorPicker);
  const handleClose = () => setDisplayColorPicker(false);

  const handleChangeComplete = (color) => {
    dispatch({ type: "SET_BACKGROUND_COLOR", payload: color.hex });
  };

  const processImage = async () => {
    if (!alignedImage) {
      dispatch({ type: "SET_ERROR", payload: "No image to process." });
      return;
    }

    // Set loading immediately
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    let transparentImageURL = null; // Defined for access in finally block

    try {
      // 1. Convert Data URI to Blob (Synchronous, fail fast)
      const blob = dataURIToBlob(alignedImage);
      const formData = new FormData();
      formData.append("image", blob, "aligned-image.jpeg");

      // 2. Network Call to Server API
      const response = await axios.post(
        "http://localhost:5000/api/remove-background",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          responseType: "arraybuffer",
        }
      );

      // Defensive check for empty or invalid image data from server
      if (!response.data || response.data.byteLength === 0)
        throw new Error("Server returned empty image, check server logs for API key/file size limits.");

      const transparentImageBlob = new Blob([response.data], {
        type: "image/png",
      });
      transparentImageURL = URL.createObjectURL(transparentImageBlob);

      // 3. CRITICAL FIX: Wrap Image Decoding/Canvas Ops in an awaitable Promise
      const finalCanvas = await new Promise((resolve, reject) => {
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        // Error handler to prevent silent hangs
        img.onerror = () => {
          reject(new Error("Browser failed to decode image data (potentially corrupted PNG)."));
        };

        img.onload = () => {
          try {
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;

            // Draw transparent image onto colored background
            tempCtx.fillStyle = backgroundColor;
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.drawImage(img, 0, 0);

            // Target dimensions for passport photo (3.5cm x 4.5cm at 300 DPI)
            const targetWidth = 413; // pixels for 3.5cm
            const targetHeight = 531; // pixels for 4.5cm

            const finalCanvas = document.createElement("canvas");
            finalCanvas.width = targetWidth;
            finalCanvas.height = targetHeight;
            const finalCtx = finalCanvas.getContext("2d");

            // Calculate aspect ratios
            const imageAspectRatio = tempCanvas.width / tempCanvas.height;
            const targetAspectRatio = targetWidth / targetHeight;

            let drawWidth = targetWidth;
            let drawHeight = targetHeight;
            let offsetX = 0;
            let offsetY = 0;

            if (imageAspectRatio > targetAspectRatio) {
              // Image is wider than target, scale to target height
              drawHeight = targetHeight;
              drawWidth = targetHeight * imageAspectRatio;
              offsetX = (targetWidth - drawWidth) / 2;
            } else {
              // Image is taller than target, scale to target width
              drawWidth = targetWidth;
              drawHeight = targetWidth / imageAspectRatio;
              offsetY = (targetHeight - drawHeight) / 2;
            }

            finalCtx.fillStyle = backgroundColor;
            finalCtx.fillRect(0, 0, targetWidth, targetHeight);
            finalCtx.drawImage(
              tempCanvas,
              offsetX,
              offsetY,
              drawWidth,
              drawHeight
            );

            resolve(finalCanvas);
          } catch (e) {
            reject(new Error(`Canvas drawing/resizing failed: ${e.message}`));
          }
        };

        img.src = transparentImageURL; // Start image loading
      }); // Function waits here

      // 4. Final Success State Update
      dispatch({
        type: "SET_PROCESSED_IMAGE",
        payload: finalCanvas.toDataURL("image/jpeg"),
      });

    } catch (err) {
      // Catch all errors (network, custom empty image, promise reject)
      let errorMessage = err.message || "Internal processing failed";

      if (err.response && err.response.data) {
          // Attempt to decode server's JSON error response
          try {
              const errorText = new TextDecoder().decode(err.response.data);
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.error || `Server Error (${err.response.status}): ${errorMessage}`;
          } catch {
              errorMessage = `Server Error (${err.response.status}): Could not parse error message.`;
          }
      }
      
      console.error('Error processing image:', err);
      dispatch({ type: "SET_ERROR", payload: `Processing failed: ${errorMessage}` });

    } finally {
      // GUARANTEED CLEANUP: Resets loading state and revokes object URL
      dispatch({ type: "SET_LOADING", payload: false });
      if (transparentImageURL) URL.revokeObjectURL(transparentImageURL);
    }
  };

  // --- JSX RENDER ---
  const popover = {
    position: "absolute",
    zIndex: "2",
  };
  const cover = {
    position: "fixed",
    top: "0px",
    right: "0px",
    bottom: "0px",
    left: "0px",
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <h3 className="text-xl font-semibold mb-4">Edit & Process Photo</h3>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">Background Color:</label>
        <div className="flex items-center">
          <div
            className="w-10 h-10 rounded-full border cursor-pointer"
            style={{ backgroundColor }}
            onClick={handleClick}
          ></div>
          <span className="ml-3 text-gray-800">{backgroundColor}</span>
        </div>

        {displayColorPicker && (
          <div style={popover}>
            <div style={cover} onClick={handleClose} />
            <SketchPicker
              color={backgroundColor}
              onChangeComplete={handleChangeComplete}
            />
          </div>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="imagesPerRow" className="block text-sm font-medium text-gray-700 mb-2">
          Images per row:
        </label>
        <input
          type="number"
          id="imagesPerRow"
          min="1"
          value={imagesPerRow}
          onChange={(e) => dispatch({ type: 'SET_IMAGES_PER_ROW', payload: parseInt(e.target.value) || 1 })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>

      <button
        onClick={processImage}
        disabled={!alignedImage || loading}
        className={`w-full px-4 py-2 rounded-md text-white font-semibold transition-colors ${
          !alignedImage || loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {loading ? "Processing..." : "Remove Background & Apply Color"}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: "50%" }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default PhotoEditorControls;
