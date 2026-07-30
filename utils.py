import os
import json
import base64
from svgpathtools import svg2paths
from PIL import Image

def get_image_base64(image_path):
    import mimetypes
    mime_type, _ = mimetypes.guess_type(image_path)
    if not mime_type:
        mime_type = "image/png"
    with open(image_path, "rb") as img_file:
        encoded_string = base64.b64encode(img_file.read()).decode("utf-8")
    return f"data:{mime_type};base64,{encoded_string}"

def parse_svg_to_polygons(svg_path, num_samples=100):
    """Parse an SVG file and return a list of polygons (list of [x, y] coordinates)."""
    paths, attributes = svg2paths(svg_path)
    polygons = []
    
    for path in paths:
        for subpath in path.continuous_subpaths():
            subpoly = []
            for i in range(num_samples):
                t = i / float(num_samples - 1)
                point = subpath.point(t)
                subpoly.append([point.real, point.imag])
            if subpoly:
                polygons.append(subpoly)
                
    return polygons

def generate_threejs_html(polygons, base_image_b64, side_texture_b64, img_width, img_height, extrude_height=50, logo_html="", cadastral_data=None, drone_spots=None):
    if cadastral_data is None:
        cadastral_data = {}
    if drone_spots is None:
        drone_spots = []
        
    # Load HTML template and inject data
    with open("template.html", "r", encoding="utf-8") as f:
        html = f.read()
        
    html = html.replace("{{POLYGONS}}", json.dumps(polygons))
    html = html.replace("{{CADASTRAL_DATA}}", json.dumps(cadastral_data))
    html = html.replace("{{BASE_IMAGE_B64}}", base_image_b64)
    html = html.replace("{{SIDE_TEXTURE_B64}}", side_texture_b64)
    html = html.replace("{{IMG_WIDTH}}", str(img_width))
    html = html.replace("{{IMG_HEIGHT}}", str(img_height))
    html = html.replace("{{EXTRUDE_HEIGHT}}", str(extrude_height))
    html = html.replace("{{LOGO_HTML}}", logo_html)
    html = html.replace("{{DRONE_SPOTS}}", json.dumps(drone_spots))
    
    return html
