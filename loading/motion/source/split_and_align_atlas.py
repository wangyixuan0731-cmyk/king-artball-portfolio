from pathlib import Path
from PIL import Image

SOURCE = Path(__file__).with_name("run-cycle-atlas-v1.png")
MOTION_ROOT = SOURCE.parent.parent
RAW_DIR = MOTION_ROOT / "frames" / "raw"
FINAL_DIR = MOTION_ROOT / "frames" / "final"

CELL = 512
SCALED_CELL = 440
GROUND_Y = (476, 476, 468, 476, 476, 468)

RAW_DIR.mkdir(parents=True, exist_ok=True)
FINAL_DIR.mkdir(parents=True, exist_ok=True)

atlas = Image.open(SOURCE).convert("RGBA")
if atlas.size != (1536, 1024):
    raise SystemExit(f"Unexpected atlas size: {atlas.size}")

for index in range(6):
    column = index % 3
    row = index // 3
    frame = atlas.crop(
        (column * CELL, row * CELL, (column + 1) * CELL, (row + 1) * CELL)
    )
    frame.save(RAW_DIR / f"frame-{index:02d}.png")

    scaled = frame.resize((SCALED_CELL, SCALED_CELL), Image.Resampling.NEAREST)
    alpha = scaled.getchannel("A").point(lambda value: 255 if value >= 32 else 0)
    scaled.putalpha(alpha)
    bbox = alpha.getbbox()
    if bbox is None:
        raise SystemExit(f"Frame {index} has no visible pixels")

    visible_center_x = (bbox[0] + bbox[2]) / 2
    dx = round(CELL / 2 - visible_center_x)
    dy = round(GROUND_Y[index] - bbox[3])
    aligned = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    aligned.alpha_composite(scaled, (dx, dy))
    aligned.save(FINAL_DIR / f"frame-{index:02d}.png")

print(f"wrote 6 raw frames to {RAW_DIR}")
print(f"wrote 6 aligned frames to {FINAL_DIR}")
