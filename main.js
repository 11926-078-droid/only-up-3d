import * as THREE from 'three';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);
scene.fog = new THREE.Fog(0x1a1a1a, 100, 1000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 30;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Game state
let score = 0;
let cubes = [];
let gameActive = true;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Cube class
class Cube {
  constructor(number, x = 0, y = 0, z = 0) {
    this.number = number;
    this.geometry = new THREE.BoxGeometry(1 + number * 0.2, 1 + number * 0.2, 1 + number * 0.2);
    this.material = new THREE.MeshPhongMaterial({
      color: this.getColor(number),
      emissive: this.getEmissive(number)
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.userData = { cube: this };
    scene.add(this.mesh);
  }

  getColor(n) {
    const hue = (n % 10) * 0.1;
    return new THREE.Color().setHSL(hue, 0.7, 0.5);
  }

  getEmissive(n) {
    const hue = (n % 10) * 0.1;
    return new THREE.Color().setHSL(hue, 0.7, 0.3);
  }

  dispose() {
    scene.remove(this.mesh);
    this.geometry.dispose();
    this.material.dispose();
  }
}

// Initialize with some cubes
function initGame() {
  cubes = [];
  score = 0;
  gameActive = true;
  document.getElementById('gameOver').style.display = 'none';
  
  // Create initial cubes
  for (let i = 0; i < 5; i++) {
    const x = (Math.random() - 0.5) * 40;
    const y = (Math.random() - 0.5) * 40;
    cubes.push(new Cube(1, x, y, 0));
  }
}

// Merge cubes
function mergeCubes(cube1, cube2) {
  if (!gameActive) return;

  const newNumber = cube1.number + cube2.number;
  const newX = (cube1.mesh.position.x + cube2.mesh.position.x) / 2;
  const newY = (cube1.mesh.position.y + cube2.mesh.position.y) / 2;
  
  cube1.dispose();
  cube2.dispose();
  
  cubes = cubes.filter(c => c !== cube1 && c !== cube2);
  
  const newCube = new Cube(newNumber, newX, newY, 0);
  cubes.push(newCube);
  
  score += newNumber;
  document.getElementById('score').textContent = `Score: ${score}`;

  // Fail condition: too many cubes
  if (cubes.length > 50) {
    endGame();
  }
}

// End game
function endGame() {
  gameActive = false;
  document.getElementById('gameOver').style.display = 'block';
  document.getElementById('finalScore').textContent = `Final Score: ${score}`;
}

// Mouse click handler
window.addEventListener('click', (event) => {
  if (!gameActive) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  
  const meshes = cubes.map(c => c.mesh);
  const intersects = raycaster.intersectObjects(meshes);

  if (intersects.length > 0) {
    const clickedCube = intersects[0].object.userData.cube;
    
    // Find nearby cube to merge
    for (const cube of cubes) {
      if (cube !== clickedCube && cube.number === clickedCube.number) {
        const distance = clickedCube.mesh.position.distanceTo(cube.mesh.position);
        if (distance < 5) {
          mergeCubes(clickedCube, cube);
          break;
        }
      }
    }
  }
});

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Rotate cubes
  cubes.forEach(cube => {
    cube.mesh.rotation.x += 0.003;
    cube.mesh.rotation.y += 0.005;
  });

  renderer.render(scene, camera);
}

initGame();
animate();