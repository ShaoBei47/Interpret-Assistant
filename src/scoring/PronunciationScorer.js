export class PronunciationScorer {
    constructor(options = {}) {
        // 遵循项目统一代码风格：初始化参数
        this.targetWpmMin = options.targetWpmMin || 110; // 理想最低语速 (词/分钟)
        this.targetWpmMax = options.targetWpmMax || 160; // 理想最高语速
    }

    /**
     * 1. 文本相似度计算 (接口约定方法)
     * @param {string} original - 原文
     * @param {string} user - 用户识别文本
     * @returns {number} 0-100 的相似度得分
     */
    calculateTextSimilarity(original, user) {
        if (!original || !user) return 0;

        // 清洗数据：转小写并去除标点符号
        const cleanStr = (str) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
        const refWords = cleanStr(original).split(/\s+/);
        const recWords = cleanStr(user).split(/\s+/);

        if (refWords.length === 0) return 0;

        // 动态规划计算 Levenshtein 编辑距离 (单词级别)
        const dp = Array(refWords.length + 1).fill(null).map(() => Array(recWords.length + 1).fill(0));
        for (let i = 0; i <= refWords.length; i++) dp[i][0] = i;
        for (let j = 0; j <= recWords.length; j++) dp[0][j] = j;

        for (let i = 1; i <= refWords.length; i++) {
            for (let j = 1; j <= recWords.length; j++) {
                const cost = refWords[i - 1] === recWords[j - 1] ? 0 : 1;
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,       // 删除
                    dp[i][j - 1] + 1,       // 插入
                    dp[i - 1][j - 1] + cost // 替换
                );
            }
        }

        const distance = dp[refWords.length][recWords.length];
        const maxLen = Math.max(refWords.length, recWords.length);
        
        const similarity = ((maxLen - distance) / maxLen) * 100;
        return Math.max(0, Math.round(similarity));
    }

    /**
     * 2. 语音特征分析 (接口约定方法)
     * 利用 Web Audio API 提取录音的物理特征
     * @param {Blob} blob - 录音文件
     * @returns {Promise<{duration: number, volume: number, pace: number}>}
     */
    async analyzeAudioFeatures(blob) {
        return new Promise(async (resolve, reject) => {
            try {
                const arrayBuffer = await blob.arrayBuffer();
                // 兼容浏览器API
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const audioCtx = new AudioContext();
                
                const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                const duration = audioBuffer.duration; // 时长(秒)

                // 计算音量 (RMS)
                const channelData = audioBuffer.getChannelData(0);
                let sumSquare = 0;
                for (let i = 0; i < channelData.length; i++) {
                    sumSquare += channelData[i] * channelData[i];
                }
                const volume = Math.sqrt(sumSquare / channelData.length);

                // 注意：因为只传了 blob，无法知道准确的单词数，这里 pace 暂时用能量峰值估算音节率
                // 或者在主评分函数中结合真实 text 进行准确计算，这里返回默认值。
                resolve({ 
                    duration: duration, 
                    volume: volume, 
                    pace: 0 // 将在 scorePronunciation 中被精确覆盖
                });
            } catch (err) {
                console.error("音频特征分析失败:", err);
                resolve({ duration: 1, volume: 0, pace: 0 }); // 降级处理，防崩溃
            }
        });
    }

    /**
     * 3. 综合评分 (接口约定方法 - 给成员5主应用调用的最终接口)
     * @param {string} originalTranscript - 原文
     * @param {string} userTranscript - 识别出的文本
     * @param {Blob} userAudioBlob - 录音文件
     * @returns {Promise<{overall: number, textScore: number, audioScore: number, feedback: string[]}>}
     */
    async scorePronunciation(originalTranscript, userTranscript, userAudioBlob) {
        // 1. 获取文本得分
        const textScore = this.calculateTextSimilarity(originalTranscript, userTranscript);

        // 2. 解析音频获取特征
        let duration = 1;
        let volume = 0;
        let pace = 0;

        if (userAudioBlob) {
            const features = await this.analyzeAudioFeatures(userAudioBlob);
            duration = features.duration || 1;
            volume = features.volume;
            
            // 精确计算语速 (Words Per Minute)
            const wordCount = (userTranscript || "").trim().split(/\s+/).length;
            pace = (wordCount / duration) * 60; 
        }

        // 3. 计算语音表现得分 (audioScore)
        const audioScore = this._calculateAudioScore(pace, volume);

        // 4. 计算综合总分 (文本占60%，语音表现占40%)
        let overall = Math.round((textScore * 0.6) + (audioScore * 0.4));

        // 5. 生成反馈数组
        const feedback = this._generateFeedback(textScore, audioScore, pace, volume);

        return {
            overall: overall,
            textScore: textScore,
            audioScore: audioScore,
            feedback: feedback
        };
    }

    // --- 以下为私有方法，遵循项目命名规范 ---

    _calculateAudioScore(pace, volume) {
        let score = 100;
        
        // 评判语速
        if (pace < 50) {
            score -= 40; // 太慢
        } else if (pace < this.targetWpmMin) {
            score -= 20; // 偏慢
        } else if (pace > 180) {
            score -= 20; // 太快
        }

        // 评判音量 (防蚊子音)
        if (volume > 0 && volume < 0.015) {
            score -= 15;
        }

        return Math.max(0, score);
    }

    _generateFeedback(textScore, audioScore, pace, volume) {
        const feedback = [];

        // 文本反馈
        if (textScore >= 90) feedback.push("🎯 发音准确，完美还原了原文内容！");
        else if (textScore >= 70) feedback.push("✅ 内容传达基本正确，注意个别单词的发音。");
        else feedback.push("📖 与原文偏差较大，请尝试看着文本再跟读一遍。");

        // 语速反馈
        if (pace > 0 && pace < 90) feedback.push("🐢 语速有些缓慢，可以尝试连读来提升流利度。");
        else if (pace > 180) feedback.push("🚄 语速过快，适当的停顿会让口译更加清晰。");

        // 音量反馈
        if (volume > 0 && volume < 0.015) feedback.push("🔈 声音稍小，请更加自信地大声表达！");

        // 综合鼓励
        if (textScore >= 80 && audioScore >= 80) {
            feedback.push("🌟 非常棒的表现，请继续保持！");
        }

        return feedback;
    }
}