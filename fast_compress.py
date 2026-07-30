import cv2
import os

def fast_compress(input_path, output_path):
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        print("Cannot open video:", input_path)
        return

    fps = cap.get(cv2.CAP_PROP_FPS) or 29.97
    out_fps = 15
    skip_step = int(round(fps / out_fps)) or 1

    target_w = 1280
    target_h = 640

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"Fast Compressing: {target_w}x{target_h}, FPS: {out_fps}, Total frames: {total_frames}")

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, out_fps, (target_w, target_h))

    count = 0
    written = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if count % skip_step == 0:
            resized = cv2.resize(frame, (target_w, target_h), interpolation=cv2.INTER_AREA)
            out.write(resized)
            written += 1
        count += 1

    cap.release()
    out.release()
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"Done! Written {written} frames. File size: {size_mb:.2f} MB")

if __name__ == "__main__":
    in_file = "360_2/DJI_20260729145630_0020_D.LRF"
    out_file = "360_2/DJI_20260729145630_0020_D_web.mp4"
    fast_compress(in_file, out_file)
