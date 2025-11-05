from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import uuid
import os
import json
import asyncio
from typing import Optional, Dict, Any
import logging
from io import BytesIO

import boto3
from botocore.client import Config

from model_loader import get_models
from generate import generate_image

# Try to import enhanced features, fallback to basic if not available
try:
    from enhanced_generate import generate_image_advanced, generate_multiple_variations
    ENHANCED_FEATURES = True
    print("✅ Enhanced features loaded successfully")
except ImportError:
    ENHANCED_FEATURES = False
    print("⚠️ Enhanced features not available, using basic functionality")

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Interior Designer AI API", version="2.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models
pipe, depth_estimator = get_models()

# Ensure directories exist
os.makedirs("images", exist_ok=True)
os.makedirs("temp", exist_ok=True)

# --- Cloudflare R2 configuration ---
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME")
R2_PUBLIC_BASE_URL = os.getenv("R2_PUBLIC_BASE_URL")  # e.g. https://pub-xxxx.r2.dev

_r2_enabled = all([R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME])
if _r2_enabled:
    r2_endpoint = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
    s3_client = boto3.client(
        "s3",
        endpoint_url=r2_endpoint,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )
else:
    s3_client = None


def _upload_image_return_url(image: Image.Image, key: str) -> str:
    """Upload an image to R2 (if configured) and return a URL to access it.

    Fallback: saves locally under images/ and returns the local file-serving endpoint.
    """
    if _r2_enabled and s3_client is not None:
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        buffer.seek(0)
        s3_client.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=key,
            Body=buffer,
            ContentType="image/png",
        )
        if R2_PUBLIC_BASE_URL:
            return f"{R2_PUBLIC_BASE_URL.rstrip('/')}/{key}"
        # Presigned fallback if no public base URL configured
        return s3_client.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": R2_BUCKET_NAME, "Key": key},
            ExpiresIn=3600,
        )

    # Local fallback
    local_path = f"images/{key}"
    image.save(local_path)
    return f"/images/{key}"

@app.get("/")
async def root():
    return {"message": "Interior Designer AI API", "version": "2.0.0", "enhanced_features": ENHANCED_FEATURES}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "models_loaded": True, "enhanced_features": ENHANCED_FEATURES}

@app.post("/generate/")
async def generate(
    prompt: str = Form(...),
    file: UploadFile = File(...),
    settings: str = Form(default="{}")
):
    """Enhanced generation endpoint with backward compatibility"""
    try:
        # Parse settings if provided
        try:
            settings_dict = json.loads(settings) if settings != "{}" else {}
        except json.JSONDecodeError:
            settings_dict = {}
        
        # Save uploaded image
        input_image = Image.open(file.file).convert("RGB")
        
        # Log input dimensions
        input_width, input_height = input_image.size
        logger.info(f"Input image dimensions: {input_width}x{input_height}")
        
        # Use enhanced generation if available, otherwise fallback to basic
        if ENHANCED_FEATURES and settings_dict:
            output_image = generate_image_advanced(prompt, input_image, pipe, depth_estimator, settings_dict)
        else:
            output_image = generate_image(prompt, input_image, pipe, depth_estimator)
        
        # Log output dimensions
        output_width, output_height = output_image.size
        logger.info(f"Output image dimensions: {output_width}x{output_height}")
        
        # Verify dimensions match
        if input_width == output_width and input_height == output_height:
            logger.info("✅ Output dimensions match input dimensions")
        else:
            logger.warning("❌ Output dimensions do not match input dimensions")

        # Upload and return URL(s)
        key = f"{uuid.uuid4()}.png"
        url = _upload_image_return_url(output_image, key)

        return JSONResponse({
            "success": True,
            "output": [url, url],
            "settings_used": settings_dict,
            "input_dimensions": [input_width, input_height],
            "output_dimensions": [output_width, output_height]
        })
        
    except Exception as e:
        logger.error(f"Generation error: {str(e)}")
        return JSONResponse({
            "success": False,
            "error": str(e)
        }, status_code=500)

@app.post("/generate/advanced")
async def generate_advanced(
    prompt: str = Form(...),
    file: UploadFile = File(...),
    settings: str = Form(default="{}")
):
    """Advanced generation with custom settings"""
    if not ENHANCED_FEATURES:
        return JSONResponse({
            "success": False,
            "error": "Enhanced features not available. Please install required dependencies."
        }, status_code=501)
    
    try:
        # Parse settings
        try:
            settings_dict = json.loads(settings)
        except json.JSONDecodeError:
            settings_dict = {}
        
        # Default settings with overrides
        default_settings = {
            'steps': 20,
            'guidanceScale': 7.5,
            'strength': 0.8,
            'seed': 0,
            'enableUpscaling': False,
            'preserveColors': False,
            'enhanceLighting': True,
            'style': 'Modern',
            'roomType': 'Living Room'
        }
        default_settings.update(settings_dict)
        
        # Save uploaded image
        input_image = Image.open(file.file).convert("RGB")
        
        # Generate image
        output_image = generate_image_advanced(prompt, input_image, pipe, depth_estimator, default_settings)
        
        # Upload and return URL(s)
        key = f"{uuid.uuid4()}.png"
        url = _upload_image_return_url(output_image, key)

        return JSONResponse({
            "success": True,
            "output": [url, url],
            "settings_used": default_settings
        })
        
    except Exception as e:
        logger.error(f"Advanced generation error: {str(e)}")
        return JSONResponse({
            "success": False,
            "error": str(e)
        }, status_code=500)

@app.post("/generate/variations")
async def generate_variations(
    prompt: str = Form(...),
    file: UploadFile = File(...),
    settings: str = Form(default="{}"),
    num_variations: int = Form(default=3)
):
    """Generate multiple variations of the same design"""
    if not ENHANCED_FEATURES:
        return JSONResponse({
            "success": False,
            "error": "Enhanced features not available. Please install required dependencies."
        }, status_code=501)
    
    try:
        # Parse settings
        try:
            settings_dict = json.loads(settings)
        except json.JSONDecodeError:
            settings_dict = {}
        
        # Default settings
        default_settings = {
            'steps': 15,  # Reduced for faster batch processing
            'guidanceScale': 7.5,
            'strength': 0.8,
            'seed': 42,  # Base seed for variations
            'enableUpscaling': False,
            'preserveColors': False,
            'enhanceLighting': True,
            'style': 'Modern',
            'roomType': 'Living Room'
        }
        default_settings.update(settings_dict)
        
        # Limit variations
        num_variations = min(max(1, num_variations), 5)
        
        # Save uploaded image
        input_image = Image.open(file.file).convert("RGB")
        
        # Generate variations
        variations = generate_multiple_variations(
            prompt, input_image, pipe, depth_estimator, default_settings, num_variations
        )
        
        # Upload all variations and return URLs
        urls = []
        for i, variation in enumerate(variations):
            key = f"{uuid.uuid4()}_var_{i}.png"
            url = _upload_image_return_url(variation, key)
            urls.append(url)

        return JSONResponse({
            "success": True,
            "variations": urls,
            "num_generated": len(urls),
            "settings_used": default_settings
        })
        
    except Exception as e:
        logger.error(f"Variations generation error: {str(e)}")
        return JSONResponse({
            "success": False,
            "error": str(e)
        }, status_code=500)

@app.get("/models/info")
async def get_model_info():
    """Get information about loaded models"""
    return {
        "stable_diffusion_model": "runwayml/stable-diffusion-v1-5",
        "controlnet_model": "lllyasviel/sd-controlnet-depth",
        "depth_estimator": "depth-estimation",
        "device": "cuda" if pipe.device.type == "cuda" else "cpu",
        "enhanced_features": ENHANCED_FEATURES,
        "optimizations": {
            "memory_efficient_attention": True,
            "cpu_offload": pipe.device.type == "cuda"
        },
        "storage": {
            "r2_enabled": _r2_enabled,
            "bucket": R2_BUCKET_NAME if _r2_enabled else None,
        }
    }

# Serve static files
@app.get("/images/{image_name}")
async def get_image(image_name: str):
    """Serve generated images from local fallback storage."""
    image_path = f"images/{image_name}"
    if os.path.exists(image_path):
        return FileResponse(image_path, media_type="image/png")
    raise HTTPException(status_code=404, detail="Image not found")


@app.delete("/images/{image_key}")
async def delete_image(image_key: str):
    """Delete a generated image either from R2 (if configured) or local storage."""
    try:
        if _r2_enabled and s3_client is not None:
            s3_client.delete_object(Bucket=R2_BUCKET_NAME, Key=image_key)
            return {"success": True, "message": "Image deleted from R2"}

        # Local fallback
        image_path = f"images/{image_key}"
        if os.path.exists(image_path):
            os.remove(image_path)
            return {"success": True, "message": "Image deleted from local storage"}
        raise HTTPException(status_code=404, detail="Image not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
