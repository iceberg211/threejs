import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

export async function initializeGestures(onGesture) {
    const videoElement = document.createElement('video');
    videoElement.style.display = 'none';
    document.body.appendChild(videoElement);

    const hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    hands.onResults((results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];

            // Logic to interpret gestures
            // 1. Position: Index finger tip (ID: 8)
            const indexTip = landmarks[8];
            const thumbTip = landmarks[4];

            // 2. Detect Pinch (Thumb tip close to Index tip)
            const distance = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
            const isPinching = distance < 0.05;

            // Call callback with enhanced data
            // MediaPipe x is 0(left) to 1(right). 
            const x = 1 - indexTip.x; // Flip for mirror effect
            const y = indexTip.y;

            // "Joystick" logic: value from -1 (left) to 1 (right)
            // Deadzone in the middle (0.4 - 0.6)
            let rotationSpeed = 0;
            if (x < 0.4) rotationSpeed = (x - 0.4) * 2; // -0.8 to 0
            if (x > 0.6) rotationSpeed = (x - 0.6) * 2; // 0 to 0.8

            onGesture({
                cursor: { x, y }, // Raw 0-1 position for UI cursor
                rotationSpeed: rotationSpeed, // -1 to 1 control value
                pinch: isPinching,
                gestureType: isPinching ? 'Pinch' : 'Open'
            });
        }
    });

    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        width: 640,
        height: 480
    });

    await camera.start();
}
