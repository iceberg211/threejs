import * as THREE from 'three';

// 场景、相机、渲染器是 Three.js 的三大核心组件

// 1. 创建场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

// 2. 创建相机（透视相机）
// 参数：视角(FOV)、宽高比、近裁剪面、远裁剪面
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 2, 5);
camera.lookAt(0, 0, 0);

// 3. 创建渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// 4. 添加光照
// 环境光（提供整体的柔和光照）
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// 方向光（模拟太阳光，可产生阴影）
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// 5. 创建立方体
// 几何体 + 材质 = 网格
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
    color: 0x00ff88,
    metalness: 0.3,
    roughness: 0.4
});
const cube = new THREE.Mesh(geometry, material);
cube.position.y = 0.5;
cube.castShadow = true;
scene.add(cube);

// 6. 创建地面
const groundGeometry = new THREE.PlaneGeometry(10, 10);
const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x808080,
    side: THREE.DoubleSide
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// 7. 添加网格辅助线（帮助理解3D空间）
const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

// 8. 响应窗口大小变化
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 9. 动画循环
function animate() {
    requestAnimationFrame(animate);

    // 让立方体旋转
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // 渲染场景
    renderer.render(scene, camera);
}

// 启动动画
animate();

console.log('Three.js demo 已启动！');
