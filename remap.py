import sys
import json
import numpy as np
import os
sys.path.append(r"C:\Users\user\Desktop\egoeimi\jijuck_site")
from utils import parse_svg_to_polygons

old_svg = r"C:\Users\user\Desktop\egoeimi\buildings\jijuck.svg"
new_svg = r"C:\Users\user\Desktop\egoeimi\jijuck_site\jijuck_2.svg"
json_path = r"C:\Users\user\Desktop\egoeimi\buildings\cadastral_data.json"

old_polys = parse_svg_to_polygons(old_svg, num_samples=50)
new_polys = parse_svg_to_polygons(new_svg, num_samples=50)

def get_centroid(poly):
    if not poly: return np.array([0,0])
    pts = np.array(poly)
    return np.mean(pts, axis=0)

old_centroids = [get_centroid(p) for p in old_polys]
new_centroids = [get_centroid(p) for p in new_polys]

with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

old_areas = data.get("areas", {})
old_sequence = data.get("sequence", [])

mapping = {}
for new_i, nc in enumerate(new_centroids):
    best_old_i = -1
    best_dist = float('inf')
    for old_i, oc in enumerate(old_centroids):
        dist = np.linalg.norm(nc - oc)
        if dist < best_dist:
            best_dist = dist
            best_old_i = old_i
    mapping[new_i] = best_old_i

print("Mapping new -> old:", mapping)

new_areas = {}
for new_i, old_i in mapping.items():
    if str(old_i) in old_areas:
        new_areas[str(new_i)] = old_areas[str(old_i)]
        
rev_map = {old_i: new_i for new_i, old_i in mapping.items()}

new_sequence = []
for old_i in old_sequence:
    if old_i in rev_map:
        new_sequence.append(rev_map[old_i])

new_data = {
    "sequence": new_sequence,
    "areas": new_areas,
    "textOffsets": data.get("textOffsets", {}),
    "parcelColors": data.get("parcelColors", {}),
    "paintDataUrl": data.get("paintDataUrl", None)
}

# Overwrite original directly since we want the Streamlit app to use the remapped data
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(new_data, f, ensure_ascii=False, indent=2)

print("Remapping complete! Original JSON overwritten.")
