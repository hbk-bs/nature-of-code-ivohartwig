let particles = [];
let baseImage; // To store the static background image

function setup() {
  createCanvas(300, 300);
  // Create offscreen graphics buffer for the static background
  baseImage = createGraphics(width, height);
  baseImage.background(155);
  baseImage.noFill();
  baseImage.stroke(0);
  
  // Draw all the lines on the baseImage instead of directly on the canvas
  let spacing = 15;
  let noiseScale = 0.05;
  let overflow = 50;

  // Draw the pattern on baseImage instead of the main canvas
  for (let y = 0; y < height; y += spacing) {
    let isDrawing = false;
    for (let x = -overflow; x <= width + overflow; x += 5) {
      let offset = noise(x * noiseScale, y * noiseScale) * 20;
      if (random(1) > 0.1) {
        if (!isDrawing) {
          baseImage.beginShape();
          isDrawing = true;
        }
        baseImage.curveVertex(x, y + offset);
      } else if (isDrawing) {
        baseImage.endShape();
        isDrawing = false;
      }
    }
    if (isDrawing) baseImage.endShape();
  }

  // Zwischenverbindungen hinzufügen
  for (let y = spacing / 2; y < height; y += spacing) {
    let isDrawing = false;
    for (let x = -overflow; x <= width + overflow; x += 5) {
      let offset = noise(x * noiseScale, y * noiseScale) * 20;
      if (random(1) > 0.1) {
        if (!isDrawing) {
          baseImage.beginShape();
          isDrawing = true;
        }
        baseImage.curveVertex(x, y + offset);
      } else if (isDrawing) {
        baseImage.endShape();
        isDrawing = false;
      }
    }
    if (isDrawing) baseImage.endShape();
  }
}

function draw() {
  // Draw the static background first
  image(baseImage, 0, 0);
  
  // Update and display particles
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.update();
    p.display();
    
    // Remove particles that go off screen
    if (p.y < 0) {
      particles.splice(i, 1);
    }
  }
  
  // Add new particles across the width
  for (let x = 0; x < width; x += 5) {
    if (random(1) < 0.05) {  // 5% chance to create a particle at each position
      particles.push(new Particle(x, height));
    }
  }
}

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = random(1, 3); // Vertical speed
  }
  
  update() {
    // Simple upward movement
    this.y -= this.speed;
  }
  
  display() {
    // Draw as a single point
    stroke(0, 100, 255);
    strokeWeight(2);
    point(this.x, this.y);
    strokeWeight(1);
  }
}


