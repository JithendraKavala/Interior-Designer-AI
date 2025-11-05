from PIL import Image, ImageEnhance
from io import BytesIO
import numpy as np
import torch

def calculate_optimal_size(width, height, max_size=512):
    """Calculate optimal size for processing while maintaining aspect ratio"""
    if width <= max_size and height <= max_size:
        return width, height
    
    # Calculate aspect ratio
    aspect_ratio = width / height
    
    if width > height:
        # Landscape image
        new_width = max_size
        new_height = int(max_size / aspect_ratio)
    else:
        # Portrait or square image
        new_height = max_size
        new_width = int(max_size * aspect_ratio)
    
    # Ensure dimensions are multiples of 8 (better for AI models)
    new_width = (new_width // 8) * 8
    new_height = (new_height // 8) * 8
    
    return new_width, new_height

def preprocess_image(image: Image.Image, target_size=(512, 512)):
    """Resize image for processing while preserving aspect ratio"""
    # Store original dimensions
    original_width, original_height = image.size
    
    # Calculate optimal processing size
    optimal_width, optimal_height = calculate_optimal_size(original_width, original_height)
    
    # Convert to RGB
    image = image.convert("RGB")
    
    # Resize for processing (AI models work better with standard sizes)
    image_resized = image.resize((optimal_width, optimal_height), Image.Resampling.LANCZOS)
    
    return image_resized, (original_width, original_height)

def generate_depth_map(image, depth_estimator, target_size=(512, 512)):
    image_resized, original_dims = preprocess_image(image, target_size)
    depth = depth_estimator(image_resized)["depth"]
    depth = depth.resize((image_resized.size[0], image_resized.size[1]))
    return depth, original_dims

def enhance_prompt(prompt: str) -> str:
    """Enhance the prompt for better lighting and vibrancy"""
    # Add lighting and quality keywords
    enhanced_prompt = f"{prompt}, bright lighting, well-lit, vibrant colors, high quality, detailed, professional photography, natural lighting, warm atmosphere"
    return enhanced_prompt

def post_process_image(image: Image.Image) -> Image.Image:
    """Post-process image to enhance brightness and contrast if needed"""
    # Convert to RGB if not already
    image = image.convert("RGB")
    
    # Calculate average brightness
    img_array = np.array(image)
    avg_brightness = np.mean(img_array)
    
    # If image is too dark (average brightness < 100), enhance it
    if avg_brightness < 100:
        print(f"Image is dark (avg brightness: {avg_brightness:.1f}), enhancing...")
        
        # Enhance brightness
        enhancer = ImageEnhance.Brightness(image)
        image = enhancer.enhance(1.3)  # Increase brightness by 30%
        
        # Enhance contrast slightly
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.1)  # Increase contrast by 10%
        
        # Enhance color saturation
        enhancer = ImageEnhance.Color(image)
        image = enhancer.enhance(1.2)  # Increase saturation by 20%
    
    return image

def generate_image(prompt: str, image: Image.Image, pipe, depth_estimator):
    # Get depth map and original dimensions
    depth_map, original_dims = generate_depth_map(image, depth_estimator)
    
    # Debug: Check depth map
    print(f"Depth map size: {depth_map.size}")
    print(f"Depth map mode: {depth_map.mode}")
    
    # Ensure depth map is in correct format
    if depth_map.mode != 'RGB':
        depth_map = depth_map.convert('RGB')
    
    # Enhance the prompt for better lighting
    enhanced_prompt = enhance_prompt(prompt)
    print(f"Enhanced prompt: {enhanced_prompt}")
    
    # Fixed parameters to prevent black images
    try:
        output = pipe(
            prompt=enhanced_prompt,
            image=depth_map,
            num_inference_steps=20,  # Increased for better quality
            guidance_scale=7.5,      # Standard value that works well
            controlnet_conditioning_scale=1.0,  # Important: ControlNet strength
            num_images_per_prompt=1,
            negative_prompt="dark, dim, poorly lit, low quality, blurry, distorted, deformed, ugly",
            generator=torch.Generator().manual_seed(42)  # Fixed seed for consistency
        ).images[0]
        
        print(f"Generated image size: {output.size}")
        print(f"Generated image mode: {output.mode}")
        
        # Check if image is completely black
        img_array = np.array(output)
        avg_brightness = np.mean(img_array)
        print(f"Generated image average brightness: {avg_brightness}")
        
        if avg_brightness < 10:  # Image is essentially black
            print("⚠️ Generated image is too dark, applying emergency brightness fix")
            # Emergency fix for black images
            enhancer = ImageEnhance.Brightness(output)
            output = enhancer.enhance(3.0)  # Dramatic brightness increase
            
            # Add some contrast
            enhancer = ImageEnhance.Contrast(output)
            output = enhancer.enhance(1.5)
            
    except Exception as e:
        print(f"Generation error: {e}")
        # Fallback: create a test image instead of black
        output = Image.new('RGB', depth_map.size, (128, 128, 128))  # Gray fallback
        
        # Add some text to indicate it's a fallback
        from PIL import ImageDraw, ImageFont
        draw = ImageDraw.Draw(output)
        try:
            draw.text((10, 10), "Generation Error", fill=(255, 255, 255))
        except:
            pass
    
    # Post-process to enhance brightness if needed
    output = post_process_image(output)
    
    # Resize output back to original dimensions
    original_width, original_height = original_dims
    output_resized = output.resize((original_width, original_height), Image.Resampling.LANCZOS)
    
    return output_resized
