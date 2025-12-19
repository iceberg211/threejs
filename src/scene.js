import * as BABYLON from '@babylonjs/core';

export async function createScene(canvas) {
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);

    // Dark background for Christmas night feel
    scene.clearColor = new BABYLON.Color4(0.05, 0.05, 0.1, 1);

    // Camera
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.inputs.removeByType("ArcRotateCameraMouseWheelInput"); // Disable zoom on scroll if we want gesture control priority
    // Re-add zoom if needed, or customize.

    // Lighting
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.5;

    // Glow Layer for magical effect
    const glowLayer = new BABYLON.GlowLayer("glow", scene);
    glowLayer.intensity = 1.2; // Boost glow

    // --- Interactive Elements ---

    // 1. 3D Hand Cursor
    // We'll project the 2D hand position onto a plane in front of the camera
    const cursor = BABYLON.MeshBuilder.CreateSphere("cursor", { diameter: 0.3 }, scene);
    const cursorMat = new BABYLON.StandardMaterial("cursorMat", scene);
    cursorMat.emissiveColor = new BABYLON.Color3(0, 1, 1); // Cyan glow
    cursorMat.disableLighting = true;
    cursor.material = cursorMat;
    cursor.position.z = 5; // Fixed depth for now
    cursor.isVisible = false; // Hidden until hand detected

    // 2. Firework System Helper
    const createFirework = (position, color) => {
        const fireworkSystem = new BABYLON.ParticleSystem("firework", 100, scene);
        fireworkSystem.particleTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/flare.png", scene);
        fireworkSystem.emitter = position;
        fireworkSystem.minEmitBox = new BABYLON.Vector3(0, 0, 0);
        fireworkSystem.maxEmitBox = new BABYLON.Vector3(0, 0, 0);

        fireworkSystem.color1 = color;
        fireworkSystem.color2 = new BABYLON.Color4(1, 1, 1, 1);
        fireworkSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);

        fireworkSystem.minSize = 0.2;
        fireworkSystem.maxSize = 0.5;
        fireworkSystem.minLifeTime = 0.5;
        fireworkSystem.maxLifeTime = 1.0;
        fireworkSystem.emitRate = 1000;
        fireworkSystem.burst(100); // One shot burst
        fireworkSystem.minEmitPower = 5;
        fireworkSystem.maxEmitPower = 10;
        fireworkSystem.updateSpeed = 0.01;

        // Manual dispose after animation
        setTimeout(() => {
            fireworkSystem.dispose();
        }, 1500);
    };

    // Create a particle system
    const particleSystem = new BABYLON.ParticleSystem("particles", 2000, scene);

    // Texture for particles (using a default flare or we can generate one)
    // Using a base64 generic particle texture to avoid external asset dependency issues for now
    const particleTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/flare.png", scene);
    particleSystem.particleTexture = particleTexture;

    // Colors - Christmas Theme (Green, Gold, Red mix)
    particleSystem.color1 = new BABYLON.Color4(0.1, 0.8, 0.1, 1.0);
    particleSystem.color2 = new BABYLON.Color4(0.8, 0.1, 0.1, 1.0);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);

    // Size
    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.3;

    // Lifetime
    particleSystem.minLifeTime = 2;
    particleSystem.maxLifeTime = 5;

    // Emission rate
    particleSystem.emitRate = 300;

    // Emitter shape - we want a cone/spiral
    // We will use a custom update function to position particles in a tree shape

    // Reset emitter to 0,0,0
    particleSystem.emitter = BABYLON.Vector3.Zero();

    // Start
    particleSystem.start();

    // Custom update function for Spiral Tree effect
    // We will manually manage a set of "persistent" particles or just use the standard system with custom start positions?
    // Standard system emits from a point/box. To get a stable tree shape that "sparkles", we might want a SolidParticleSystem or just trick the emitter.
    // Let's use a custom init function for positions.

    particleSystem.startPositionFunction = (worldMatrix, positionToUpdate, particle, isLocal) => {
        // Spiral logic
        // Height: 0 to 8
        const height = Math.random() * 8;
        // Radius decreases as height increases (Cone)
        const maxRadius = 3 * (1 - height / 8);
        const radius = Math.random() * maxRadius;

        // Angle depends on height to create spiral arms? Or just random for volume?
        // Let's do random angle for a full volume tree
        const angle = Math.random() * Math.PI * 2;

        positionToUpdate.x = radius * Math.cos(angle);
        positionToUpdate.y = height;
        positionToUpdate.z = radius * Math.sin(angle);
    };

    // Update function to adding rotation/swirl
    particleSystem.updateFunction = (particles) => {
        for (let index = 0; index < particles.length; index++) {
            const particle = particles[index];
            particle.age += particleSystem._scaledUpdateSpeed;

            // Rotate particles around Y axis
            const speed = 0.01;
            const x = particle.position.x;
            const z = particle.position.z;

            particle.position.x = x * Math.cos(speed) - z * Math.sin(speed);
            particle.position.z = x * Math.sin(speed) + z * Math.cos(speed);

            if (particle.age >= particle.lifeTime) {
                particleSystem.recycleParticle(particle);
                index--; // Correct the index
                continue;
            }
        }
    };

    // Tree rotation node (wrapper to rotate the whole tree easily)
    const treeRoot = new BABYLON.TransformNode("treeRoot", scene);
    // Note: ParticleSystem isn't a mesh, so it doesn't parent easily to a TransformNode for position updates in the same way.
    // But we can modify the emitter or the world matrix. 
    // For simplicity in this demo, we will rotate the Camera or modifying the particle logic based on input.

    // Let's add a Star on top
    const star = BABYLON.MeshBuilder.CreateSphere("star", { diameter: 0.5 }, scene);
    star.position.y = 8;
    const starMat = new BABYLON.StandardMaterial("starMat", scene);
    starMat.emissiveColor = new BABYLON.Color3(1, 1, 0);
    star.material = starMat;

    // Add point light at star
    const starLight = new BABYLON.PointLight("starLight", new BABYLON.Vector3(0, 8, 0), scene);
    starLight.diffuse = new BABYLON.Color3(1, 0.8, 0);
    starLight.intensity = 1.0;


    // --- Interface for Gestures ---

    function updateTree(gestureData) {
        if (!gestureData) return;

        // Example: If gesture has 'x' (0-1), rotate scene/camera
        if (gestureData.x !== undefined) {
            // Map 0-1 to rotation angle
            // Let's rotate the Camera alpha
            // Smooth lerp could be better, but direct map for now
            const targetAlpha = (gestureData.x - 0.5) * 4 * Math.PI; // -2PI to 2PI range approx

            // simple smooth follow
            camera.alpha += (targetAlpha - camera.alpha) * 0.05;
        }

        // Example: "Magic Sparkles" at finger position
        // We'd need to unproject 2D hand coordinates to 3D world, which is complex without depth.
        // For MVP, let's just control rotation.

        if (gestureData.gestureType === 'Pinch') {
            // Change color or scale?
            starMat.emissiveColor = new BABYLON.Color3(1, 0, 1); // Turn star purple
        } else {
            starMat.emissiveColor = new BABYLON.Color3(1, 1, 0); // Back to Gold
        }
    }

    return { engine, scene, updateTree };
}
