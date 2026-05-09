#!/usr/bin/env python3
"""Generate a 720x1560 end-card PNG for the PM Daily demo video."""
from PIL import Image, ImageDraw, ImageFont
import sys, os

WIDTH, HEIGHT = 720, 1560
BG = (42, 24, 16)        # #2A1810
FG = (251, 247, 240)     # #FBF7F0
ACCENT = (210, 105, 30)  # #D2691E
GOLD = (232, 176, 75)    # #E8B04B

img = Image.new("RGBA", (WIDTH, HEIGHT), BG + (255,))
draw = ImageDraw.Draw(img)

# Try common system font paths on macOS
def find_font(candidates, size):
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()

font_huge = find_font([
    "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
    "/System/Library/Fonts/NewYork.ttf",
    "/Library/Fonts/Georgia.ttf",
    "/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf",
], 64)
font_med = find_font([
    "/System/Library/Fonts/Supplemental/Georgia.ttf",
    "/System/Library/Fonts/SFNSMono.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
], 36)
font_small = find_font([
    "/System/Library/Fonts/SFNSMono.ttf",
    "/System/Library/Fonts/Menlo.ttc",
    "/System/Library/Fonts/Supplemental/Courier New.ttf",
], 26)
font_pill = find_font([
    "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
], 22)

def text_size(s, font):
    bbox = draw.textbbox((0, 0), s, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]

def center_text(y, s, font, fill):
    w, _ = text_size(s, font)
    draw.text(((WIDTH - w) / 2, y), s, font=font, fill=fill)

# Coffee-cup style logo block at top
cy = 540
# Orange rounded square
sq_size = 120
sq_x = (WIDTH - sq_size) // 2
sq_y = cy - sq_size - 30
draw.rounded_rectangle(
    [(sq_x, sq_y), (sq_x + sq_size, sq_y + sq_size)],
    radius=24, fill=ACCENT, outline=FG, width=4,
)
# Inner mark
draw.text((sq_x + 38, sq_y + 30), "P", font=find_font([
    "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
], 60), fill=FG)

# Gold pill: "THE DAILY PM"
pill_text = "THE DAILY PM"
pw, ph = text_size(pill_text, font_pill)
pad_x, pad_y = 28, 12
px = (WIDTH - pw - pad_x * 2) // 2
py = cy
draw.rounded_rectangle(
    [(px, py), (px + pw + pad_x * 2, py + ph + pad_y * 2)],
    radius=999, fill=GOLD,
)
draw.text((px + pad_x, py + pad_y - 2), pill_text, font=font_pill, fill=BG)

# Headline
center_text(cy + ph + pad_y * 2 + 60, "Try it", font_huge, FG)
center_text(cy + ph + pad_y * 2 + 140, "Daily PM reps,", font_huge, FG)
center_text(cy + ph + pad_y * 2 + 220, "sourced from Lenny.", font_huge, ACCENT)

# URL block
url_y = HEIGHT - 360
url_box_w = 600
url_box_h = 80
ubx = (WIDTH - url_box_w) // 2
draw.rounded_rectangle(
    [(ubx, url_y), (ubx + url_box_w, url_y + url_box_h)],
    radius=14, fill=(60, 38, 26), outline=ACCENT, width=2,
)
center_text(url_y + 22, "pm-daily.avalanche05.workers.dev", font_med, FG)

# Repo line
center_text(url_y + url_box_h + 36, "github.com/Deepikar8/pm-daily", font_small, ACCENT)

img.save(sys.argv[1] if len(sys.argv) > 1 else "/tmp/end-card.png")
print("End-card written")
