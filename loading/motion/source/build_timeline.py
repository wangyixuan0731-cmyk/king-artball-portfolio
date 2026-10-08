import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "final" / "loading-run-atlas.json"
OUTPUT_PATH = ROOT / "build" / "timeline.json"

manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
frame_count = int(manifest["frameCount"])
fps = 9
frame_duration = 1 / fps

timeline = {
    "schemaVersion": 1,
    "fps": fps,
    "frameDuration": frame_duration,
    "loadingDuration": 5,
    "initialState": "running",
    "states": [{"id": "running", "hold": 0}],
    "segments": [
        {
            "id": "run-loop",
            "from": "running",
            "to": "running",
            "start": 0,
            "hold": (frame_count - 1) * frame_duration,
            "endExclusive": frame_count * frame_duration,
            "curve": {"type": "constant", "rate": 1},
        }
    ],
}

OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
OUTPUT_PATH.write_text(
    json.dumps(timeline, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
print(OUTPUT_PATH)
