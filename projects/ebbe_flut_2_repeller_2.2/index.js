let teilchen = [];
let grundBild;
let linien = [];
let abstosser = [];

function setup() {
  createCanvas(300, 300);
  grundBild = createGraphics(width, height);
  grundBild.background("white");
  grundBild.noFill();
  grundBild.stroke("black"); // Ändern Sie hier den Wert für die Linienfarbe. z.B. grundBild.stroke("blue") oder grundBild.stroke(0, 0, 255) für Blau.

  let abstand = 15;
  let rauschSkala = 0.05;
  let überstand = 50;

  // Hintergrundlinien generieren
  for (let y = 0; y < height; y += abstand) {
    zeichneMusterLinie(y, rauschSkala, überstand);
  }

  for (let y = abstand / 2; y < height; y += abstand) {
    zeichneMusterLinie(y, rauschSkala, überstand);
  }

  // Abstosser am unteren Rand
  for (let x = 0; x <= width; x += 40) {
    abstosser.push(new Abstosser(x, height - 5));
  }
}

function zeichneMusterLinie(y, rauschSkala, überstand) {
  let linienpunkte = [];
  let zeichnet = false;

  for (let x = -überstand; x <= width + überstand; x += 5) {
    let versatz = noise(x * rauschSkala, y * rauschSkala) * 20;
    if (random(1) > 0.1) {
      if (!zeichnet) {
        grundBild.beginShape();
        linienpunkte = [];
        zeichnet = true;
      }
      grundBild.curveVertex(x, y + versatz);
      linienpunkte.push(createVector(x, y + versatz));
    } else if (zeichnet) {
      grundBild.endShape();
      if (linienpunkte.length > 1) {
        speichereLinie(linienpunkte);
      }
      zeichnet = false;
    }
  }

  if (zeichnet) {
    grundBild.endShape();
    if (linienpunkte.length > 1) {
      speichereLinie(linienpunkte);
    }
  }
}

function draw() {
  image(grundBild, 0, 0);

  for (let t of teilchen) {
    // Auftrieb verstärken, aber weniger stark für langsamere Bewegung
    t.wendeKraftAn(createVector(0, -0.1));  // Schwächerer Auftrieb für langsamere Bewegung
    
    // Leichte seitliche Zufallskraft
    let seitlicheKraft = createVector(random(-0.05, 0.05), 0); 
    t.wendeKraftAn(seitlicheKraft);

    // Abstosser-Kräfte
    for (let a of abstosser) {
      t.wendeKraftAn(a.stoßeAb(t));
    }
  }

  for (let i = teilchen.length - 1; i >= 0; i--) {
    let t = teilchen[i];
    t.aktualisiere();
    t.prüfeKollision();
    t.zeige();

    if (t.pos.y < 0 || t.pos.y > height || t.pos.x < 0 || t.pos.x > width) {
      teilchen.splice(i, 1);
    }
  }

  // Neue Teilchen - Beispiel für viele Teilchen
  for (let x = 0; x < width; x += 5) {   // Engere Abstände (5 statt 10)
    if (random(1) < 0.1) {               // Höhere Wahrscheinlichkeit (10% statt 5%)
      teilchen.push(new Teilchen(x, height - 1));
    }
  }

  // Abstosser anzeigen (optional)
  // for (let a of abstosser) a.zeige();
}

function speichereLinie(punkte) {
  for (let i = 1; i < punkte.length; i++) {
    linien.push({
      x1: punkte[i - 1].x,
      y1: punkte[i - 1].y,
      x2: punkte[i].x,
      y2: punkte[i].y
    });
  }
}

class Teilchen {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-0.3, 0.3), -1.0); // Mehr Aufwärtsgeschwindigkeit am Start
    this.acc = createVector(0, 0);
    this.radius = 1.5;
    this.maxGeschwindigkeit = 3.0; // Von 2.5 auf 3.0 erhöht für schnelleres Durchfließen
    this.abprallZähler = 0;
    this.steckenZähler = 0;
    this.letztePos = createVector(x, y);
    this.lebensdauer = random(300, 600); // Lebensdauer hinzufügen, falls Teilchen trotzdem steckenbleiben
  }

  wendeKraftAn(kraft) {
    this.acc.add(kraft);
  }

  aktualisiere() {
    this.lebensdauer--;
    this.vel.add(this.acc);
    this.vel.limit(this.maxGeschwindigkeit);
    
    // Position für Steckenbleib-Prüfung speichern
    this.letztePos.set(this.pos.x, this.pos.y);
    
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    // Prüfen ob Teilchen steckengeblieben ist - empfindlicher reagieren
    let bewegungsDist = dist(this.pos.x, this.pos.y, this.letztePos.x, this.letztePos.y);
    if (bewegungsDist < 0.3) { // Erhöht von 0.2 auf 0.3 für frühere Erkennung
      this.steckenZähler++;
    } else {
      this.steckenZähler = 0;
    }
    
    // Teilchen schneller befreien
    if (this.steckenZähler > 10) { // Reduziert von 15 auf 10
      // Stärkere Befreiungsbewegung
      this.vel = p5.Vector.random2D().mult(this.maxGeschwindigkeit * 1.2);
      this.vel.y = -abs(this.vel.y) * 1.5; // Stärker nach oben
      this.steckenZähler = 0;
    }
    
    // Teilchen entfernen, wenn Lebensdauer abgelaufen
    return this.lebensdauer > 0;
  }

  prüfeKollision() {
    let kollidiert = false;
    for (let linie of linien) {
      if (this.linienKollision(linie)) {
        kollidiert = true;
        
        // Tangentialvektor der Linie berechnen
        let linienVektor = createVector(linie.x2 - linie.x1, linie.y2 - linie.y1).normalize();
        
        // Normalen-Vektor (senkrecht zur Linie)
        let normalenVektor = createVector(-linienVektor.y, linienVektor.x);
        
        // Reflexion mit mehr Betonung auf die Bewegung entlang der Linie
        let reflexion = this.reflexion(this.vel, normalenVektor);
        
        // Zurücksetzen, um Eindringen zu vermeiden
        this.pos.sub(this.vel.copy().mult(1.1));
        
        // Neue Geschwindigkeit setzen
        this.vel = reflexion.mult(0.9);
        
        // Die Geschwindigkeit in Richtung der Linie erhöhen
        // Dies hilft den Teilchen, entlang der Linien zu fließen
        let tangentialGeschw = p5.Vector.dot(this.vel, linienVektor);
        let tangentialBoost = linienVektor.copy().mult(abs(tangentialGeschw) * 0.5); // Von 0.3 auf 0.5 erhöht
        this.vel.add(tangentialBoost);
        
        // Nach oben tendieren - stärker
        if (this.vel.y > 0 && random() < 0.8) { // Höhere Wahrscheinlichkeit (0.7 -> 0.8)
          this.vel.y *= -0.9; // Stärkere Umkehr (-0.7 -> -0.9)
        }
        
        this.abprallZähler++;
        
        // Wenn ein Teilchen zu oft abprallt, bekommt es einen stärkeren Auftriebs-Impuls
        if (this.abprallZähler > 2) { // Reduziert von 3 auf 2
          this.vel.add(createVector(0, -1.5)); // Verstärkt von -1.2 auf -1.5
          this.abprallZähler = 0;
        }
        
        break;
      }
    }
    
    // Häufiger nach oben ausrichten
    if (!kollidiert && random() < 0.05) { // Erhöht von 0.02 auf 0.05
      this.vel.y = mix(this.vel.y, -this.maxGeschwindigkeit, 0.4); // Stärker ausrichten (0.3 -> 0.4)
    }
  }

  // Reflexionsvektor berechnen
  reflexion(einfallsvektor, normalenvektor) {
    let dot = einfallsvektor.x * normalenvektor.x + einfallsvektor.y * normalenvektor.y;
    return createVector(
      einfallsvektor.x - 2 * dot * normalenvektor.x,
      einfallsvektor.y - 2 * dot * normalenvektor.y
    );
  }

  linienKollision(linie) {
    let x1 = linie.x1, y1 = linie.y1, x2 = linie.x2, y2 = linie.y2;
    let länge = dist(x1, y1, x2, y2);
    if (länge === 0) return false;

    let t = ((this.pos.x - x1) * (x2 - x1) + (this.pos.y - y1) * (y2 - y1)) / (länge * länge);
    t = constrain(t, 0, 1);

    let nächsterX = x1 + t * (x2 - x1);
    let nächsterY = y1 + t * (y2 - y1);
    let d = dist(this.pos.x, this.pos.y, nächsterX, nächsterY);
    return d < this.radius + 1;
  }

  zeige() {
    stroke(0, 100, 255);
    strokeWeight(2);
    point(this.pos.x, this.pos.y);
  }
}

class Abstosser {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.stärke = 300;
  }

  stoßeAb(teilchen) {
    let richtung = p5.Vector.sub(teilchen.pos, this.position);
    let d = richtung.mag();
    d = constrain(d, 10, 100);
    richtung.normalize();
    let kraft = richtung.mult(this.stärke / (d * d));
    return kraft;
  }

  zeige() {
    noStroke();
    fill(255, 0, 0, 80);
    ellipse(this.position.x, this.position.y, 30);
  }
}

// Hilfsfunktion zur Interpolation von Werten
function mix(a, b, t) {
  return a * (1 - t) + b * t;
}
