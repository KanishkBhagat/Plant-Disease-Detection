const API_URL = "https://plant-disease-detection-47170806887.us-central1.run.app/predict";

let selectedFile = null;
const imgElement = document.getElementById("preview-image");
const canvas = document.getElementById('overlay-canvas')
const ctx = canvas.getContext('2d');
const btn = document.getElementById("analyze-btn");
const resultsText = document.getElementById("results-text");


function loadImage(event) {
    selectedFile = event.target.files[0]
    if (!selectedFile) return;

    imgElement.src = URL.createObjectURL(selectedFile);
    imgElement.style.display = "block";

    canvas.width = 0;
    canvas.height = 0;


    resultsText.innerHTML = ""

    btn.disabled = false;
}

async function analyzeImage() {
    if (!selectedFile) return;

    btn.disabled = true;
    btn.innerText = "Analyzing in Cloud..."
    resultsText.innerHTML = "Starting Model... (This may take upto 10s if asleep)";

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
        const response = await fetch(API_URL,{ 
            method : 'POST',
            body : formData
        })

    if (!response.ok) throw new Error("API Request Failed");

    const data = await response.json();

    if (data.predictions.length === 0){
        resultsText.innerHTML = "✅ No diseases detected!"
    } else {
        resultsText.innerHTML = `⚠️ Found ${data.predictions.length} issue(s).`;
        drawBoundingBoxes(data.predictions);
    }
}
    catch (error) {
        console.error(error);
        resultsText.innerHTML = "❌ Error analyzing image. Check console.";
    }
    finally {
        btn.disabled = false;
        btn.innerHTML = "Analyze Plant";
    }
    }

    function drawBoundingBoxes(predictions) {
        canvas.width = imgElement.width
        canvas.height = imgElement.height

        const scalex = imgElement.width / imgElement.naturalWidth;
        const scaley = imgElement.height / imgElement.naturalHeight;

        predictions.forEach(pred => {
            const [xmin, ymin, xmax, ymax] = pred.bbox_xyxy;

            const x = xmin * scalex;
            const y = ymin * scaley;
            const width = (xmax - xmin) * scalex;
            const height = (ymax - ymin) * scaley;

            ctx.strokeStyle = "#FF3B30";
            ctx.lineWidth = 4;
            ctx.strokeRect(x, y, width, height);

const text = `${pred.class_name} (${(pred.confidence * 100).toFixed(1)}%)`;            ctx.font = "16px Arial"
            ctx.textWidth = ctx.measureText(text).width;

            let recty = y - 25
            let texty = y - 7

            if (y < 25){
                recty = y 
                texty = y + 18
            }

            ctx.fillStyle = "#FF3B30";
            ctx.fillRect(x, recty - 25, ctx.measureText(text).width + 10, 25);

            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(text, x + 5, texty);
        })
    }