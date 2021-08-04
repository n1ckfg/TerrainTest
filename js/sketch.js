"use strict";

let guy;
let grid;
let guyTopSpeed = 3;
let guyMomentum = 0.6;
let guyFriction = 0.9;
let yScale = .6;
let guyJumpSpeed = 4;
let guyHeight =20;
let guyGravityStrength = 0.2;
let mapRes = 30;
let terrainBumpiness = 100;
let guyWarpEffectDistance = 30;

function setup() {
  createCanvas(800, 400);
  guy = new Guy(width / 2, height / 2);
  grid = new Grid(mapRes);
}

function draw() {
  // background(100,50,100);
  background(255)
  grid.findZOff(guy.pos.x,guy.pos.y,guy.pos.z >= 0);
  grid.draw();
  guy.move();
  guy.draw();
}

function mouseWheel() {
  return false;
}

function keyPressed() {
  return false;
}

function scaleVal(value, start1, stop1, start2, stop2, withinBounds) {
  if (start1 == stop1) {
    return start2;
  }
  if (!withinBounds) withinBounds = false;
  let initialPercentage = (value-start1) /( stop1-start1);
  let targetRange = stop2-start2;
  let targetPercentage = (targetRange * initialPercentage)+start2;
  if (withinBounds) {
    targetPercentage = max(start2,min(stop2,targetPercentage))
  }
  return targetPercentage;
}


class Guy {

  constructor(x, y) {
    this.pos = createVector(x, y, 0);
    this.speed = 0;
    this.dir = createVector(0, 0);
    this.jumpDepartureHeight = 0;
  }

  move() {
    if (this.pos.z >= 0) {
      // if on ground, get movemnet input
      let newDir = createVector(0, 0, 0);
      if (keyIsDown(32) && this.pos.z >= 0) {
        this.jumpDepartureHeight = grid.getHeight(this.pos.x, this.pos.y);
        newDir.z = -guyJumpSpeed;
      }
      if (keyIsDown(68)||keyIsDown(39)) {
        newDir.x += guyMomentum;
      }
      if (keyIsDown(65)||keyIsDown(37)) {
        newDir.x -= guyMomentum;
      }
      if (keyIsDown(87)||keyIsDown(38)) {
        newDir.y -= guyMomentum * yScale;
      }
      if (keyIsDown(83)||keyIsDown(40)) {
        newDir.y += guyMomentum * yScale;
      }
      this.dir.add(newDir);
      this.dir.x *= guyFriction;
      this.dir.y *= guyFriction;
    }

    // gravity and hitting the ground
    this.dir.z += guyGravityStrength;
    this.pos.add(this.dir);
    
    if (this.pos.z >= 0) {
      this.pos.z = min(0, this.pos.z);
      this.dir.z = 0;
    }

    this.dir.x = max(-guyTopSpeed, min(guyTopSpeed, this.dir.x));
    this.dir.y = max(
      -guyTopSpeed * yScale,
      min(guyTopSpeed * yScale, this.dir.y)
    );
  }

  draw() {
    ellipseMode(CENTER);
    noStroke();
    fill(0, 50);
    ellipse(
      this.pos.x,
      this.pos.y +
        grid.getHeight(this.pos.x, this.pos.y) +
        guyHeight,
      guyHeight * 2,
      guyHeight * yScale
    );

    rectMode(CENTER);
    fill(255, 200, 200);
    stroke(255);
    strokeWeight(2);
    let yPos;

    if (this.pos.z >= 0) {
      yPos = this.pos.y + this.pos.z + grid.getHeight(this.pos.x, this.pos.y);
    } else {
      yPos = this.pos.y + this.pos.z + min(this.jumpDepartureHeight,grid.getHeight(this.pos.x, this.pos.y));
    }
    rect(this.pos.x, yPos, guyHeight, guyHeight * 2);
  }
}


class Grid {

  constructor(res) {
    this.resolution = res;
    this.grid = [];
    for (let i = 0; i < width / res + 1; i++) {
      let row = [];
      for (let j = 0; j < height / (res * yScale) + 1; j++) {
        row.push({
          pos: createVector(
            i * res,
            j * res * yScale,
            noise(i/4, j/4) * terrainBumpiness
          ),
          zOff: 0,
          glow: function () {
            fill(255);
            circle(this.pos.x, this.pos.y + this.pos.z + this.zOff, 15);
          },
        });
      }
      this.grid.push(row);
    }
  }

  findZOff(x, y, isDepressed) {
    for (let i = 0; i < this.grid.length - 1; i++) {
      for (let j = 0; j < this.grid[i].length - 1; j++) {
        if (isDepressed) {
          this.grid[i][j].zOff = scaleVal(
            dist(
              this.grid[i][j].pos.x,
              this.grid[i][j].pos.y,
              x,
              y
            ),
            guyWarpEffectDistance,
            0,
            0,
            guyHeight,
            true
          );
        } else {
          this.grid[i][j].zOff *= 0.9;
        }
      }
    }
  }

  draw() {
    for (let i = 0; i < this.grid.length - 1; i++) {
      for (let j = 0; j < this.grid[i].length - 1; j++) {
        let dotPos = this.grid[i][j];
        let ldotPos = this.grid[i + 1][j];
        let bdotPos = this.grid[i][j + 1];
        strokeWeight(0.5);

        stroke(200,
          scaleVal(
            dotPos.pos.z - ldotPos.pos.z,
            terrainBumpiness,
            -terrainBumpiness,
            255,
            0
          ),255
        );

        line(
          dotPos.pos.x,
          dotPos.pos.y + dotPos.pos.z + dotPos.zOff,
          ldotPos.pos.x,
          ldotPos.pos.y + ldotPos.pos.z + ldotPos.zOff
        );

        stroke(200,200,
          scaleVal(
            dotPos.pos.z - bdotPos.pos.z,
            terrainBumpiness,
            -terrainBumpiness,
            255,
            0
          )
        );

        line(
          dotPos.pos.x,
          dotPos.pos.y + dotPos.pos.z + dotPos.zOff,
          bdotPos.pos.x,
          bdotPos.pos.y + bdotPos.pos.z + bdotPos.zOff
        );
      }
    }
  }

  getHeight(x, y) {
    let yRes = this.resolution * yScale;
    let left = min(this.grid.length - 1, max(0, floor(x / this.resolution)));
    let right = min(this.grid.length - 1, max(0, ceil(x / this.resolution)));
    let above = min(this.grid[0].length - 1, max(0, floor(y / yRes)));
    let below = min(this.grid[0].length - 1, max(0, ceil(y / yRes)));
    let nw = this.grid[left][above];
    // nw.glow();
    let ne = this.grid[right][above];
    // ne.glow();
    let sw = this.grid[left][below];
    // sw.glow();
    let se = this.grid[right][below];
    // se.glow();
    let x1 = scaleVal(x / this.resolution, left, right, nw.pos.z, ne.pos.z);
    let x2 = scaleVal(x / this.resolution, left, right, sw.pos.z, se.pos.z);
    // rectMode(CORNER);
    // fill(255);
    // rect(nw.pos.x, nw.pos.y, this.resolution, yRes);
    return scaleVal(y / yRes, above, below, x1, x2);
  }

}
