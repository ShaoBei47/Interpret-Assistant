# Interpret-Assistant — 英语影子跟读

纯浏览器端英语跟读练习工具。上传音频 → 自动识别原文 → 播放+录音跟读 → 评分反馈。

## 快速开始

双击 `start.bat`，或手动运行：

```bash
# Python
python -m http.server 8000

# 或 Node.js
npx serve src/
```

浏览器打开 `http://localhost:8000/src/index.html`

## 使用流程

1. **上传音频** — 展开「上传自己的音频」，选择 `mp3/wav` 等文件
2. **识别原文**（可选）— 点击「🎤 识别原文文本」，Whisper 模型在浏览器本地识别
3. **调整倍速**（可选）— 播放器右侧下拉选 `0.5x ~ 2x`
4. **开始跟读** — 点击「开始练习」，自动播放 + 录音 + 评分

> 原文文本支持手动输入或 Whisper 自动识别。留空则跳过文本比对，仅评语速和音量。

## 功能

- 音频播放：播放/暂停/停止/拖动进度/倍速
- 影子跟读：播放音频同时录音，音频结束后 1.5s 自动停止并评分
- 原文显示：默认模糊隐藏，点击「显示原文」切换
- 评分算法：Levenshtein 文本相似度(60%) + 语速音量特征(40%)
- 录音回放：练习记录保存在浏览器本地

## 项目结构

```
├── src/
│   ├── index.html           # 主页面
│   ├── audio/               # 音频播放与录音
│   ├── speech/              # 语音识别 (Web Speech API)
│   ├── scoring/             # 评分算法
│   ├── ui/                  # UI 组件
│   ├── storage/             # localStorage + IndexedDB
│   └── types/               # 类型定义
├── css/style.css
├── js/
│   ├── main.js              # 主控集成
│   └── whisper-worker.js    # Whisper 离线识别 Worker
├── assets/
├── INTERFACES.md            # 开发接口文档
└── start.bat                # 本地服务器启动脚本
```

## 注意事项

- **需要 HTTP 服务器**：ES Modules 不支持 `file://` 协议
- **首次识别较慢**：Whisper 模型首次需下载 ~300MB（缓存后可复用）
- **浏览器兼容**：推荐 Chrome/Edge，需要 Web Audio API + MediaRecorder 支持
- **麦克风权限**：首次录音会请求麦克风权限
- **录音在播放音频的同时进行**，建议戴耳机避免回声
