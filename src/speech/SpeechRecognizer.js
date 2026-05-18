/**
 * @file src/speech/SpeechRecognizer.js
 * @description 语音识别模块 — 实时语音转文字、批量音频识别
 * 成员2 语音识别与录音 (Web Speech API + MediaRecorder)
 *
 * 职责：
 *   - 实时语音识别（Web Speech API → transcript）
 *   - 识别结果回调（transcript + confidence）
 *   - 批量识别（从 Blob 播放并识别）
 *
 * 技术方案：
 *   - 使用 Web Speech API (SpeechRecognition / webkitSpeechRecognition)
 *   - continuous: true 实现不间断实时识别
 *   - interimResults: true 获取中间结果用于流式显示
 *   - 静默超时后自动重启识别，保证长时间录音不中断
 *
 * 与 AudioManager 的职责划分：
 *   - AudioManager（成员1）：负责原始音频采集 → 产出 Blob
 *   - SpeechRecognizer（成员2）：负责语音转文字 → 产出 transcript
 *   - 两者独立运行，互不依赖
 */

export class SpeechRecognizer {
    constructor(language = 'en-US') {
        this._language = language;
        this._recognition = null;
        this._isRecognizing = false;
        this._onResultCallback = null;
        this._onErrorCallback = null;

        // 累积的最终识别文本
        this._finalTranscript = '';
        // 是否已被显式停止（用于区分"用户主动停止"和"静默超时自动停止"）
        this._stoppedByUser = false;
    }

    /**
     * 检查浏览器是否支持 Web Speech API
     * @returns {boolean}
     */
    static isSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }

    /**
     * 创建 SpeechRecognition 实例
     * @returns {SpeechRecognition}
     */
    _createRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            throw new Error('浏览器不支持语音识别功能（Web Speech API）');
        }

        const recognition = new SpeechRecognition();
        recognition.lang = this._language;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalChunk = '';
            let confidence = 0;

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const alt = result[0];
                if (result.isFinal) {
                    finalChunk += alt.transcript;
                    confidence = alt.confidence;
                    this._finalTranscript += ' ' + finalChunk;
                } else {
                    interimTranscript += alt.transcript;
                }
            }

            const displayText = finalChunk || interimTranscript;
            if (displayText.trim() && this._onResultCallback) {
                this._onResultCallback(displayText, confidence);
            }
        };

        recognition.onerror = (event) => {
            // 'no-speech' 和 'aborted' 是正常情况，不视为错误
            if (event.error === 'no-speech' || event.error === 'aborted') {
                return;
            }
            if (this._onErrorCallback) {
                this._onErrorCallback(event.error);
            }
        };

        recognition.onend = () => {
            // 如果不是用户主动停止，自动重启以保持持续识别
            if (!this._stoppedByUser && this._isRecognizing) {
                try {
                    this._recognition.start();
                    return; // 重启成功，不修改 isRecognizing
                } catch (e) {
                    // 重启失败则标记为停止
                }
            }
            this._isRecognizing = false;
        };

        return recognition;
    }

    /**
     * 启动实时语音识别
     * 开始监听麦克风输入并将语音实时转为文字
     */
    startRecognition() {
        if (this._isRecognizing) return;

        try {
            this._recognition = this._createRecognition();
            this._stoppedByUser = false;
            this._finalTranscript = '';
            this._recognition.start();
            this._isRecognizing = true;
        } catch (e) {
            if (this._onErrorCallback) {
                this._onErrorCallback(e.message);
            }
            throw e;
        }
    }

    /**
     * 停止语音识别
     * 停止后将通过 onResult 回调返回最终累积的识别结果
     */
    stopRecognition() {
        if (!this._recognition || !this._isRecognizing) return;

        this._stoppedByUser = true;
        this._isRecognizing = false;
        this._recognition.stop();
    }

    /**
     * 注册识别结果回调
     * @param {function(string, number): void} callback
     *   - transcript: 识别文本（实时为增量片段）
     *   - confidence: 置信度（0-1，实时模式下可能为0）
     */
    onResult(callback) {
        this._onResultCallback = callback;
    }

    /**
     * 注册错误回调
     * @param {function(string): void} callback
     *   - error: 错误描述字符串
     */
    onError(callback) {
        this._onErrorCallback = callback;
    }

    /**
     * 获取当前累积的最终识别文本
     * @returns {string}
     */
    getFinalTranscript() {
        return this._finalTranscript.trim();
    }

    /**
     * 从音频 Blob 进行批量识别
     * 通过扬声器播放音频并用麦克风重新采集识别（Web Speech API 仅支持麦克风输入）
     *
     * @param {Blob} blob - 音频 Blob（建议 webm 或 wav 格式）
     * @returns {Promise<{transcript: string, confidence: number}>}
     */
    async recognizeFromBlob(blob) {
        return new Promise((resolve, reject) => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                reject(new Error('浏览器不支持语音识别功能'));
                return;
            }

            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            const recognition = new SpeechRecognition();
            recognition.lang = this._language;
            recognition.continuous = false;
            recognition.interimResults = false;

            let settled = false;

            const cleanup = () => {
                if (url) URL.revokeObjectURL(url);
                audio.pause();
                try { recognition.stop(); } catch (e) { /* 可能已停止 */ }
            };

            recognition.onresult = (event) => {
                if (settled) return;
                settled = true;
                const result = event.results[0][0];
                cleanup();
                resolve({ transcript: result.transcript, confidence: result.confidence });
            };

            recognition.onerror = (event) => {
                if (settled) return;
                // 'no-speech' 视为空结果
                if (event.error === 'no-speech') {
                    settled = true;
                    cleanup();
                    resolve({ transcript: '', confidence: 0 });
                } else {
                    settled = true;
                    cleanup();
                    reject(new Error('语音识别错误: ' + event.error));
                }
            };

            recognition.onend = () => {
                if (!settled) {
                    settled = true;
                    cleanup();
                    resolve({ transcript: '', confidence: 0 });
                }
            };

            audio.onended = () => {
                try { recognition.stop(); } catch (e) { /* ignore */ }
            };

            audio.onerror = () => {
                if (!settled) {
                    settled = true;
                    cleanup();
                    reject(new Error('音频播放失败'));
                }
            };

            recognition.start();
            audio.play().catch((e) => {
                if (!settled) {
                    settled = true;
                    cleanup();
                    reject(new Error('音频播放失败: ' + e.message));
                }
            });
        });
    }

    /**
     * 查询当前是否正在识别
     * @returns {boolean}
     */
    isRecognizing() {
        return this._isRecognizing;
    }

    /**
     * 释放资源
     */
    destroy() {
        if (this._isRecognizing) {
            this.stopRecognition();
        }
        this._onResultCallback = null;
        this._onErrorCallback = null;
        this._recognition = null;
        this._finalTranscript = '';
    }
}
