## Interior Designer AI

Upload a sample room photo and get a design back in seconds.

## Features

- 🎨 AI-powered interior design transformation
- 📸 Drag & drop image upload
- ⌨️ Ctrl+V paste functionality
- 📐 Maintains original image dimensions
- 💡 Optimized for bright, well-lit results
- 🎯 Multiple design styles (Modern, Traditional, Minimalist)
- 🏠 Various room types (Living Room, Dining Room, Bedroom, Bathroom, Office)
- 💾 Download generated designs

## Performance Optimization

### Processing Time

- **CPU Processing**: 1-3 minutes (depending on your system)
- **GPU Processing**: 30-60 seconds (if CUDA is available)

### Tips for Faster Processing

1. **Use GPU if available**: The system automatically detects and uses CUDA if available
2. **Smaller images**: Upload images under 1MB for faster processing
3. **Close other applications**: Free up CPU resources
4. **Be patient**: The AI model is processing your image with high quality

### Current Optimizations

- Reduced inference steps from 20 to 10 for faster processing
- Memory-efficient attention slicing for CPU
- Optimized model loading and caching
- 5-minute timeout for processing requests

## Installation

1. Clone the repository
2. Install Python dependencies: `pip install -r api/requirements.txt`
3. Install Node.js dependencies: `npm install`
4. Start the Python API: `cd api && uvicorn app:app --reload`
5. Start the Next.js app: `npm run dev`

## Usage

1. Open the application in your browser
2. Upload an image using drag & drop, click to browse, or Ctrl+V to paste
3. Select your preferred style and room type
4. Click "Design this room" and wait for processing
5. Download your generated design

## Technologies

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python
- **AI Models**: Stable Diffusion, ControlNet, Depth Estimation
- **Image Processing**: PIL, OpenCV
