// ─── AI Demo: TensorFlow COCO-SSD room detection ─────

const tfScript = document.createElement('script');
tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.2.0/dist/tf.min.js';
document.head.appendChild(tfScript);

const cocoScript = document.createElement('script');
cocoScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.2/dist/coco-ssd.min.js';
document.head.appendChild(cocoScript);

let model = null;
let modelLoading = false;

// ─── Scoring logic ────────────────────────────────
const MESS_INDICATORS = [
  'bottle', 'cup', 'bowl', 'book', 'laptop', 'keyboard', 'mouse',
  'backpack', 'handbag', 'suitcase', 'chair', 'couch', 'bed',
  'cell phone', 'remote', 'scissors', 'toothbrush', 'vase',
  'clock', 'teddy bear', 'sports ball', 'baseball glove',
  'skateboard', 'umbrella', 'wine glass', 'fork', 'knife', 'spoon',
  'dining table', 'potted plant', 'tv', 'microwave', 'oven',
  'toaster', 'sink', 'refrigerator', 'toilet', 'hair drier'
];

function calculateCleanlinessScore(detections) {
  if (!detections.length) return 95;
  const messItems = detections.filter(d =>
    MESS_INDICATORS.some(m => d.class.toLowerCase().includes(m))
  );
  const messRatio = messItems.length / Math.max(detections.length, 1);
  const countPenalty = Math.min(detections.length * 4, 60);
  const score = Math.max(5, Math.round(100 - countPenalty - (messRatio * 20)));
  return score;
}

function getScoreColor(score) {
  if (score >= 75) return '#6ee7b7';
  if (score >= 45) return '#fbbf24';
  return '#f87171';
}

function generateTaskSuggestions(detections) {
  const suggestions = [];
  const classes = detections.map(d => d.class.toLowerCase());

  if (classes.some(c => ['bottle', 'cup', 'bowl', 'wine glass', 'fork', 'knife', 'spoon'].includes(c))) {
    suggestions.push('Bring dishes and bottles to the kitchen');
  }
  if (classes.some(c => ['book', 'laptop', 'keyboard', 'mouse'].includes(c))) {
    suggestions.push('Organize books and electronics on the desk');
  }
  if (classes.some(c => ['backpack', 'handbag', 'suitcase'].includes(c))) {
    suggestions.push('Put bags in the closet or designated area');
  }
  if (classes.some(c => ['teddy bear', 'sports ball', 'baseball glove', 'skateboard'].includes(c))) {
    suggestions.push('Put toys and sports gear back in storage');
  }
  if (classes.some(c => ['cell phone', 'remote'].includes(c))) {
    suggestions.push('Place electronics and remotes on the charger or shelf');
  }
  if (classes.some(c => ['couch', 'chair', 'bed'].includes(c))) {
    suggestions.push('Straighten cushions and make the bed / tidy seating');
  }
  if (classes.some(c => ['scissors', 'toothbrush', 'hair drier'].includes(c))) {
    suggestions.push('Put personal care items back in the bathroom');
  }
  if (suggestions.length === 0) {
    suggestions.push('Room looks relatively tidy — do a final sweep for small items');
  }
  return suggestions.slice(0, 5);
}

// ─── Run detection ────────────────────────────────
async function runDetection(imageEl) {
  if (!model) {
    model = await cocoSsd.load();
  }
  return await model.detect(imageEl);
}

function drawDetections(canvas, imageEl, detections) {
  const ctx = canvas.getContext('2d');
  const rect = imageEl.getBoundingClientRect();
  const containerRect = imageEl.parentElement.getBoundingClientRect();

  const scaleX = imageEl.naturalWidth / imageEl.offsetWidth;
  const scaleY = imageEl.naturalHeight / imageEl.offsetHeight;

  canvas.width = imageEl.offsetWidth;
  canvas.height = imageEl.offsetHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  detections.forEach((det, i) => {
    const [x, y, w, h] = det.bbox;
    const drawX = x / scaleX;
    const drawY = y / scaleY;
    const drawW = w / scaleX;
    const drawH = h / scaleY;

    const color = '#6ee7b7';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(drawX, drawY, drawW, drawH);

    const label = `${det.class} ${Math.round(det.score * 100)}%`;
    ctx.fillStyle = 'rgba(110,231,183,0.85)';
    ctx.font = 'bold 11px DM Sans, sans-serif';
    const textWidth = ctx.measureText(label).width;
    ctx.fillRect(drawX, drawY - 18, textWidth + 10, 18);

    ctx.fillStyle = '#09090b';
    ctx.fillText(label, drawX + 5, drawY - 5);
  });
}

function animateScanLine(overlay, scanLine, duration, onComplete) {
  overlay.style.display = 'block';
  scanLine.style.top = '0';
  scanLine.style.transition = `top ${duration}ms linear`;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scanLine.style.top = '100%';
    });
  });

  setTimeout(() => {
    overlay.style.display = 'none';
    if (onComplete) onComplete();
  }, duration);
}

function updateResults(detections, score) {
  const resultsEl = document.getElementById('demoResults');
  const scoreBarEl = document.getElementById('resultScoreBar');
  const scoreNumEl = document.getElementById('resultScoreNum');
  const detectedItemsEl = document.getElementById('detectedItems');
  const taskSugEl = document.getElementById('taskSuggestions');

  const scoreColor = getScoreColor(score);

  scoreBarEl.style.width = `${score}%`;
  scoreBarEl.style.background = scoreColor;
  scoreNumEl.textContent = `${score}%`;
  scoreNumEl.style.color = scoreColor;

  const uniqueClasses = [...new Set(detections.map(d => d.class))];
  detectedItemsEl.innerHTML = '';

  if (uniqueClasses.length) {
    uniqueClasses.forEach(cls => {
      const chip = document.createElement('span');
      chip.className = 'item-chip';
      chip.textContent = cls;
      detectedItemsEl.appendChild(chip);
    });
  } else {
    const chip = document.createElement('span');
    chip.className = 'item-chip';
    chip.textContent = 'No objects detected';
    detectedItemsEl.appendChild(chip);
  }

  const tasks = generateTaskSuggestions(detections);
  taskSugEl.innerHTML = '';
  tasks.forEach(task => {
    const item = document.createElement('div');
    item.className = 'task-sug-item';
    item.textContent = task;
    taskSugEl.appendChild(item);
  });

  resultsEl.style.display = 'flex';
}

// ─── Image load trigger (called from script.js drag-drop too) ─
window.triggerImageLoad = function(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.getElementById('uploadedImage');
    const container = document.getElementById('imageContainer');
    const prompt = document.getElementById('uploadPrompt');
    const loading = document.getElementById('demoLoading');
    const resultsEl = document.getElementById('demoResults');

    prompt.style.display = 'none';
    loading.style.display = 'flex';
    resultsEl.style.display = 'none';

    img.onload = async () => {
      container.style.display = 'block';
      loading.style.display = 'none';

      const overlay = document.getElementById('scanOverlay');
      const scanLine = document.getElementById('demoScanLine');

      animateScanLine(overlay, scanLine, 1800, async () => {
        try {
          const detections = await runDetection(img);
          const canvas = document.getElementById('detectionCanvas');
          drawDetections(canvas, img, detections);
          const score = calculateCleanlinessScore(detections);
          updateResults(detections, score);
        } catch (err) {
          console.error('Detection failed:', err);
          updateResults([], 50);
        }
      });
    };

    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

// ─── File input handler ───────────────────────────
document.getElementById('imageUpload')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) triggerImageLoad(file);
});

// ─── Upload area click ────────────────────────────
document.getElementById('uploadArea')?.addEventListener('click', (e) => {
  if (e.target.classList.contains('link-btn')) return;
  document.getElementById('imageUpload')?.click();
});