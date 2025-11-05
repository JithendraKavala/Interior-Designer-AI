from PIL import Image, ImageEnhance, ImageFilter
from io import BytesIO
import numpy as np
import torch
import cv2
from typing import Optional, Tuple, Dict, Any

def calculate_optimal_size(width, height, max_size=512):
    """Calculate optimal size for processing while maintaining aspect ratio"""
    if width <= max_size and height <= max_size:
        return width, height
    
    aspect_ratio = width / height
    
    if width > height:
        new_width = max_size
        new_height = int(max_size / aspect_ratio)
    else:
        new_height = max_size
        new_width = int(max_size * aspect_ratio)
    
    # Ensure dimensions are multiples of 8
    new_width = (new_width // 8) * 8
    new_height = (new_height // 8) * 8
    
    return new_width, new_height

def preprocess_image(image: Image.Image, target_size=(512, 512)):
    """Enhanced image preprocessing with noise reduction"""
    original_width, original_height = image.size
    optimal_width, optimal_height = calculate_optimal_size(original_width, original_height)
    
    # Convert to RGB
    image = image.convert("RGB")
    
    # Apply slight noise reduction
    image_array = np.array(image)
    image_array = cv2.bilateralFilter(image_array, 9, 75, 75)
    image = Image.fromarray(image_array)
    
    # Resize for processing
    image_resized = image.resize((optimal_width, optimal_height), Image.Resampling.LANCZOS)
    
    return image_resized, (original_width, original_height)

def generate_depth_map(image, depth_estimator, target_size=(512, 512)):
    """Enhanced depth map generation with edge preservation"""
    image_resized, original_dims = preprocess_image(image, target_size)
    depth = depth_estimator(image_resized)["depth"]
    depth = depth.resize((image_resized.size[0], image_resized.size[1]))
    
    # Enhance depth map contrast
    depth_array = np.array(depth)
    depth_array = cv2.equalizeHist(depth_array.astype(np.uint8))
    depth = Image.fromarray(depth_array)
    
    return depth, original_dims

def enhance_prompt_advanced(prompt: str, settings: Dict[str, Any]) -> str:
    """Advanced prompt enhancement based on settings"""
    base_prompt = prompt
    
    # Add lighting enhancements
    if settings.get('enhanceLighting', True):
        base_prompt += ", bright lighting, well-lit, natural lighting, warm atmosphere"
    
    # Add color preservation
    if settings.get('preserveColors', False):
        base_prompt += ", maintaining original color palette, color harmony"
    
    # Add quality modifiers
    base_prompt += ", high quality, detailed, professional photography, 8k resolution"
    
    # Add style-specific enhancements
    style = settings.get('style', '').lower()
    if 'modern' in style:
        base_prompt += ", clean lines, contemporary design, sleek furniture"
    elif 'traditional' in style:
        base_prompt += ", classic design, elegant furniture, timeless style"
    elif 'minimalist' in style:
        base_prompt += ", simple design, uncluttered space, minimal furniture"
    
    return base_prompt

def apply_color_correction(image: Image.Image, preserve_colors: bool = False) -> Image.Image:
    """Apply intelligent color correction"""
    if preserve_colors:
        # Gentle enhancement that preserves original colors
        enhancer = ImageEnhance.Color(image)
        image = enhancer.enhance(1.1)  # Slight saturation boost
        
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.05)  # Minimal contrast boost
    else:
        # Standard color enhancement
        enhancer = ImageEnhance.Color(image)
        image = enhancer.enhance(1.2)
        
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.1)
    
    return image

def upscale_image(image: Image.Image, scale_factor: int = 2) -> Image.Image:
    """Simple upscaling using LANCZOS resampling"""
    width, height = image.size
    new_size = (width * scale_factor, height * scale_factor)
    return image.resize(new_size, Image.Resampling.LANCZOS)

def post_process_image_advanced(image: Image.Image, settings: Dict[str, Any]) -> Image.Image:
    """Advanced post-processing with multiple enhancement options"""
    image = image.convert("RGB")
    
    # Calculate image statistics
    img_array = np.array(image)
    avg_brightness = np.mean(img_array)
    
    # Apply brightness enhancement if needed
    if avg_brightness < 100 or settings.get('enhanceLighting', True):
        print(f"Enhancing image brightness (avg: {avg_brightness:.1f})")
        
        # Smart brightness enhancement
        enhancer = ImageEnhance.Brightness(image)
        brightness_factor = 1.3 if avg_brightness < 80 else 1.2
        image = enhancer.enhance(brightness_factor)
    
    # Apply color correction
    image = apply_color_correction(image, settings.get('preserveColors', False))
    
    # Apply sharpening filter
    if not settings.get('preserveColors', False):
        image = image.filter(ImageFilter.UnsharpMask(radius=1, percent=120, threshold=3))
    
    # Apply upscaling if requested
    if settings.get('enableUpscaling', False):
        image = upscale_image(image, 2)
    
    return image

def generate_image_advanced(
    prompt: str, 
    image: Image.Image, 
    pipe, 
    depth_estimator, 
    settings: Dict[str, Any]
):
    """Advanced image generation with customizable settings"""
    
    # Get depth map and original dimensions
    depth_map, original_dims = generate_depth_map(image, depth_estimator)
    
    # Enhance the prompt
    enhanced_prompt = enhance_prompt_advanced(prompt, settings)
    
    # Prepare generation parameters
    generation_params = {
        "prompt": enhanced_prompt,
        "image": depth_map,
        "num_inference_steps": settings.get('steps', 20),
        "guidance_scale": settings.get('guidanceScale', 7.5),
        "strength": settings.get('strength', 0.8),
        "num_images_per_prompt": 1,
        "negative_prompt": "dark, dim, poorly lit, low quality, blurry, dark lighting, shadows, dark atmosphere, distorted, deformed"
    }
    
    # Set seed for reproducibility
    if settings.get('seed', 0) > 0:
        torch.manual_seed(settings['seed'])
        generation_params["generator"] = torch.Generator().manual_seed(settings['seed'])
    
    # Generate image
    print(f"Generating with settings: steps={generation_params['num_inference_steps']}, "
          f"guidance={generation_params['guidance_scale']}, strength={generation_params['strength']}")
    
    output = pipe(**generation_params).images[0]
    
    # Post-process the image
    output = post_process_image_advanced(output, settings)
    
    # Resize output back to original dimensions (unless upscaling is enabled)
    if not settings.get('enableUpscaling', False):
        original_width, original_height = original_dims
        output = output.resize((original_width, original_height), Image.Resampling.LANCZOS)
    
    return output

def generate_multiple_variations(
    prompt: str,
    image: Image.Image,
    pipe,
    depth_estimator,
    settings: Dict[str, Any],
    num_variations: int = 3
) -> list:
    """Generate multiple variations of the same design"""
    variations = []
    
    for i in range(num_variations):
        # Slightly vary the settings for each variation
        variation_settings = settings.copy()
        variation_settings['seed'] = settings.get('seed', 0) + i
        variation_settings['guidance_scale'] = settings.get('guidanceScale', 7.5) + (i * 0.5 - 1)
        
        # Clamp guidance scale to reasonable range
        variation_settings['guidance_scale'] = max(1, min(20, variation_settings['guidance_scale']))
        
        variation = generate_image_advanced(prompt, image, pipe, depth_estimator, variation_settings)
        variations.append(variation)
    
    return variations
