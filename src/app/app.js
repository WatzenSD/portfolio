import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectPass, BloomEffect } from 'postprocessing';
import { DitheringEffect } from './DitheringEffect';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

import * as dat from 'lil-gui'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';

import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { TextPlugin } from "gsap/TextPlugin";
import { CustomWiggle } from "gsap/CustomWiggle";
import { CustomEase } from "gsap/CustomEase";
import { CustomBounce } from "gsap/CustomBounce";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";


gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, SplitText, TextPlugin, CustomEase, CustomWiggle, CustomBounce);

ScrollToPlugin.config({ autoKill: true })

const fontLoader = new FontLoader();





const ColorListeners = new Set();

export function onColorChange(callback) {
  ColorListeners.add(callback);
  callback(); // call once immediately
}

// Observe CSS variable updates on :root
new MutationObserver(() => {
  ColorListeners.forEach(cb => cb());
}).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["style", "class"]
});











document.addEventListener("DOMContentLoaded", function() {
  
// ---------------------- Custom Cursor ----------------------
// Check if it's a touch device
const isTouchDevice = 'ontouchstart' in window;

// Function for Mouse Move Scale Change (Jelly Effect)
function getScale(diffX, diffY) {
  const distance = Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
  return Math.min(distance / 100, 0.25);
}

// Function For Mouse Movement Angle in Degrees (Jelly Effect)
function getAngle(diffX, diffY) {
  return (Math.atan2(diffY, diffX) * 180) / Math.PI;
}

// Variables
const elasticCursor = document.getElementById("BlobCursor");
elasticCursor.style.border = "0.1em solid rgb(45, 255, 3)";
elasticCursor.style.backgroundColor = "rgb(29, 255, 41)";
const cursorStats = { scale: 0.75 };
const pos = { x: 0, y: 0 };
const vel = { x: 0, y: 0 };
let targetPos = { x: 0, y: 0 };
let isHoveringClickable = false;

// Use gsap.quickSetter for optimized property setting
const setX = gsap.quickSetter(elasticCursor, "x", "px");
const setY = gsap.quickSetter(elasticCursor, "y", "px");
const setRotation = gsap.quickSetter(elasticCursor, "rotate", "deg");
const setScaleX = gsap.quickSetter(elasticCursor, "scaleX");
const setScaleY = gsap.quickSetter(elasticCursor, "scaleY");
const setOpacity = gsap.quickSetter(elasticCursor, "opacity");

// Update position and rotation (without affecting the scale)
function update() {
  const rotation = getAngle(vel.x, vel.y);
  const velocityScale = getScale(vel.x, vel.y);

  // Apply jelly-like effect (position and rotation), keeping scale separate
  setX(pos.x);
  setY(pos.y);
  setRotation(rotation);

  // If not hovering, apply the jelly scale effect
  if (!isHoveringClickable) {
    setScaleX(cursorStats.scale + velocityScale * 1.25);
    setScaleY(cursorStats.scale - velocityScale * 1.25);
  } else {
    setScaleX(cursorStats.scale);
    setScaleY(cursorStats.scale);
  }
}

// Animation loop
function animateCursor() {
  const speed = 0.3;

  // Update cursor's position based on targetPos
  pos.x += (targetPos.x - pos.x) * speed;
  pos.y += (targetPos.y - pos.y) * speed;
  vel.x = (targetPos.x - pos.x);
  vel.y = (targetPos.y - pos.y);

  update();
  requestAnimationFrame(animateCursor);
}

// Handle mouse move event
window.addEventListener("mousemove", (e) => {
  const { clientX, clientY } = e;
  targetPos.x = clientX;
  targetPos.y = clientY;

  // Always update position, regardless of hover state
  update();
});

// Function to handle scaling when hovering over clickable elements
function handleCursorHover(isHovering) {
  isHoveringClickable = isHovering; // Set hover state

  // Smoothly apply scaling effect on hover, but don't stop position updating
  gsap.to(cursorStats, {
    scale: isHovering ? 0.45 : 0.75,
    duration: 0.3,
    ease: "power1.out",
  });
  }

// Add event listeners for clickable elements (links and buttons)
document.querySelectorAll('a, button, [data-clickable="true"]').forEach((element) => {
  // Scale down cursor on mouse enter
  element.addEventListener('mouseenter', () => handleCursorHover(true));

  // Reset cursor size on mouse leave
  element.addEventListener('mouseleave', () => handleCursorHover(false));
});

// Function to hide the cursor
function hideCursor() {
  gsap.to(elasticCursor, {
    opacity: 0,
    duration: 0.7,
    ease: 'power2.out',
  });
}

// Function to show the cursor
function showCursor() {
  gsap.to(elasticCursor, {
    opacity: 1,
    duration: 0.7,
    ease: 'power2.out',
  });
}

// Hiding the cursor when it leaves the viewport
document.addEventListener('mouseleave', hideCursor);

// Re-show the cursor when mouse re-enters the viewport
document.addEventListener('mouseenter', showCursor);

// Detect when entering and exiting an iframe
const iframes = document.querySelectorAll('iframe');

iframes.forEach((iframe) => {
  // Add event listener to hide cursor when entering the iframe
  iframe.addEventListener('mouseenter', hideCursor);

  // Add event listener to show cursor when leaving the iframe
  iframe.addEventListener('mouseleave', showCursor);
});

// Only invoke the animation if it's not a touch device
if (elasticCursor && !isTouchDevice) {
  animateCursor();
}




















// ---------------------- Loading Screen ----------------------
const loaderScreen = document.getElementById('loading-screen');
const loaderBar = document.getElementById('loader-bar');

// Three.js scene for loading screen
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
loaderScreen.appendChild(renderer.domElement);

// Particle Sphere
const geometry = new THREE.IcosahedronGeometry(2, 4);
const material = new THREE.MeshStandardMaterial({ color: "rgb(45, 255, 3)", wireframe: true, transparent: true, opacity: 0.95 });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

const light = new THREE.PointLight(0xffffff, 1);
light.position.set(0, 0, 0);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

let targetRotation = { x: 0, y: 0 };
let currentRotation = { x: 0, y: 0 };

function animateSphere(){
  currentRotation.x += (targetRotation.x - currentRotation.x) * 0.06;
  currentRotation.y += (targetRotation.y - currentRotation.y) * 0.045;
  mesh.rotation.x = currentRotation.x + Math.sin(Date.now() * 0.001) * 0.45;
  mesh.rotation.y = currentRotation.y + Math.cos(Date.now() * 0.00135) * 0.6;
  const scale = 0.95 + Math.sin(Date.now() * 0.002) * 0.175;
  mesh.scale.set(scale, scale, scale);
}

// Orbiting particles
const orbitParticlesCount = 175;
const orbitGeometry = new THREE.BufferGeometry();
const orbitPositions = new Float32Array(orbitParticlesCount * 3);
for(let i=0;i<orbitParticlesCount;i++){
  const angle = Math.random()*Math.PI*2;
  const radius = 3 + Math.random();
  orbitPositions[i*3] = Math.cos(angle)*radius;
  orbitPositions[i*3+1] = (Math.random()-0.5)*2;
  orbitPositions[i*3+2] = Math.sin(angle)*radius;
}
orbitGeometry.setAttribute('position', new THREE.BufferAttribute(orbitPositions,3));
const orbitMaterial = new THREE.PointsMaterial({ color: "rgb(29, 255, 41)", size: 0.025, transparent: true, opacity: 0.95 });
const orbitParticles = new THREE.Points(orbitGeometry, orbitMaterial);
scene.add(orbitParticles);

function animateOrbitParticles(){
  const positions = orbitParticles.geometry.attributes.position.array;
  for(let i=0;i<positions.length;i+=3){
    const x = positions[i];
    const z = positions[i+2];
    const angle = Math.atan2(z,x) + 0.01;
    const radius = Math.sqrt(x*x + z*z);
    positions[i] = Math.cos(angle)*radius;
    positions[i+2] = Math.sin(angle)*radius;
  }
  orbitParticles.geometry.attributes.position.needsUpdate = true;
}

// Pulsing light
const pulseLight = new THREE.PointLight(0x00ffcc, 0.8, 20);
scene.add(pulseLight);
function animatePulse(){
  pulseLight.intensity = 0.6 + Math.sin(Date.now()*0.01)*0.8;
}

// Mouse interaction
window.addEventListener('mousemove', (e) => {
  const nx = (e.clientX / window.innerWidth - 0.5) * 2;
  const ny = (e.clientY / window.innerHeight - 0.5) * 2;
  targetRotation.x = ny * 1.75;
  targetRotation.y = nx * 1.75;
  pulseLight.position.set(nx * 2.5, -ny * 2.5, 3);
});

// Animate loader
function animateLoader(){
  requestAnimationFrame(animateLoader);
  animateOrbitParticles();
  animateSphere();
  animatePulse();
  renderer.render(scene, camera);
}
animateLoader();

// ---------------------- Loading Manager & Assets ----------------------
let LoadedModels;
const LoadingManager = new THREE.LoadingManager();
LoadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
  const progress = (itemsLoaded / itemsTotal) * 100;
  gsap.to(loaderBar, { width: Math.min(progress, 99) + '%', duration: 0.2, ease: "power1.out" });
};

LoadingManager.onLoad = () => {
  gsap.to(loaderScreen, {
    opacity: 0,
    duration: 1.25,
    ease: "power1.out",
    onComplete: () => {
      loaderScreen.style.display = 'none';
    }
  });
};

// Async function to load all models
async function loadAssets() {
  const gltfLoader = new GLTFLoader(LoadingManager);

  const Hallway = gltfLoader.loadAsync("/assets/models/Hallway/scene.gltf");
  const Knight = gltfLoader.loadAsync("/assets/models/Knight/scene.gltf");
  const Katana = gltfLoader.loadAsync("/assets/models/Katana/scene.gltf");
  const Chandelier = gltfLoader.loadAsync("/assets/models/Chandelier/scene.gltf");
  const Chandelier2 = gltfLoader.loadAsync("/assets/models/Chandelier/scene.gltf");

  LoadedModels = await Promise.all([Hallway, Knight, Katana, Chandelier, Chandelier2]);

  initApp(LoadedModels);
}
loadAssets().catch(err => {
  console.error("Error loading assets:", err);
});

// ---------------------- Window Resize ----------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

});



// ---------------------- Main Stuff ----------------------
function initApp(models){
  const Hallway = models[0].scene;
  const Knight = models[1].scene;
  const Katana = models[2].scene;
  const Chandelier = models[3].scene;
  const Chandelier2 = models[4].scene;

  // ---------------- Functions ----------------
  function brightenColor(rgb, saturationFactor = 1.5, lightnessFactor = 1.2) {
    // parse rgb(x, y, z)
  const match = rgb.match(/\d+/g);
  if (!match) return rgb;
  let r = parseInt(match[0], 10);
  let g = parseInt(match[1], 10);
  let b = parseInt(match[2], 10);

  // convert RGB to HSL
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch(max){
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h /= 6;
  }

  // increase saturation and lightness
  s = Math.min(s * saturationFactor, 1);
  l = Math.min(l * lightnessFactor, 1);

  // convert HSL back to RGB
  let r1, g1, b1;
  if(s === 0){
    r1 = g1 = b1 = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if(t < 0) t += 1;
      if(t > 1) t -= 1;
      if(t < 1/6) return p + (q - p) * 6 * t;
      if(t < 1/2) return q;
      if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r1 = hue2rgb(p, q, h + 1/3);
    g1 = hue2rgb(p, q, h);
    b1 = hue2rgb(p, q, h - 1/3);
  }

  r1 = Math.round(r1 * 255);
  g1 = Math.round(g1 * 255);
  b1 = Math.round(b1 * 255);

  return `rgb(${r1}, ${g1}, ${b1})`;
  }





  // ---------------- Change Cursor Color ----------------
  const elasticCursor = document.getElementById("BlobCursor");
  elasticCursor.style.border = "0.1em solid var(--primaryLight)";
  elasticCursor.style.backgroundColor = "var(--primaryDark)";



  
  // ---------------- Landing Animations ----------------
  const split = new SplitText("#LandingTitle", { type: "chars" });

  gsap.fromTo(
    split.chars,
    { yPercent: 100, opacity: 0 },
    {
      yPercent: 0,
      opacity: 1,
      stagger: 0.05,
      duration: 1.1,
      delay: 1.25,
      ease: "power3.out",
    }
  );

  gsap.to("#RevealBar", {
    yPercent: -100,
    duration: 1,
    delay: 1.4,
    ease: "power3.out",
  });

  gsap.from("#BackgroundBox", {
    scaleY: 0,
    duration: 1.45,
    ease: "power3.out",
    delay: 0.5,
  });

  gsap.from("#BackgroundBox", {
    borderRadius: 0,
    duration: 0.8,
    ease: "power2.out",
    delay: 0.7,
  });

  gsap.from("#LandingImage", {
    xPercent: -100,
    opacity: 0,
    duration: 1.5,
    ease: "power3.out",
    delay: 1.75,
  });

  gsap.from(["#LandingImageWrapper", "#LandingTitle"], {
    outlineWidth: 0,
    duration: 0.4,
    ease: "power3.out",
    delay: 2.95,
  });



  // ---------------- Topbar Landing Animations ----------------
  const tlTopbar = gsap.timeline({ defaults: { duration: 1, ease: "power3.out" } });

  tlTopbar.from([".MusicPad", "#ThemeDial"], { y: -70, opacity: 0 }, 0.6);

  tlTopbar.from(".Text", { x: 90, opacity: 0 }, 0.85);


  // ---------------- Topbar Scroll ----------------
  window.addEventListener("scroll", () => {
  const scrolled = window.scrollY > 50;

  gsap.to(".ToybarLeft", {
    top: scrolled ? 8 : 20,
    boxShadow: scrolled ? "0 12px 30px rgba(0,0,0,0.5)" : "0 8px 26px rgba(0,0,0,0.5)",
    duration: 0.275,
    ease: "power3.out"
  });

  gsap.to(".Navbar", {
    top: scrolled ? 8 : 20,
    boxShadow: scrolled ? "0 12px 30px rgba(0,0,0,0.5)" : "0 8px 26px rgba(0,0,0,0.5)",
    duration: 0.275,
    ease: "power3.out"
  });

  gsap.to(".ToybarRight", {
    top: scrolled ? 8 : 20,
    boxShadow: scrolled ? "0 12px 30px rgba(0,0,0,0.5)" : "0 8px 26px rgba(0,0,0,0.5)",
    duration: 0.275,
    ease: "power3.out"
  });
});

  


  


  // ---------------- Hover Animations ----------------
  document.querySelectorAll('[data-spread="true"]').forEach(link => {
  const chars = Array.from(link.childNodes).flatMap(n => 
    n.nodeType === 3 ? n.textContent.split("") : [n]
  );
  link.textContent = "";

  chars.forEach(c => {
    const span = document.createElement("span");
    if (typeof c === "string") {
      span.textContent = c;
      span.style.display = c === " " ? "inline" : "inline-block";
    } else {
      span.appendChild(c);
    }
    link.appendChild(span);
  });


  let originalColor, newColor, originalFilter, newFilter;

onColorChange(() => {
  const colorVar = link.dataset.color;
  originalColor = getComputedStyle(document.documentElement).getPropertyValue(colorVar);
  newColor = brightenColor(originalColor, 2, 1.15);
  originalFilter = `drop-shadow(0 0 0px ${originalColor})`;
  newFilter = `drop-shadow(0 0 7px ${newColor})`;

    gsap.set(link.querySelectorAll("span"), {
      color: originalColor,
      filter: originalFilter,
    });
});


  link.addEventListener("mouseenter", () => {
    gsap.to(link.querySelectorAll("span"), {
      y: () => 0 + Math.random() * -10,
      x: () => 0 + (Math.random() - 0.5) * 5,
      rotate: () => 0 + (Math.random() - 0.5) * 10,
      
      color: newColor,
      filter: newFilter,

      duration: 0.3,
      stagger: 0.04,
      ease: "power2.out"
    });
  });
  link.addEventListener("mouseleave", () => {
    gsap.to(link.querySelectorAll("span"), {
      y: 0,
      x: 0,
      rotate: 0,

      color: originalColor,
      filter: originalFilter,

      duration: 0.275,
      stagger: 0.05,
      ease: "power2.inOut"
    });
  });
  });

  document.querySelectorAll(".ProjectLink a").forEach(link => {
  const chars = Array.from(link.childNodes).flatMap(n => 
    n.nodeType === 3 ? n.textContent.split("") : [n]
  );
  link.textContent = "";

  chars.forEach(c => {
    const span = document.createElement("span");
    if (typeof c === "string") {
      span.textContent = c;
      span.style.display = c === " " ? "inline" : "inline-block";
    } else {
      span.appendChild(c);
    }
    link.appendChild(span);
  });


  let originalColor, newColor, originalFilter, newFilter;

onColorChange(() => {
  const colorVar = link.dataset.color;
  originalColor = getComputedStyle(document.documentElement).getPropertyValue(colorVar);
  newColor = brightenColor(originalColor, 2, 1.15);
  originalFilter = `drop-shadow(0 0 0px ${originalColor})`;
  newFilter = `drop-shadow(0 0 7px ${newColor})`;

    gsap.set(link.querySelectorAll("span"), {
      color: originalColor,
      filter: originalFilter,
    });
});


  link.addEventListener("mouseenter", () => {
    gsap.to(link.querySelectorAll("span"), {
      color: newColor,
      filter: newFilter,
      scale: 1.1,

      duration: 0.275,
      stagger: 0.04,
      ease: "power2.out"
    });
  });

  link.addEventListener("mouseleave", () => {
    gsap.to(link.querySelectorAll("span"), {
        color: originalColor,
        filter: originalFilter,
        scale: 1,

      duration: 0.275,
      stagger: 0.04,
      ease: "power2.inOut"
    });
  });

  
  });

  document.querySelectorAll('[data-title="true"]').forEach(link => {
  const chars = Array.from(link.childNodes).flatMap(n =>
    n.nodeType === 3 ? n.textContent.split("") : [n]
  );
  link.textContent = "";

  chars.forEach(c => {
    const span = document.createElement("span");
    if (typeof c === "string") {
      span.textContent = c;
      span.style.display = c === " " ? "inline" : "inline-block";
    } else {
      span.appendChild(c);
    }
    link.appendChild(span);


  let originalColor, newColor, originalFilter, newFilter;

onColorChange(() => {
  originalColor = getComputedStyle(link).getPropertyValue("color");
  newColor = brightenColor(originalColor, 2, 1.15);
  originalFilter = `drop-shadow(0 0 0px ${originalColor})`;
  newFilter = `drop-shadow(0 0 7px ${newColor})`;

    gsap.set(span, {
      color: originalColor,
      filter: originalFilter,
    });
});


  span.addEventListener("mouseenter", () => {
    gsap.to(span, {
      color: newColor,
      filter: newFilter,
      scale: 1.1,
      duration: 0.275,
      stagger: 0.04,
      ease: "power2.out"
    });
  });

  span.addEventListener("mouseleave", () => {
    gsap.to(span, {
      color: originalColor,
      filter: originalFilter,
      scale: 1,
      duration: 0.275,
      stagger: 0.04,
      ease: "power2.inOut"
    });
  });
  });

  
});

  document.querySelectorAll('.ScrollText').forEach(link => {
  const spans = link.querySelectorAll('span');

  let originalColor, newColor, originalFilter, newFilter;

onColorChange(() => {
  originalColor = getComputedStyle(link).getPropertyValue("color");
  newColor = brightenColor(originalColor, 2, 1.15);
  originalFilter = `drop-shadow(0 0 0px ${originalColor})`;
  newFilter = `drop-shadow(0 0 7px ${newColor})`;

    gsap.set(spans, {
      color: originalColor,
      filter: originalFilter,
    });
});

  link.addEventListener("mouseenter", () => {
    gsap.to(spans, {
      color: newColor,
      filter: newFilter,
      scale: 1.1,
      duration: 0.275,
      stagger: 0.04,
      ease: "power2.out"
    });
  });

  link.addEventListener("mouseleave", () => {
    gsap.to(spans, {
      color: originalColor,
      filter: originalFilter,
      scale: 1,
      duration: 0.275,
      stagger: 0.04,
      ease: "power2.inOut"
    });
  });
});



// ---------------- Reveal Animation ----------------
gsap.utils.toArray('[data-scroll-reveal="true"]').forEach((Element, Index) => {
  const OriginalOpacity = parseFloat(getComputedStyle(Element).opacity) || 1;

   gsap.fromTo(Element,
    { opacity: 0 },
    { 
      opacity: OriginalOpacity,
      duration: 2,
      delay: 2 + Index * 0.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: Element,
        start: "top 65%",
        end: "bottom 80%",
        scrub: 0.85 // smoothly reverses when scrolling back
      }
    }
  );
});



  // ---------------- Navbar Shortcuts ----------------
  document.querySelectorAll("[data-scrollTo]").forEach(Element => {
    Element.addEventListener("click", () => {
      const Target = Element.getAttribute("data-scrollTo");

      gsap.to(window, {
        duration: 1.25,
        ease: "power1.out",
        scrollTo: Target
      });
    });
  });

  





  // ---------------- Marquee / ScrollText ----------------
  document.querySelectorAll(".ScrollText").forEach((el) => {
  const reverse = el.getAttribute("data-dir") === "reverse";
  const distance = el.scrollWidth / 2;

  // set proper starting position
  gsap.set(el, { x: reverse ? -distance : 0 });

  gsap.to(el, {
    x: reverse ? 0 : -distance,
    duration: 15,
    ease: "none",
    repeat: -1,
  });
});



  // ---------------- 3D Landing Tilt ----------------
  const landing = document.querySelector("#Landing");
  const bgBox = document.querySelector("#BackgroundBox");
  const contentBox = document.querySelector("#ContentBox");

  if (landing && bgBox && contentBox) {
    gsap.set(landing, { perspective: 1000 });

    const outerRX = gsap.quickTo(bgBox, "rotationX", { ease: "power2" });
    const outerRY = gsap.quickTo(bgBox, "rotationY", { ease: "power2" });
    const innerX = gsap.quickTo(contentBox, "x", { ease: "power2" });
    const innerY = gsap.quickTo(contentBox, "y", { ease: "power2" });

    landing.addEventListener("pointermove", (e) => {
      const rect = contentBox.getBoundingClientRect();
      const xRatio = (e.clientX - rect.left) / rect.width;
      const yRatio = (e.clientY - rect.top) / rect.height;

      outerRX(gsap.utils.interpolate(15, -15, yRatio));
      outerRY(gsap.utils.interpolate(-15, 15, xRatio));

      innerX(gsap.utils.interpolate(-125, 125, xRatio));
      innerY(gsap.utils.interpolate(-100, 100, yRatio));
    });

    landing.addEventListener("pointerleave", () => {
      outerRX(0);
      outerRY(0);
      innerX(0);
      innerY(0);
    });
  }



  // ---------------- Project Cards Scroll ----------------
  const projectcontainer = document.querySelector(".ProjectContainer");
  const track = document.querySelector(".ProjectTrack");
  const cards = document.querySelectorAll(".ProjectCard");

  if (projectcontainer && track && cards.length) {
    const projectcontainerWidth = projectcontainer.offsetWidth;
    const firstCardWidth = cards[0].offsetWidth;
    const lastCardWidth = cards[cards.length - 1].offsetWidth;

    track.style.paddingLeft = `${(projectcontainerWidth - firstCardWidth) / 2}px`;
    track.style.paddingRight = `${(projectcontainerWidth - lastCardWidth) / 2}px`;

    const totalWidth = track.scrollWidth;
    const viewWidth = window.innerWidth;
    const scrollDistance = totalWidth - viewWidth;

    gsap.to(track, {
      x: -scrollDistance,
      ease: "none",
      scrollTrigger: {
        trigger: projectcontainer,
        start: "center center",
        end: () => "+=" + scrollDistance,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
      },
    });
  }



  // ---------------- Dither Background ----------------
  const canvas = document.getElementById("Dither");
    const gl = canvas.getContext("webgl");
    canvas.width = innerWidth;
    canvas.height = innerHeight;

    let mouse = { x: 0, y: 0 };
    const thresholdCurve = 1.2;
    const mouseSize = 120;
    const mouseStrength = 1.15;
    const blobAmount = 0.4;
    const blobScale = 2.5;

    function createShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
      }
      return s;
    }

    const vs = createShader(gl.VERTEX_SHADER, `
      attribute vec2 pos;
      void main() { gl_Position = vec4(pos,0.0,1.0); }
    `);

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
      uniform vec3 u_blobColor;
      uniform vec3 u_bgPrimary;

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

          float n = blobNoise(uv * u_blobScale);
          n = pow(n, u_thresholdCurve);
          n *= u_blobAmount;

          float dist = distance(gl_FragCoord.xy, u_mouse);
          float fade = smoothstep(0.0, u_mouseSize, dist);
          n *= fade*u_mouseStrength;

          float idx = floor(n*5.0)/5.0;
          gl_FragColor = vec4(u_blobColor * idx, idx);
      }
    `);

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1,-1, 1,-1, -1,1, 1,-1, 1,1, -1,1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(prog, "pos");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const u_res = gl.getUniformLocation(prog, "u_res");
    const u_time = gl.getUniformLocation(prog, "u_time");
    const u_mouse = gl.getUniformLocation(prog, "u_mouse");
    const u_thresholdCurve = gl.getUniformLocation(prog, "u_thresholdCurve");
    const u_mouseSize = gl.getUniformLocation(prog, "u_mouseSize");
    const u_mouseStrength = gl.getUniformLocation(prog, "u_mouseStrength");
    const u_blobAmount = gl.getUniformLocation(prog, "u_blobAmount");
    const u_blobScale = gl.getUniformLocation(prog, "u_blobScale");
    const u_blobColor = gl.getUniformLocation(prog, "u_bgColor");
    const u_bgPrimary = gl.getUniformLocation(prog, "u_bgPrimary");
    

    function getCSSColor(colorType) {
    const bgSecondary = getComputedStyle(document.documentElement)
      .getPropertyValue(colorType)
      .trim();
    const m = bgSecondary.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return [0.18,0.18,0.18];
    return [parseInt(m[1])/255, parseInt(m[2])/255, parseInt(m[3])/255];
  }


    gl.enable(gl.BLEND);
    //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.uniform2f(u_res, canvas.width, canvas.height);
    gl.uniform1f(u_thresholdCurve, thresholdCurve);
    gl.uniform1f(u_mouseSize, mouseSize);
    gl.uniform1f(u_mouseStrength, mouseStrength);
    gl.uniform1f(u_blobAmount, blobAmount);
    gl.uniform1f(u_blobScale, blobScale);

    gl.viewport(0, 0, canvas.width, canvas.height);

    function loop(t) {
      const bgColor = getCSSColor('--backgroundPrimary');
      gl.clearColor(bgColor[0], bgColor[1], bgColor[2], 1.0);

      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform3f(u_bgPrimary, ...getCSSColor('--backgroundPrimary'));
      gl.uniform3f(u_blobColor, ...getCSSColor('--backgroundSecondary'));
      gl.uniform1f(u_time, t * 0.001);
      gl.uniform2f(u_mouse, mouse.x, canvas.height - mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    window.addEventListener("resize", () => {
      canvas.width = innerWidth;
      canvas.height = innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u_res, canvas.width, canvas.height);
    });






  // ---------------- Image Gallery ----------------
  const depthData = [
  { selector: ".one",   zStart: -200, zEnd: 1500, startAt: 0.00, duration: 0.25 },
  { selector: ".two",   zStart: -250, zEnd: 1400,  startAt: 0.05, duration: 0.275 },
  { selector: ".three", zStart: -300, zEnd: 1450,  startAt: 0.125, duration: 0.30 },
  { selector: ".four",  zStart: -350, zEnd: 1500,  startAt: 0.175, duration: 0.325 },
  { selector: ".five",  zStart: -400, zEnd: 1400,  startAt: 0.20, duration: 0.35 },
  { selector: ".six",   zStart: -450, zEnd: 1400,  startAt: 0.30, duration: 0.40 }
  ];

/* Apply initial Z-depth transform */
  depthData.forEach(item => {
  gsap.set(item.selector, {
    z: item.zStart,
    opacity: 0,
  });
  });

/* Main scroll animation */
  const tl = gsap.timeline({
  scrollTrigger: {
    trigger: "#ImageGallery",
    start: "top top",
    end: "500%",
    pin: true,
    scrub: 1
  }
  });

  depthData.forEach(item => {
  tl.to(item.selector, {
    z: item.zEnd,
    opacity: 1.75,
    ease: "power1.out",
    duration: item.duration
  }, item.startAt);
  });

  gsap.set(".center", {
    z: -200,
    opacity: 0,
  });

  tl.to(".center", {
    z: 900,
    opacity: 1.7,
    ease: "power3.inout",
    duration: 0.575
  }, 0.275);
























  // ---------------------- Fire Transition ----------------------
  const FireContainer = document.querySelector('#FireContainer');
  const FireCanvas = document.querySelector('#FireCanvas');

  const FireRenderer = new THREE.WebGLRenderer({
      alpha: true,
      canvas: FireCanvas
  });
  FireRenderer.setPixelRatio(window.devicePixelRatio);
  FireRenderer.setSize(FireContainer.clientWidth, FireContainer.clientHeight);

  const FireScene = new THREE.Scene();
  const FireCamera = new THREE.OrthographicCamera(-.5, .5, .5, -.5, .1, 10);
  const FireTimer = new THREE.Timer()

  FireScene.add(FireCamera)

  const FireParams = {
	  speed: 1.9,
    shape: 1.15,
    power: 0.8,
    addition: 0.75,
  }
    


  const FireFragmentShader = `
    varying vec2 vUv;
    uniform float u_ratio;
    uniform float u_time;
    uniform float u_speed;
    uniform float u_shape_offset;
    uniform float u_power;
    uniform float u_addition;

    // Simple noise
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
        -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
        + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
        dot(x12.zw, x12.zw)), 0.0);
        m = m*m;
        m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    // Color space transform
    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    const float STEPS = 4.;

    float get_noise(vec2 uv, float t){
        float SCALE = 8.;
        float noise = snoise(vec2(uv.x * SCALE, uv.y * .25 * SCALE - t));
        SCALE = 10.;
        noise += .2 * snoise(vec2(uv.x * SCALE + 1.5 * t, uv.y * .3 * SCALE));
        noise = min(1., .5 * noise + u_addition);
        return noise;
    }


    void main () {
        vec2 uv = vUv;
        uv.y /= u_ratio;

        float t = u_time * u_speed;

        float noise = get_noise(uv, t);
        float shape = pow(.8 * uv.y * u_ratio, .5);
        shape += 3. * pow(abs(uv.x - .5), 2.);
        shape *= u_shape_offset;

        float stepped_noise = floor(get_noise(uv, t) * STEPS) / STEPS;
        float d = pow(stepped_noise, u_power);
        d *= (1.2 - shape);

        vec3 hsv = vec3(d * .15, .8 - .2 * d, d + .5 + .1 * uv.y);
        vec3 col = hsv2rgb(hsv);

        col *= smoothstep(shape, shape + .2, noise);
        gl_FragColor = vec4(col, step(shape, noise) - .5);
    }
  `;

  const FireVertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.);
    }
  `;

    const FireMaterial = new THREE.ShaderMaterial({
        uniforms: {
            u_time: {type: "f", value: 0},
            u_ratio: {type: "f", value: FireContainer.clientWidth / FireContainer.clientHeight},
            u_speed: {type: "f", value: FireParams.speed},
            u_shape_offset: {type: "f", value: FireParams.shape},
            u_power: {type: "f", value: FireParams.power},
            u_addition: {type: "f", value: FireParams.addition},
        },
        vertexShader: FireVertexShader,
        fragmentShader: FireFragmentShader,
		  transparent: true
    });
    const FirePlaneGeometry = new THREE.PlaneGeometry(2, 2);
    FireScene.add(new THREE.Mesh(FirePlaneGeometry, FireMaterial));


  function renderFire() {
    FireTimer.update();
    FireMaterial.uniforms.u_time.value = FireTimer.getElapsed();
    FireRenderer.render(FireScene, FireCamera);
    requestAnimationFrame(renderFire);
  }
  renderFire();



  window.addEventListener("resize", () => {
    const width = FireContainer.clientWidth;
    const height = FireContainer.clientHeight;

    FireMaterial.uniforms.u_ratio.value = width / height;
    FireRenderer.setSize(width, height);
  });



  gsap.timeline({
      scrollTrigger: {
        trigger: "#FireScroller",
        start: "top top",
        end: "+=250%",
        pin: "#FireContainer",
        scrub: 1,
      },
      onUpdate: () => {
        FireMaterial.uniforms.u_shape_offset.value = FireParams.shape;
        FireMaterial.uniforms.u_power.value = FireParams.power;
        FireMaterial.uniforms.u_addition.value = FireParams.addition;
      }
    })
    .to(FireParams, {
            duration: .7,
            shape: .4,
    })
    .to(FireParams, {
            duration: .7,
            power: .4,
            ease: 'power3.in'
    }, 0)
    .fromTo(FireParams, {
            addition: .5,
        }, {
            duration: .7,
            addition: 1,
            ease: 'power3.out'
    }, .3)











  // ---------------------- ScrollScene Scrolling Animations ----------------------
  const tlscrollscene = gsap.timeline({
  scrollTrigger: {
    trigger: "#ScrollSceneScroller",
    start: "top top",
    end: "1500%",
    pin: true,
    scrub: 1,
  }
  });
  
  const images = document.querySelectorAll('.ScrollSceneImage');
  const maxImages = images.length;
  const totalDuration = 1; // 0 → 1 of timeline
  const imgDuration = totalDuration / maxImages; // how long each image animates

  // set initial state
  images.forEach(img => {
    gsap.set(img, { opacity: 0, scale: 0.5, xPercent: -50, yPercent: -50, position: "absolute", left: "50%", top: "50%" });
  });

  images.forEach((img, i) => {
    const startTime = i * imgDuration;

    tlscrollscene.to(img, {
      opacity: 1,
      scale: 1,
      duration: imgDuration * 0.3,
      ease: "power1.out"
    }, startTime);

    tlscrollscene.to(img, {
      scale: 1.45,
      duration: imgDuration * 0.7,
      ease: "power1.out"
    }, startTime + imgDuration * 0.3);

    tlscrollscene.to(img, {
      opacity: 0,
      duration: imgDuration * 0.325,
      ease: "power1.in"
    }, startTime + imgDuration * 0.65);
  });







  // ---------------- Scroll Scene ----------------
  const scrollCanvasContainer = document.querySelector('#ScrollSceneCanvasContainer');
  const scrollCanvas = document.querySelector('#ScrollSceneCanvas');
  const scrollScene = new THREE.Scene();
  const scrollRenderer = new THREE.WebGLRenderer({ canvas: scrollCanvas, alpha: true, antialias: true });
  scrollRenderer.setPixelRatio(window.devicePixelRatio);
  scrollRenderer.setSize(scrollCanvasContainer.clientWidth, scrollCanvasContainer.clientHeight);
  scrollRenderer.shadowMap.enabled = true
  scrollRenderer.shadowMap.type = THREE.BasicShadowMap

  const scrollCamera = new THREE.PerspectiveCamera(
    75,
    scrollCanvasContainer.clientWidth / scrollCanvasContainer.clientHeight,
    0.1,
    1000
  );

  scrollCamera.position.set(2.2, -0.475, -7.75);
  scrollCamera.rotation.copy(
    new THREE.Euler(
      THREE.MathUtils.degToRad(0),
      THREE.MathUtils.degToRad(180),
      THREE.MathUtils.degToRad(0)
    )
  );

  scrollRenderer.render(scrollScene, scrollCamera);




  tlscrollscene.to(scrollCamera.position, {
    z: 6,
    ease: "power1.out",
    duration: 0.725,
  }, 0);
  tlscrollscene.to(scrollCamera.rotation, {
    y: THREE.MathUtils.degToRad(220),
    ease: "power2.inout",
    duration: 0.3,
  }, 0.22);
  tlscrollscene.to(scrollCamera.rotation, {
    y: THREE.MathUtils.degToRad(90),
    ease: "power2.in",
    duration: 0.35,
  }, 0.6);
  tlscrollscene.to(scrollCamera.position, {
    x: -4,
    ease: "power2.out",
    duration: 0.275,
  }, 0.725);

  


  
  

  // ---------------------- Lights ----------------------
  const ChandlierLight = new THREE.PointLight("rgb(255, 95, 5)", 4, 150, 1.7);
  const ChandlierLight2 = new THREE.PointLight("rgb(255, 95, 5)", 4, 150, 1.7);
  const SunLight = new THREE.DirectionalLight( "rgb(255, 219, 58)", 1.75);
  const AmbientLight = new THREE.AmbientLight("rgb(32, 32, 32)", 0.45);

  SunLight.castShadow = true
  SunLight.shadow.mapSize.width = 512
  SunLight.shadow.mapSize.height = 512
  SunLight.position.set(50, 30, 0);

  ChandlierLight.castShadow = true
  ChandlierLight.shadow.mapSize.width = 512
  ChandlierLight.shadow.mapSize.height = 512

  ChandlierLight2.castShadow = true
  ChandlierLight2.shadow.mapSize.width = 512
  ChandlierLight2.shadow.mapSize.height = 512

  scrollScene.add(SunLight, ChandlierLight, ChandlierLight2, AmbientLight);



  // ---------------------- Hallway ----------------------
  {
    const box = new THREE.Box3().setFromObject(Hallway);
    const center = box.getCenter(new THREE.Vector3());
    Hallway.position.sub(center);

    Hallway.receiveShadow = true;
    Hallway.castShadow = true;

    scrollScene.add(Hallway);

    SunLight.target = Hallway;
  }

  // ---------------------- Knight ----------------------
  {
    const box = new THREE.Box3().setFromObject(Knight);
    const center = box.getCenter(new THREE.Vector3());
    Knight.position.sub(center);
    Knight.receiveShadow = true
    Knight.castShadow = true

    Knight.scale.multiplyScalar(1.2);
    Knight.position.set(3.9, -2.47, 8);
    Knight.rotation.copy(
    new THREE.Euler(
      THREE.MathUtils.degToRad(0),
      THREE.MathUtils.degToRad(220),
      THREE.MathUtils.degToRad(0)
    )
    );

    scrollScene.add(Knight);
  }
  // ---------------------- Katana ----------------------
  {
    const box = new THREE.Box3().setFromObject(Katana);
    const center = box.getCenter(new THREE.Vector3());
    Katana.position.sub(center);
    Katana.receiveShadow = true
    Katana.castShadow = true

    Katana.scale.multiplyScalar(1.25);
    Katana.position.set(2.2, 3.6, 0);
    Katana.rotation.copy(
    new THREE.Euler(
      THREE.MathUtils.degToRad(90),
      THREE.MathUtils.degToRad(140),
      THREE.MathUtils.degToRad(0)
    )
    );

    scrollScene.add(Katana);


    // Animate Katana falling
    const KatanaTL = gsap.timeline({ paused: true });
    const KatanaReverseTL = gsap.timeline({ paused: true });

    KatanaTL.to(Katana.position, {
      y: -2,
      x: 2.1,
      duration: 0.7,
      ease: "power4.in"
    }, 0);
    KatanaTL.to(Katana.rotation, {
      y: THREE.MathUtils.degToRad(95),
      duration: 0.7,
      ease: "power2.in"
    }, 0);

    KatanaTL.to(Katana.position, {
      x: 2.3,
      duration: 3,
      ease: CustomWiggle.create("myWiggle", {
        wiggles: 45,
        type: "easeOut",
      }),
    }, 0.7);
    KatanaTL.to(Katana.rotation, {
      y: THREE.MathUtils.degToRad(75),
      duration: 3,
      ease: CustomWiggle.create("myWiggle", {
        wiggles: 45,
        type: "easeOut",
      }),
    }, 0.7);


    KatanaReverseTL.to(Katana.position, {
      x: 2.3,
      duration: 2,
      ease: CustomWiggle.create("myWiggle", {
        wiggles: 35,
        type: "easeOut",
      }),
    }, 0);
    KatanaReverseTL.to(Katana.rotation, {
      y: THREE.MathUtils.degToRad(75),
      duration: 2,
      ease: CustomWiggle.create("myWiggle", {
        wiggles: 35,
        type: "easeOut",
      }),
    }, 0);
    KatanaReverseTL.to(Katana.position, {
      y: 3.6,
      x: 2.1,
      duration: 1,
      ease: "power4.out"
    }, 2);
    KatanaReverseTL.to(Katana.rotation, {
      y: THREE.MathUtils.degToRad(140),
      duration: 1,
      ease: "power2.out"
    }, 2);




    // Trigger Animation at certain scroll
    ScrollTrigger.create({
      trigger: "#ScrollSceneScroller",
      start: "top top",
      end: "200%",
      onLeave: () => KatanaTL.restart(),
      onLeaveBack: () => KatanaReverseTL.restart(),
    });
  }

  // ---------------------- Chandelier ----------------------
  {
    const box = new THREE.Box3().setFromObject(Chandelier);
    const center = box.getCenter(new THREE.Vector3());
    Chandelier.position.sub(center);
    Chandelier.receiveShadow = true
    Chandelier.castShadow = true

    Chandelier.scale.multiplyScalar(0.05);
    Chandelier.position.set(2.2, 0.56, 3);

    scrollScene.add(Chandelier);

    // Set Light position
    ChandlierLight.position.copy(Chandelier.position).add(new THREE.Vector3(0, 0.1, 0));
  }

  // ---------------------- Chandelier 2 ----------------------
  {
    const box = new THREE.Box3().setFromObject(Chandelier2);
    const center = box.getCenter(new THREE.Vector3());
    Chandelier2.position.sub(center);
    Chandelier2.receiveShadow = true
    Chandelier2.castShadow = true

    Chandelier2.scale.multiplyScalar(0.05);
    Chandelier2.position.set(2.2, 0.56, -3);

    scrollScene.add(Chandelier2);

    // Set Light position
    ChandlierLight2.position.copy(Chandelier2.position).add(new THREE.Vector3(0, 0.1, 0));
  }

  // ---------------------- Background Square ----------------------
  const TextureLoader = new THREE.TextureLoader();
  const BackgroundTexture = TextureLoader.load('Forest_Background.jpg');
  const BackgroundGeometry = new THREE.BoxGeometry(2, 2, 1);
  const BackgroundMaterial = new THREE.MeshBasicMaterial({ map: BackgroundTexture, side: THREE.DoubleSide });
  const BackgroundSquare = new THREE.Mesh(BackgroundGeometry, BackgroundMaterial);
  
  BackgroundSquare.scale.set(16, 8, 1);
  BackgroundSquare.position.set(14, 1.75, 8);
  BackgroundSquare.rotation.copy(
    new THREE.Euler(
      THREE.MathUtils.degToRad(0),
      THREE.MathUtils.degToRad(70),
      THREE.MathUtils.degToRad(0)
    )
  );

  scrollScene.add(BackgroundSquare);


  // ---------------------- Debug Helpers ----------------------
  //const controls = new OrbitControls(scrollCamera, scrollRenderer.domElement);
  //const ChandlierLightHelper = new THREE.PointLightHelper(ChandlierLight);
  //const ChandlierLight2Helper = new THREE.PointLightHelper(ChandlierLight2);
  //scrollScene.add(ChandlierLightHelper, ChandlierLight2Helper);
  // const gridHelper = new THREE.GridHelper(200, 50);
  // scrollScene.add(gridHelper);



  // ---------------------- Animation Loop ----------------------
  function animate() {
    requestAnimationFrame(animate);
    scrollRenderer.render(scrollScene, scrollCamera);
  }
  animate();


  window.addEventListener("resize", () => {
    const width = scrollCanvasContainer.clientWidth;
    const height = scrollCanvasContainer.clientHeight;

    scrollCamera.aspect = width / height;
    scrollCamera.updateProjectionMatrix();

    scrollRenderer.setSize(width, height);

    ScrollTrigger.refresh();
  });







// ---------------- Finger Animation ----------------
const fingerYou = document.getElementById("FingerYou");
const fingerDown = document.getElementById("FingerDown");
const fingerContainer = document.getElementById("FingerWrap");

gsap.set(fingerContainer, { opacity: 0 });
gsap.set(fingerYou, { scale: 0.5, opacity: 1 });
gsap.set(fingerDown, { scale: 1, opacity: 0 });

const tlFinger = gsap.timeline({
  repeat: -1,
  paused: true
});

tlFinger
.to(fingerYou, {
  scale: 1,
  duration: 0.6,
  ease: "power3.out"
})
.to(fingerYou, {
  opacity: 0,
  duration: 0.05
}, ">")
.to(fingerDown, {
  opacity: 1,
  duration: 0.05
}, "<")
.to(fingerDown, {
  y: 35,
  duration: 0.25,
  ease: "power1.inOut",
  yoyo: true,
  repeat: 4
});

ScrollTrigger.create({
  trigger: fingerContainer,
  start: "top 60%",
  onEnter: () => {
    gsap.to(fingerContainer, { opacity: 1, duration: 0.2 });
    tlFinger.play();
  }
});



// ---------------- Text Typer ----------------
const endText = document.getElementById("EndTextContent");
const caret = document.querySelector(".Caret");
const OriginalText = "What are you waiting for?<br>Hire me now!";

gsap.set(caret, { opacity: 0 });
gsap.set(endText, { text: "" });

const tlText = gsap.timeline({ paused: true });

tlText
.to(endText, {
  duration: 2.45,
  text: OriginalText,
  ease: "rough({template:power1.out, strength: 2, points:25, taper:none, randomize:true, clamp:true})",
})
.to(caret, {
  opacity: 1,
  repeat: -1,
  yoyo: true,
  duration: 0.4,
  ease: "power1.inOut",
}, 0);

ScrollTrigger.create({
  trigger: document.querySelector(".EndText"),
  start: "top 70%",
  onEnter: () => tlText.play()
});










// ---------------- Theme ----------------
const defaultTheme = "dark";

const themes = {
  dark: {
    backgroundPrimary: "rgb(26, 26, 26)",
    backgroundSecondary: "rgb(139, 139, 139)",
    primaryDark: "rgb(0, 245, 41)",
    primary: "rgb(45, 226, 0)",
    primaryLight: "rgb(0, 245, 41)",
    secondaryDark: "rgb(255, 255, 255)",
    secondary: "rgb(230, 230, 230)",
    secondaryLight: "rgb(255, 255, 255)",
    accentDark: "rgb(202, 255, 10)",
    accent: "rgb(175, 243, 17)",
    accentLight: "rgb(202, 255, 10)",
  },
  light: {
    backgroundPrimary: "rgb(207, 207, 207)",
    backgroundSecondary: "rgb(90, 90, 90)",
    primaryDark: "rgb(131, 131, 131)",
    primary: "rgb(134, 134, 134)",
    primaryLight: "rgb(158, 158, 158)",
    secondaryDark: "rgb(255, 255, 255)",
    secondary: "rgb(230, 230, 230)",
    secondaryLight: "rgb(255, 255, 255)",
    accentDark: "rgb(36, 36, 36)",
    accent: "rgb(53, 53, 53)",
    accentLight: "rgb(75, 75, 75)",
  },
  green: {
    backgroundPrimary: "rgb(0, 90, 0)",
    backgroundSecondary: "rgb(0, 140, 0)",
    primaryDark: "rgb(0, 245, 41)",
    primary: "rgb(45, 226, 0)",
    primaryLight: "rgb(0, 245, 41)",
    secondaryDark: "rgb(255, 255, 255)",
    secondary: "rgb(230, 230, 230)",
    secondaryLight: "rgb(255, 255, 255)",
    accentDark: "rgb(202, 255, 10)",
    accent: "rgb(175, 243, 17)",
    accentLight: "rgb(202, 255, 10)",
  },
  red: {
    backgroundPrimary: "rgb(140, 0, 0)",
    backgroundSecondary: "rgb(228, 34, 34)",
    primaryDark: "rgb(173, 0, 0)",
    primary: "rgb(223, 0, 0)",
    primaryLight: "rgb(255, 0, 0)",
    secondaryDark: "rgb(68, 0, 0)",
    secondary: "rgb(102, 0, 0)",
    secondaryLight: "rgb(131, 0, 0)",
    accentDark: "rgb(134, 69, 69)",
    accent: "rgb(182, 90, 90)",
    accentLight: "rgb(238, 120, 120)",
  },
};

function applyTheme(themeName){
  const theme = themes[themeName];
  if(!theme) return;

  // Set CSS variables for use in your styles
  document.documentElement.style.setProperty("--backgroundPrimary", theme.backgroundPrimary);
  document.documentElement.style.setProperty("--backgroundSecondary", theme.backgroundSecondary);
  document.documentElement.style.setProperty("--primaryDark", theme.primaryDark);
  document.documentElement.style.setProperty("--primary", theme.primary);
  document.documentElement.style.setProperty("--primaryLight", theme.primaryLight);
  document.documentElement.style.setProperty("--secondaryDark", theme.secondaryDark);
  document.documentElement.style.setProperty("--secondary", theme.secondary);
  document.documentElement.style.setProperty("--secondaryLight", theme.secondaryLight);
  document.documentElement.style.setProperty("--accentDark", theme.accentDark);
  document.documentElement.style.setProperty("--accent", theme.accent);
  document.documentElement.style.setProperty("--accentLight", theme.accentLight);
}

// Set default theme on load
applyTheme(defaultTheme);

// Handle clicks
document.querySelectorAll("#ThemeDial .Button").forEach(btn => {
  const theme = btn.getAttribute("data-theme");

  if(theme === defaultTheme) btn.classList.add("active");

  btn.addEventListener("click", () => {
    document.querySelectorAll("#ThemeDial .Button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    applyTheme(theme);
  });
});








// ---------------- Performance Stats ----------------
let lastFrame = performance.now();
let smoothedLoad = 0;
let last = performance.now();
let frames = 0;

// ---------------- FPS ----------------
function updateFPS() {
  frames++;
  const now = performance.now();

  if (now - last >= 1000) {
    const fps = frames;
    FPSValue.textContent = fps;

    // gradient
    const pct = Math.min(100, Math.max(0, (60 - fps) * (100 / 60))); 
    const r = Math.round(45 + (pct / 100) * (226 - 45));
    const g = Math.round(226 - (pct / 100) * (226 - 45));
    FPSValue.style.color = `rgb(${r}, ${g}, 0)`;

    frames = 0;
    last = now;
  }

  requestAnimationFrame(updateFPS);
}
updateFPS();

// ---------------- CPU ----------------
function updateCPULoad() {
  const now = performance.now();
  const delta = now - lastFrame;
  lastFrame = now;

  const ideal = 1000 / 60;
  let load = ((delta - ideal) / ideal) * 100;
  load = Math.max(0, Math.min(100, load));

  smoothedLoad = smoothedLoad * 0.8 + load * 0.2;

  const value = Math.round(smoothedLoad);
  CPUValue.textContent = value + "%";

  const r = Math.round(45 + (value / 100) * (226 - 45));
  const g = Math.round(226 - (value / 100) * (226 - 45));
  CPUValue.style.color = `rgb(${r}, ${g}, 0)`;

  requestAnimationFrame(updateCPULoad);
}
updateCPULoad();

// ---------------- Memory ----------------
const MemValue = document.getElementById("MemValue");

if (!performance.memory) {
  MemValue.textContent = "N/A";
  MemValue.style.color = `rgb(100, 100, 100)`;
} else {
  function updateMemory() {
    const used = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
    MemValue.textContent = used + "MB";

    // gradient: memory ~ dangerous under 300MB? scale roughly
    const pct = Math.min(100, (used / 300) * 100);
    const r = Math.round(45 + (pct / 100) * (226 - 45));
    const g = Math.round(226 - (pct / 100) * (226 - 45));
    MemValue.style.color = `rgb(${r}, ${g}, 0)`;

    requestAnimationFrame(updateMemory);
  }
  updateMemory();
}






// ---------------- Music Player ----------------
const playlist = [
  { name: "Two", author: "Twenty One Pilots", src: "/music/Two.mp3" },
  { name: "House of Gold", author: "Twenty One Pilots", src: "/music/House of Gold.mp3" },
  { name: "Drag Path", author: "Twenty One Pilots", src: "/music/Drag Path.mp3" }
];

let currentTrack = 0;
const musicPlayer = new Audio();
musicPlayer.src = playlist[currentTrack].src;
musicPlayer.loop = true;

const TrackName = document.getElementById("TrackName");
const TrackAuthor = document.getElementById("TrackAuthor");
const PlayPauseBtn = document.getElementById("PlayPause");
const PrevBtn = document.getElementById("Prev");
const NextBtn = document.getElementById("Next");
const VolumeSlider = document.getElementById("VolumeSlider");

function updateTrackInfo() {
  TrackName.textContent = playlist[currentTrack].name;
  TrackAuthor.textContent = playlist[currentTrack].author;
  musicPlayer.src = playlist[currentTrack].src;
  musicPlayer.play();
  PlayPauseBtn.textContent = "⏸";
}

PlayPauseBtn.addEventListener("click", () => {
  if(musicPlayer.paused){
    musicPlayer.play();
    PlayPauseBtn.textContent = "⏸";
  } else {
    musicPlayer.pause();
    PlayPauseBtn.textContent = "▶";
  }
});

PrevBtn.addEventListener("click", () => {
  currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
  updateTrackInfo();
});

NextBtn.addEventListener("click", () => {
  currentTrack = (currentTrack + 1) % playlist.length;
  updateTrackInfo();
});

VolumeSlider.addEventListener("input", () => {
  musicPlayer.volume = VolumeSlider.value;
});

updateTrackInfo();






// ---------------- Music Visualizer ----------------

// ---------------- Basic Setup ----------------
const musicVisualizerCanvas = document.querySelector("#MusicVisualizer");
const musicVisualizerRenderer = new THREE.WebGLRenderer({ canvas: musicVisualizerCanvas, antialias: true, alpha: false });
const musicVisualizerScene = new THREE.Scene();
const musicVisualizerCamera = new THREE.PerspectiveCamera(45, musicVisualizerCanvas.clientWidth / musicVisualizerCanvas.clientHeight, 0.1, 1000);

musicVisualizerRenderer.setSize(musicVisualizerCanvas.clientWidth, musicVisualizerCanvas.clientHeight);

musicVisualizerCamera.position.set(0, -2, 14);


// ---------------- Shader and Configs ----------------
const musicVisualizerParams = {
	red: 0.6,
	green: 0.25,
	blue: 0.75,
	threshold: 0.05,
	strength: 0.7,
	radius: 0.35
}

const musicVisualizerUniforms = {
	u_time: {type: 'f', value: 0.0},
	u_frequency: {type: 'f', value: 0.0},
	u_red: {type: 'f', value: musicVisualizerParams.red},
	u_green: {type: 'f', value: musicVisualizerParams.green},
	u_blue: {type: 'f', value: musicVisualizerParams.blue}
}

const musicVisualizerVertexShader = `
uniform float u_time;

      vec3 mod289(vec3 x)
      {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }
      
      vec4 mod289(vec4 x)
      {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }
      
      vec4 permute(vec4 x)
      {
        return mod289(((x*34.0)+10.0)*x);
      }
      
      vec4 taylorInvSqrt(vec4 r)
      {
        return 1.79284291400159 - 0.85373472095314 * r;
      }
      
      vec3 fade(vec3 t) {
        return t*t*t*(t*(t*6.0-15.0)+10.0);
      }

      // Classic Perlin noise, periodic variant
      float pnoise(vec3 P, vec3 rep)
      {
        vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
        vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
        Pi0 = mod289(Pi0);
        Pi1 = mod289(Pi1);
        vec3 Pf0 = fract(P); // Fractional part for interpolation
        vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
        vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
        vec4 iy = vec4(Pi0.yy, Pi1.yy);
        vec4 iz0 = Pi0.zzzz;
        vec4 iz1 = Pi1.zzzz;

        vec4 ixy = permute(permute(ix) + iy);
        vec4 ixy0 = permute(ixy + iz0);
        vec4 ixy1 = permute(ixy + iz1);

        vec4 gx0 = ixy0 * (1.0 / 7.0);
        vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
        gx0 = fract(gx0);
        vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
        vec4 sz0 = step(gz0, vec4(0.0));
        gx0 -= sz0 * (step(0.0, gx0) - 0.5);
        gy0 -= sz0 * (step(0.0, gy0) - 0.5);

        vec4 gx1 = ixy1 * (1.0 / 7.0);
        vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
        gx1 = fract(gx1);
        vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
        vec4 sz1 = step(gz1, vec4(0.0));
        gx1 -= sz1 * (step(0.0, gx1) - 0.5);
        gy1 -= sz1 * (step(0.0, gy1) - 0.5);

        vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
        vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
        vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
        vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
        vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
        vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
        vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
        vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

        vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
        g000 *= norm0.x;
        g010 *= norm0.y;
        g100 *= norm0.z;
        g110 *= norm0.w;
        vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
        g001 *= norm1.x;
        g011 *= norm1.y;
        g101 *= norm1.z;
        g111 *= norm1.w;

        float n000 = dot(g000, Pf0);
        float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
        float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
        float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
        float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
        float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
        float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
        float n111 = dot(g111, Pf1);

        vec3 fade_xyz = fade(Pf0);
        vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
        vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
        float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
        return 2.2 * n_xyz;
      }

      uniform float u_frequency;

      void main() {
          float noise = 2.9 * pnoise(position + u_time, vec3(10.0));
          float displacement = (u_frequency / 30.) * (noise / 10.);
          vec3 newPosition = position + normal * displacement;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
`;

const musicVisualizerFragmentShader = `
  uniform float u_red;
  uniform float u_blue;
  uniform float u_green;

  void main() {
    vec3 color = vec3(u_red, u_green, u_blue);
    gl_FragColor = vec4(color, 1.0);
  }
`;


// ---------------- Bloom ----------------
const musicVisualizerRenderScene = new RenderPass(musicVisualizerScene, musicVisualizerCamera);

const musicVisualizerBloomPass = new UnrealBloomPass(new THREE.Vector2(musicVisualizerCanvas.clientWidth, musicVisualizerCanvas.clientHeight));
musicVisualizerBloomPass.threshold = musicVisualizerParams.threshold;
musicVisualizerBloomPass.strength = musicVisualizerParams.strength;
musicVisualizerBloomPass.radius = musicVisualizerParams.radius;

const musicVisualizerBloomComposer = new EffectComposer(musicVisualizerRenderer);
musicVisualizerBloomComposer.addPass(musicVisualizerRenderScene);
musicVisualizerBloomComposer.addPass(musicVisualizerBloomPass);

const musicVisualizerOutputPass = new OutputPass();
musicVisualizerBloomComposer.addPass(musicVisualizerOutputPass);


// ---------------- Mesh Creation ----------------
const musicVisualizerMaterial = new THREE.ShaderMaterial({
  uniforms: musicVisualizerUniforms,
  vertexShader: musicVisualizerVertexShader,
  fragmentShader: musicVisualizerFragmentShader,
  wireframe: false, // true
});
const musicVisualizerGeometry = new THREE.IcosahedronGeometry(4.25, 15);
const musicVisualizerMesh = new THREE.Mesh(musicVisualizerGeometry, musicVisualizerMaterial);

musicVisualizerScene.add(musicVisualizerMesh);


// ---------------- React with Audio ----------------
const musicVisualizerListener = new THREE.AudioListener();
musicVisualizerCamera.add(musicVisualizerListener);

const musicVisualizerAudio = new THREE.Audio(musicVisualizerListener);
musicVisualizerAudio.setMediaElementSource(musicPlayer);

const musicVisualizerAnalyser = new THREE.AudioAnalyser(musicVisualizerAudio, 32);


// ---------------- Mouse Sway ----------------
let mouseX = 0;
let mouseY = 0;
document.addEventListener('mousemove', function(e) {
	let canvasHalfX = musicVisualizerCanvas.clientWidth / 2;
	let canvasHalfY = musicVisualizerCanvas.clientHeight / 2;
	mouseX = (e.clientX - canvasHalfX) / 100;
	mouseY = (e.clientY - canvasHalfY) / 100;
});


// ---------------- Finalize ----------------
const musicVisualizerTimer = new THREE.Timer();

function animateVisualizer() {
  musicVisualizerCamera.position.x += (mouseX - musicVisualizerCamera.position.x) * 0.05;
	musicVisualizerCamera.position.y += (-mouseY - musicVisualizerCamera.position.y) * 0.2;
	musicVisualizerCamera.lookAt(musicVisualizerScene.position);

  // musicVisualizerAnalyser.getAverageFrequency() / 50 ist 1 on average
  musicVisualizerMesh.rotation.x += 0.005 + musicVisualizerAnalyser.getAverageFrequency() / 10000 // 0.011
  musicVisualizerMesh.rotation.y += 0.003 + musicVisualizerAnalyser.getAverageFrequency() / 15000 // 0.008
  musicVisualizerMesh.rotation.z += 0.001 + musicVisualizerAnalyser.getAverageFrequency() / 20000 // 0.006

  musicVisualizerTimer.update();
	musicVisualizerUniforms.u_time.value = musicVisualizerTimer.getElapsed();
	musicVisualizerUniforms.u_frequency.value = musicVisualizerAnalyser.getAverageFrequency() / 1.1;

  musicVisualizerBloomComposer.render();

  requestAnimationFrame(animateVisualizer);
}
animateVisualizer();

window.addEventListener('resize', function() {
  const width = musicVisualizerCanvas.clientWidth;
  const height = musicVisualizerCanvas.clientHeight;

  musicVisualizerCamera.aspect = width / height;
  musicVisualizerCamera.updateProjectionMatrix();

  musicVisualizerRenderer.setSize(width, height);
  musicVisualizerBloomComposer.setSize(width, height);
});










// ---------------- Word Looper ----------------
function initLoopingWordsWithSelector() {  
  const wordList = document.querySelector('[data-looping-words-list]');
  const words = Array.from(wordList.children);
  const totalWords = words.length;
  const wordHeight = 100 / totalWords;
  const edgeElement = document.querySelector('[data-looping-words-selector]');
  let currentIndex = 0;

  function updateEdgeWidth() {
    const centerIndex = (currentIndex + 1) % totalWords;
    const centerWord = words[centerIndex];
    const centerWordWidth = centerWord.getBoundingClientRect().width;
    const listWidth = wordList.getBoundingClientRect().width;
    const percentageWidth = (centerWordWidth / listWidth) * 100;

    gsap.to(edgeElement, {
      width: `${percentageWidth}%`,
      duration: 0.7,
      ease: 'back.inOut(2.6)',
    });
  }

  function moveWords() {
    currentIndex++;

    gsap.to(wordList, {
      yPercent: -wordHeight * currentIndex,
      duration: 1.25,
      ease: 'elastic.out(1.75, 0.55)',
      onStart: updateEdgeWidth,
      onComplete: function() {
        if (currentIndex >= totalWords - 3) {
          wordList.appendChild(wordList.children[0]);
          currentIndex--;
          gsap.set(wordList, { yPercent: -wordHeight * currentIndex });
          words.push(words.shift());
        }
      }
    });
  }

  updateEdgeWidth();

  gsap.timeline({ repeat: -1, delay: 0.5 })
    .call(moveWords)
    .to({}, { duration: 2 })
    .repeat(-1);
}

// Initialize Looping Words with Selector
initLoopingWordsWithSelector();









// ---------------- Contacts Section ----------------
const ContactsCanvasContainer = document.getElementById('Contacts');
const ContactsCanvas = document.getElementById('ContactsCanvas');
const ContactsScene = new THREE.Scene();
const ContactsCamera = new THREE.PerspectiveCamera(75, ContactsCanvasContainer.clientWidth / ContactsCanvasContainer.clientHeight, 0.1, 1000);
const ContactsRenderer = new THREE.WebGLRenderer({ canvas: ContactsCanvas, alpha: true, antialias: true });
ContactsRenderer.setSize(ContactsCanvasContainer.clientWidth, ContactsCanvasContainer.clientHeight);


ContactsCamera.position.z = 5;

// Fullscreen plane for fluid shader
const ContactsGeometry = new THREE.PlaneGeometry(8, 8, 128, 128);

const ContactsMaterial = new THREE.ShaderMaterial({
  uniforms: {
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(ContactsCanvasContainer.clientWidth, ContactsCanvasContainer.clientHeight) }
  },
  vertexShader: `
    uniform float u_time;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 pos = position;
      pos.z += sin(pos.x * 4.0 + u_time) * 0.5;
      pos.z += cos(pos.y * 4.0 + u_time * 0.75) * 0.5;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform float u_time;
    uniform vec2 u_resolution;
    varying vec2 vUv;

    void main() {
      vec3 color = vec3(0.0);
      color.r = 0.5 + 0.5 * sin(vUv.x * 4.0 + u_time);
      color.g = 0.5 + 0.5 * cos(vUv.y * 4.0 + u_time * 0.5);
      color.b = 0.7 + 0.3 * sin((vUv.x+vUv.y) * 6.0 + u_time);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  side: THREE.DoubleSide
});

const ContactsPlane = new THREE.Mesh(ContactsGeometry, ContactsMaterial);
ContactsScene.add(ContactsPlane);

function animateContactsBackground() {
  requestAnimationFrame(animateContactsBackground);
  ContactsMaterial.uniforms.u_time.value += 0.03;
  ContactsRenderer.render(ContactsScene, ContactsCamera);
}
animateContactsBackground();

window.addEventListener('resize', function() {
  ContactsCamera.aspect = ContactsCanvasContainer.clientWidth / ContactsCanvasContainer.clientHeight;
  ContactsCamera.updateProjectionMatrix();

  ContactsRenderer.setSize(ContactsCanvasContainer.clientWidth, ContactsCanvasContainer.clientHeight);
  ContactsMaterial.uniforms.u_resolution.value.set(ContactsCanvasContainer.clientWidth, ContactsCanvasContainer.clientHeight);
});








}