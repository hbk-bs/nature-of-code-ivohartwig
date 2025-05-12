let teilchen = [];
let grundBild;
let linien = [];
let abstosser = [];

function setup() {
  createCanvas(300, 300); // Kleinere Canvas zum Testen, bei Bedarf anpassen
  grundBild = createGraphics(width, height);
  grundBild.background("white");
  grundBild.noFill();
  grundBild.stroke("white"); // Linienfarbe

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
    let versatz = noise(x * rauschSkala, y * rauschSkala) * 20; // Amplitude des Rauschens
    if (random(1) > 0.1) { // Wahrscheinlichkeit für Lücken in den Linien
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
    // Auftrieb nochmals verstärken <--- *** Änderung hier ***
    t.wendeKraftAn(createVector(0, -0.25));  // Deutlich stärkerer Auftrieb

    // Leichte seitliche Zufallskraft (kann optional reduziert oder entfernt werden)
    let seitlicheKraft = createVector(random(-0.05, 0.05), 0);
    t.wendeKraftAn(seitlicheKraft);

    // Abstosser-Kräfte
    for (let a of abstosser) {
      t.wendeKraftAn(a.stoßeAb(t));
    }
  }

  // Teilchen aktualisieren, prüfen und anzeigen
  for (let i = teilchen.length - 1; i >= 0; i--) {
    let t = teilchen[i];
    let lebtNoch = t.aktualisiere();
    if (!lebtNoch) {
        teilchen.splice(i, 1);
        continue;
    }

    t.prüfeKollision();
    t.zeige();

    // Entfernen, wenn außerhalb des Canvas (wichtig für oben!)
    if (t.pos.y < 0 || t.pos.y > height || t.pos.x < 0 || t.pos.x > width) {
      teilchen.splice(i, 1);
    }
  }

  // Neue Teilchen generieren (ggf. Rate anpassen)
  for (let x = 0; x < width; x += 2) { // Erzeugt relativ viele Teilchen
    if (random(1) < 0.3) { // 10% Chance pro Position
      teilchen.push(new Teilchen(x, height - 1));
    }
  }
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
    // Evtl. höhere Startgeschwindigkeit nach oben
    this.vel = createVector(random(-0.3, 0.3), -1.5);
    this.acc = createVector(0, 0);
    this.radius = 1.5;
    // Maximalgeschwindigkeit weiter erhöhen <--- *** Änderung hier ***
    this.maxGeschwindigkeit = 5.0;
    this.abprallZähler = 0;
    this.steckenZähler = 0;
    this.letztePos = createVector(x, y);
    // Lebensdauer weiter erhöhen <--- *** Änderung hier ***
    this.lebensdauer = random(800, 1200); // Längere Zeit zum Erreichen des Ziels
  }

  wendeKraftAn(kraft) {
    this.acc.add(kraft);
  }

  aktualisiere() {
    this.lebensdauer--;
    this.vel.add(this.acc);
    this.vel.limit(this.maxGeschwindigkeit);

    this.letztePos.set(this.pos.x, this.pos.y);
    this.pos.add(this.vel);
    this.acc.mult(0);

    // Steckenbleib-Erkennung (kann ggf. aggressiver werden)
    let bewegungsDist = dist(this.pos.x, this.pos.y, this.letztePos.x, this.letztePos.y);
    if (bewegungsDist < 0.3 && this.vel.mag() < 1.0) { // Nur zählen, wenn wirklich langsam
      this.steckenZähler++;
    } else {
      this.steckenZähler = 0;
    }

    // Schneller befreien
    if (this.steckenZähler > 8) { // Früher eingreifen (war 10)
      this.vel = p5.Vector.random2D().mult(this.maxGeschwindigkeit * 1.5); // Stärkerer Boost
      this.vel.y = -abs(this.vel.y) * 2.0; // Sehr stark nach oben
      this.steckenZähler = 0;
    }

    return this.lebensdauer > 0;
  }

  prüfeKollision() {
    let kollidiert = false;
    for (let linie of linien) {
      if (this.linienKollision(linie)) {
        kollidiert = true;

        let linienVektor = createVector(linie.x2 - linie.x1, linie.y2 - linie.y1);
        // Prüfe, ob Linie eine nennenswerte Länge hat, um Division durch Null zu vermeiden
        if (linienVektor.magSq() < 0.01) continue; // Überspringe sehr kurze Liniensegmente
        linienVektor.normalize();

        let normalenVektor = createVector(-linienVektor.y, linienVektor.x);
        let reflexion = this.reflexion(this.vel, normalenVektor);

        // Zurücksetzen, um Eindringen zu vermeiden (etwas stärker)
        this.pos.sub(this.vel.copy().mult(1.2));

        // Keine Dämpfung bei Reflexion <--- *** Änderung hier ***
        this.vel = reflexion.mult(1.0);

        // Intelligenter Tangential-Boost <--- *** Änderung hier ***
        // Nur anwenden, wenn Linie nach oben zeigt (y2 ist kleiner als y1)
        if (linie.y2 < linie.y1) {
            let tangentialGeschw = p5.Vector.dot(this.vel, linienVektor);
            // Stärkerer Boost entlang der Linie
            let tangentialBoost = linienVektor.copy().mult(abs(tangentialGeschw) * 0.7); // War 0.5
            this.vel.add(tangentialBoost);
        }

        // Nach Kollision: Sicherstellen, dass die Y-Geschwindigkeit negativ ist <--- *** Änderung hier ***
        // Multiplizieren mit < 1, um nicht *zu* extrem zu werden, aber Richtung erzwingen
        this.vel.y = -abs(this.vel.y) * 0.8;

        // Stärkerer Impuls bei wiederholten Kollisionen
        this.abprallZähler++;
        if (this.abprallZähler > 1) { // Früher (war 2)
          this.vel.add(createVector(0, -2.0)); // Stärker (war -1.5)
          this.abprallZähler = 0;
        }

        // Geschwindigkeit nach all den Änderungen begrenzen
        this.vel.limit(this.maxGeschwindigkeit);

        break; // Nur eine Kollision pro Frame
      }
    }

    // Aggressivere Ausrichtung nach oben, wenn keine Kollision
    if (!kollidiert && random() < 0.1) { // Häufiger (war 0.05)
      // Stärker zur maximalen Aufwärtsgeschwindigkeit interpolieren
      this.vel.y = mix(this.vel.y, -this.maxGeschwindigkeit, 0.6); // War 0.4
    }
  }

  reflexion(einfallsvektor, normalenvektor) {
    let dot = einfallsvektor.x * normalenvektor.x + einfallsvektor.y * normalenvektor.y;
    return createVector(
      einfallsvektor.x - 2 * dot * normalenvektor.x,
      einfallsvektor.y - 2 * dot * normalenvektor.y
    );
  }

  linienKollision(linie) {
    let x1 = linie.x1, y1 = linie.y1, x2 = linie.x2, y2 = linie.y2;
    let längeSq = (x2 - x1)*(x2 - x1) + (y2 - y1)*(y2 - y1); // Quadrat der Länge ist effizienter
    if (längeSq < 0.01) return false; // Zu kurz

    let t = ((this.pos.x - x1) * (x2 - x1) + (this.pos.y - y1) * (y2 - y1)) / längeSq;
    t = constrain(t, 0, 1);

    let nächsterX = x1 + t * (x2 - x1);
    let nächsterY = y1 + t * (y2 - y1);
    // Distanzquadrat prüfen ist effizienter als dist()
    let abstandSq = (this.pos.x - nächsterX)*(this.pos.x - nächsterX) + (this.pos.y - nächsterY)*(this.pos.y - nächsterY);
    let kollisionsRadiusSq = (this.radius + 0.5) * (this.radius + 0.5); // Kleinerer Puffer

    return abstandSq < kollisionsRadiusSq;
  }

  zeige() {
    stroke(0, 100, 255, 200); // Etwas Transparenz hinzufügen
    strokeWeight(2);
    point(this.pos.x, this.pos.y);
  }
}

class Abstosser {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.stärke = 350; // Leicht erhöht
  }

  stoßeAb(teilchen) {
    let richtung = p5.Vector.sub(teilchen.pos, this.position);
    let dSq = richtung.magSq(); // Distanzquadrat ist effizienter
    dSq = constrain(dSq, 100, 10000); // Entspricht d=10 bis d=100
    let stärkeFaktor = this.stärke / dSq; // Kraft = Stärke / d^2
    richtung.normalize();
    let kraft = richtung.mult(stärkeFaktor);
    return kraft;
  }

  zeige() {
    noStroke();
    fill(255, 0, 0, 80);
    ellipse(this.position.x, this.position.y, 30);
  }
}

function mix(a, b, t) {
  return a * (1 - t) + b * t;
}

function mousePressed() {
  // Clear existing particles
  teilchen = [];
  
  // Reset background and lines
  linien = [];
  grundBild = createGraphics(width, height);
  grundBild.background("white");
  grundBild.noFill();
  grundBild.stroke("white"); // Linienfarbe
  
  let abstand = 15;
  let rauschSkala = 0.05;
  let überstand = 50;
  
  // Regenerate background lines
  for (let y = 0; y < height; y += abstand) {
    zeichneMusterLinie(y, rauschSkala, überstand);
  }
  for (let y = abstand / 2; y < height; y += abstand) {
    zeichneMusterLinie(y, rauschSkala, überstand);
  }
  
  // Clear and regenerate repellers
  abstosser = [];
  for (let x = 0; x <= width; x += 40) {
    abstosser.push(new Abstosser(x, height - 5));
  }
  
  // Optional: Add some feedback that the simulation was reset
  console.log("Simulation reset");
}