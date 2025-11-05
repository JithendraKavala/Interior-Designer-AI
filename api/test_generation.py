#!/usr/bin/env python3
"""
Test script to debug black image generation issue
"""

from PIL import Image
import numpy as np
import torch
from model_loader import get_models
from generate import generate_image

def test_generation():
    print("🔧 Testing image generation to debug black image issue...")
    
    # Load models
    print("Loading models...")
    pipe, depth_estimator = get_models()
    
    # Create a simple test image
    test_image = Image.new('RGB', (512, 512), (100, 150, 200))  # Light blue
    print(f"Test image created: {test_image.size}, mode: {test_image.mode}")
    
    # Test prompt
    test_prompt = "modern living room interior design"
    
    try:
        print("Generating image...")
        result = generate_image(test_prompt, test_image, pipe, depth_estimator)
        
        # Check result
        result_array = np.array(result)
        avg_brightness = np.mean(result_array)
        
        print(f"✅ Generation completed!")
        print(f"Result size: {result.size}")
        print(f"Result mode: {result.mode}")
        print(f"Average brightness: {avg_brightness}")
        
        if avg_brightness < 10:
            print("❌ Result is still too dark (black image)")
            return False
        else:
            print("✅ Result looks good!")
            # Save test result
            result.save("test_output.png")
            print("Test image saved as test_output.png")
            return True
            
    except Exception as e:
        print(f"❌ Generation failed: {e}")
        return False

if __name__ == "__main__":
    success = test_generation()
    if success:
        print("🎉 Test passed! Generation should work now.")
    else:
        print("⚠️ Test failed. Need further debugging.")
