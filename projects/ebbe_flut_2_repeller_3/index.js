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
    abstosser.push(new Abstosser(x, height - 10)); // Position leicht erhöht für früheren Effekt
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
    // Auftrieb verstärken
    t.wendeKraftAn(createVector(0, -0.15));  // Stärkerer Auftrieb (war -0.1 bzw. -0.12)
    
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
    let aktiv = t.aktualisiere(); // aktualisiere gibt false zurück, wenn Lebensdauer abgelaufen
    t.prüfeKollision();
    t.zeige();

    // Partikel zurücksetzen statt entfernen, wenn sie den Bildschirm verlassen oder ihre Lebensdauer abgelaufen ist
    if (!aktiv || t.pos.y < -10 || t.pos.y > height + 10 || t.pos.x < -10 || t.pos.x > width + 10) {
      // Partikel am unteren Rand mit neuer Energie neu initialisieren
      t.pos.set(random(width), height - 1);
      t.vel.set(random(-0.5, 0.5), random(-2.0, -3.0)); // Stärkere und variablere Startgeschwindigkeit nach oben
      t.acc.mult(0);
      t.abprallZähler = 0;
      t.steckenZähler = 0;
      t.lebensdauer = random(500, 800); // Angepasste Lebensdauer
    }
  }

  // Neue Teilchen - seltener und weniger, da Recycling die Hauptarbeit macht
  // Stellt sicher, dass die Partikelanzahl nicht zu stark sinkt.
  if (frameCount % 10 === 0) { // Seltener neue Teilchen erzeugen
    if (random(1) < 0.1 && teilchen.length < 280) { // Geringere Wahrscheinlichkeit, Obergrenze leicht angepasst
      teilchen.push(new Teilchen(random(width), height - 1));
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
    this.vel = createVector(random(-0.5, 0.5), random(-2.0, -3.0)); // Stärkere und variablere Aufwärtsgeschwindigkeit am Start
    this.acc = createVector(0, 0);
    this.radius = 1.5;
    this.maxGeschwindigkeit = 3.5; // Erhöht für schnelleres Durchfließen (war 3.0)
    this.abprallZähler = 0;
    this.steckenZähler = 0;
    this.letztePos = createVector(x, y);
    this.lebensdauer = random(500, 800); // Angepasste Lebensdauer (war 300-600 / 400-700)
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
    
    // Prüfen ob Teilchen steckengeblieben ist
    let bewegungsDist = dist(this.pos.x, this.pos.y, this.letztePos.x, this.letztePos.y);
    if (bewegungsDist < 0.25) { // Schwellenwert für Steckenbleiben (war 0.3)
      this.steckenZähler++;
    } else {
      this.steckenZähler = 0;
    }
    
    // Teilchen befreien, wenn es zu lange steckt
    if (this.steckenZähler > 12) { // Schwellenwert (war 10)
      // Stärkere, gezieltere Befreiungsbewegung, primär nach oben
      this.vel.set(random(-this.maxGeschwindigkeit * 0.4, this.maxGeschwindigkeit * 0.4), -this.maxGeschwindigkeit * 1.3);
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
        
        let reflexion = this.reflexion(this.vel, normalenVektor);
        
        // Zurücksetzen, um Eindringen zu vermeiden - etwas stärker
        this.pos.sub(this.vel.copy().mult(1.2)); // War 1.1
        
        // Neue Geschwindigkeit setzen mit leichter Dämpfung
        this.vel = reflexion.mult(0.85); // War 0.9
        
        // Die Geschwindigkeit in Richtung der Linie erhöhen
        let tangentialGeschw = p5.Vector.dot(this.vel, linienVektor);
        let tangentialBoost = linienVektor.copy().mult(abs(tangentialGeschw) * 0.65); // Stärkerer Boost (war 0.5)
        this.vel.add(tangentialBoost);
        
        // Nach oben tendieren - stärker und wahrscheinlicher
        if (this.vel.y > 0 && random() < 0.85) { // Höhere Wahrscheinlichkeit (war 0.8)
          this.vel.y *= -0.95; // Stärkere Umkehr (war -0.9)
        }
        
        this.abprallZähler++;
        
        // Wenn ein Teilchen zu oft abprallt, bekommt es einen stärkeren Auftriebs-Impuls
        if (this.abprallZähler > 2) { // Schwelle beibehalten (war 2)
          this.vel.add(createVector(0, -2.2)); // Stärkerer Impuls (war -1.5 / -2.0)
          this.abprallZähler = 0;
        }
        
        break;
      }
    }
    
    // Häufiger und stärker nach oben ausrichten, wenn keine Kollision
    if (!kollidiert && random() < 0.06) { // Etwas häufiger (war 0.05)
      this.vel.y = mix(this.vel.y, -this.maxGeschwindigkeit, 0.45); // Stärker ausrichten (war 0.4)
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
    stroke(0, 100, 255, 200); // Alpha für leichten Glaseffekt oder bessere Sichtbarkeit
    strokeWeight(2.5); // Etwas dickere Partikel
    point(this.pos.x, this.pos.y);
  }
}

class Abstosser {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.stärke = 350; // Stärker (war 300)
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
