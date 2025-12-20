import * as BABYLON from '@babylonjs/core';

export async function createScene(canvas) {
    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    const scene = new BABYLON.Scene(engine);

    // 深色背景营造圣诞夜晚氛围
    scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.08, 1);

    // 相机设置 - 调整目标为树的中心
    const camera = new BABYLON.ArcRotateCamera(
        "camera",
        -Math.PI / 2,
        Math.PI / 2.2, // 更平视的角度
        18, // 稍微拉远一点
        new BABYLON.Vector3(0, 4, 0), // 目标锁定在树的中心高度 (0, 4, 0)
        scene
    );
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 30;
    camera.inputs.removeByType("ArcRotateCameraMouseWheelInput");

    // ... (Light setup remains same) ...
    // 光照系统
    const ambientLight = new BABYLON.HemisphericLight("ambient", new BABYLON.Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.3;

    // 方向光
    const directionalLight = new BABYLON.DirectionalLight("dir", new BABYLON.Vector3(-1, -2, -1), scene);
    directionalLight.intensity = 0.5;

    // 辉光效果
    const glowLayer = new BABYLON.GlowLayer("glow", scene);
    glowLayer.intensity = 1.5;

    // ==================== 增强的粒子系统 ====================

    // 全局呼吸因子 (由手势控制)
    let globalBreathingFactor = 0; // -1 (收缩) 到 1 (扩张)

    // 1. 主圣诞树粒子系统
    const treeParticles = new BABYLON.ParticleSystem("treeParticles", 4000, scene); // 增加粒子数
    treeParticles.particleTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/flare.png", scene);

    // ... (Colors remain same) ...
    treeParticles.color1 = new BABYLON.Color4(0.1, 0.9, 0.1, 1.0);
    treeParticles.color2 = new BABYLON.Color4(0.9, 0.7, 0.1, 1.0);
    treeParticles.colorDead = new BABYLON.Color4(0.2, 0.2, 0.4, 0.0);

    treeParticles.minSize = 0.08;
    treeParticles.maxSize = 0.25;
    treeParticles.minLifeTime = 3;
    treeParticles.maxLifeTime = 6;
    treeParticles.emitRate = 800; // 增加发射率
    treeParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    treeParticles.emitter = BABYLON.Vector3.Zero();

    // 存储粒子的初始半径，用于呼吸效果
    // Babylon粒子系统不直接支持自定义属性存储在粒子对象上用于updateFunction
    // 我们使用一种数学方法：在 updateFunction 中根据粒子位置反推原始半径，或者
    // 使用 CustomParticleSystem (SPS) 会更灵活，但为了保持现有结构，我们用数学近似。
    // 更好的方法：利用 updateFunction 的逻辑。

    treeParticles.startPositionFunction = (worldMatrix, positionToUpdate, particle) => {
        const height = Math.random() * 8;
        const maxRadius = 3.5 * (1 - height / 8);
        const radius = Math.random() * maxRadius;
        const angle = Math.random() * Math.PI * 2;

        positionToUpdate.x = radius * Math.cos(angle);
        positionToUpdate.y = height;
        positionToUpdate.z = radius * Math.sin(angle);

        // 我们可以将 "原始半径" 编码到粒子的某个未使用的属性中吗？
        // 或者简单点：呼吸效果就是基于当前高度计算最大半径，然后应用乘数。
        // 但我们需要粒子 "记住" 它是内部粒子还是外部粒子。
        // Trick: 将 normalized radius (r / maxR_at_height) 存储在 angle (impossible)
        // 让我们只做基于高度的整体扩张，这看起来已经很酷了。
    };

    treeParticles.updateFunction = (particles) => {
        for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];
            particle.age += treeParticles._scaledUpdateSpeed;

            // 基础旋转
            const rotSpeed = 0.008;
            let x = particle.position.x;
            let z = particle.position.z;
            const y = particle.position.y;

            // 恢复原始半径 (近似)
            // 先逆向旋转? 不，直接算当前半径
            const currentRadius = Math.sqrt(x * x + z * z);
            let angle = Math.atan2(z, x);

            // 应用旋转
            angle += rotSpeed;

            // 计算该高度下的参考最大半径
            const maxRadiusAtHeight = 3.5 * (1 - y / 8);

            // 呼吸逻辑:
            // 扩张: 半径简单放大
            // 收缩: 半径缩小
            // 为了让它平滑，我们基于 globalBreathingFactor 调整 radius
            // globalBreathingFactor: 0=正常, 1=放大2倍, -1=缩小到0

            let targetRadius = currentRadius;

            // 这是一个持续的过程，为了防止粒子无限飞出去，我们不能在这个循环里累加半径
            // 我们必须基于 "原始位置" 计算，但没存原始位置。
            // 替代方案：在每一帧，我们把粒子 "推" 向目标半径
            // 或者，简单的视觉欺骗：只改变显示的半径？不行，得改位置。

            // 改进方案：
            // 假设当前位置是 "基准"，我们添加一个偏移量？
            // 不，最稳定的方式是：粒子系统只负责产生基准形态。
            // 但标准粒子系统 updateFunction 很难做到这一点而不发散。

            // 让我们尝试一种流动力场 (Flow Field) 的感觉：
            // 如果 factor > 0 (扩张)，给予一个远离 Y 轴的速度
            // 如果 factor < 0 (收缩)，给予一个指向 Y 轴的速度
            // 同时增加阻力防止失控

            // 径向向量 (Normalized)
            const dirX = x / (currentRadius + 0.001);
            const dirZ = z / (currentRadius + 0.001);

            // 径向速度控制
            let radialVelocity = 0;
            if (globalBreathingFactor > 0.1) {
                // 扩张：推出去，但在外围减速
                radialVelocity = 0.05 * globalBreathingFactor;
            } else if (globalBreathingFactor < -0.1) {
                // 收缩：吸回来
                radialVelocity = 0.05 * globalBreathingFactor;
            } else {
                // 回归平衡 (这很难，因为不知道平衡点)
                // 索性只做 "扩张/收缩" 的动态，不做绝对位置锁定
                radialVelocity = 0;
            }

            // 限制：不要让粒子跑到太远或太近(穿模)
            const nextRadius = currentRadius + radialVelocity;

            // 强力约束：如果收缩模式，且半径很小，就停止收缩
            // 如果扩张模式，且半径超过最大值*2，停止
            if (nextRadius < 0.2 && radialVelocity < 0) radialVelocity = 0;
            if (nextRadius > maxRadiusAtHeight * 2.5 && radialVelocity > 0) radialVelocity = 0;

            // 更新位置
            particle.position.x = (currentRadius + radialVelocity) * Math.cos(angle);
            particle.position.z = (currentRadius + radialVelocity) * Math.sin(angle);

            // 闪烁效果
            const twinkle = Math.sin(particle.age * 3 + particle.id * 0.5) * 0.5 + 0.5;
            particle.color.a = twinkle * 0.8;

            if (particle.age >= particle.lifeTime) {
                treeParticles.recycleParticle(particle);
                i--;
            }
        }
    };

    // ... Ornament particles need similar logic ...
    // 为了代码简洁，我们先把装饰球粒子 updateFunction 也改了
    // 或者我们直接在 updateTree 里统一设置一个全局变量，让 updateFunction 读取

    treeParticles.start();

    // 2. 装饰球粒子系统 (简化逻辑，跟随主树)
    const ornamentParticles = new BABYLON.ParticleSystem("ornaments", 800, scene);
    ornamentParticles.particleTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/flare.png", scene);
    // ... Color/Size config ...
    ornamentParticles.color1 = new BABYLON.Color4(1.0, 0.1, 0.1, 1.0);
    ornamentParticles.color2 = new BABYLON.Color4(1.0, 0.3, 0.3, 1.0);
    ornamentParticles.colorDead = new BABYLON.Color4(0.5, 0, 0, 0);
    ornamentParticles.minSize = 0.15;
    ornamentParticles.maxSize = 0.3;
    ornamentParticles.minLifeTime = 4;
    ornamentParticles.maxLifeTime = 8;
    ornamentParticles.emitRate = 150;
    ornamentParticles.emitter = BABYLON.Vector3.Zero();

    ornamentParticles.startPositionFunction = (worldMatrix, positionToUpdate) => {
        const height = Math.random() * 7 + 0.5;
        const maxRadius = 3 * (1 - height / 8);
        const radius = maxRadius * 0.7;
        const angle = Math.random() * Math.PI * 2;
        positionToUpdate.x = radius * Math.cos(angle);
        positionToUpdate.y = height;
        positionToUpdate.z = radius * Math.sin(angle);
    };

    ornamentParticles.updateFunction = (particles) => {
        for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];
            particle.age += ornamentParticles._scaledUpdateSpeed;

            const rotSpeed = 0.008;
            const x = particle.position.x;
            const z = particle.position.z;
            const currentRadius = Math.sqrt(x * x + z * z);
            let angle = Math.atan2(z, x) + rotSpeed;

            // 简单的跟随扩张/收缩
            let radialVelocity = 0;
            if (globalBreathingFactor > 0.1) radialVelocity = 0.05 * globalBreathingFactor;
            else if (globalBreathingFactor < -0.1) radialVelocity = 0.05 * globalBreathingFactor;

            particle.position.x = (currentRadius + radialVelocity) * Math.cos(angle);
            particle.position.z = (currentRadius + radialVelocity) * Math.sin(angle);
            particle.position.y += Math.sin(particle.age * 0.5) * 0.002;

            if (particle.age >= particle.lifeTime) {
                ornamentParticles.recycleParticle(particle);
                i--;
            }
        }
    };

    ornamentParticles.start();

    // 3. 环境雪花粒子
    const snowParticles = new BABYLON.ParticleSystem("snow", 1000, scene);
    snowParticles.particleTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/flare.png", scene);
    snowParticles.color1 = new BABYLON.Color4(0.9, 0.9, 1.0, 0.6);
    snowParticles.color2 = new BABYLON.Color4(1.0, 1.0, 1.0, 0.8);
    snowParticles.colorDead = new BABYLON.Color4(0.7, 0.7, 0.8, 0);

    snowParticles.minSize = 0.05;
    snowParticles.maxSize = 0.15;
    snowParticles.minLifeTime = 5;
    snowParticles.maxLifeTime = 10;
    snowParticles.emitRate = 100;

    // 从顶部大范围发射
    snowParticles.emitter = new BABYLON.Vector3(0, 12, 0);
    snowParticles.minEmitBox = new BABYLON.Vector3(-8, 0, -8);
    snowParticles.maxEmitBox = new BABYLON.Vector3(8, 0, 8);

    snowParticles.direction1 = new BABYLON.Vector3(-0.5, -1, -0.5);
    snowParticles.direction2 = new BABYLON.Vector3(0.5, -1, 0.5);
    snowParticles.minEmitPower = 0.5;
    snowParticles.maxEmitPower = 1;
    snowParticles.gravity = new BABYLON.Vector3(0, -0.5, 0);

    snowParticles.start();

    // ==================== 3D手部光标 ====================
    const cursor = BABYLON.MeshBuilder.CreateSphere("cursor", { diameter: 0.4, segments: 16 }, scene);
    const cursorMat = new BABYLON.StandardMaterial("cursorMat", scene);
    cursorMat.emissiveColor = new BABYLON.Color3(0, 1, 1);
    cursorMat.disableLighting = true;
    cursor.material = cursorMat;
    cursor.isVisible = false;

    // 光标拖尾效果
    const cursorTrail = new BABYLON.ParticleSystem("cursorTrail", 300, scene);
    cursorTrail.particleTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/flare.png", scene);
    cursorTrail.emitter = cursor;
    cursorTrail.color1 = new BABYLON.Color4(0, 1, 1, 0.8);
    cursorTrail.color2 = new BABYLON.Color4(0.5, 1, 1, 0.6);
    cursorTrail.colorDead = new BABYLON.Color4(0, 0.5, 0.5, 0);
    cursorTrail.minSize = 0.1;
    cursorTrail.maxSize = 0.2;
    cursorTrail.minLifeTime = 0.3;
    cursorTrail.maxLifeTime = 0.6;
    cursorTrail.emitRate = 200;
    cursorTrail.minEmitPower = 0;
    cursorTrail.maxEmitPower = 0.5;
    cursorTrail.start();

    // ==================== 树顶星星 ====================
    const star = BABYLON.MeshBuilder.CreateSphere("star", { diameter: 0.6, segments: 16 }, scene);
    star.position.y = 8.5;
    const starMat = new BABYLON.StandardMaterial("starMat", scene);
    starMat.emissiveColor = new BABYLON.Color3(1, 0.9, 0.1);
    starMat.disableLighting = true;
    star.material = starMat;

    // 星星点光源
    const starLight = new BABYLON.PointLight("starLight", new BABYLON.Vector3(0, 8.5, 0), scene);
    starLight.diffuse = new BABYLON.Color3(1, 0.9, 0.2);
    starLight.intensity = 2.0;
    starLight.range = 15;

    // 星星旋转动画
    scene.registerBeforeRender(() => {
        star.rotation.y += 0.02;
        // 星星脉动效果
        const pulse = Math.sin(Date.now() * 0.003) * 0.2 + 1;
        star.scaling.setAll(pulse);
        starLight.intensity = 1.5 + pulse * 0.5;
    });

    // ==================== 烟花系统 ====================
    const createFirework = (position, color) => {
        const firework = new BABYLON.ParticleSystem("firework", 150, scene);
        firework.particleTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/flare.png", scene);
        firework.emitter = position.clone();
        firework.minEmitBox = new BABYLON.Vector3(0, 0, 0);
        firework.maxEmitBox = new BABYLON.Vector3(0, 0, 0);

        firework.color1 = color;
        firework.color2 = new BABYLON.Color4(1, 1, 1, 1);
        firework.colorDead = new BABYLON.Color4(color.r, color.g, color.b, 0);

        firework.minSize = 0.15;
        firework.maxSize = 0.4;
        firework.minLifeTime = 0.4;
        firework.maxLifeTime = 1.2;
        firework.emitRate = 2000;

        firework.minEmitPower = 3;
        firework.maxEmitPower = 8;
        firework.updateSpeed = 0.015;
        firework.gravity = new BABYLON.Vector3(0, -5, 0);

        firework.disposeOnStop = true;
        firework.targetStopDuration = 0.2;
        firework.start();

        setTimeout(() => {
            firework.stop();
        }, 100);
    };

    // ==================== 手势更新函数 ====================
    let lastZoom = 0;
    let fireworkCooldown = 0;

    function updateTree(gestureData) {
        if (!gestureData) return;

        // 更新光标位置
        if (gestureData.position3D) {
            cursor.isVisible = true;
            cursor.position.x = gestureData.position3D.x * 0.5;
            cursor.position.y = gestureData.position3D.y * 0.5 + 4;
            cursor.position.z = gestureData.position3D.z * 0.3;
        }

        // 旋转控制（平滑）
        if (gestureData.rotationSpeed !== undefined) {
            camera.alpha += gestureData.rotationSpeed * 0.02;
        }

        // 缩放控制（新功能！）
        if (gestureData.zoom !== undefined) {
            const zoomSpeed = 15;
            const targetRadius = camera.radius - gestureData.zoom * zoomSpeed;
            camera.radius += (targetRadius - camera.radius) * 0.1;

            // 限制缩放范围
            camera.radius = Math.max(camera.lowerRadiusLimit, Math.min(camera.upperRadiusLimit, camera.radius));
        }

        // 单手开合度 - 控制粒子树呼吸
        if (gestureData.zoomAbsolute !== undefined) {
            const openness = gestureData.zoomAbsolute; // 0 (closed) to 1 (open)

            // Map openness to breathing factor
            // Open (1.0) -> Expand (0.8)
            // Neutral (0.5) -> Normal (0)
            // Closed (0.0) -> Contract (-0.8)

            // 使用平滑过渡
            const targetFactor = (openness - 0.5) * 2.0; // -1 to 1

            globalBreathingFactor += (targetFactor - globalBreathingFactor) * 0.1;

            // 改变光标大小显示开合度
            cursor.scaling.setAll(0.5 + openness * 1.5);

            // 根据开合度改变光标颜色
            cursorMat.emissiveColor = new BABYLON.Color3(
                openness,
                1 - openness * 0.5,
                1
            );
        }

        // 捏合手势触发烟花
        if (gestureData.pinchTriggered && fireworkCooldown <= 0) {
            const colors = [
                new BABYLON.Color4(1, 0.2, 0.2, 1), // 红
                new BABYLON.Color4(0.2, 1, 0.2, 1), // 绿
                new BABYLON.Color4(0.2, 0.2, 1, 1), // 蓝
                new BABYLON.Color4(1, 1, 0.2, 1),   // 黄
                new BABYLON.Color4(1, 0.2, 1, 1)    // 紫
            ];

            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const fireworkPos = cursor.position.clone();
            createFirework(fireworkPos, randomColor);

            // 星星颜色变化
            starMat.emissiveColor = new BABYLON.Color3(randomColor.r, randomColor.g, randomColor.b);
            setTimeout(() => {
                starMat.emissiveColor = new BABYLON.Color3(1, 0.9, 0.1);
            }, 500);

            fireworkCooldown = 30; // 冷却时间（帧数）
        }

        // 冷却倒计时
        if (fireworkCooldown > 0) fireworkCooldown--;

        // 显示手势状态
        if (gestureData.handsCount === 2) {
            // 双手模式 - 增强效果
            treeParticles.emitRate = 500;
            ornamentParticles.emitRate = 200;
        } else {
            treeParticles.emitRate = 400;
            ornamentParticles.emitRate = 150;
        }
    }

    return { engine, scene, updateTree };
}
