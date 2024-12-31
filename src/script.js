import * as THREE from 'three';
import {GUI} from 'dat.gui';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';
import {FilmPass} from 'three/examples/jsm/postprocessing/FilmPass'; // Additional postprocessing effect
import vertex from './shaders/particles/vertex.glsl';
import fragment from './shaders/particles/fragment.glsl';

// Initialize renderer with antialiasing enabled for sharp rendering
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
	45,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
);

// Parameters for GUI controls
const params = {
	red: 1.0,
	green: 1.0,
	blue: 1.0,
	strength: 0.10,
	radius: 0.8,
	glitchEnabled: false // Glitch pass disabled by default
}

// Set renderer color space
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Postprocessing passes
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight));
bloomPass.strength = params.strength;
bloomPass.radius = params.radius;

const filmPass = new FilmPass(0.35, 0.025, 648, false); // Additional postprocessing effect

const glitchPass = new GlitchPass(); // Initialize GlitchPass

const bloomComposer = new EffectComposer(renderer);
bloomComposer.addPass(renderScene);
bloomComposer.addPass(bloomPass);
bloomComposer.addPass(filmPass); // Add the new postprocessing effect
if (params.glitchEnabled) {
	bloomComposer.addPass(glitchPass); // Add GlitchPass to the composer
}

const outputPass = new OutputPass();
bloomComposer.addPass(outputPass);

// Set camera position
camera.position.set(0, -2, 25);
camera.lookAt(0, 0, 0);

// Load texture
const textureLoader = new THREE.TextureLoader();
const uniforms = {
	u_time: {type: 'f', value: 0.0},
	u_frequency: {type: 'f', value: 0.0},
	u_red: {type: 'f', value: 1.0},
	u_green: {type: 'f', value: 1.0},
	u_blue: {type: 'f', value: 1.0},
	u_picture: {value: textureLoader.load('./linkinpark.png')},
	u_resolution: {value: new THREE.Vector2(window.innerWidth, window.innerHeight)}
}

// Create shader material
const mat = new THREE.ShaderMaterial({
	uniforms,
	vertexShader: vertex,
	fragmentShader: fragment,
	blending: THREE.AdditiveBlending,
	transparent: true
});

// Create geometry and mesh
const geo = new THREE.PlaneGeometry(10, 10, 1024, 1024);
const mesh = new THREE.Points(geo, mat);
scene.add(mesh);
mesh.material.wireframe = false;

// Audio setup
const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load('./linkinpark.mp3', function(buffer) {
	sound.setBuffer(buffer);
});

const analyser = new THREE.AudioAnalyser(sound, 2048);

// GUI setup
const gui = new GUI();
const colorsFolder = gui.addFolder('Colors');
colorsFolder.add(params, 'red', 0, 1).onChange(value => uniforms.u_red.value = Number(value));
colorsFolder.add(params, 'green', 0, 1).onChange(value => uniforms.u_green.value = Number(value));
colorsFolder.add(params, 'blue', 0, 1).onChange(value => uniforms.u_blue.value = Number(value));

const bloomFolder = gui.addFolder('Bloom');
bloomFolder.add(params, 'strength', 0, 1, 0.1).onChange(value => bloomPass.strength = Number(value));
bloomFolder.add(params, 'radius', 0, 1, 0.1).onChange(value => bloomPass.radius = Number(value));

const glitchFolder = gui.addFolder('Glitch');
glitchFolder.add(params, 'glitchEnabled').onChange(value => {
	params.glitchEnabled = value;
	if (value) {
		bloomComposer.addPass(glitchPass);
	} else {
		bloomComposer.removePass(glitchPass);
	}
});

// Mouse movement event listener
let mouseX = 0;
let mouseY = 0;
document.addEventListener('mousemove', e => {
	const windowHalfX = window.innerWidth / 2;
	const windowHalfY = window.innerHeight / 2;
	mouseX = (e.clientX - windowHalfX) / 100;
	mouseY = (e.clientY - windowHalfY) / 100;
});

// Play and pause buttons
const playButton = document.createElement('button');
playButton.innerText = 'Play';
playButton.style.position = 'absolute';
playButton.style.bottom = '10%';
playButton.style.left = '46%';
playButton.style.transform = 'translateX(-50%)';
playButton.style.textShadow = '0 0 10px #fff, 0 0 20px #fff, 0 0 30px #fff, 0 0 40px #fff, 0 0 70px #fff, 0 0 80px #fff, 0 0 100px #fff, 0 0 150px #fff';
playButton.style.padding = '5px'; // Changed padding to 5px
document.body.appendChild(playButton);

const pauseButton = document.createElement('button');
pauseButton.innerText = 'Pause';
pauseButton.style.position = 'absolute';
pauseButton.style.bottom = '10%';
pauseButton.style.left = '54%';
pauseButton.style.transform = 'translateX(-50%)';
pauseButton.style.textShadow = '0 0 10px #fff, 0 0 20px #fff, 0 0 30px #fff, 0 0 40px #fff, 0 0 70px #fff, 0 0 80px #fff, 0 0 100px #fff, 0 0 150px #fff';
pauseButton.style.padding = '5px'; // Changed padding to 5px
document.body.appendChild(pauseButton);

playButton.addEventListener('click', () => {
	if (!sound.isPlaying) {
		sound.play();
	}
});

pauseButton.addEventListener('click', () => {
	if (sound.isPlaying) {
		sound.pause();
	}
});

// Animation loop
const clock = new THREE.Clock();
function animate() {
	camera.position.x += (mouseX - camera.position.x) * .05;
	camera.position.y += (-mouseY - camera.position.y) * 0.5;
	camera.lookAt(scene.position);
	uniforms.u_time.value = clock.getElapsedTime();
	uniforms.u_frequency.value = analyser.getAverageFrequency();
    bloomComposer.render();
	requestAnimationFrame(animate);
}
animate();

// Window resize event listener
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
	bloomComposer.setSize(window.innerWidth, window.innerHeight);
	uniforms.u_resolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
});