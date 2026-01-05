# Quick Start Guide

## Get Up and Running in 5 Minutes

### Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### Step 2: Set Up the Project

```bash
# Create a virtual environment
python -m venv venv

# Activate it
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set your API key
export GEMINI_API_KEY="your_api_key_here"  # On Windows: set GEMINI_API_KEY=your_api_key_here
```

### Step 3: Start the Server

```bash
python dining_waste_tracker_gemini.py
```

You should see:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 4: Test the API

Open a new terminal and run:

```bash
python test_api.py
```

This will:
- Check if the server is running
- Create test images
- Make a sample scan request
- Show you the results

### Step 5: Try It With Real Images

1. Take a photo of your plate before eating
2. Eat your meal
3. Take a photo of your plate after eating
4. Upload both images:

```bash
curl -X POST "http://localhost:8000/api/scan" \
  -F "before_image=@my_before_photo.jpg" \
  -F "after_image=@my_after_photo.jpg" \
  -F "student_id=my_student_id"
```

Or visit `http://localhost:8000/docs` for the interactive API interface!

## Common Issues

### "GEMINI_API_KEY not set"
- Make sure you exported the environment variable
- On Windows, use `set` instead of `export`
- Or create a `.env` file with the key

### "Connection refused"
- Make sure the server is running
- Check if port 8000 is available
- Try a different port: `uvicorn dining_waste_tracker_gemini:app --port 8080`

### "Invalid API key"
- Double-check your API key
- Make sure there are no spaces or quotes
- Regenerate the key in Google AI Studio if needed

### Images not analyzing correctly
- Ensure images are JPG or PNG
- Keep file sizes under 10MB
- Use well-lit, clear photos
- Take photos from directly above the plate

## What's Next?

Check out the full [README.md](README.md) for:
- Complete API documentation
- Integration examples
- Deployment guide
- Customization options

Happy tracking! 🌍♻️
