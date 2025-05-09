function setup() {
  // --- GRUNDEINSTELLUNGEN ---
  createCanvas(300, 300); // Erstellt eine Zeichenfläche von 300x300 Pixeln
  drawPattern(); // Ruft die Funktion zum Zeichnen des Musters auf
}

function drawPattern() {
  noiseSeed(millis()); // Ändert den Seed für die Noise-Funktion bei jedem Aufruf
  background(255);       // Setzt die Hintergrundfarbe auf Weiß
  noFill();              // Deaktiviert das Füllen von Formen (Linien werden nicht gefüllt)
  stroke(0);             // Setzt die Linienfarbe auf Schwarz

  // --- STEUERPARAMETER FÜR LINIEN ---
  let spacing = 15;      // Abstand zwischen den Hauptlinienbündeln
  let noiseScale = 0.05; // Skalierungsfaktor für die Perlin-Noise-Verzerrung (beeinflusst die "Weichheit" der Kurven)

  // --- HAUPTLINIEN ZEICHNEN ---
  // Diese Schleife iteriert von oben nach unten über die Zeichenfläche in 'spacing'-Schritten
  for (let y = 0; y < height; y += spacing) {
    let isDrawing = false; // Zustand, ob aktuell eine Linie gezeichnet wird
    // Diese innere Schleife iteriert von links nach rechts über die Zeichenfläche in kleinen Schritten
    for (let x = 0; x <= width; x += 5) { // Kleinere Schritte für feinere Liniensegmente
      // Berechnet einen Versatz basierend auf Perlin Noise, um eine organische Wellenform zu erzeugen
      let offset = noise(x * noiseScale, y * noiseScale) * 20; // Die '20' skaliert die Stärke des Versatzes
      if (random(1) > 0.1) { // 90% Wahrscheinlichkeit, das aktuelle Liniensegment weiterzuzeichnen
        if (!isDrawing) {    // Wenn noch keine Linie gezeichnet wird...
          beginShape();      // ...starte eine neue Form (Linie)
          isDrawing = true;  // Merke, dass jetzt gezeichnet wird
        }
        curveVertex(x, y + offset); // Füge einen Punkt zur geschwungenen Linie hinzu
      } else if (isDrawing) { // Wenn mit 10% Wahrscheinlichkeit unterbrochen wird UND gerade gezeichnet wird...
        endShape();          // ...beende die aktuelle Linie
        isDrawing = false;   // Merke, dass nicht mehr gezeichnet wird
      }
    }
    if (isDrawing) endShape(); // Stelle sicher, dass eine am Rand begonnene Linie auch beendet wird
  }

  // --- ZWISCHENVERBINDUNGEN ZEICHNEN ---
  // Diese Schleife iteriert versetzt zu den Hauptlinien von oben nach unten
  // Ziel ist es, Verbindungen oder Überlappungen zwischen den Hauptlinienbündeln zu erzeugen
  for (let y = spacing / 2; y < height; y += spacing) { // Startet bei der Hälfte des 'spacing' für den Versatz
    let isDrawing = false; // Zustand, ob aktuell eine Verbindungslinie gezeichnet wird
    // Diese innere Schleife iteriert wieder von links nach rechts
    for (let x = 0; x <= width; x += 5) {
      // Erneute Berechnung eines Versatzes für die Verbindungslinien
      let offset = noise(x * noiseScale, y * noiseScale) * 20;
      if (random(1) > 0.1) { // 90% Wahrscheinlichkeit, weiterzuzeichnen
        if (!isDrawing) {
          beginShape();
          isDrawing = true;
        }
        curveVertex(x, y + offset); // Füge Punkt zur Verbindungslinie hinzu
      } else if (isDrawing) {
        endShape();
        isDrawing = false;
      }
    }
    if (isDrawing) endShape(); // Beende die Linie, falls sie noch offen ist
  }
}

function mousePressed() {
  drawPattern(); // Zeichnet das Muster neu, wenn die Maus geklickt wird
}
