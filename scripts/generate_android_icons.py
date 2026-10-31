import os
import math
from PIL import Image, ImageDraw, ImageFilter

def create_aurum_icon(size=512, is_foreground_only=False, is_round=False):
    # Create base RGBA canvas
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    center = size / 2.0
    radius = size * 0.44

    if not is_foreground_only:
        # Draw background
        if is_round:
            draw.ellipse([center - radius, center - radius, center + radius, center + radius], fill=(7, 10, 16, 255))
        else:
            corner_radius = size * 0.22
            draw.rounded_rectangle([0, 0, size, size], radius=int(corner_radius), fill=(7, 10, 16, 255))

        # Medallion glow
        medallion_r = size * 0.38
        draw.ellipse([center - medallion_r, center - medallion_r, center + medallion_r, center + medallion_r], fill=(16, 24, 44, 255))

        # Outer Gold Border
        ring_w = max(2, int(size * 0.035))
        draw.ellipse([center - radius, center - radius, center + radius, center + radius], outline=(212, 175, 55, 255), width=ring_w)
        
        # Inner thin gold ring
        inner_ring_r = size * 0.39
        inner_ring_w = max(1, int(size * 0.012))
        draw.ellipse([center - inner_ring_r, center - inner_ring_r, center + inner_ring_r, center + inner_ring_r], outline=(245, 230, 179, 180), width=inner_ring_w)

    # If foreground for adaptive icon, safe zone scale is ~0.65
    scale = 0.65 if is_foreground_only else 1.0
    
    # Outer circle for foreground if is_foreground_only
    if is_foreground_only:
        f_radius = radius * scale
        ring_w = max(2, int(size * 0.03 * scale))
        draw.ellipse([center - f_radius, center - f_radius, center + f_radius, center + f_radius], outline=(212, 175, 55, 255), width=ring_w)
        inner_ring_r = size * 0.39 * scale
        inner_ring_w = max(1, int(size * 0.01 * scale))
        draw.ellipse([center - inner_ring_r, center - inner_ring_r, center + inner_ring_r, center + inner_ring_r], outline=(245, 230, 179, 200), width=inner_ring_w)

    # Stylized Golden Monogram "A"
    # Vertex coordinates scaled relative to center
    top_y = center - (size * 0.22 * scale)
    bot_y = center + (size * 0.16 * scale)
    bar_y = center + (size * 0.06 * scale)
    apex_x = center
    left_x = center - (size * 0.16 * scale)
    right_x = center + (size * 0.16 * scale)
    stroke_w = max(3, int(size * 0.045 * scale))

    # Left leg
    draw.line([(apex_x, top_y), (left_x, bot_y)], fill=(245, 230, 179, 255), width=stroke_w)
    # Right leg
    draw.line([(apex_x, top_y), (right_x, bot_y)], fill=(212, 175, 55, 255), width=stroke_w)
    # Crossbar
    bar_left_x = apex_x - (size * 0.09 * scale)
    bar_right_x = apex_x + (size * 0.09 * scale)
    draw.line([(bar_left_x, bar_y), (bar_right_x, bar_y)], fill=(253, 224, 71, 255), width=max(2, int(stroke_w * 0.8)))

    # Golden Market Heartbeat / Pulse Wave across bottom
    pulse_y = center + (size * 0.22 * scale)
    pulse_points = [
        (center - size * 0.22 * scale, pulse_y),
        (center - size * 0.09 * scale, pulse_y),
        (center - size * 0.05 * scale, pulse_y - size * 0.06 * scale),
        (center, pulse_y + size * 0.08 * scale),
        (center + size * 0.05 * scale, pulse_y - size * 0.07 * scale),
        (center + size * 0.08 * scale, pulse_y + size * 0.03 * scale),
        (center + size * 0.12 * scale, pulse_y),
        (center + size * 0.22 * scale, pulse_y),
    ]
    pulse_w = max(2, int(size * 0.02 * scale))
    draw.line(pulse_points, fill=(245, 230, 179, 255), width=pulse_w, joint="curve")

    # Sparkling luster diamond at apex
    sparkle_r = max(2, int(size * 0.018 * scale))
    draw.ellipse([apex_x - sparkle_r, top_y - sparkle_r, apex_x + sparkle_r, top_y + sparkle_r], fill=(255, 255, 255, 255))

    return img

def main():
    res_base = "android/app/src/main/res"

    # Dimensions for mipmaps
    densities = {
        "mipmap-mdpi": {"launcher": 48, "foreground": 108},
        "mipmap-hdpi": {"launcher": 72, "foreground": 162},
        "mipmap-xhdpi": {"launcher": 96, "foreground": 216},
        "mipmap-xxhdpi": {"launcher": 144, "foreground": 324},
        "mipmap-xxxhdpi": {"launcher": 192, "foreground": 432},
    }

    print("Generating Android Launcher Icons...")
    master_512 = create_aurum_icon(512, is_foreground_only=False, is_round=False)
    master_round_512 = create_aurum_icon(512, is_foreground_only=False, is_round=True)
    master_foreground_512 = create_aurum_icon(512, is_foreground_only=True)

    # Save to public/icons as well
    os.makedirs("public/icons", exist_ok=True)
    master_512.save("public/icons/icon-512.png", "PNG")
    master_512.resize((192, 192), Image.Resampling.LANCZOS).save("public/icons/icon-192.png", "PNG")

    for folder, dims in densities.items():
        folder_path = os.path.join(res_base, folder)
        os.makedirs(folder_path, exist_ok=True)

        # 1. Standard ic_launcher.png
        l_size = dims["launcher"]
        icon_standard = master_512.resize((l_size, l_size), Image.Resampling.LANCZOS)
        icon_standard.save(os.path.join(folder_path, "ic_launcher.png"), "PNG")

        # 2. Round ic_launcher_round.png
        icon_round = master_round_512.resize((l_size, l_size), Image.Resampling.LANCZOS)
        icon_round.save(os.path.join(folder_path, "ic_launcher_round.png"), "PNG")

        # 3. Adaptive ic_launcher_foreground.png
        f_size = dims["foreground"]
        icon_fg = master_foreground_512.resize((f_size, f_size), Image.Resampling.LANCZOS)
        icon_fg.save(os.path.join(folder_path, "ic_launcher_foreground.png"), "PNG")

        print(f"Generated {folder}: {l_size}x{l_size} launcher & {f_size}x{f_size} foreground")

    # Generate Splash screens with dark luxury background and centered logo
    splash_logo = master_round_512.resize((256, 256), Image.Resampling.LANCZOS)
    
    splash_targets = [
        os.path.join(res_base, "drawable", "splash.png"),
        os.path.join(res_base, "drawable-land-mdpi", "splash.png"),
        os.path.join(res_base, "drawable-land-hdpi", "splash.png"),
        os.path.join(res_base, "drawable-land-xhdpi", "splash.png"),
        os.path.join(res_base, "drawable-land-xxhdpi", "splash.png"),
        os.path.join(res_base, "drawable-land-xxxhdpi", "splash.png"),
        os.path.join(res_base, "drawable-port-mdpi", "splash.png"),
        os.path.join(res_base, "drawable-port-hdpi", "splash.png"),
        os.path.join(res_base, "drawable-port-xhdpi", "splash.png"),
        os.path.join(res_base, "drawable-port-xxhdpi", "splash.png"),
        os.path.join(res_base, "drawable-port-xxxhdpi", "splash.png"),
    ]

    for sp_path in splash_targets:
        os.makedirs(os.path.dirname(sp_path), exist_ok=True)
        # Create dark background
        w, h = 480, 800
        if "land" in sp_path:
            w, h = 800, 480
        if "xxxhdpi" in sp_path:
            w, h = (1920, 1080) if "land" in sp_path else (1080, 1920)
        elif "xxhdpi" in sp_path:
            w, h = (1280, 720) if "land" in sp_path else (720, 1280)

        splash_bg = Image.new("RGBA", (w, h), (7, 10, 16, 255))
        # Center the logo
        logo_w, logo_h = splash_logo.size
        offset_x = (w - logo_w) // 2
        offset_y = (h - logo_h) // 2
        splash_bg.paste(splash_logo, (offset_x, offset_y), splash_logo)
        splash_bg.save(sp_path, "PNG")

    print("Generated all splash screens successfully!")

if __name__ == "__main__":
    main()
