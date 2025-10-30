import React, { useState } from "react";
import { SketchPicker } from "react-color";
import axios from "axios";

const dataURIToBlob = (dataURI) => {
  const splitData = dataURI.split(",");
  if (splitData.length < 2) throw new Error("Invalid Data URI format.");

  const mimeMatch = splitData[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const b64 = splitData[1];

  const byteString = atob(b64);
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

    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    let transparentImageURL = null;

    try {
      const blob = dataURIToBlob(alignedImage);
      const formData = new FormData();
      formData.append("image", blob, "aligned-image.jpeg");

      const response = await axios.post(
        "http://localhost:5000/api/remove-background",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          responseType: "arraybuffer",
        }
      );

      if (!response.data || response.data.byteLength === 0)
        throw new Error("Server returned empty image — check API key/credits");

      const transparentImageBlob = new Blob([response.data], {
        type: "image/png",
      });
      transparentImageURL = URL.createObjectURL(transparentImageBlob);

      const finalCanvas = await new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = transparentImageURL;

        img.onload = () => {
          try {
            canvas.width = img.width;
            canvas.height = img.height;

            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            const DPI = 300;
            const size = 2 * DPI;
            const finalCanvas = document.createElement("canvas");
            finalCanvas.width = size;
            finalCanvas.height = size;
            const finalCtx = finalCanvas.getContext("2d");

            const aspectRatio = img.width / img.height;
            let drawWidth = size,
              drawHeight = size;

            if (img.width > img.height) drawHeight = size / aspectRatio;
            else drawWidth = size * aspectRatio;

            finalCtx.fillStyle = backgroundColor;
            finalCtx.fillRect(0, 0, size, size);
            finalCtx.drawImage(
              canvas,
              (size - drawWidth) / 2,
              (size - drawHeight) / 2,
              drawWidth,
              drawHeight
            );

            resolve(finalCanvas);
          } catch (e) {
            reject(new Error(`Canvas drawing failed: ${e.message}`));
          }
        };

        img.onerror = () => reject(new Error("Failed to decode image"));
      });

      dispatch({
        type: "SET_PROCESSED_IMAGE",
        payload: finalCanvas.toDataURL("image/jpeg"),
      });
    } catch (err) {
      const msg = err?.message || "Internal processing failed";
      dispatch({ type: "SET_ERROR", payload: `Processing failed: ${msg}` });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
      if (transparentImageURL) URL.revokeObjectURL(transparentImageURL);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <h3 className="text-xl font-semibold mb-4">Edit & Process Photo</h3>

      <div className="mb-4">
        <label className="block mb-2">Background Color:</label>
        <div className="flex items-center">
          <div
            className="w-10 h-10 rounded-full border cursor-pointer"
            style={{ backgroundColor }}
            onClick={handleClick}
          />
          <span className="ml-3">{backgroundColor}</span>
        </div>

        {displayColorPicker && (
          <div style={{ position: "absolute", zIndex: 2 }}>
            <div
              style={{ position: "fixed", inset: 0 }}
              onClick={handleClose}
            />
            <SketchPicker
              color={backgroundColor}
              onChangeComplete={handleChangeComplete}
            />
          </div>
        )}
      </div>

      <button
        onClick={processImage}
        disabled={!alignedImage || loading}
        className={`w-full px-4 py-2 rounded text-white ${
          !alignedImage || loading
            ? "bg-gray-400"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {loading ? "Processing..." : "Remove Background & Apply Color"}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {loading && (
        <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="h-2.5 rounded-full bg-blue-600"
            style={{ width: "50%" }}
          />
        </div>
      )}
    </div>
  );
};

export default PhotoEditorControls;
