"""
Download or generate sample apartment images
Run this script once to prepare sample images for database seeding
"""
import os
import urllib.request
from pathlib import Path

def download_sample_images():
    """Download sample apartment images from Unsplash"""
    script_dir = Path(__file__).parent
    images_dir = script_dir / "sample_images"
    images_dir.mkdir(exist_ok=True)
    
    # Sample apartment image URLs from Unsplash (free images)
    # Using direct Unsplash source URLs - 2 images per apartment
    image_urls = [
        # Existing apartments (1-5)
        ("https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80&fit=crop", "apartment1_1.jpg"),
        ("https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80&fit=crop", "apartment1_2.jpg"),
        ("https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80&fit=crop", "apartment2_1.jpg"),
        ("https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80&fit=crop", "apartment2_2.jpg"),
        ("https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80&fit=crop", "apartment3_1.jpg"),
        ("https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80&fit=crop", "apartment3_2.jpg"),
        ("https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80&fit=crop", "apartment4_1.jpg"),
        ("https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&q=80&fit=crop", "apartment4_2.jpg"),
        ("https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&q=80&fit=crop", "apartment5_1.jpg"),
        ("https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80&fit=crop", "apartment5_2.jpg"),
        # Budget apartments (6-8)
        ("https://images.unsplash.com/photo-1560448075-cbc16ba4a9b5?w=800&q=80&fit=crop", "apartment6_1.jpg"),
        ("https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80&fit=crop", "apartment6_2.jpg"),
        ("https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80&fit=crop", "apartment7_1.jpg"),
        ("https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80&fit=crop", "apartment7_2.jpg"),
        ("https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80&fit=crop", "apartment8_1.jpg"),
        ("https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80&fit=crop", "apartment8_2.jpg"),
        # Mid-range apartments (9-14)
        ("https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&q=80&fit=crop", "apartment9_1.jpg"),
        ("https://images.unsplash.com/photo-1560448075-cbc16ba4a9b5?w=800&q=80&fit=crop", "apartment9_2.jpg"),
        ("https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80&fit=crop", "apartment10_1.jpg"),
        ("https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80&fit=crop", "apartment10_2.jpg"),
        ("https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80&fit=crop", "apartment11_1.jpg"),
        ("https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80&fit=crop", "apartment11_2.jpg"),
        ("https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80&fit=crop", "apartment12_1.jpg"),
        ("https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&q=80&fit=crop", "apartment12_2.jpg"),
        ("https://images.unsplash.com/photo-1560448075-cbc16ba4a9b5?w=800&q=80&fit=crop", "apartment13_1.jpg"),
        ("https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80&fit=crop", "apartment13_2.jpg"),
        ("https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80&fit=crop", "apartment14_1.jpg"),
        ("https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80&fit=crop", "apartment14_2.jpg"),
        # Premium apartments (15-19)
        ("https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80&fit=crop", "apartment15_1.jpg"),
        ("https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80&fit=crop", "apartment15_2.jpg"),
        ("https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&q=80&fit=crop", "apartment16_1.jpg"),
        ("https://images.unsplash.com/photo-1560448075-cbc16ba4a9b5?w=800&q=80&fit=crop", "apartment16_2.jpg"),
        ("https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80&fit=crop", "apartment17_1.jpg"),
        ("https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80&fit=crop", "apartment17_2.jpg"),
        ("https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80&fit=crop", "apartment18_1.jpg"),
        ("https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80&fit=crop", "apartment18_2.jpg"),
        ("https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80&fit=crop", "apartment19_1.jpg"),
        ("https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&q=80&fit=crop", "apartment19_2.jpg"),
        # Short-term (20-21)
        ("https://images.unsplash.com/photo-1560448075-cbc16ba4a9b5?w=800&q=80&fit=crop", "apartment20_1.jpg"),
        ("https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80&fit=crop", "apartment20_2.jpg"),
        ("https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80&fit=crop", "apartment21_1.jpg"),
        ("https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80&fit=crop", "apartment21_2.jpg"),
        # Long-term (22-23)
        ("https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80&fit=crop", "apartment22_1.jpg"),
        ("https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80&fit=crop", "apartment22_2.jpg"),
        ("https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&q=80&fit=crop", "apartment23_1.jpg"),
        ("https://images.unsplash.com/photo-1560448075-cbc16ba4a9b5?w=800&q=80&fit=crop", "apartment23_2.jpg"),
        # Immediate (24-25)
        ("https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80&fit=crop", "apartment24_1.jpg"),
        ("https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80&fit=crop", "apartment24_2.jpg"),
        ("https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80&fit=crop", "apartment25_1.jpg"),
        ("https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80&fit=crop", "apartment25_2.jpg"),
        # Future (26-27) - actually these are the last 2 in the list
        ("https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80&fit=crop", "apartment26_1.jpg"),
        ("https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&q=80&fit=crop", "apartment26_2.jpg"),
        ("https://images.unsplash.com/photo-1560448075-cbc16ba4a9b5?w=800&q=80&fit=crop", "apartment27_1.jpg"),
        ("https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80&fit=crop", "apartment27_2.jpg"),
    ]
    
    print(f"Downloading {len(image_urls)} sample images to {images_dir}...")
    print("Note: This requires an internet connection.")
    print()
    
    downloaded = 0
    failed = 0
    for url, filename in image_urls:
        filepath = images_dir / filename
        if filepath.exists():
            print(f"  ✓ {filename} (already exists)")
            downloaded += 1
            continue
            
        try:
            print(f"  Downloading {filename}...", end=" ")
            urllib.request.urlretrieve(url, filepath)
            print("✓")
            downloaded += 1
        except Exception as e:
            print(f"✗ Error: {e}")
            failed += 1
    
    print()
    print(f"Summary:")
    print(f"  Downloaded: {downloaded} images")
    if failed > 0:
        print(f"  Failed: {failed} images")
    print(f"  Total images in folder: {len(list(images_dir.glob('*.jpg')))}")
    print(f"  Images saved to: {images_dir}")
    
    if failed > 0:
        print()
        print("Note: Some images failed to download. You can:")
        print("  1. Run this script again to retry")
        print("  2. Manually add images to the sample_images folder")
        print("  3. The init_db script will work without images (apartments will be created without images)")

if __name__ == "__main__":
    download_sample_images()

