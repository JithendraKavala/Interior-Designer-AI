from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import uuid
import os
import json
import asyncio
from typing import Optional, Dict, Any
import logging

from model_loader import get_models
from enhanced_generate import generate_image_advanced, generate_multiple_variations

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

@app.get("/")
async def root():
    return {"message": "Interior Designer AI API", "version": "2.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "models_loaded": True}

@app.post("/generate/")
async def generate_basic(
    prompt: str = Form(...),
    file: UploadFile = File(...)
):
    """Basic generation endpoint for backward compatibility"""
    try:
        # Save uploaded image
        input_image = Image.open(file.file).convert("RGB")
        
        # Default settings
        settings = {
            'steps': 20,
            'guidanceScale': 7.5,
            'strength': 0.8,
            'seed': 0,
            'enableUpscaling': False,
            'preserveColors': False,
            'enhanceLighting': True
        }
        
        # Generate image
        output_image = generate_image_advanced(prompt, input_image, pipe, depth_estimator, settings)
        
        # Save and return
        output_path = f"images/{uuid.uuid4()}.png"
        output_image.save(output_path)
        
        return JSONResponse({
            "success": True,
            "output": [output_path, output_path],  # Return same image twice for compatibility
            "settings_used": settings
        })
        
    except Exception as e:
        logger.error(f"Generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/advanced")
async def generate_advanced(
    prompt: str = Form(...),
    file: UploadFile = File(...),
    settings: str = Form(default="{}")
):
    """Advanced generation with custom settings"""
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
        
        # Log input dimensions
        input_width, input_height = input_image.size
        logger.info(f"Input image dimensions: {input_width}x{input_height}")
        
        # Generate image
        output_image = generate_image_advanced(prompt, input_image, pipe, depth_estimator, default_settings)
        
        # Log output dimensions
        output_width, output_height = output_image.size
        logger.info(f"Output image dimensions: {output_width}x{output_height}")
        
        # Save output
        output_path = f"images/{uuid.uuid4()}.png"
        output_image.save(output_path)
        
        return JSONResponse({
            "success": True,
            "output": [output_path, output_path],
            "settings_used": default_settings,
            "input_dimensions": [input_width, input_height],
            "output_dimensions": [output_width, output_height]
        })
        
    except Exception as e:
        logger.error(f"Advanced generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/variations")
async def generate_variations(
    prompt: str = Form(...),
    file: UploadFile = File(...),
    settings: str = Form(default="{}"),
    num_variations: int = Form(default=3)
):
    """Generate multiple variations of the same design"""
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
        
        # Save all variations
        output_paths = []
        for i, variation in enumerate(variations):
            output_path = f"images/{uuid.uuid4()}_var_{i}.png"
            variation.save(output_path)
            output_paths.append(output_path)
        
        return JSONResponse({
            "success": True,
            "variations": output_paths,
            "num_generated": len(output_paths),
            "settings_used": default_settings
        })
        
    except Exception as e:
        logger.error(f"Variations generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/batch")
async def generate_batch(
    files: list[UploadFile] = File(...),
    prompt: str = Form(...),
    settings: str = Form(default="{}")
):
    """Batch process multiple images"""
    try:
        # Parse settings
        try:
            settings_dict = json.loads(settings)
        except json.JSONDecodeError:
            settings_dict = {}
        
        # Default settings optimized for batch processing
        default_settings = {
            'steps': 15,  # Reduced for faster processing
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
        
        # Limit batch size
        files = files[:10]  # Max 10 files
        
        results = []
        
        for i, file in enumerate(files):
            try:
                # Process each image
                input_image = Image.open(file.file).convert("RGB")
                
                # Use different seed for each image
                batch_settings = default_settings.copy()
                batch_settings['seed'] = default_settings['seed'] + i
                
                output_image = generate_image_advanced(
                    prompt, input_image, pipe, depth_estimator, batch_settings
                )
                
                # Save output
                output_path = f"images/{uuid.uuid4()}_batch_{i}.png"
                output_image.save(output_path)
                
                results.append({
                    "success": True,
                    "original_filename": file.filename,
                    "output_path": output_path,
                    "index": i
                })
                
            except Exception as e:
                logger.error(f"Batch processing error for file {i}: {str(e)}")
                results.append({
                    "success": False,
                    "original_filename": file.filename,
                    "error": str(e),
                    "index": i
                })
        
        successful_results = [r for r in results if r["success"]]
        
        return JSONResponse({
            "success": True,
            "total_processed": len(files),
            "successful": len(successful_results),
            "failed": len(files) - len(successful_results),
            "results": results,
            "settings_used": default_settings
        })
        
    except Exception as e:
        logger.error(f"Batch processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models/info")
async def get_model_info():
    """Get information about loaded models"""
    return {
        "stable_diffusion_model": "runwayml/stable-diffusion-v1-5",
        "controlnet_model": "lllyasviel/sd-controlnet-depth",
        "depth_estimator": "depth-estimation",
        "device": "cuda" if pipe.device.type == "cuda" else "cpu",
        "optimizations": {
            "memory_efficient_attention": True,
            "cpu_offload": pipe.device.type == "cuda"
        }
    }

@app.delete("/images/{image_id}")
async def delete_image(image_id: str):
    """Delete a generated image"""
    try:
        image_path = f"images/{image_id}"
        if os.path.exists(image_path):
            os.remove(image_path)
            return {"success": True, "message": "Image deleted"}
        else:
            raise HTTPException(status_code=404, detail="Image not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
