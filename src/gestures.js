import { Hands } from '@mediapipe/hands';
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
        maxNumHands: 2, // 支持双手检测以实现缩放
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    // 用于平滑手势数据
    let smoothedZoom = 0;
    let lastPinchState = false;
    let lastTwoHandsDistance = null;

    hands.onResults((results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];

            // 基础手势数据
            const indexTip = landmarks[8];
            const thumbTip = landmarks[4];
            const palmBase = landmarks[0];
            const middleTip = landmarks[12];

            // 1. 计算手掌大小（用于单手缩放）
            const handSpan = Math.hypot(
                landmarks[0].x - landmarks[9].x,
                landmarks[0].y - landmarks[9].y
            );

            // 2. 检测捏合手势（拇指和食指）
            const pinchDistance = Math.hypot(
                indexTip.x - thumbTip.x,
                indexTip.y - thumbTip.y
            );
            const isPinching = pinchDistance < 0.05;

            // 3. 双手缩放检测
            let twoHandsZoom = null;
            if (results.multiHandLandmarks.length === 2) {
                const hand1Center = landmarks[9]; // 手掌中心
                const hand2Center = results.multiHandLandmarks[1][9];

                const twoHandsDistance = Math.hypot(
                    hand1Center.x - hand2Center.x,
                    hand1Center.y - hand2Center.y
                );

                if (lastTwoHandsDistance !== null) {
                    // 计算距离变化率
                    const distanceChange = twoHandsDistance - lastTwoHandsDistance;
                    twoHandsZoom = distanceChange * 10; // 放大变化幅度
                }
                lastTwoHandsDistance = twoHandsDistance;
            } else {
                lastTwoHandsDistance = null;
            }

            // 4. 手掌开合程度（用于单手缩放）
            // 计算拇指到小指的距离
            const openness = Math.hypot(
                thumbTip.x - landmarks[20].x, // 小指尖
                thumbTip.y - landmarks[20].y
            );

            // 归一化到合理范围 (0.05-0.5)
            const normalizedOpenness = Math.max(0, Math.min(1, (openness - 0.05) / 0.45));

            // 5. 位置数据（用于旋转）
            const x = 1 - indexTip.x; // 翻转以获得镜像效果
            const y = indexTip.y;

            // 6. 计算旋转速度
            let rotationSpeed = 0;
            if (x < 0.4) rotationSpeed = (x - 0.4) * 2; // -0.8 to 0
            if (x > 0.6) rotationSpeed = (x - 0.6) * 2; // 0 to 0.8

            // 7. 缩放控制（优先使用双手，其次单手开合）
            let zoomDelta = 0;
            if (twoHandsZoom !== null) {
                // 双手缩放
                zoomDelta = twoHandsZoom;
            } else {
                // 单手开合缩放
                zoomDelta = (normalizedOpenness - 0.5) * 0.3;
            }

            // 平滑缩放值
            smoothedZoom += (zoomDelta - smoothedZoom) * 0.1;

            // 8. 检测捏合状态变化（用于触发烟花）
            const pinchTriggered = isPinching && !lastPinchState;
            lastPinchState = isPinching;

            // 发送完整的手势数据
            onGesture({
                cursor: { x, y }, // 原始0-1位置用于UI光标
                rotationSpeed: rotationSpeed, // -1到1的旋转控制
                zoom: smoothedZoom, // 缩放增量
                zoomAbsolute: normalizedOpenness, // 绝对开合度 0-1
                pinch: isPinching,
                pinchTriggered: pinchTriggered,
                gestureType: isPinching ? 'Pinch' : 'Open',
                handSpan: handSpan,
                handsCount: results.multiHandLandmarks.length,
                // 3D位置估计（简化版）
                position3D: {
                    x: (x - 0.5) * 10,
                    y: (0.5 - y) * 10,
                    z: handSpan * 20 - 5
                }
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

    console.log('✋ 手势识别已启动！');
    console.log('👆 单手：开合控制缩放');
    console.log('🤲 双手：双手距离控制缩放');
    console.log('🤏 捏合：触发特效');
}
