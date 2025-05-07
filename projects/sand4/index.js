function setup() {
  createCanvas(300, 300);
  background(255);
  noFill();
  stroke(0);
  
  let spacing = 15; // Reduzierter Abstand zwischen den Linien
  let noiseScale = 0.05; // Skalierung für die Perlin-Noise-Verzerrung

  for (let y = 0; y < height; y += spacing) {
    let isDrawing = false; // Zustand, ob gezeichnet wird
    for (let x = 0; x <= width; x += 5) { // Kleinere Schritte für feinere Linien
      let offset = noise(x * noiseScale, y * noiseScale) * 20; // zufällige Höhenverzerrung
      if (random(1) > 0.1) { // 90% Wahrscheinlichkeit, weiterzuzeichnen
        if (!isDrawing) {
          beginShape();
          isDrawing = true;
        }
        curveVertex(x, y + offset); // Geschwungene Linien
      } else if (isDrawing) {
        endShape();
        isDrawing = false;
      }
    }
    if (isDrawing) endShape(); // Beende die Linie, falls sie noch offen ist
  }

  // Zwischenverbindungen hinzufügen
  for (let y = spacing / 2; y < height; y += spacing) {
    let isDrawing = false; // Zustand, ob gezeichnet wird
    for (let x = 0; x <= width; x += 5) {
      let offset = noise(x * noiseScale, y * noiseScale) * 20;
      if (random(1) > 0.1) { // 90% Wahrscheinlichkeit, weiterzuzeichnen
        if (!isDrawing) {
          beginShape();
          isDrawing = true;
        }
        curveVertex(x, y + offset); // Verbindungen zwischen den Hauptlinien
      } else if (isDrawing) {
        endShape();
        isDrawing = false;
      }
    }
    if (isDrawing) endShape(); // Beende die Linie, falls sie noch offen ist
  }
}


