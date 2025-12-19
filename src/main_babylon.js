
import { createScene } from './scene';
import { initializeGestures } from './gestures';

async function main() {
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.id = 'renderCanvas';
    document.body.appendChild(canvas);

    // Initialize Babylon.js Scene
    const { engine, scene, updateTree } = await createScene(canvas);

    // Initialize Gesture Recognition
    await initializeGestures((gestureData) => {
        // gestureData: { x, y, gestureType }
        updateTree(gestureData);
    });

    // Render Loop
    engine.runRenderLoop(() => {
        scene.render();
    });

    // Resize Handling
    window.addEventListener('resize', () => {
        engine.resize();
    });
}

main().catch(console.error);
