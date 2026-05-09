#!/usr/bin/env bash
set -euo pipefail
REPO="/Users/deepikarudramurthy/Documents/lenny-podcasts"
RAW="$REPO/docs/_video-raw/raw.webm"
END_CARD="$REPO/docs/_video-raw/end-card.png"
OUT_MP4="$REPO/docs/demo.mp4"
OUT_GIF="$REPO/docs/demo.gif"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Generate the end-card PNG (720x1560)
python3 "$SCRIPT_DIR/make-end-card.py" "$END_CARD"

# Get raw video duration
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$RAW" | head -1)
echo "Raw video duration: ${DUR}s"

# Pre-compute end-card start time (3 seconds before end of video)
END_CARD_START=$(awk "BEGIN { printf \"%.3f\", $DUR - 3.0 }")
echo "End-card overlay starts at: ${END_CARD_START}s"

# Convert webm -> mp4 (H.264, AAC). Overlay the end-card image during the last 3 seconds.
# Source is already 720x1560, so scale is a no-op but keeps things explicit.
ffmpeg -y \
  -i "$RAW" \
  -loop 1 -i "$END_CARD" \
  -filter_complex "[0:v]scale=720:1560,format=yuv420p[base];[1:v]format=yuva420p[card];[base][card]overlay=enable='gte(t,${END_CARD_START})':eof_action=pass[outv]" \
  -map "[outv]" \
  -c:v libx264 -preset slow -crf 23 \
  -movflags +faststart \
  -an \
  "$OUT_MP4"

echo "MP4: $OUT_MP4 ($(du -h "$OUT_MP4" | cut -f1))"
ffprobe -v error -show_entries format=duration:stream=width,height,codec_name -of default=nw=1 "$OUT_MP4"

# Convert mp4 -> gif (palette-optimized).
PALETTE="/tmp/demo-palette.png"
ffmpeg -y -i "$OUT_MP4" -vf "fps=12,scale=540:-1:flags=lanczos,palettegen" "$PALETTE"
ffmpeg -y -i "$OUT_MP4" -i "$PALETTE" -lavfi "fps=12,scale=540:-1:flags=lanczos[x];[x][1:v]paletteuse" "$OUT_GIF"

echo "GIF: $OUT_GIF ($(du -h "$OUT_GIF" | cut -f1))"
