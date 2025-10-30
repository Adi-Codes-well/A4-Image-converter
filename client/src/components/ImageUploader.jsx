import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const ImageUploader = ({ dispatch }) => {
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        dispatch({ type: 'UPLOAD_IMAGE', payload: reader.result });
      };
      reader.readAsDataURL(file);
    }
  }, [dispatch]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg']
    },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed border-gray-300 p-8 text-center cursor-pointer rounded-lg hover:border-blue-500 transition-colors"
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className="text-blue-600">Drop the image here ...</p>
      ) : (
        <p className="text-gray-600">Drag 'n' drop an image here, or click to select one</p>
      )}
      <p className="text-sm text-gray-500 mt-2">Accepted: JPEG, PNG, JPG</p>
    </div>
  );
};

export default ImageUploader;
