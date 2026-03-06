const canvas = document.getElementById("Dither");
const ctx = canvas.getContext("2d");

let w = canvas.width = window.innerWidth;
let h = canvas.height = window.innerHeight;

let mouse = { x: 0, y: 0, radius: 120 };

// Settings
let pixelSize = 10;        // pixel size
let detail = 0.003;        // noise detail
let speed = 0.0004;        // evolution speed
let colors = [0, 50, 110, 160, 210]; // 5 grayscale options

const thresholdCurve = 1.2;
const mouseStrength = 1.15;
const blobStrength = 0.4;
const blobScale = 2.5;
const pixelJitter = 0;

// Simplex/Perlin noise generator
class NoiseGenerator {
  constructor() { 
    this.grad3 = [
      [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
      [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
      [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
    ];
    this.p = [];
    for (let i=0; i<256; i++) this.p[i]=Math.floor(Math.random()*256);
    this.perm = [];
    for(let i=0; i<512; i++) this.perm[i]=this.p[i & 255];
  }
  dot(g, x, y) { return g[0]*x + g[1]*y; }
  noise(xin, yin) {
    let n0, n1, n2;
    const F2 = 0.5*(Math.sqrt(3)-1);
    const s = (xin+yin)*F2;
    const i = Math.floor(xin+s);
    const j = Math.floor(yin+s);
    const G2 = (3 - Math.sqrt(3))/6;
    const t = (i+j)*G2;
    const X0 = i-t, Y0 = j-t;
    const x0 = xin-X0, y0 = yin-Y0;
    let i1, j1;
    if(x0>y0){i1=1;j1=0;} else {i1=0;j1=1;}
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2*G2, y2 = y0 - 1 + 2*G2;
    const ii = i & 255, jj = j & 255;
    const gi0 = this.perm[ii+this.perm[jj]] % 12;
    const gi1 = this.perm[ii+i1+this.perm[jj+j1]] % 12;
    const gi2 = this.perm[ii+1+this.perm[jj+1]] % 12;
    let t0 = 0.5 - x0*x0 - y0*y0;
    n0 = t0<0 ? 0 : (t0*=t0)*t0*this.dot(this.grad3[gi0],x0,y0);
    let t1 = 0.5 - x1*x1 - y1*y1;
    n1 = t1<0 ? 0 : (t1*=t1)*t1*this.dot(this.grad3[gi1],x1,y1);
    let t2 = 0.5 - x2*x2 - y2*y2;
    n2 = t2<0 ? 0 : (t2*=t2)*t2*this.dot(this.grad3[gi2],x2,y2);
    return 70*(n0+n1+n2);
  }
}

const noiseGen = new NoiseGenerator();

// Animation
function draw(time){
  ctx.clearRect(0,0,w,h);

  for(let y=0;y<h;y+=pixelSize){
    for(let x=0;x<w;x+=pixelSize){
      const nx = x * detail * blobScale;
      const ny = y * detail * blobScale;

      // layered noise for blobs
      const n1 = noiseGen.noise(nx + time*speed, ny + time*speed);
      const n2 = noiseGen.noise(nx*2 + time*speed*1.5, ny*2 + time*speed*1.5)*0.5;
      const n3 = noiseGen.noise(nx*4 + time*speed*2, ny*4 + time*speed*2)*0.25;
      let value = (n1+n2+n3+1) * blobStrength; // [0..1]

      // mouse influence: darken around cursor
      const dx = mouse.x - x;
      const dy = mouse.y - y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if(dist<mouse.radius){
        const pct = dist/mouse.radius;
        value *= Math.pow(pct, thresholdCurve); // fade to black near cursor
      }

      // map to grayscale colors
      const colIndex = Math.min(colors.length-1, Math.floor(value*colors.length));
      const col = colors[colIndex];
      ctx.fillStyle = `rgb(${col},${col},${col})`;

      const jitter = 1 + (Math.random()-0.5)*pixelJitter;
      ctx.fillRect(x, y, pixelSize*jitter, pixelSize*jitter);
    }
  }

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);

// Resize
window.addEventListener("resize",()=>{
  w=canvas.width=window.innerWidth;
  h=canvas.height=window.innerHeight;
});

// Mouse
window.addEventListener("mousemove", e=>{
  mouse.x=e.clientX;
  mouse.y=e.clientY;
});