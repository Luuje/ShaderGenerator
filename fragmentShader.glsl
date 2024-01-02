#ifdef GL_ES
precision mediump float;
#endif


// Inspired by http://glslsandbox.com/e#8143.0
#define PI 3.14159
#define color_filter mat3(0.3, 0.3, 0.1, 0.0, 0.0, 0.0, 0.7, 0.4, 0.3)

precision highp float;

uniform float seed;
uniform vec2 resolution;
uniform float time;

const int maxComplexity = 13; // Complexity of curls/computation
const float fixedOffset = 0.7; // Drives complexity in the amount of curls/cuves
const float fluidSpeed = 0.9; // Drives speed
const float baseColor = 0.0; // Base color
const float BLUR = 0.87; // Blur effect
const float brightness = 1.0; // Brightness

float random(float x) {
    return fract(sin(x) * seed);
}

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float grain(in vec2 st, float noiseTime) {
    vec2 i = floor(st);
    vec2 f = fract(st);

      // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

      // Smooth Interpolation

      // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f * f * (3.0 - 2.0 * f);
      // u = smoothstep(0.,1.,f);

      // Mix 4 coorners percentages
    //return 0.0 + ((mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y) / 10.0) * 10.0;
    return pow(random(st) + mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y, 0.5); //pow 0.5 to make grain more gray
}

float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    return mix(random(i), random(i + 1.0), smoothstep(0.0, 1.0, f));
}

vec3 blend(vec3 base, vec3 blend, float blendFactor) {
    vec3 blendedColor;
    if(base[0] + base[1] + base[2] < 1.5) {
        blendedColor = (2.0 * base * blend + base * base * (1.0 - 2.0 * blend));
    } else {
        blendedColor = (sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend));
    }
    blendedColor += 0.1 * blend;
    return mix(base, blendedColor, blendFactor);
}

void main() {
    vec2 p = (2.0 * gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);
    float t = time * fluidSpeed;
    float noiseSTime = 1.0;//noiseS(t);
    float noiseSTime1 = 1.0;//noiseS(t + 1.0);

    for(int i = 1; i <= maxComplexity; i++) {
        p += BLUR / float(i) * sin(float(i) * p.yx + t + PI * vec2(noiseSTime, noiseSTime1)) + fixedOffset;
    }

    float r = pow(0.5 * (1.0 + baseColor + sin(p.x + p.y)), 1.5) * brightness;
    float g = pow(0.5 * (1.0 + baseColor + cos(p.x + p.y)), 1.5) * brightness;
    float b = pow(0.5 * (1.0 + baseColor + sin(p.x * p.y)), 1.5) * brightness;
 
    vec3 color = vec3(r, g, b) * color_filter;

    vec3 blendColor = blend(color, vec3(grain(gl_FragCoord.xy, noiseSTime)), 0.3);

    gl_FragColor = vec4(blendColor, 1.0);
}
