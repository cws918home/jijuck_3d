import cv2
import os

def compress_lrf(input_path, output_path):
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        print("Cannot open video:", input_path)
        return

    fps = cap.get(cv2.CAP_PROP_FPS) or 29.97
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    # Target 1920x960 2:1 equirectangular web video resolution
    target_w = 1920
    target_h = 960

    print(f"Original Video: {width}x{height}, FPS: {fps}, Frames: {total_frames}")

    # Use mp4v / avc1 codec
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (target_w, target_h))

    count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        resized = cv2.resize(frame, (target_w, target_h), interpolation=cv2.INTER_AREA)
        out.write(resized)
        count += 1
        if count % 100 == 0:
            print(f"Progress: {count}/{total_frames} frames...")

    cap.release()
    out.release()
    print("Video compression complete! Saved:", output_path)

if __name__ == "__main__":
    in_file = "360_2/DJI_20260729145630_0020_D.LRF"
    out_file = "360_2/DJI_20260729145630_0020_D_web.mp4"
    compress_lrf(in_file, out_file)
