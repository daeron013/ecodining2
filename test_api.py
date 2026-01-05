"""
Test script for the Dining Waste Tracker API
Run this after starting the server to verify everything works.
"""

import requests
import json
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import os

# Configuration
API_BASE_URL = "http://localhost:8000"

def create_test_images():
    """Create simple test images if none exist."""
    print("Creating test images...")
    
    # Create a "before" image with FULL plate of food
    before_img = Image.new('RGB', (800, 800), color='white')
    draw = ImageDraw.Draw(before_img)
    
    # Draw a plate (circle)
    draw.ellipse([100, 100, 700, 700], fill='lightgray', outline='gray', width=5)
    
    # Draw FULL portions of food
    draw.ellipse([200, 250, 400, 450], fill='brown', outline='darkbrown', width=3)  # Full chicken portion
    draw.ellipse([420, 250, 620, 450], fill='green', outline='darkgreen', width=3)  # Full broccoli portion
    draw.rectangle([200, 480, 600, 600], fill='yellow', outline='orange', width=3)  # Full Mac & Cheese
    
    # Save before image
    before_img.save('/tmp/test_before.jpg')
    
    # Create an "after" image with SMALL amounts of food remaining (waste)
    # Most food should be GONE (eaten), only small amounts remain
    after_img = Image.new('RGB', (800, 800), color='white')
    draw = ImageDraw.Draw(after_img)
    
    # Draw the same plate
    draw.ellipse([100, 100, 700, 700], fill='lightgray', outline='gray', width=5)
    
    # Draw SMALL remaining food portions (about 15-20% left)
    draw.ellipse([280, 320, 340, 380], fill='brown', outline='darkbrown', width=2)  # Tiny bit of chicken left
    draw.ellipse([500, 310, 560, 370], fill='green', outline='darkgreen', width=2)  # Small broccoli piece
    draw.rectangle([350, 520, 450, 560], fill='yellow', outline='orange', width=2)  # Small mac & cheese left
    
    # Save after image
    after_img.save('/tmp/test_after.jpg')
    
    print("✓ Test images created at /tmp/test_before.jpg and /tmp/test_after.jpg")
    return '/tmp/test_before.jpg', '/tmp/test_after.jpg'


def test_health_check():
    """Test the health check endpoint."""
    print("\n1. Testing health check endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/api/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Health check passed")
            print(f"  Status: {data.get('status')}")
            print(f"  Gemini enabled: {data.get('gemini_enabled')}")
            return True
        else:
            print(f"✗ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error connecting to API: {e}")
        print("  Make sure the server is running: python dining_waste_tracker_gemini.py")
        return False


def test_scan(before_path, after_path):
    """Test the main scan endpoint."""
    print("\n2. Testing scan endpoint...")
    try:
        files = {
            'before_image': open(before_path, 'rb'),
            'after_image': open(after_path, 'rb')
        }
        data = {
            'student_id': 'test_student_123',
            'school_id': 'test_school'
        }
        
        response = requests.post(f"{API_BASE_URL}/api/scan", files=files, data=data)
        
        if response.status_code == 200:
            result = response.json()
            print("✓ Scan successful!")
            print(f"  Scan ID: {result.get('scan_id')}")
            print(f"  Waste Level: {result.get('waste_level')}")
            print(f"  Average Waste: {result.get('avg_waste_percentage')}%")
            print(f"  Points Earned: {result.get('points')}")
            
            print("\n  Food Items Detected:")
            for item in result.get('food_items', []):
                print(f"    - {item['name']}: {item['waste_percentage']}% wasted")
            
            print("\n  Environmental Impact:")
            impact = result.get('impact', {})
            print(f"    - Weight: {impact.get('weight_oz')} oz ({impact.get('weight_lbs')} lbs)")
            print(f"    - Cost: ${impact.get('cost_usd')}")
            print(f"    - CO2: {impact.get('co2_kg')} kg")
            print(f"    - Water: {impact.get('water_gallons')} gallons")
            
            print("\n  Tips:")
            for tip in result.get('tips', []):
                print(f"    • {tip}")
            
            return True, result.get('scan_id')
        else:
            print(f"✗ Scan failed: {response.status_code}")
            print(f"  Error: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"✗ Error during scan: {e}")
        return False, None


def test_student_stats(student_id):
    """Test the student statistics endpoint."""
    print("\n3. Testing student statistics endpoint...")
    try:
        response = requests.get(
            f"{API_BASE_URL}/api/student-stats",
            params={'student_id': student_id, 'days': 7}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✓ Student stats retrieved!")
            print(f"  Total Scans: {result.get('total_scans')}")
            print(f"  Total Points: {result.get('total_points')}")
            print(f"  Average Waste: {result.get('avg_waste_pct')}%")
            
            badge = result.get('badge', {})
            print(f"\n  Badge: {badge.get('emoji')} {badge.get('level')} - {badge.get('description')}")
            
            next_goal = result.get('next_goal', {})
            if 'points_needed' in next_goal:
                print(f"  Next Goal: {next_goal.get('points_needed')} more points to {next_goal.get('next_badge')}")
            
            return True
        else:
            print(f"✗ Failed to get student stats: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ Error getting student stats: {e}")
        return False


def test_daily_report(school_id):
    """Test the daily report endpoint."""
    print("\n4. Testing daily report endpoint...")
    try:
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")
        
        response = requests.get(
            f"{API_BASE_URL}/api/daily-report",
            params={'school_id': school_id, 'date': today}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✓ Daily report retrieved!")
            print(f"  Date: {result.get('date')}")
            print(f"  Total Scans: {result.get('total_scans')}")
            
            if result.get('total_scans', 0) > 0:
                print(f"  Average Waste: {result.get('avg_waste_pct')}%")
                
                totals = result.get('totals', {})
                print(f"\n  Daily Totals:")
                print(f"    - Weight: {totals.get('weight_lbs')} lbs")
                print(f"    - Cost: ${totals.get('cost_usd')}")
                print(f"    - CO2: {totals.get('co2_kg')} kg")
                
                print(f"\n  Food Items (showing top 3):")
                for item in result.get('by_food', [])[:3]:
                    print(f"    - {item['food']}: {item['avg_waste_pct']}% avg waste")
                    print(f"      Recommendation: {item['recommendation']}")
            
            return True
        else:
            print(f"✗ Failed to get daily report: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ Error getting daily report: {e}")
        return False


def test_leaderboard(school_id):
    """Test the leaderboard endpoint."""
    print("\n5. Testing leaderboard endpoint...")
    try:
        response = requests.get(
            f"{API_BASE_URL}/api/leaderboard",
            params={'school_id': school_id, 'period': 'week'}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✓ Leaderboard retrieved!")
            print(f"  Period: {result.get('period')}")
            
            leaderboard = result.get('leaderboard', [])
            if leaderboard:
                print(f"\n  Top Students:")
                for entry in leaderboard[:5]:
                    badge = entry.get('badge', {})
                    print(f"    {entry['rank']}. Student {entry['student_id']}")
                    print(f"       Points: {entry['total_points']} | Badge: {badge.get('emoji')} {badge.get('level')}")
            else:
                print("  No entries yet")
            
            return True
        else:
            print(f"✗ Failed to get leaderboard: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ Error getting leaderboard: {e}")
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("Dining Waste Tracker API - Test Suite")
    print("=" * 60)
    
    # Test 1: Health check
    if not test_health_check():
        print("\n❌ Cannot proceed - API is not responding")
        print("Please start the server first: python dining_waste_tracker_gemini.py")
        return
    
    # Create test images
    before_path, after_path = create_test_images()
    
    # Test 2: Scan endpoint
    success, scan_id = test_scan(before_path, after_path)
    if not success:
        print("\n⚠️ Scan test failed - some features may not work correctly")
    
    # Test 3: Student stats
    test_student_stats('test_student_123')
    
    # Test 4: Daily report
    test_daily_report('test_school')
    
    # Test 5: Leaderboard
    test_leaderboard('test_school')
    
    print("\n" + "=" * 60)
    print("Test Suite Complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Review any failed tests above")
    print("2. Check server logs for errors")
    print("3. Visit http://localhost:8000/docs for interactive API docs")
    print("4. Try uploading real plate images!")
    print("\nNote: For best results with Gemini API:")
    print("  - Use clear, well-lit photos")
    print("  - Take photos from directly above the plate")
    print("  - Keep the same angle/distance for before/after")


if __name__ == "__main__":
    main()
