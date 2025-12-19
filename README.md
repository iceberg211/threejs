# Three.js 学习项目

这是一个基础的 Three.js 学习项目，使用 pnpm 作为包管理工具。

## 启动项目

```bash
# 安装依赖（如果还没安装）
pnpm install

# 启动开发服务器
pnpm dev
```

启动后，在浏览器中打开显示的地址（通常是 http://localhost:5173）

## 项目结构

```
threejs/
├── src/
│   └── main.js       # Three.js 主代码
├── index.html        # HTML 入口文件
├── package.json      # 项目配置
└── README.md         # 项目说明
```

## Three.js 基础概念

### 三大核心组件

1. **场景 (Scene)** - 所有 3D 对象的容器
2. **相机 (Camera)** - 定义观察视角
3. **渲染器 (Renderer)** - 将场景渲染到页面上

### 当前 Demo 包含

- **立方体 (Cube)** - 一个旋转的绿色立方体
- **光照 (Lights)** - 环境光 + 方向光
- **地面 (Ground)** - 一个平面作为地板
- **网格辅助线 (GridHelper)** - 帮助理解 3D 空间

## 学习建议

1. 修改 `src/main.js` 中的参数，观察效果变化
2. 尝试改变立方体的颜色 (`color` 属性)
3. 调整相机位置 (`camera.position.set()`)
4. 修改旋转速度 (`cube.rotation` 的增量值)

## 其他命令

```bash
# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

## 下一步学习

- 添加更多几何体（球体、圆柱体等）
- 加载外部 3D 模型
- 添加鼠标交互控制（OrbitControls）
- 学习材质和纹理
