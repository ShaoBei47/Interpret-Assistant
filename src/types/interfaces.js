/**
 * @file src/types/interfaces.js
 * @description 全局数据结构与模块接口约定 (Day 1 - 成员4制定，最终更新)
 * 其他成员请严格按照此处的返回值和参数结构进行开发！
 */

/**
 * 学习记录数据结构 (成员5存储使用)
 * @typedef {Object} PracticeRecord
 * @property {string} id - 记录唯一标识
 * @property {Date} date - 练习时间
 * @property {string} audioId - 关联的练习音频ID
 * @property {number} overallScore - 总分 (0-100)
 * @property {Object} details - 详细得分 (ScoreResult 格式)
 */

/**
 * 用户设置数据结构 (成员5存储使用)
 * @typedef {Object} UserSettings
 * @property {string} language - 识别语言 (如 'en-US')
 * @property {boolean} autoPlay - 是否自动播放
 */

/**
 * 评分结果返回结构 (成员3算法使用)
 * @typedef {Object} ScoreResult
 * @property {number} overall - 综合得分 (0-100)
 * @property {number} textScore - 文本相似度得分
 * @property {number} audioScore - 发音特征得分
 * @property {string[]} feedback - 具体的改进建议列表
 */

// 注：此类文件在纯JS中主要作为 JSDoc 规范存在。
// 成员在自己的类中实现对应的方法即可。

/**
 * ================================
 * 模块接口约定（强制 — 已实现状态）
 * ================================
 *
 * 【AudioManager】成员1 ✅ 已实现
 *   // 播放控制
 *   playAudio(url: string): Promise<void>
 *   pauseAudio(): void
 *   stopAudio(): void
 *   seekTo(time: number): void
 *   getCurrentTime(): number        // 秒
 *   getDuration(): number           // 秒
 *
 *   // 录音控制
 *   startRecording(): Promise<void>
 *   stopRecording(): Promise<Blob>  // webm 格式
 *   isRecording(): boolean
 *
 *   // 音频可视化
 *   getAnalyserNode(): AnalyserNode
 *   getWaveformData(): number[]     // 0-255 时域数据
 *   getFrequencyData(): number[]    // 0-255 频域数据
 *
 *   // 事件回调
 *   onTimeUpdate(callback: (currentTime: number) => void): void
 *   onEnded(callback: () => void): void
 *   onPlay(callback: () => void): void
 *   onPause(callback: () => void): void
 *
 *   // 资源释放
 *   destroy(): void
 *
 * 【SpeechRecognizer】成员2 ✅ 已实现
 *   static isSupported(): boolean
 *   constructor(language: string = 'en-US')
 *
 *   // 实时识别
 *   startRecognition(): void
 *   stopRecognition(): void
 *   isRecognizing(): boolean
 *
 *   // 批量识别
 *   recognizeFromBlob(blob: Blob): Promise<{ transcript: string, confidence: number }>
 *
 *   // 事件回调
 *   onResult(callback: (transcript: string, confidence: number) => void): void
 *   onError(callback: (error: string) => void): void
 *
 *   // 累积文本
 *   getFinalTranscript(): string
 *
 *   // 资源释放
 *   destroy(): void
 *
 * 【PronunciationScorer】成员3 ✅ 已实现
 *   constructor(options: { targetWpmMin?: number, targetWpmMax?: number })
 *
 *   calculateTextSimilarity(original: string, user: string): number    // 0-100
 *   analyzeAudioFeatures(blob: Blob): Promise<{ duration: number, volume: number, pace: number }>
 *   scorePronunciation(originalTranscript: string, userTranscript: string, userAudioBlob: Blob):
 *     Promise<ScoreResult>
 *
 * 【AudioPlayer】成员4 ✅ 已实现 (UI组件)
 *   constructor(container: HTMLElement, audioUrl?: string)
 *   play() / pause() / stop()
 *   seekTo(time: number)
 *   getCurrentTime(): number
 *   syncProgress(currentTime: number, duration: number): void
 *   onTimeUpdate(cb) / onEnded(cb) / onPlay(cb) / onPause(cb) / onSeek(cb: (time) => void)
 *
 * 【RecordingButton】成员4 ✅ 已实现 (UI组件)
 *   constructor(container: HTMLElement)
 *   isRecording(): boolean
 *   getRecordingTime(): number    // 秒
 *   reset(): void
 *   onRecordingStart(cb) / onRecordingStop(cb)
 *
 * 【TranscriptDisplay】成员4 ✅ 已实现 (UI组件)
 *   constructor(container: HTMLElement, transcript?: string)
 *   setTranscript(text: string): void
 *   highlightWord(wordIndex: number): void
 *   highlightSentence(sentenceIndex: number): void
 *   scrollToCurrent(): void
 *
 * 【LocalStorage】成员5 ✅ 已实现
 *   saveUserSettings(settings: UserSettings): void
 *   getUserSettings(): UserSettings
 *   savePracticeRecord(record: PracticeRecord): void
 *   getPracticeRecords(): PracticeRecord[]
 *   cacheAudioFile(id: string, blob: Blob): Promise<void>
 *   getCachedAudioFile(id: string): Promise<object | null>
 *
 * 【IndexedDBStorage】成员5 ✅ 已实现
 *   saveAudioBlob(id: string, blob: Blob): Promise<void>
 *   getAudioBlob(id: string): Promise<Blob | null>
 *   deleteAudioBlob(id: string): Promise<void>
 *
 * 【通用约定】
 * - 所有时间单位统一为"秒"
 * - 所有音频数据统一为 Blob
 * - 所有回调均为单监听器模式（后注册覆盖前者）
 */
