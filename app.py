import streamlit as st
import streamlit.components.v1 as components
from PIL import Image
from utils import get_image_base64, parse_svg_to_polygons, generate_threejs_html

st.set_page_config(layout="wide", page_title="3D Cadastral Visualization", initial_sidebar_state="collapsed")

# Hide Streamlit UI elements for a premium fullscreen look
st.markdown("""
    <style>
        #MainMenu {visibility: hidden;}
        header {visibility: hidden;}
        footer {visibility: hidden;}
        .block-container {
            padding: 0rem !important;
            max-width: 100% !important;
        }
        iframe {
            height: 100vh !important;
            border: none;
        }
    </style>
""", unsafe_allow_html=True)

# Paths
base_image_path = "base.png"
side_texture_path = "dirt_side_2.avif"
svg_path = "jijuck_2.svg"

import os
import base64
import json

# --- Background Server for 360 Video and Photo Files ---
import threading
from http.server import SimpleHTTPRequestHandler, HTTPServer

class VideoHTTPHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        three60_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "360_2")
        super().__init__(*args, directory=three60_dir, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

VideoHTTPHandler.extensions_map.update({
    '.lrf': 'video/mp4',
    '.LRF': 'video/mp4',
    '.osv': 'video/mp4',
    '.OSV': 'video/mp4',
    '.jpg': 'image/jpeg',
    '.JPG': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.JPEG': 'image/jpeg',
    '.png': 'image/png',
    '.PNG': 'image/png'
})

def run_video_server():
    try:
        three60_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "360_2")
        if os.path.exists(three60_dir):
            server = HTTPServer(('0.0.0.0', 8082), VideoHTTPHandler)
            server.serve_forever()
    except Exception as e:
        pass

# Start server daemon
if not any(t.name == "360_server" for t in threading.enumerate()):
    t = threading.Thread(target=run_video_server, daemon=True, name="360_server")
    t.start()

# Logo setup
logo_html = ""
for ext in ["png", "jpg", "jpeg", "avif"]:
    logo_path = f"logo.{ext}"
    if os.path.exists(logo_path):
        with open(logo_path, "rb") as f:
            logo_bytes = f.read()
        logo_b64 = base64.b64encode(logo_bytes).decode('utf-8')
        mime_type = f"image/{ext}"
        if ext == "jpg": mime_type = "image/jpeg"
        logo_src = f"data:{mime_type};base64,{logo_b64}"
        logo_html = f'<img src="{logo_src}" alt="Logo">'
        break

# Read image dimensions
try:
    with Image.open(base_image_path) as img:
        img_width, img_height = img.size
except Exception as e:
    st.error(f"이미지({base_image_path})를 불러오는 데 실패했습니다: {e}")
    st.stop()

# Load cadastral data
cadastral_data = {}
cadastral_data_path = "cadastral_data.json"
try:
    with open(cadastral_data_path, "r", encoding="utf-8") as f:
        cadastral_data = json.load(f)
except Exception as e:
    st.warning(f"지적도 데이터를 불러오는 데 실패했습니다 (건물 위 텍스트가 표시되지 않습니다): {e}")

# Parse SVG
with st.spinner("SVG 데이터를 파싱하는 중..."):
    try:
        polygons = parse_svg_to_polygons(svg_path, num_samples=100)
    except Exception as e:
        st.error(f"SVG 파싱 에러: {e}")
        st.stop()

# Helper to get/create web-optimized 8K JPEG from 120MP MPO drone photo
def get_web_optimized_image(three60_folder, fname):
    if fname.endswith("_web.jpg"):
        return fname
    base_name = os.path.splitext(fname)[0]
    web_fname = f"{base_name}_web.jpg"
    web_path = os.path.join(three60_folder, web_fname)
    orig_path = os.path.join(three60_folder, fname)
    if not os.path.exists(web_path):
        try:
            from PIL import Image
            Image.MAX_IMAGE_PIXELS = None
            img = Image.open(orig_path)
            # Resize 120MP MPO image to 8192x4096 (standard WebGL max 8K texture size)
            resized = img.resize((8192, 4096), Image.Resampling.LANCZOS)
            resized.save(web_path, 'JPEG', quality=95)
        except Exception as e:
            return fname
    return web_fname

# Scan 360_2 Drone Files (Photo & Video)
drone_spots = []
three60_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), "360_2")
if os.path.exists(three60_folder):
    files = sorted(os.listdir(three60_folder))
    for fname in files:
        if fname.endswith("_web.jpg"):
            continue
        fname_upper = fname.upper()
        if fname_upper.endswith(".LRF"):
            drone_spots.append({
                "id": fname,
                "type": "video",
                "name": "📹 항공 360 비디오",
                "filename": fname
            })
        elif fname_upper.endswith((".JPG", ".JPEG", ".PNG")):
            web_filename = get_web_optimized_image(three60_folder, fname)
            web_path = os.path.join(three60_folder, web_filename)
            img_b64 = get_image_base64(web_path)
            drone_spots.append({
                "id": fname,
                "type": "image",
                "name": "📷 항공 360 사진",
                "filename": web_filename,
                "b64": img_b64
            })

# Generate HTML
with st.spinner("3D 뷰어 생성 중..."):
    try:
        base_image_b64 = get_image_base64(base_image_path)
        side_texture_b64 = get_image_base64(side_texture_path)
        
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
    except Exception as e:
        st.error(f"HTML 생성 에러: {e}")
        st.stop()

# Display in Streamlit
components.html(html_content, height=1000)
