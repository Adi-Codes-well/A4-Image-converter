import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import * as faceapi from 'face-api.js';

const ImageCropperModal = ({ uploadedImage, dispatch, onClose }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'; // Assuming models are in public/models
      console.log('Loading face-api.js models from:', MODEL_URL);
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        console.log('face-api.js models loaded successfully.');
      } catch (error) {
        console.error('Error loading face-api.js models:', error);
        dispatch({ type: 'SET_ERROR', payload: `Failed to load face detection models: ${error.message}` });
      }
    };
    loadModels();
  }, [dispatch]);

  useEffect(() => {
    console.log('croppedAreaPixels updated:', croppedAreaPixels);
  }, [croppedAreaPixels]);

  const onCropComplete = useCallback((croppedArea, newCroppedAreaPixels) => {
    console.log('onCropComplete called. croppedAreaPixels:', newCroppedAreaPixels);
    setCroppedAreaPixels(newCroppedAreaPixels);
  }, []);

  const showCroppedImage = useCallback(async () => {
    console.log('showCroppedImage called');
    if (!uploadedImage || !croppedAreaPixels) {
      console.log('uploadedImage or croppedAreaPixels is null:', { uploadedImage, croppedAreaPixels });
      return;
    }

    const image = new Image();
    image.src = uploadedImage;
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      croppedAreaPixels.x * scaleX,
      croppedAreaPixels.y * scaleY,
      croppedAreaPixels.width * scaleX,
      croppedAreaPixels.height * scaleY,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    const croppedImageBase64 = canvas.toDataURL('image/jpeg');
    console.log('Image cropped to base64.');

    // Face alignment
    console.log('Attempting face detection...');
    let detections = null;
    try {
      console.log('Before faceapi.detectSingleFace');
      detections = await faceapi.detectSingleFace(
        canvas,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks();
      console.log('After faceapi.detectSingleFace. Detections:', detections);
    } catch (error) {
      console.error('Error during face detection:', error);
      dispatch({ type: 'SET_ERROR', payload: `Face detection failed: ${error.message}` });
    }


    if (detections) {
      console.log('Face detected, performing alignment.');
      const { box } = detections.detection;
      const faceCenterY = box.y + box.height / 2;
      const imageCenterY = canvas.height / 2;
      const offsetY = imageCenterY - faceCenterY;

      const alignedCanvas = document.createElement('canvas');
      alignedCanvas.width = canvas.width;
      alignedCanvas.height = canvas.height;
      const alignedCtx = alignedCanvas.getContext('2d');

      alignedCtx.translate(0, offsetY);
      alignedCtx.drawImage(canvas, 0, 0);

      dispatch({ type: 'SET_ALIGNED_IMAGE', payload: alignedCanvas.toDataURL('image/jpeg') });
      console.log('Dispatched SET_ALIGNED_IMAGE with aligned image.');
    } else {
      console.log('No face detected, dispatching SET_ALIGNED_IMAGE with cropped image.');
      dispatch({ type: 'SET_ALIGNED_IMAGE', payload: croppedImageBase64 });
    }

    dispatch({ type: 'SET_CROP_DATA', payload: croppedAreaPixels });
    console.log('Dispatched SET_CROP_DATA.');
    onClose();
    console.log('onClose called.');
  }, [uploadedImage, croppedAreaPixels, dispatch, onClose]);

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 md:w-2/3 lg:w-1/2 max-h-[90vh] flex flex-col">
        <h2 className="text-2xl font-bold mb-4">Crop & Align Photo</h2>
        <div className="relative w-full flex-grow min-h-[300px]">
          <Cropper
            image={uploadedImage}
            crop={crop}
            zoom={zoom}
            aspect={3.5 / 4.5}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            cropShape="rect"
            showGrid={true}
          />
        </div>
        <div className="flex justify-center items-center mt-4">
          <span className="mr-2">Zoom:</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => {
              setZoom(parseFloat(e.target.value));
            }}
            className="w-2/3"
          />
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={showCroppedImage}
            className={`px-4 py-2 rounded-md transition-colors ${
              croppedAreaPixels
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-400 text-gray-700 cursor-not-allowed'
            }`}
            disabled={!croppedAreaPixels}
          >
            Apply Crop & Align
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;
