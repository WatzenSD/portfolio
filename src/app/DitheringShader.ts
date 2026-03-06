/**
 * Dithering shader GLSL code
 */

const ditheringShader = /*glsl*/`
uniform float ditheringEnabled;
uniform vec2 resolution;
uniform float gridSize;
uniform float luminanceMethod;
uniform float invertColor;
uniform float pixelSizeRatio;
uniform float grayscaleOnly;
uniform vec3 ditherColor;

// Ordered dithering 4x4 Bayer matrix
bool getValue(float brightness, vec2 pos) {
  if(brightness > 16.0/17.0) return false;
  if(brightness < 1.0/17.0) return true;

  vec2 pixel = floor(mod(pos.xy / gridSize, 4.0));
  int x = int(pixel.x);
  int y = int(pixel.y);

  if(x==0){ if(y==0)return brightness<16.0/17.0; if(y==1)return brightness<5.0/17.0; if(y==2)return brightness<13.0/17.0; return brightness<1.0/17.0; } 
  else if(x==1){ if(y==0)return brightness<8.0/17.0; if(y==1)return brightness<12.0/17.0; if(y==2)return brightness<4.0/17.0; return brightness<9.0/17.0; } 
  else if(x==2){ if(y==0)return brightness<14.0/17.0; if(y==1)return brightness<2.0/17.0; if(y==2)return brightness<15.0/17.0; return brightness<3.0/17.0; } 
  else { if(y==0)return brightness<6.0/17.0; if(y==1)return brightness<10.0/17.0; if(y==2)return brightness<7.0/17.0; return brightness<11.0/17.0; }
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 fragCoord = uv * resolution;

  // Pixelate scene first
  float pixelSize = gridSize * pixelSizeRatio;
  vec2 pixelatedUV = floor(fragCoord / pixelSize) * pixelSize / resolution;

  vec3 baseColor = texture2D(inputBuffer, pixelatedUV).rgb;

  // Compute luminance
  float luminance = dot(baseColor, vec3(1.0));
  if(grayscaleOnly > 0.0) baseColor = vec3(luminance);

  // Apply dithering to pixelated color
  bool dithered = getValue(luminance, fragCoord);
  if(dithered) baseColor = ditherColor;

  // Invert color if needed
  if(invertColor > 0.0) baseColor = 1.0 - baseColor;

  outputColor = vec4(baseColor, inputColor.a);
}`;


export default ditheringShader;