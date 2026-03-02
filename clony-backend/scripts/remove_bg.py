from PIL import Image
import sys

def remove_fake_transparency(input_path, output_path):
    print(f"Processing image: {input_path}")
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    # Logo is purely white (255, 255, 255)
    # Checkerboard is often (204, 204, 204) and (255, 255, 255)
    # The key difficulty is distinguish white logo from white checkerboard square.
    # HOWEVER, since the logo is white, we keep white and try to remove the gray.
    # If we remove the gray squares, we might get a "holey" logo if it was over white tiles.
    # STRATEGY: Treat ONLY the logo's core white as solid, and any gray as transparent.
    # If the user-provided img has checkerboard, the 'white' part of the logo might be 
    # overlayed on both gray and white squares.
    
    for item in datas:
        # If it's very white, keep it. 
        # If it's slightly gray (delta between R, G, B is small and value is below 250), it's likely the checkerboard gray.
        r, g, b, a = item
        if r > 250 and g > 250 and b > 250:
            newData.append((255, 255, 255, 255))
        elif r == g == b and r < 250: # Perfectly gray
            newData.append((0, 0, 0, 0))
        elif abs(r-g) < 10 and abs(g-b) < 10 and r < 240: # Nearly gray
            newData.append((0, 0, 0, 0))
        else:
            # Everything else (remnants) -> transparent
            newData.append((0, 0, 0, 0))

    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Success! Saved to: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 remove_bg.py input_path output_path")
    else:
        remove_fake_transparency(sys.argv[1], sys.argv[2])
