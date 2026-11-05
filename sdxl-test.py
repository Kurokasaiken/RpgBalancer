import torch
from diffusers import StableDiffusionXLImg2ImgPipeline
from PIL import Image
pipe = StableDiffusionXLImg2ImgPipeline.from_pretrained(
    'stabilityai/stable-diffusion-xl-base-1.0',
    torch_dtype=torch.float32).to('mps')
src = Image.open('/tmp/mappa2-upscale-test/zones/strip_e_2x.png').convert('RGB')
src = src.resize((960, 640))
r = pipe(prompt=("hand-painted fantasy world map seen from above, gouache style, "
        "individual well-crafted trees with visible trunks and leaf clusters, "
        "pines and broadleaf trees, painted meadow, same scene composition"),
    negative_prompt="blurry, photo, realistic, 3d render, low quality, text, signature",
    image=src, strength=0.55, num_inference_steps=30, guidance_scale=6.0).images[0]
r.save('test-results/mappa2-upscale/gallery/strip_e_sdxl.png')
print('done', r.size)
