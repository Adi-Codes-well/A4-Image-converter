# Portimage Sheet - Online A4 Image Converter & Editor

Portimage Sheet is a free online tool designed to help you convert and edit images specifically for A4 sheets. Easily resize, crop, and optimize your images to ensure they are perfectly formatted for printing on standard A4 paper.

## Features

- **Image Upload:** Upload various image formats.
- **A4 Sheet Preview:** Visualize how your images will appear on an A4 sheet.
- **Cropping and Resizing:** Precisely crop and resize images to fit A4 dimensions.
- **Optimization:** Optimize images for print quality.

## Technologies Used

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Image Processing:** face-api.js (for potential future features like face detection for smart cropping)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Adi-Codes-well/A4-Image-converter.git
   cd A4-Image-converter
   ```

2. **Install client dependencies:**
   ```bash
   cd client
   npm install
   ```

3. **Install server dependencies:**
   ```bash
   cd ../server
   npm install
   ```

### Running the Application

1. **Start the backend server:**
   ```bash
   cd server
   npm start # or node index.js
   ```

2. **Start the frontend development server:**
   ```bash
   cd ../client
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).

## Contributing

We welcome contributions! Please see our `CONTRIBUTING.md` (if available) for more details.

## License

This project is licensed under the ISC License.
