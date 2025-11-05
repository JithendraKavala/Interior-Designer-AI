import torch
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel, UniPCMultistepScheduler
from transformers import pipeline as transformers_pipeline

# Check if CUDA is available
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# Load ControlNet (depth)
controlnet = ControlNetModel.from_pretrained(
    "lllyasviel/sd-controlnet-depth", 
    torch_dtype=torch.float16 if device == "cuda" else torch.float32
)

pipe = StableDiffusionControlNetPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    controlnet=controlnet,
    torch_dtype=torch.float16 if device == "cuda" else torch.float32,
    safety_checker=None,  # Disable safety checker to prevent black images
    requires_safety_checker=False
)

# Use a more stable scheduler
pipe.scheduler = UniPCMultistepScheduler.from_config(pipe.scheduler.config)

# Set pipeline to evaluation mode
pipe.unet.eval()
pipe.vae.eval()
if hasattr(pipe, 'text_encoder'):
    pipe.text_encoder.eval()

# Only enable CPU offload if CUDA is available
if device == "cuda":
    pipe.enable_model_cpu_offload()
else:
    # For CPU, move the model to CPU and use optimizations
    pipe = pipe.to(device)
    # Use memory efficient attention for CPU
    pipe.enable_attention_slicing()
    # Use memory efficient xformers if available
    try:
        pipe.enable_xformers_memory_efficient_attention()
        print("Using xformers memory efficient attention")
    except:
        print("xformers not available, using standard attention")
    print("Running on CPU - optimized for speed")

# Depth Estimator
depth_estimator = transformers_pipeline("depth-estimation", device=device)

def get_models():
    return pipe, depth_estimator
