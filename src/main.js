import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ==================== 1. 场景设置 ====================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);
scene.fog = new THREE.Fog(0x1a1a2e, 10, 50); // 添加雾效

// ==================== 2. 相机设置 ====================
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(8, 6, 8);
camera.lookAt(0, 0, 0);

// ==================== 3. 渲染器设置 ====================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 软阴影
document.getElementById('canvas-container').appendChild(renderer.domElement);

// ==================== 4. 添加 OrbitControls（鼠标控制） ====================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // 启用阻尼（惯性）
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 30;

// ==================== 5. 光照系统 ====================
// 环境光
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// 主方向光
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 15, 5);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -15;
directionalLight.shadow.camera.right = 15;
directionalLight.shadow.camera.top = 15;
directionalLight.shadow.camera.bottom = -15;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// 点光源（彩色光）
const pointLight1 = new THREE.PointLight(0xff0040, 1, 20);
pointLight1.position.set(-5, 3, -5);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0x0040ff, 1, 20);
pointLight2.position.set(5, 3, 5);
scene.add(pointLight2);

// ==================== 6. 创建纹理 ====================
// 创建一个简单的棋盘纹理
const textureCanvas = document.createElement('canvas');
textureCanvas.width = 256;
textureCanvas.height = 256;
const ctx = textureCanvas.getContext('2d');
const gridSize = 32;
for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
        ctx.fillStyle = (i + j) % 2 === 0 ? '#ffffff' : '#cccccc';
        ctx.fillRect(i * gridSize, j * gridSize, gridSize, gridSize);
    }
}
const checkerTexture = new THREE.CanvasTexture(textureCanvas);
checkerTexture.wrapS = THREE.RepeatWrapping;
checkerTexture.wrapT = THREE.RepeatWrapping;
checkerTexture.repeat.set(2, 2);

// ==================== 7. 创建多种几何体 ====================
const meshes = []; // 存储所有需要动画的物体

// 7.1 立方体（带纹理）
const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.5, 1.5),
    new THREE.MeshStandardMaterial({
        map: checkerTexture,
        metalness: 0.2,
        roughness: 0.4
    })
);
cube.position.set(-3, 1.5, -3);
cube.castShadow = true;
scene.add(cube);
meshes.push({ mesh: cube, rotationSpeed: { x: 0.01, y: 0.015, z: 0 } });

// 7.2 球体（金属材质）
const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshStandardMaterial({
        color: 0xff6b6b,
        metalness: 0.8,
        roughness: 0.2
    })
);
sphere.position.set(3, 1.5, -3);
sphere.castShadow = true;
scene.add(sphere);
meshes.push({ mesh: sphere, rotationSpeed: { x: 0.005, y: 0.01, z: 0 }, bounce: true });

// 7.3 圆锥体（发光材质）
const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.8, 2, 32),
    new THREE.MeshStandardMaterial({
        color: 0x4ecdc4,
        emissive: 0x4ecdc4,
        emissiveIntensity: 0.3,
        metalness: 0.5,
        roughness: 0.3
    })
);
cone.position.set(-3, 1.5, 3);
cone.castShadow = true;
scene.add(cone);
meshes.push({ mesh: cone, rotationSpeed: { x: 0, y: 0.02, z: 0 } });

// 7.4 圆柱体（粗糙材质）
const cylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 0.8, 2, 32),
    new THREE.MeshStandardMaterial({
        color: 0xf9ca24,
        metalness: 0.1,
        roughness: 0.8
    })
);
cylinder.position.set(3, 1.5, 3);
cylinder.castShadow = true;
scene.add(cylinder);
meshes.push({ mesh: cylinder, rotationSpeed: { x: 0.01, y: 0.01, z: 0.01 } });

// 7.5 圆环（线框材质）
const torus = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.4, 16, 100),
    new THREE.MeshStandardMaterial({
        color: 0x95e1d3,
        metalness: 0.6,
        roughness: 0.2,
        wireframe: false
    })
);
torus.position.set(0, 1.5, 0);
torus.castShadow = true;
scene.add(torus);
meshes.push({ mesh: torus, rotationSpeed: { x: 0.02, y: 0.03, z: 0.01 } });

// 7.6 八面体（半透明材质）
const octahedron = new THREE.Mesh(
    new THREE.OctahedronGeometry(1),
    new THREE.MeshStandardMaterial({
        color: 0xa29bfe,
        metalness: 0.3,
        roughness: 0.3,
        transparent: true,
        opacity: 0.8
    })
);
octahedron.position.set(0, 3.5, -5);
octahedron.castShadow = true;
scene.add(octahedron);
meshes.push({ mesh: octahedron, rotationSpeed: { x: 0.015, y: 0.015, z: 0.015 }, float: true });

// ==================== 8. 创建地面 ====================
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({
        color: 0x2d3436,
        metalness: 0.1,
        roughness: 0.8
    })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// 添加网格辅助线
const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x333333);
scene.add(gridHelper);

// ==================== 9. 添加粒子系统 ====================
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 500;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 30;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.05,
    color: 0x88ccff,
    transparent: true,
    opacity: 0.6
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// ==================== 10. 响应窗口大小变化 ====================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
});

// ==================== 11. 动画循环 ====================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // 更新控制器
    controls.update();

    // 动画所有几何体
    meshes.forEach((item, index) => {
        const { mesh, rotationSpeed, bounce, float } = item;

        // 旋转动画
        mesh.rotation.x += rotationSpeed.x;
        mesh.rotation.y += rotationSpeed.y;
        mesh.rotation.z += rotationSpeed.z;

        // 弹跳动画
        if (bounce) {
            mesh.position.y = 1.5 + Math.sin(elapsedTime * 2) * 0.5;
        }

        // 浮动动画
        if (float) {
            mesh.position.y = 3.5 + Math.sin(elapsedTime * 1.5 + index) * 0.3;
        }
    });

    // 粒子旋转
    particlesMesh.rotation.y = elapsedTime * 0.05;

    // 点光源动画（圆周运动）
    pointLight1.position.x = Math.sin(elapsedTime) * 8;
    pointLight1.position.z = Math.cos(elapsedTime) * 8;

    pointLight2.position.x = Math.sin(elapsedTime + Math.PI) * 8;
    pointLight2.position.z = Math.cos(elapsedTime + Math.PI) * 8;

    // 渲染场景
    renderer.render(scene, camera);
}

// 启动动画
animate();

console.log('🎨 Three.js 丰富场景已启动！');
console.log('💡 提示：使用鼠标拖拽旋转视角，滚轮缩放');
