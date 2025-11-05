## Interior Designer AI

Upload a room photo and get redesigned variants in seconds using Stable Diffusion + ControlNet (depth).

## Features

- 🎨 AI-powered interior design transformation
- 📸 Drag & drop image upload
- ⌨️ Ctrl+V paste functionality
- 📐 Maintains original image dimensions
- 💡 Optimized for bright, well-lit results
- 🎯 Multiple design styles (Modern, Traditional, Minimalist)
- 🏠 Various room types (Living Room, Dining Room, Bedroom, Bathroom, Office)
- 💾 Download generated designs

Backend supports:

- Advanced prompt enhancement, post-processing, optional upscaling
- Batch processing and multiple variations per input
- Optional Cloudflare R2 storage with public URLs

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

### Environment variables (Backend)

Set these for Cloudflare R2 uploads (optional; if omitted, images are saved locally under `api/images`):

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL` (optional, e.g., https://pub-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.r2.dev)

When configured, generated images are uploaded to R2 and the API returns public URLs. Without R2, the API serves images locally via `/images/{name}`.

## Usage

1. Open the application in your browser
2. Upload an image using drag & drop, click to browse, or Ctrl+V to paste
3. Select your preferred style and room type
4. Click "Design this room" and wait for processing
5. Download your generated design

## API (FastAPI)

Base URL: by default `http://localhost:8000`

- `GET /` → basic info
- `GET /health` → health check
- `GET /models/info` → model and runtime info
- `POST /generate/` → basic generation
  - form-data: `prompt` (string), `file` (image), `settings` (optional JSON string)
- `POST /generate/advanced` → advanced generation with settings
  - form-data: `prompt`, `file`, `settings` (JSON string)
- `POST /generate/variations` → multiple variations
  - form-data: `prompt`, `file`, `settings` (JSON string), `num_variations` (int, 1–5)
- `POST /generate/batch` → batch multiple input images
  - form-data: `prompt`, `settings` (JSON string), `files` (list of images)
- `GET /images/{image_name}` → serve locally stored images (when R2 not configured)
- `DELETE /images/{image_key}` → delete an image from R2 or local

Settings JSON supports (examples):

```
{
  "steps": 20,
  "guidanceScale": 7.5,
  "strength": 0.8,
  "seed": 0,
  "enableUpscaling": false,
  "preserveColors": false,
  "enhanceLighting": true,
  "style": "Modern",
  "roomType": "Living Room"
}
```

## Technologies

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python
- **AI Models**: Stable Diffusion, ControlNet, Depth Estimation
- **Image Processing**: PIL, OpenCV

## Models

- **Base**: `runwayml/stable-diffusion-v1-5`

  - Text-to-image foundation used in conjunction with ControlNet for structure guidance.
  - Safety checker is disabled to avoid unintended black outputs in controlled environments.

- **ControlNet (Depth)**: `lllyasviel/sd-controlnet-depth`

  - Receives a depth map derived from the input photo to preserve geometry/layout while applying the new style.
  - Exposed strength via settings (`strength`) to control adherence to the input structure.

- **Depth Estimator**: `Intel/dpt-large` (via Transformers `depth-estimation` pipeline)

  - Produces a per-pixel depth map used as ControlNet conditioning.
  - Automatically sized to match the preprocessed image; includes mild contrast enhancements.

- **Scheduler**: UniPCMultistepScheduler

  - More stable and often faster convergence than default schedulers for the chosen pipeline.

- **Device Handling**

  - CUDA used if available; otherwise optimized CPU with attention slicing (and xFormers if present).
  - Model modules are set to eval mode; optional CPU offload enabled on CUDA to reduce memory usage.

- **Generation Parameters (typical defaults)**
  - `steps`: 15–20
  - `guidanceScale`: ~7.5
  - `strength`: ~0.8 (depth/control strength)
  - `seed`: optional for reproducibility
  - Negative prompt tuned to reduce dark/low-quality artifacts

These defaults can be overridden via the `settings` JSON in advanced endpoints.

## Sample Outputs

See `outputs/` for example generated designs:

- `outputs/image.png`
- `outputs/image copy.png`

You can open them directly or embed them in your documentation/UI as needed.

## Notes

- GPU (CUDA) is auto-detected; otherwise optimized CPU execution is used.
- For production, configure Cloudflare R2 and a public base URL to serve images.
- If you need to further tune lighting/color preservation, adjust settings sent to `/generate/advanced`.
