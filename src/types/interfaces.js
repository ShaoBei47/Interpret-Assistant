/**
 * @file src/types/interfaces.js
 * @description 全局数据结构与模块接口约定 (Day 1 - 成员4制定)
 * 其他成员请严格按照此处的返回值和参数结构进行开发！
 */

/**
 * 学习记录数据结构 (成员5存储使用)
 * @typedef {Object} PracticeRecord
 * @property {string} id - 记录唯一标识
 * @property {Date} date - 练习时间
 * @property {string} audioId - 关联的练习音频ID
 * @property {number} overallScore - 总分
 * @property {Object} details - 详细得分
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
 * 模块接口补充约定（强制）
 * ================================
 *
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