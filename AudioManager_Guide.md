# 🎧 Interpret-Assistant 成员1交接文档

## 负责人：成员1（音频与播放控制，Web Audio API）

---

## ✅ 我已完成的工作

📁 文件位置：`src/audio/AudioManager.js`

完整实现了 AudioManager 类，涵盖四大功能模块：**播放控制、进度追踪、录音控制、音频可视化**。

---

### 1️⃣ 播放控制

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `playAudio(url)` | `url: string` | `Promise<void>` | 播放指定URL的音频；相同URL不重新加载，已结束则从头播放 |
| `pauseAudio()` | — | `void` | 暂停当前播放 |
| `stopAudio()` | — | `void` | 停止播放并重置进度到 0 |
| `seekTo(time)` | `time: number`（秒） | `void` | 跳转到指定时间位置 |

#### 技术方案

- 使用 **HTML5 Audio 元素**进行实际播放（格式兼容性好，支持 mp3/wav/ogg 等）
- 通过 **AudioContext + MediaElementSourceNode** 连接 AnalyserNode 实现可视化
- 音频链路：`source → analyser → gain → destination`
- AudioContext 和 Audio 元素采用**懒初始化**，首次调用时才创建（避免浏览器自动播放策略限制）
- `playAudio()` 会自动处理 AudioContext 的 `suspended` 状态（用户首次交互后 resume）

---

### 2️⃣ 进度追踪

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `getCurrentTime()` | — | `number`（秒） | 获取当前播放时间，未初始化返回 0 |
| `getDuration()` | — | `number`（秒） | 获取音频总时长，未初始化返回 0 |

#### 进度轮询机制

- 播放开始后自动启动 **200ms 间隔轮询**，触发 `onTimeUpdate` 回调
- 暂停/停止时自动停止轮询
- 轮询间隔与 AudioPlayer UI 组件一致（200ms），保证 UI 同步流畅

#### 事件回调

| 回调 | 触发时机 | 回调参数 |
|------|----------|----------|
| `onTimeUpdate(cb)` | 每 200ms（播放中） | `currentTime: number`（秒） |
| `onEnded(cb)` | 音频播放结束 | 无 |
| `onPlay(cb)` | 音频开始播放 | 无 |
| `onPause(cb)` | 音频暂停 | 无 |

---

### 3️⃣ 录音控制

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `startRecording()` | — | `Promise<void>` | 请求麦克风权限并启动 MediaRecorder |
| `stopRecording()` | — | `Promise<Blob\|null>` | 停止录音，返回 webm 格式 Blob；未录音时返回 null |
| `isRecording()` | — | `boolean` | 查询当前是否正在录音 |

#### 技术方案

- 使用 **MediaRecorder API** + **getUserMedia** 实现录音
- 录音数据以 100ms 间隔收集（`mediaRecorder.start(100)`）
- 停止录音时自动释放麦克风（`mediaStream.getTracks().forEach(track.stop())`）
- 输出格式：`audio/webm`（Blob）

#### ⚠️ 与成员2的职责划分（重要）

```
AudioManager（成员1）        SpeechRecognizer（成员2）
┌──────────────────┐        ┌──────────────────┐
│ startRecording() │        │ startRecognition()│
│   → 采集原始音频  │        │   → 实时语音转文字 │
│   → 产出 Blob    │        │   → 产出 transcript│
│ stopRecording()  │        │ stopRecognition() │
│   → 返回 Blob    │        │   → 返回识别结果   │
└──────────────────┘        └──────────────────┘
```

- **AudioManager**：负责原始音频采集 → 产出 **Blob**（给评分模块用）
- **SpeechRecognizer**：负责语音转文字 → 产出 **transcript**（给评分模块用）
- 两者独立运行，互不依赖

---

### 4️⃣ 音频可视化

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `getAnalyserNode()` | — | `AnalyserNode` | 获取分析节点（供外部绘制波形/频谱图） |
| `getWaveformData()` | — | `number[]` | 获取当前波形数据（时域），0-255 范围 |
| `getFrequencyData()` | — | `number[]` | 获取当前频谱数据（频域），0-255 范围 |

#### 技术方案

- AnalyserNode 的 `fftSize = 2048`，频率精度 1024 bins
- `getWaveformData()` 返回时域波形采样值（适合绘制波形图）
- `getFrequencyData()` 返回频域频率强度（适合绘制频谱柱状图）
- 可视化数据在音频播放时实时更新

---

### 5️⃣ 资源清理

| 方法 | 说明 |
|------|------|
| `destroy()` | 释放所有资源：断开音频节点、关闭 AudioContext、停止录音、释放 Audio 元素 |

---

## 🔌 对其他成员的对接说明

### 👉 给成员2（SpeechRecognizer）

你不需要调用我的录音方法。你的职责是语音识别，我的职责是音频采集。

但在 main.js 集成时，成员5需要协调两者的调用时序：

```js
// 建议的集成方式（给成员5参考）
recordingButton.onRecordingStart(async () => {
    await audioManager.startRecording();      // 成员1：开始采集音频
    speechRecognizer.startRecognition();       // 成员2：开始语音识别
});

recordingButton.onRecordingStop(async () => {
    const blob = await audioManager.stopRecording();  // 成员1：获取录音 Blob
    speechRecognizer.stopRecognition();                // 成员2：停止识别
    // blob 传给评分模块
});
```

---

### 👉 给成员3（PronunciationScorer）

我的 `stopRecording()` 返回的 **Blob** 就是你的 `scorePronunciation()` 第三个参数 `userAudioBlob`：

```js
// 你的接口
scorePronunciation(originalTranscript, userTranscript, userAudioBlob)
//                                              ↑ 这就是 stopRecording() 返回的 Blob
```

如果你需要分析音频特征（语速、音量），可以：
- 使用我提供的 `getWaveformData()` / `getFrequencyData()` 获取实时数据
- 或者直接对 Blob 进行独立分析

---

### 👉 给成员4（UI）

我的 `onTimeUpdate` 回调与你的 AudioPlayer 组件风格一致（200ms 间隔），成员5可以这样同步：

```js
// 成员5在 main.js 中的集成方式
audioManager.onTimeUpdate((time) => {
    audioPlayer.syncProgress(time, audioManager.getDuration());
    transcriptDisplay.highlightWord(wordIndex);
});
```

如果你后续需要做波形可视化，可以直接调用：
```js
const analyser = audioManager.getAnalyserNode();
// 用 Canvas 绘制波形/频谱
```

---

### 👉 给成员5（主控集成）

#### 当前 main.js 已有的调用点

```js
// startPractice 中
await this.audioManager.playAudio(audioUrl);   // ✅ 已实现

// endPractice 中
this.audioManager.stopAudio();                  // ✅ 已实现
```

#### 需要你补充的集成逻辑

1. **播放进度同步**（连接 AudioManager → AudioPlayer UI）：

```js
// 在 init() 中添加
this.audioManager.onTimeUpdate((time) => {
    this.audioPlayer.syncProgress(time, this.audioManager.getDuration());
});
this.audioManager.onEnded(() => this._handleAudioEnded());
```

2. **录音数据链路**（连接 RecordingButton → AudioManager → Scorer）：

```js
// 修改 _handleRecordingStart
async _handleRecordingStart() {
    if (this.audioManager) {
        await this.audioManager.startRecording();
    }
    if (this.speechRecognizer) {
        this.speechRecognizer.startRecognition();
    }
}

// 修改 _handleRecordingStop
async _handleRecordingStop() {
    if (this.audioManager) {
        this.lastRecordedBlob = await this.audioManager.stopRecording();
    }
    if (this.speechRecognizer) {
        this.speechRecognizer.stopRecognition();
    }
    this.endPractice();
}
```

3. **AudioPlayer 用户操作 → AudioManager 控制**：

```js
// 在 init() 中添加
this.audioPlayer.onPlay(() => {
    if (this.audioManager) this.audioManager.playAudio(this.currentAudioUrl);
});
this.audioPlayer.onPause(() => {
    if (this.audioManager) this.audioManager.pauseAudio();
});
this.audioPlayer.onSeek((time) => {
    if (this.audioManager) this.audioManager.seekTo(time);
});
```

---

## ⚠️ 注意事项

### 1. 浏览器自动播放策略

现代浏览器要求 AudioContext 必须在**用户交互**后才能 resume。我的实现已自动处理：
- `_ensureAudioContext()` 检测 `suspended` 状态并自动 `resume()`
- 只要用户点击了播放按钮，就不会有问题

### 2. 跨域音频

如果音频文件来自不同域名，需要服务器配置 CORS 头。Audio 元素已设置 `crossOrigin = 'anonymous'`。

### 3. MediaElementSourceNode 限制

一个 Audio 元素只能创建**一个** MediaElementSourceNode。我的实现通过 `_isConnected` 标志确保只创建一次，重复调用 `_connectAnalyser()` 不会报错。

### 4. 录音格式

`stopRecording()` 返回的 Blob 格式为 `audio/webm`（Chrome 默认）。如需其他格式，可在创建 MediaRecorder 时指定 `mimeType`（需检查浏览器支持）。

---

## 📌 接口速查表

```
AudioManager:
  播放控制:  playAudio(url) / pauseAudio() / stopAudio() / seekTo(time)
  进度查询:  getCurrentTime() / getDuration()
  录音控制:  startRecording() / stopRecording() / isRecording()
  可视化:    getAnalyserNode() / getWaveformData() / getFrequencyData()
  事件回调:  onTimeUpdate(cb) / onEnded(cb) / onPlay(cb) / onPause(cb)
  资源清理:  destroy()
```

所有方法签名与 `src/types/interfaces.js` 中的约定完全一致，无需任何调整即可集成。
