
# 📘 Interpret-Assistant 项目交接文档Day1


## 负责人：成员4（UI/UX & 接口定义，Day1:搭骨架，接口定义）

---
## 项目结构：
```
Interpret-Assiatant/
├── src/
│   ├── audio/            # 👉 成员1 (音频)
│   │   └── AudioManager.js
│   ├── speech/           # 👉 成员2 (识别)
│   │   └── SpeechRecognizer.js
│   ├── scoring/          # 👉 成员3 (算法)
│   │   └── PronunciationScorer.js
│   ├── ui/               # 👉 成员4 (UI)
│   │   ├── AudioPlayer.js
│   │   ├── RecordingButton.js
│   │   └── TranscriptDisplay.js
│   ├── storage/          # 👉 成员5 (存储)
│   │   ├── LocalStorage.js
│   │   └── IndexedDBStorage.js
│   ├── types/            # 👉 成员4 (Day 1：全局接口与类型定义)
│   │   └── interfaces.js # (或 .d.ts，用于规范全组开发)
│   └── index.html        # 👉 成员4/成员5 (基础结构成员4写，成员5负责最终集成引入)
├── css/                  # 👉 成员4 (UI)
│   └── style.css
├── js/                   # 👉 成员5 (主控逻辑)
│   └── main.js           # (包含 ShadowingApp 类)
└── assets/               # 共享资源
    └── audio/
```
---
## ✅ 我已完成的工作（Day 1）

本阶段的核心目标是：**定义全局接口规范 + 搭建UI模块骨架 + 提供基础页面结构**，确保其他成员可以并行开发。

---

### 1️⃣ 全局接口与数据结构定义（已完成）

📁 文件位置：`src/types/interfaces.js`

我已通过 **JSDoc** 形式定义了全局数据结构，作为全组开发“契约”。所有成员必须严格遵守这些数据格式。

#### ✅ 已定义结构：

- `PracticeRecord`（成员5使用：学习记录存储）
- `UserSettings`（成员5使用：用户配置）
- `ScoreResult`（成员3使用：评分返回结果）
#### ⚠️ 约定说明

##### 1. 评分结果格式（必须遵守）

```js
{
  overall: number,      // 0-100
  textScore: number,
  audioScore: number,
  feedback: string[]
}
```

##### 2. 全局数据规范

- ⏱ 时间类型：统一使用 `Date` 对象
- 🎧 音频数据：统一使用 `Blob`

---

##### 3. 模块接口补充约定（强制）

```js
/**
 * 【AudioManager】
 * - getCurrentTime(): number（单位：秒）
 * - getDuration(): number（单位：秒）
 * - stopRecording(): Promise<Blob>
 *
 * 【SpeechRecognizer】
 * - onResult(callback)
 *   callback参数必须为：
 *   (transcript: string, confidence: number)
 *
 * - recognizeFromBlob(blob)
 *   返回：
 *   Promise<{ transcript: string, confidence: number }>
 *
 * 【通用约定】
 * - 所有时间单位统一为“秒”
 * - 所有音频数据统一为 Blob
 */
```
---

### 2️⃣ UI组件模块骨架（已完成）

📁 目录：`src/ui/`

我已经完成了 **3个核心UI组件类的骨架定义 + 基础事件机制**，并暴露接口供主应用调用。

---

#### 🎧 AudioPlayer.js（音频播放器UI）

✔ 已完成：
- 类结构定义
- 基础 render 方法（占位UI）
- 播放控制接口（play / pause / stop / seekTo）
- 事件注册接口（onTimeUpdate / onEnded）

📌 当前状态：
- ❗ 仅UI占位，未实现真实DOM控制（Day2完成）

📌 给成员1（音频模块）的对接方式：
- 你负责真实播放逻辑（AudioManager）
- UI组件只负责“展示状态”
- 主控（成员5）会连接你和我

---

#### 🎙 RecordingButton.js（录音按钮）

✔ 已完成：
- 按钮UI渲染
- 点击切换录音状态
- 内部UI状态管理
- 回调机制：
  - `onRecordingStart`
  - `onRecordingStop`

📌 当前状态：
- UI逻辑完整 ✅
- ❗ 未接入真实录音（成员2负责）

📌 给成员2的说明：
- 你只需要在 main.js 里监听：
  ```js
  recordingButton.onRecordingStart(() => {...})
  recordingButton.onRecordingStop(() => {...})
  ```

---

#### 📄 TranscriptDisplay.js（文本展示）

✔ 已完成：
- 文本设置接口 `setTranscript`
- 基础渲染逻辑

📌 预留功能（Day2实现）：
- 单词高亮 `highlightWord`
- 句子高亮 `highlightSentence`
- 自动滚动 `scrollToCurrent`

📌 给成员3/5说明：
- 文本内容由你们传入
- 高亮控制由主控调用我提供的方法

---

### 3️⃣ 页面结构（已完成）

📁 文件：`src/index.html`

我已提供完整页面骨架，并划分清晰的挂载点：

#### 🧩 DOM结构说明：

| 区域 | ID | 用途 |
|------|----|------|
| 文本显示区 | `#transcript-container` | TranscriptDisplay |
| 录音按钮 | `#recording-control` | RecordingButton |
| 播放器 | `#audio-player-control` | AudioPlayer |
| 评分结果 | `#score-result-panel` | 成员3输出 |
| 状态栏 | `#status-bar` | 可扩展 |

📌 所有组件均通过 JS 挂载（不要直接写死HTML）

---

## 🔌 模块对接说明（重点）

### 👉 成员1（AudioManager）

你提供：
```js
playAudio(url)
pauseAudio()
getCurrentTime()
```

主应用会：
- 调你接口
- 同步更新我的 AudioPlayer UI

---

### 👉 成员2（SpeechRecognizer + 录音）

你提供：
```js
startRecording()
stopRecording() -> Blob
```

对接方式：
- RecordingButton 触发
- main.js 调用你逻辑

---

### 👉 成员3（评分算法）

你提供：
```js
scorePronunciation(...) => ScoreResult
```

⚠️ 必须符合接口定义！

---

### 👉 成员5（主控集成）

你是核心连接人：

你需要：
1. 创建所有模块实例
2. 绑定 UI 和逻辑：
   ```js
   recordingButton.onRecordingStart(() => audioManager.startRecording())
   ```
3. 控制数据流：
   ```
   用户操作 → UI → main.js → 逻辑模块 → UI更新
   ```

---

## 🚧 当前未完成部分（Day2任务）

我接下来会完成：

### UI增强
- 播放器真实UI（进度条、时间显示）
- 录音动画（麦克风脉冲）
- 文本逐词高亮

### 交互优化
- 自动滚动
- 响应式布局（移动端适配）

---

## ⚠️ 开发规范（必须遵守）

### 1. 不允许：
- ❌ 修改接口定义
- ❌ 直接操作别人模块内部数据

### 2. 必须：
- ✅ 通过接口调用
- ✅ 返回统一数据结构
- ✅ 使用 ES6 class

---

## 🧪 测试建议


- 音频是否可播放
- 录音是否能返回 Blob
- 评分是否返回完整对象
- UI是否响应操作

---

## 📌 最终目标（Reminder）

最终页面必须包含：

- 🎧 音频播放器（可控制）
- 🎙 录音按钮（带状态）
- 📄 文本同步高亮
- 📊 评分结果展示
- 💾 本地学习记录

---

## 💬 最后说明

目前项目已经完成：

✅ 接口统一  
✅ UI骨架搭建  
✅ 页面结构定义  

🚀 现在可以正式进入 **Day2并行开发阶段**



