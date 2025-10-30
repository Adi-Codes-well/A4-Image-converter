export const initialState = {
  uploadedImage: null,
  cropData: null,
  alignedImage: null,
  processedImage: null,
  backgroundColor: "#ffffff",
  finalSheetURL: null,
  loading: false,
  error: null,
};

export const reducer = (state, action) => {
  switch (action.type) {
    case "UPLOAD_IMAGE":
      return { ...state, uploadedImage: action.payload, error: null };
    case "SET_CROP_DATA":
      return { ...state, cropData: action.payload, error: null };
    case "SET_ALIGNED_IMAGE":
      return { ...state, alignedImage: action.payload, error: null };
    case "SET_PROCESSED_IMAGE":
      return { ...state, processedImage: action.payload, error: null };
    case "SET_BACKGROUND_COLOR":
      return { ...state, backgroundColor: action.payload, error: null };
    case "SET_FINAL_SHEET":
      return { ...state, finalSheetURL: action.payload, error: null };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "LOAD_SAVED_STATE":
      return { ...state, ...action.payload };
    default:
      return state;
  }
};
