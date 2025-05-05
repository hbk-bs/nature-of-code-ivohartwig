let particles = [];
let baseImage; // To store the static background image
let lines = []; // To store line segments for collision detection

function setup() {
  createCanvas(300, 300);
  // Create offscreen graphics buffer for the static background
  baseImage = createGraphics(width, height);
  baseImage.background(155);
  baseImage.noFill();
  baseImage.stroke(0);
  
  let spacing = 15;
  let noiseScale = 0.05;
  let overflow = 50;

  // Draw the pattern and store line segments
  for (let y = 0; y < height; y += spacing) {
    let linePoints = [];
    let isDrawing = false;
    
    for (let x = -overflow; x <= width + overflow; x += 5) {
      let offset = noise(x * noiseScale, y * noiseScale) * 20;
      if (random(1) > 0.1) {
        if (!isDrawing) {
          baseImage.beginShape();
          linePoints = [];
          isDrawing = true;
        }
        baseImage.curveVertex(x, y + offset);
        linePoints.push(createVector(x, y + offset));
      } else if (isDrawing) {
        baseImage.endShape();
        if (linePoints.length > 1) {
          storeLine(linePoints);
        }
        isDrawing = false;
      }
    }
    
    if (isDrawing) {
      baseImage.endShape();
      if (linePoints.length > 1) {
        storeLine(linePoints);
      }
    }
  }

  // Zwischenverbindungen hinzufügen
  for (let y = spacing / 2; y < height; y += spacing) {
    let linePoints = [];
    let isDrawing = false;
    
    for (let x = -overflow; x <= width + overflow; x += 5) {
      let offset = noise(x * noiseScale, y * noiseScale) * 20;
      if (random(1) > 0.1) {
        if (!isDrawing) {
          baseImage.beginShape();
          linePoints = [];
          isDrawing = true;
        }
        baseImage.curveVertex(x, y + offset);
        linePoints.push(createVector(x, y + offset));
      } else if (isDrawing) {
        baseImage.endShape();
        if (linePoints.length > 1) {
          storeLine(linePoints);
        }
        isDrawing = false;
      }
    }
    
    if (isDrawing) {
      baseImage.endShape();
      if (linePoints.length > 1) {
        storeLine(linePoints);
      }
    }
  }
  
}

// Helper function to convert curves into line segments
function storeLine(points) {
  for (let i = 1; i < points.length; i++) {
    lines.push({
      x1: points[i-1].x, 
      y1: points[i-1].y, 
      x2: points[i].x, 
      y2: points[i].y
    });
  }
}

function draw() {
  // Draw the static background first
  image(baseImage, 0, 0);
  
  // Update and display particles
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.update();
    p.checkCollision();
    p.display();
    
    // Remove particles that go off screen
    if (p.y < 0 || p.y > height || p.x < 0 || p.x > width) {
      particles.splice(i, 1);
    }
  }
  
  // Add new particles across the width - more consistent flow
  for (let x = 0; x < width; x += 10) {
    if (random(1) < 0.03) {
      particles.push(new Particle(x, height));
    }
  }
}

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = random(0.3, 0.8); // Slow movement for fluid-like behavior
    this.velocity = createVector(0, -this.speed); // Start moving upward
    this.radius = 1;
  }
  
  update() {
    // Apply velocity
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
  
  checkCollision() {
    for (let line of lines) {
      if (this.lineCollision(line)) {
        // Schritt 1: Partikel leicht nach hinten verschieben (raus aus der Wand)
        let moveBack = this.velocity.copy().mult(-1);
        this.x += moveBack.x;
        this.y += moveBack.y;
  
        // Schritt 2: Neue Richtung: leicht zur Seite, aber weiter nach oben
        let sideStep = random([-1, 1]) * 0.5;
        this.velocity = createVector(sideStep, -1).normalize().mult(this.speed);
  
        break; // Nur eine Reaktion pro Frame
      }
    }
  }
  
  
  
  
  lineCollision(line) {
    // Check if particle is close to line segment
    let x1 = line.x1;
    let y1 = line.y1;
    let x2 = line.x2;
    let y2 = line.y2;
    
    // Calculate distance from point to line segment
    let lineLength = dist(x1, y1, x2, y2);
    if (lineLength === 0) return false;
    
    // Calculate projection
    let t = ((this.x - x1) * (x2 - x1) + (this.y - y1) * (y2 - y1)) / (lineLength * lineLength);
    t = constrain(t, 0, 1);
    
    let closestX = x1 + t * (x2 - x1);
    let closestY = y1 + t * (y2 - y1);
    
    let distance = dist(this.x, this.y, closestX, closestY);
    
    // If distance is less than particle radius, collision occurred
    return distance < this.radius + 1;
  }
  
  display() {
    // Draw as a single point
    stroke(0, 100, 255);
    strokeWeight(2);
    point(this.x, this.y);
    strokeWeight(1);
  }
}


