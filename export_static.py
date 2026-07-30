import os
import json
from PIL import Image
from utils import get_image_base64, parse_svg_to_polygons, generate_threejs_html

def get_web_optimized_image(three60_folder, fname):
    if fname.endswith("_web.jpg"):
        return fname
    base_name = os.path.splitext(fname)[0]
    web_fname = f"{base_name}_web.jpg"
    web_path = os.path.join(three60_folder, web_fname)
    orig_path = os.path.join(three60_folder, fname)
    if not os.path.exists(web_path):
        try:
            Image.MAX_IMAGE_PIXELS = None
            img = Image.open(orig_path)
            resized = img.resize((8192, 4096), Image.Resampling.LANCZOS)
            resized.save(web_path, 'JPEG', quality=95)
        except Exception as e:
            return fname
    return web_fname

def build_standalone():
    base_image_path = "base.png"
    side_texture_path = "dirt_side_2.avif"
    svg_path = "jijuck_2.svg"
    cadastral_data_path = "cadastral_data.json"
    three60_folder = "360_2"

    img = Image.open(base_image_path)
    img_width, img_height = img.size

    cadastral_data = {}
    if os.path.exists(cadastral_data_path):
        with open(cadastral_data_path, "r", encoding="utf-8") as f:
            cadastral_data = json.load(f)

    polygons = parse_svg_to_polygons(svg_path, num_samples=100)

    drone_spots = []
    if os.path.exists(three60_folder):
        files = sorted(os.listdir(three60_folder))
        for fname in files:
            fname_upper = fname.upper()
            if fname_upper.endswith(".LRF") or fname_upper.endswith(".MP4"):
                if fname.endswith("_web.mp4"):
                    target_v = fname
                else:
                    base_n = os.path.splitext(fname)[0]
                    web_v = f"{base_n}_web.mp4"
                    if os.path.exists(os.path.join(three60_folder, web_v)):
                        target_v = web_v
                    else:
                        target_v = fname
                
                if not any(spot["id"] == "360_video_main" for spot in drone_spots):
                    drone_spots.append({
                        "id": "360_video_main",
                        "type": "video",
                        "name": "📹 항공 360 비디오",
                        "filename": f"{three60_folder}/{target_v}"
                    })
            elif fname_upper.endswith((".JPG", ".JPEG", ".PNG")):
                web_filename = get_web_optimized_image(three60_folder, fname)
                drone_spots.append({
                    "id": fname,
                    "type": "image",
                    "name": "📷 항공 360 사진",
                    "filename": f"{three60_folder}/{web_filename}"
                })

    base_image_b64 = get_image_base64(base_image_path)
    side_texture_b64 = get_image_base64(side_texture_path)

    logo_html = """
    <div id="logo-container" style="position: absolute; top: 20px; left: 20px; z-index: 1000; pointer-events: auto;">
        <div style="background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(10px); padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.4); box-shadow: 0 8px 32px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center;">
            <img src="logo.png" style="max-height: 80px; max-width: 160px; object-fit: contain;">
        </div>
    </div>
    """

    html_content = generate_threejs_html(
        polygons=polygons,
        base_image_b64=base_image_b64,
        side_texture_b64=side_texture_b64,
        img_width=img_width,
        img_height=img_height,
        extrude_height=0,
        logo_html=logo_html,
        cadastral_data=cadastral_data,
        drone_spots=drone_spots
    )

    # In standalone index.html, media relative URL loads directly from static files
    html_content = html_content.replace('const mediaUrl = "http://" + targetHost + ":8082/" + spot.filename;', 'const mediaUrl = spot.filename;')

    with open("index.html", "w", encoding="utf-8") as f:
        f.write(html_content)

    print("index.html build complete! Ready for GitHub Pages deployment.")

if __name__ == "__main__":
    build_standalone()
