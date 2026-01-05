# College Dining Waste Tracker - Gemini Integration

A FastAPI-based system that uses Google's Gemini Vision API to analyze food waste on dining plates. Students can upload before/after photos of their meals to track waste, earn points, and help dining halls optimize portions and menu planning.

## 🌟 Features

### For Students:
- **Multi-Food Detection**: Gemini AI identifies each food item on the plate separately
- **Personalized Waste Tracking**: Track your waste patterns over time
- **Gamification**: Earn points and badges for reducing waste
- **Environmental Impact**: See the real-world impact (CO2, water, cost) of your choices
- **Actionable Tips**: Get personalized suggestions to reduce waste

### For Dining Halls:
- **Food-Specific Analytics**: See which menu items generate the most waste
- **Daily/Weekly Reports**: Track trends and identify problem areas
- **Smart Recommendations**: AI-powered suggestions for portion sizes and menu changes
- **Cost Savings**: Quantify financial impact of waste reduction
- **Student Leaderboards**: Encourage campus-wide participation

## 🚀 Key Improvements Over Original

1. **Gemini Vision API Integration**: Much more accurate food detection and waste estimation
2. **Multi-Food Analysis**: Separate tracking for each food item on the plate
3. **Detailed JSON Output**: Structured data including portion descriptions, categories, and weights
4. **Graceful Fallback**: Falls back to CV-based detection if Gemini API is unavailable
5. **Enhanced Gamification**: Badges, leaderboards, and personal goals
6. **Student-Specific Stats**: Individual tracking with foods to avoid
7. **Category Analysis**: Track waste by food type (entree, side, vegetable, etc.)

## 📋 Prerequisites

- Python 3.8+
- Google Gemini API Key (get it from [Google AI Studio](https://makersuite.google.com/app/apikey))
- Basic understanding of FastAPI and REST APIs

## 🛠️ Installation

1. **Clone or download the files**

2. **Create a virtual environment**:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

4. **Set up environment variables**:

Create a `.env` file in the project root:
```
GEMINI_API_KEY=your_api_key_here
```

Or export directly:
```bash
export GEMINI_API_KEY="your_api_key_here"
```

## 🏃 Running the Server

```bash
python dining_waste_tracker_gemini.py
```

The API will be available at `http://localhost:8000`

Access the interactive API docs at: `http://localhost:8000/docs`

## 📡 API Endpoints

### 1. Process Scan (Main Endpoint)

**POST** `/api/scan`

Upload before/after images to analyze waste.

**Form Data:**
- `before_image`: File (required) - Image of plate before eating
- `after_image`: File (required) - Image of plate after eating
- `student_id`: String (optional) - Student identifier
- `school_id`: String (default: "school_001") - School identifier

**Response:**
```json
{
  "success": true,
  "scan_id": 1,
  "food_items": [
    {
      "name": "Grilled Chicken Breast",
      "initial_portion": "6 oz serving",
      "remaining_portion": "1 oz remaining",
      "waste_percentage": 16.7,
      "estimated_weight_oz": 1.0,
      "category": "entree"
    },
    {
      "name": "Steamed Broccoli",
      "initial_portion": "4 oz serving",
      "remaining_portion": "2 oz remaining",
      "waste_percentage": 50.0,
      "estimated_weight_oz": 2.0,
      "category": "vegetable"
    }
  ],
  "waste_level": "Moderate",
  "avg_waste_percentage": 33.4,
  "points": 5,
  "impact": {
    "weight_lbs": 0.188,
    "weight_oz": 3.0,
    "cost_usd": 1.03,
    "co2_kg": 0.38,
    "water_gallons": 4.7,
    "meals_equivalent": 0.25
  },
  "overall_assessment": "Mixed results - protein consumed well but vegetables left behind.",
  "tips": [
    "Try taking smaller portions of vegetables initially",
    "You can always get more if still hungry"
  ]
}
```

**Example using cURL:**
```bash
curl -X POST "http://localhost:8000/api/scan" \
  -F "before_image=@before.jpg" \
  -F "after_image=@after.jpg" \
  -F "student_id=student123"
```

**Example using Python:**
```python
import requests

files = {
    'before_image': open('before.jpg', 'rb'),
    'after_image': open('after.jpg', 'rb')
}
data = {
    'student_id': 'student123'
}
response = requests.post('http://localhost:8000/api/scan', files=files, data=data)
print(response.json())
```

### 2. Daily Report

**GET** `/api/daily-report?school_id=school_001&date=2024-01-15`

Get aggregated daily statistics by food item.

**Response:**
```json
{
  "date": "2024-01-15",
  "school_id": "school_001",
  "total_scans": 145,
  "avg_waste_pct": 28.5,
  "totals": {
    "weight_lbs": 23.4,
    "cost_usd": 128.70,
    "co2_kg": 46.8,
    "water_gallons": 585.0
  },
  "by_food": [
    {
      "food": "Brussels Sprouts",
      "appearances": 42,
      "avg_waste_pct": 65.3,
      "total_wasted_oz": 109.2,
      "category": "vegetable",
      "recommendation": "⚠️ High waste (65%). Consider removing or replacing."
    }
  ]
}
```

### 3. Student Statistics

**GET** `/api/student-stats?student_id=student123&days=7`

Get individual student progress and patterns.

**Response:**
```json
{
  "student_id": "student123",
  "period_days": 7,
  "total_scans": 12,
  "total_points": 95,
  "avg_waste_pct": 22.3,
  "total_impact": {
    "weight_lbs": 1.45,
    "cost_saved": 7.98,
    "co2_prevented": 2.9
  },
  "foods_to_avoid": [
    {
      "food": "Spinach Salad",
      "times_wasted": 3,
      "avg_waste_pct": 55.0
    }
  ],
  "badge": {
    "level": "Gold",
    "emoji": "🥇",
    "description": "Eco Warrior"
  },
  "next_goal": {
    "points_needed": 5,
    "next_badge": "Waste Warrior",
    "at": "100 points"
  }
}
```

### 4. Weekly Report

**GET** `/api/weekly-report?school_id=school_001&weeks_back=0`

Get week-over-week trends.

### 5. Insights

**GET** `/api/insights?school_id=school_001&days=30`

Get AI-generated recommendations for dining staff.

### 6. Leaderboard

**GET** `/api/leaderboard?school_id=school_001&period=week`

Get student rankings. Period options: `week`, `month`, `all`

**Response:**
```json
{
  "period": "week",
  "leaderboard": [
    {
      "rank": 1,
      "student_id": "student456",
      "total_points": 125,
      "scans": 10,
      "avg_waste_pct": 12.5,
      "badge": {
        "level": "Gold",
        "emoji": "🥇",
        "description": "Eco Warrior"
      }
    }
  ]
}
```

## 🎮 Gamification System

### Point System:
- **15 points**: None (0-10% waste)
- **10 points**: Minimal (10-25% waste)
- **5 points**: Moderate (25-40% waste)
- **2 points**: Significant (40-60% waste)
- **1 point**: Most Left (60-100% waste)

### Badges:
- 🏆 **Platinum** (0-10% avg waste): Zero-Waste Champion
- 🥇 **Gold** (10-20% avg waste): Eco Warrior
- 🥈 **Silver** (20-35% avg waste): Planet Protector
- 🥉 **Bronze** (35-50% avg waste): Getting There
- 🌱 **Beginner** (50%+ avg waste): Room to Grow

### Milestones:
- 50 points: Waste Warrior
- 100 points: Eco Champion
- 250 points: Planet Saver
- 500 points: Sustainability Hero
- 1000 points: Zero-Waste Legend

## 🧪 Testing the API

### Using the Interactive Docs:

1. Navigate to `http://localhost:8000/docs`
2. Click on any endpoint to expand it
3. Click "Try it out"
4. Upload test images and fill in parameters
5. Click "Execute"

### Sample Test Images:

For best results, your test images should:
- Be well-lit and clear
- Show the plate from above (bird's eye view)
- Have the plate clearly visible
- Be taken from the same angle/distance for before/after

## 🔧 Configuration

### Customizing Waste Levels:

Edit the `WASTE_LEVELS` dictionary in the code:

```python
WASTE_LEVELS = {
    0.0: "None",
    0.1: "Minimal",
    0.25: "Moderate",
    0.40: "Significant",
    1.0: "Most Left"
}
```

### Customizing Impact Calculations:

Modify the `calculate_impact()` function:

```python
# Average cost per lb of prepared food
cost_per_lb = 5.50  # Adjust based on your dining hall costs

# CO2 emissions: ~2 kg per lb of food waste
co2_kg = total_weight_lbs * 2  # Adjust multiplier as needed
```

## 📊 How Gemini Analysis Works

The Gemini Vision API receives both before/after images and is prompted to:

1. **Identify each distinct food item** on the plate
2. **Estimate initial portion size** (in descriptive terms and ounces)
3. **Estimate remaining portion** after eating
4. **Calculate waste percentage** for each item (0-100%)
5. **Categorize foods** (entree, side, vegetable, dessert, beverage)
6. **Provide overall assessment** and actionable suggestions

The response is structured JSON that the API processes and enhances with:
- Environmental impact calculations
- Cost analysis
- Point assignments
- Category-based recommendations

## 🔄 Fallback System

If Gemini API is unavailable or fails, the system automatically falls back to:
- OpenCV-based color segmentation
- Contour analysis for area comparison
- Simple percentage-based waste estimation

This ensures the system continues to work even without Gemini.

## 🗄️ Data Storage

Currently uses in-memory storage (`scans_db` list). For production:

1. **Replace with a database** (PostgreSQL, MongoDB, etc.)
2. **Add proper authentication** (JWT tokens, OAuth)
3. **Implement data persistence** across restarts
4. **Add backup/export capabilities**

Example migration to SQLAlchemy:
```python
from sqlalchemy import create_engine, Column, Integer, String, Float, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class Scan(Base):
    __tablename__ = 'scans'
    id = Column(Integer, primary_key=True)
    timestamp = Column(String)
    school_id = Column(String)
    student_id = Column(String)
    food_items = Column(JSON)
    # ... other fields
```

## 🚀 Deployment Considerations

### For Production:

1. **Use environment variables** for all configuration
2. **Add rate limiting** to prevent API abuse
3. **Implement caching** for reports (Redis)
4. **Add proper logging** (use Python logging module)
5. **Set up monitoring** (Sentry, DataDog, etc.)
6. **Use a production ASGI server** (Gunicorn with Uvicorn workers)
7. **Add HTTPS** with proper SSL certificates
8. **Implement proper CORS** (restrict origins in production)

Example Gunicorn command:
```bash
gunicorn dining_waste_tracker_gemini:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

## 🔐 Security Notes

- **Never commit API keys** to version control
- **Use environment variables** for sensitive data
- **Implement authentication** for production
- **Validate and sanitize** all user inputs
- **Limit file upload sizes** (add to FastAPI config)
- **Implement rate limiting** per user/IP

## 🤝 Integration Examples

### React Frontend:

```javascript
const uploadScan = async (beforeFile, afterFile, studentId) => {
  const formData = new FormData();
  formData.append('before_image', beforeFile);
  formData.append('after_image', afterFile);
  formData.append('student_id', studentId);

  const response = await fetch('http://localhost:8000/api/scan', {
    method: 'POST',
    body: formData
  });

  return await response.json();
};
```

### Mobile App (React Native):

```javascript
import * as ImagePicker from 'expo-image-picker';

const scanPlate = async () => {
  const before = await ImagePicker.launchCameraAsync();
  const after = await ImagePicker.launchCameraAsync();
  
  const formData = new FormData();
  formData.append('before_image', {
    uri: before.assets[0].uri,
    type: 'image/jpeg',
    name: 'before.jpg'
  });
  formData.append('after_image', {
    uri: after.assets[0].uri,
    type: 'image/jpeg',
    name: 'after.jpg'
  });

  const response = await fetch('http://your-api.com/api/scan', {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return await response.json();
};
```

## 📈 Future Enhancements

- [ ] Real-time waste tracking dashboard
- [ ] Push notifications for milestones
- [ ] Social features (share achievements)
- [ ] Integration with dining hall menu systems
- [ ] Predictive analytics for menu planning
- [ ] Multi-language support
- [ ] Accessibility features (screen reader support)
- [ ] Campus-wide competitions
- [ ] Restaurant/retail food service versions

## 🐛 Troubleshooting

### Gemini API Not Working:

1. Check your API key is correct
2. Verify you have API quota remaining
3. Check [Google AI Studio status](https://status.ai.google.dev/)
4. Review error messages in console

### Image Upload Fails:

1. Check file size (should be < 10MB)
2. Verify image format (JPG, PNG supported)
3. Ensure images are valid (not corrupted)

### Inaccurate Results:

1. Use better lighting in photos
2. Take photos from directly above the plate
3. Ensure plate is in focus
4. Use consistent distance/angle for before/after

## 📝 License

This project is open source. Customize freely for your institution's needs.

## 🙏 Acknowledgments

- Google Gemini API for vision capabilities
- FastAPI for the excellent framework
- OpenCV for fallback image processing

## 📧 Support

For issues or questions, please open an issue on the repository or contact your development team.

---

**Happy waste tracking! 🌍♻️**
