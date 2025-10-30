import React, { useReducer, useEffect } from 'react';
import { initialState, reducer } from './reducer';
import ImageUploader from './components/ImageUploader';
import ImageCropperModal from './components/ImageCropperModal';
import PhotoEditorControls from './components/PhotoEditorControls';
import A4SheetPreview from './components/A4SheetPreview';

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Removed localStorage persistence as per user request.
  // useEffect(() => {
  //   localStorage.setItem('passportPhotoData', JSON.stringify(state));
  // }, [state]);

  const { uploadedImage, cropData, alignedImage, processedImage, backgroundColor, finalSheetURL, loading, error, imagesPerRow } = state;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">Passport Photo Generator</h1>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-1">
          <ImageUploader dispatch={dispatch} />
        </div>

        {uploadedImage && !alignedImage && (
          <ImageCropperModal
            uploadedImage={uploadedImage}
            dispatch={dispatch}
            onClose={() => dispatch({ type: 'SET_UPLOADED_IMAGE', payload: null })} // Close modal and clear uploaded image if cancelled
          />
        )}

        {alignedImage && (
          <div className="col-span-1">
            <PhotoEditorControls
              alignedImage={alignedImage}
              backgroundColor={backgroundColor}
              imagesPerRow={imagesPerRow}
              dispatch={dispatch}
              loading={loading}
              error={error}
            />
          </div>
        )}

        {processedImage && (
          <div className="col-span-1 md:col-span-2">
            <A4SheetPreview
              processedImage={processedImage}
              finalSheetURL={finalSheetURL}
              imagesPerRow={imagesPerRow}
              dispatch={dispatch}
            />
          </div>
        )}
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 p-4 bg-red-500 text-white rounded-md shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}

export default App;
