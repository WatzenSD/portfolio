const canvas = document.getElementById("Dither");
const gl = canvas.getContext("webgl");
canvas.width = innerWidth;
canvas.height = innerHeight;

// mouse
let mouse = { x: 0, y: 0 };

// settings (default same as before)
let thresholdCurve = 1.2; // >1 softer, <1 harsher
let mouseSize = 120;
let mouseStrength = 1.15;
let blobAmount = 0.4; // blob intensity
let blobScale = 2.5;
let pixelSize = 10; 
let detail = 0.003; 
let speed = 0.0004;
const colors = [0, 50, 110, 160, 210];

// --- shader helpers ---
function createShader(type, src){
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)){
    console.error(gl.getShaderInfoLog(s));
  }
  return s;
}

// vertex shader
const vs = createShader(gl.VERTEX_SHADER, `
  attribute vec2 pos;
  void main() { gl_Position = vec4(pos,0.0,1.0); }
`);

// fragment shader
const fs = createShader(gl.FRAGMENT_SHADER, `
precision highp float;
uniform vec2 u_res;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_thresholdCurve;
uniform float u_mouseSize;
uniform float u_mouseStrength;
uniform float u_blobAmount;
uniform float u_blobScale;

// simple 2D simplex noise
vec3 mod289(vec3 x){return x - floor(x* (1.0/289.0))*289.0;}
vec2 mod289(vec2 x){return x - floor(x* (1.0/289.0))*289.0;}
vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
float snoise(vec2 v){
    const vec4 C = vec4(0.211324865,0.366025404,-0.577350269,0.024390244);
    vec2 i = floor(v + dot(v,C.yy));
    vec2 x0 = v - i + dot(i,C.xx);
    vec2 i1 = (x0.x>x0.y)? vec2(1.,0.): vec2(0.,1.);
    vec2 x1 = x0 - i1 + C.xx;
    vec2 x2 = x0 + C.zz;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.,i1.y,1.)) + i.x + vec3(0.,i1.x,1.));
    vec3 m = max(0.5 - vec3(dot(x0,x0),dot(x1,x1),dot(x2,x2)),0.0);
    m = m*m; m = m*m;
    vec3 g = vec3(
        dot(x0, vec2(cos(p.x), sin(p.x))),
        dot(x1, vec2(cos(p.y), sin(p.y))),
        dot(x2, vec2(cos(p.z), sin(p.z)))
    );
    return dot(m,g)*1.7;
}

float blobNoise(vec2 uv){
    float t = u_time * 0.15;
    float n = snoise(uv*2.0 + t)*0.7 +
              snoise(uv*4.0 + t*1.4)*0.4 +
              snoise(uv*8.0 + t*2.1)*0.2;
    return (n+1.0)*0.5;
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_res.xy;
    uv.x *= u_res.x/u_res.y;

    // blob noise + scaling
    float n = blobNoise(uv * u_blobScale);
    n = pow(n, u_thresholdCurve);
    n *= u_blobAmount;

    // mouse darkening
    float dist = distance(gl_FragCoord.xy, u_mouse);
    float fade = smoothstep(0.0, u_mouseSize, dist);
    n *= fade*u_mouseStrength;

    // 5-tone grayscale mapping
    float idx = floor(n*5.0)/5.0;
    gl_FragColor = vec4(vec3(idx),1.0);
}
`);

// program
const prog = gl.createProgram();
gl.attachShader(prog, vs);
gl.attachShader(prog, fs);
gl.linkProgram(prog);
gl.useProgram(prog);

// full screen quad
const buf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1,-1,  1,-1, -1,1,
     1,-1,  1,1, -1,1
]), gl.STATIC_DRAW);

const posLoc = gl.getAttribLocation(prog,"pos");
gl.enableVertexAttribArray(posLoc);
gl.vertexAttribPointer(posLoc,2,gl.FLOAT,false,0,0);

// uniforms
let u_res = gl.getUniformLocation(prog,"u_res");
let u_time = gl.getUniformLocation(prog,"u_time");
let u_mouse = gl.getUniformLocation(prog,"u_mouse");
let u_thresholdCurve = gl.getUniformLocation(prog,"u_thresholdCurve");
let u_mouseSize = gl.getUniformLocation(prog,"u_mouseSize");
let u_mouseStrength = gl.getUniformLocation(prog,"u_mouseStrength");
let u_blobAmount = gl.getUniformLocation(prog,"u_blobAmount");
let u_blobScale = gl.getUniformLocation(prog,"u_blobScale");

gl.uniform2f(u_res,canvas.width,canvas.height);
gl.uniform1f(u_thresholdCurve, thresholdCurve);
gl.uniform1f(u_mouseSize, mouseSize);
gl.uniform1f(u_mouseStrength, mouseStrength);
gl.uniform1f(u_blobAmount, blobAmount);
gl.uniform1f(u_blobScale, blobScale);

// animation
function loop(t){
    gl.uniform1f(u_time, t*0.001);
    gl.uniform2f(u_mouse, mouse.x, canvas.height - mouse.y);
    gl.drawArrays(gl.TRIANGLES,0,6);
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// mouse
window.addEventListener("mousemove",e=>{
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// resize
window.addEventListener("resize",()=>{
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.uniform2f(u_res,canvas.width,canvas.height);
});
gl.viewport(0,0,canvas.width,canvas.height);