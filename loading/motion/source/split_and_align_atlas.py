from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

SOURCE = Path(__file__).with_name("run-cycle-atlas-v2.png")
MOTION_ROOT = SOURCE.parent.parent
RAW_DIR = MOTION_ROOT / "frames" / "raw"
FINAL_DIR = MOTION_ROOT / "frames" / "final"

CELL = 512
TARGET_HEIGHT = 452
BASELINE = 482
ALPHA_THRESHOLD = 32

RAW_DIR.mkdir(parents=True, exist_ok=True)
FINAL_DIR.mkdir(parents=True, exist_ok=True)

atlas = Image.open(SOURCE).convert("RGBA")
if atlas.size != (1536, 1024):
    raise SystemExit(f"Unexpected atlas size: {atlas.size}")


def keep_largest_component(frame: Image.Image) -> tuple[Image.Image, tuple[int, int, int, int]]:
    """Discard isolated generator pixels without changing the character artwork."""
    alpha = np.asarray(frame.getchannel("A")) >= ALPHA_THRESHOLD
    height, width = alpha.shape
    seen = np.zeros_like(alpha, dtype=bool)
    largest: list[tuple[int, int]] = []

    for y in range(height):
        for x in range(width):
            if not alpha[y, x] or seen[y, x]:
                continue
            component: list[tuple[int, int]] = []
            queue = deque([(x, y)])
            seen[y, x] = True
            while queue:
                px, py = queue.popleft()
                component.append((px, py))
                for nx, ny in ((px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)):
                    if 0 <= nx < width and 0 <= ny < height and alpha[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        queue.append((nx, ny))
            if len(component) > len(largest):
                largest = component

    if not largest:
        raise SystemExit("Frame has no visible subject")

    cleaned_alpha = np.zeros((height, width), dtype=np.uint8)
    for x, y in largest:
        cleaned_alpha[y, x] = 255
    cleaned = frame.copy()
    cleaned.putalpha(Image.fromarray(cleaned_alpha, mode="L"))
    bbox = cleaned.getchannel("A").getbbox()
    if bbox is None:
        raise SystemExit("Frame has no visible subject after component cleanup")
    return cleaned, bbox

for index in range(6):
    column = index % 3
    row = index // 3
    frame = atlas.crop(
        (column * CELL, row * CELL, (column + 1) * CELL, (row + 1) * CELL)
    )
    frame.save(RAW_DIR / f"frame-{index:02d}.png")

    cleaned, bbox = keep_largest_component(frame)
    subject = cleaned.crop(bbox)
    target_width = round(subject.width * TARGET_HEIGHT / subject.height)
    scaled = subject.resize((target_width, TARGET_HEIGHT), Image.Resampling.NEAREST)
    dx = round((CELL - target_width) / 2)
    dy = BASELINE - TARGET_HEIGHT
    aligned = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    aligned.alpha_composite(scaled, (dx, dy))
    aligned.save(FINAL_DIR / f"frame-{index:02d}.png")

print(f"wrote 6 raw frames to {RAW_DIR}")
print(f"wrote 6 aligned frames to {FINAL_DIR}")
