from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from ultralytics import YOLO
from PIL import Image
import io

# 1. Initialize the FastAPI application
app = FastAPI(title="Field Plant Detection API")

# 2. Load the Model
# TIP: Replace 'best.pt' with 'best.onnx' if you exported it for Cloud Run!
# Make sure this weights file is in the same folder as main.py
try:
    model = YOLO("best.pt") 
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

@app.get("/")
def health_check():
    """Simple health check endpoint for Cloud Run."""
    return {"status": "active", "model_loaded": model is not None}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """Accepts an image upload and returns YOLO bounding boxes."""
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded.")

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    try:
        # Read the uploaded image into memory
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Run YOLO inference
        # conf=0.25 ignores predictions that the model is less than 25% sure about
        results = model.predict(image, imgsz=640, conf=0.25)

        # Parse the results into a clean JSON format
        predictions = []
        for r in results:
            boxes = r.boxes
            for box in boxes:
                predictions.append({
                    "class_name": model.names[int(box.cls[0])],
                    "class_id": int(box.cls[0]),
                    "confidence": round(float(box.conf[0]), 3),
                    "bbox_xyxy": box.xyxy[0].tolist() # [xmin, ymin, xmax, ymax]
                })

        return JSONResponse(content={"predictions": predictions})

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

# This block allows you to run the file locally for testing
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)