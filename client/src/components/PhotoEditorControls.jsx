import React, { useState, useEffect } from "react";
import { SketchPicker } from "react-color";
import axios from "axios";

const PhotoEditorControls = ({
  alignedImage,
  backgroundColor,
  dispatch,
  loading,
  error,
}) => {
  const [displayColorPicker, setDisplayColorPicker] = useState(false);

  const handleClick = () => {
    setDisplayColorPicker(!displayColorPicker);
  };

  const handleClose = () => {
    setDisplayColorPicker(false);
  };

  const handleChangeComplete = (color) => {
    dispatch({ type: "SET_BACKGROUND_COLOR", payload: color.hex });
  };

  const dataURIToBlob = (dataURI) => {
    // Separate mime type and base64 data
    const splitData = dataURI.split(",");
    const mime = splitData[0].match(/:(.*?);/)[1];
    const b64 = splitData[1];
    // Convert Base64 to a raw binary string
    const byteString = atob(b64);
    // Write the bytes of the string to an ArrayBuffer
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    // Create a Blob from the ArrayBuffer
    return new Blob([ab], { type: mime });
  };

  const processImage = async () => {
    if (!alignedImage) {
      dispatch({ type: "SET_ERROR", payload: "No image to process." });
      return;
    }

    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      // 1. **REPLACE** the potentially buggy fetch logic with the safe method
      // const blob = await (await fetch(alignedImage)).blob();
      const blob = dataURIToBlob(alignedImage);

      const formData = new FormData();
      formData.append("image", blob, "aligned-image.jpeg");

      // 2. Add the temporary responseType back to the client-side AXIOS call.
      // This is necessary because the server EXPECTS a binary body, but
      // on SUCCESS, AXIOS's default behavior might incorrectly handle the binary buffer.
      // We explicitly tell Axios to treat the *success* response as arraybuffer.

      const response = await axios.post(
        "http://localhost:5000/api/remove-background",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          responseType: "arraybuffer",
        }
      );

      const transparentImageBlob = new Blob([response.data], {
        type: "image/png",
      });
      const transparentImageURL = URL.createObjectURL(transparentImageBlob);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = transparentImageURL;

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // Convert to 2x2 inch JPG @ 300 DPI
        const DPI = 300;
        const INCH_TO_PX = DPI; // 1 inch = 300 pixels at 300 DPI
        const targetWidthPx = 2 * INCH_TO_PX; // 2 inches
        const targetHeightPx = 2 * INCH_TO_PX; // 2 inches

        const finalCanvas = document.createElement("canvas");
        finalCanvas.width = targetWidthPx;
        finalCanvas.height = targetHeightPx;
        const finalCtx = finalCanvas.getContext("2d");

        // Calculate aspect ratio to fit image within 2x2 while maintaining proportions
        const aspectRatio = img.width / img.height;
        let drawWidth = targetWidthPx;
        let drawHeight = targetHeightPx;

        if (img.width > img.height) {
          drawHeight = targetWidthPx / aspectRatio;
        } else {
          drawWidth = targetHeightPx * aspectRatio;
        }

        const offsetX = (targetWidthPx - drawWidth) / 2;
        const offsetY = (targetHeightPx - drawHeight) / 2;

        finalCtx.fillStyle = backgroundColor;
        finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
        finalCtx.drawImage(canvas, offsetX, offsetY, drawWidth, drawHeight);

        dispatch({
          type: "SET_PROCESSED_IMAGE",
          payload: finalCanvas.toDataURL("image/jpeg"),
        });
        dispatch({ type: "SET_LOADING", payload: false });
        URL.revokeObjectURL(transparentImageURL);
      };
      img.onerror = () => {
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to load transparent image.",
        });
        dispatch({ type: "SET_LOADING", payload: false });
        URL.revokeObjectURL(transparentImageURL);
      };
    } catch (err) {
      console.error('Error processing image:', err);
      dispatch({ type: 'SET_ERROR', payload: `Failed to process image. Server returned: ${err.message}` });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

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
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Background Color:
        </label>
        <div className="flex items-center">
          <div
            className="w-10 h-10 rounded-full border cursor-pointer"
            style={{ backgroundColor: backgroundColor }}
            onClick={handleClick}
          ></div>
          <span className="ml-3 text-gray-800">{backgroundColor}</span>
        </div>
        {displayColorPicker ? (
          <div style={popover}>
            <div style={cover} onClick={handleClose} />
            <SketchPicker
              color={backgroundColor}
              onChangeComplete={handleChangeComplete}
            />
          </div>
        ) : null}
      </div>

      <button
        onClick={processImage}
        className={`w-full px-4 py-2 rounded-md text-white font-semibold transition-colors ${
          !alignedImage || loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700"
        }`}
        disabled={!alignedImage || loading}
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
            style={{ width: "50%" }} // Placeholder for actual progress
          ></div>
        </div>
      )}
    </div>
  );
};

export default PhotoEditorControls;
