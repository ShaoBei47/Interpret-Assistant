/**
 * @file src/storage/LocalStorage.js
 * @description localStorage 封装模块 — 用户设置、练习记录、音频元数据缓存
 * 成员5 数据存储模块 (Days 2-4)
 *
 * 音频缓存策略（方案B）：
 *   - LocalStorage：仅存储音频元数据索引 { id, name, duration, indexedDBKey, cachedAt }
 *   - 实际音频 Blob：由 IndexedDBStorage 管理持久化
 */

export class LocalStorage {
    static KEYS = {
        SETTINGS: 'ia_settings',
        RECORDS: 'ia_records',
        AUDIO_INDEX: 'ia_audio_index'
    };

    /**
     * 保存用户设置
     * @param {import('../../src/types/interfaces.js').UserSettings} settings
     */
    saveUserSettings(settings) {
        try {
            localStorage.setItem(LocalStorage.KEYS.SETTINGS, JSON.stringify(settings));
        } catch (e) {
            console.error('[LocalStorage] 保存用户设置失败:', e.message);
        }
    }

    /**
     * 获取用户设置，不存在时返回默认值
     * @returns {import('../../src/types/interfaces.js').UserSettings}
     */
    getUserSettings() {
        try {
            const raw = localStorage.getItem(LocalStorage.KEYS.SETTINGS);
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {
            console.error('[LocalStorage] 读取用户设置失败:', e.message);
        }
        return { language: 'en-US', autoPlay: true };
    }

    /**
     * 保存一条练习记录
     * @param {import('../../src/types/interfaces.js').PracticeRecord} record
     */
    savePracticeRecord(record) {
        try {
            const records = this.getPracticeRecords();
            records.push(record);
            localStorage.setItem(LocalStorage.KEYS.RECORDS, JSON.stringify(records));
        } catch (e) {
            console.error('[LocalStorage] 保存练习记录失败:', e.message);
        }
    }

    /**
     * 获取所有练习记录
     * @returns {import('../../src/types/interfaces.js').PracticeRecord[]}
     */
    getPracticeRecords() {
        try {
            const raw = localStorage.getItem(LocalStorage.KEYS.RECORDS);
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {
            console.error('[LocalStorage] 读取练习记录失败:', e.message);
        }
        return [];
    }

    /**
     * 获取所有练习记录 ID 列表
     * @returns {string[]}
     */
    getAllRecordIds() {
        return this.getPracticeRecords().map(r => r.id);
    }

    /**
     * 缓存音频文件元数据（实际 Blob 由 IndexedDBStorage 存储）
     * 将 Blob 转为 base64 以提取音轨时长信息，然后在索引中记录元数据
     * @param {string} id - 音频唯一标识
     * @param {Blob} blob - 音频 Blob（用于提取 duration）
     * @returns {Promise<void>}
     */
    async cacheAudioFile(id, blob) {
        try {
            // 将 Blob 转为 base64 data URL 以提取音频时长
            const dataUrl = await this._blobToDataURL(blob);
            const duration = await this._extractAudioDuration(dataUrl);

            const metadata = {
                id,
                name: id,
                duration: duration || 0,
                indexedDBKey: id,
                cachedAt: Date.now()
            };

            const index = this._getAudioIndex();
            const existingIdx = index.findIndex(item => item.id === id);
            if (existingIdx >= 0) {
                index[existingIdx] = metadata;
            } else {
                index.push(metadata);
            }
            localStorage.setItem(LocalStorage.KEYS.AUDIO_INDEX, JSON.stringify(index));
        } catch (e) {
            console.error('[LocalStorage] 缓存音频元数据失败:', e.message);
        }
    }

    /**
     * 获取缓存的音频元数据
     * @param {string} id - 音频唯一标识
     * @returns {Promise<object|null>} 元数据对象或 null
     */
    async getCachedAudioFile(id) {
        try {
            const index = this._getAudioIndex();
            const metadata = index.find(item => item.id === id);
            return metadata || null;
        } catch (e) {
            console.error('[LocalStorage] 读取音频缓存失败:', e.message);
            return null;
        }
    }

    /**
     * 从缓存索引中删除指定音频的元数据
     * @param {string} id
     */
    deleteCachedAudioFile(id) {
        try {
            const index = this._getAudioIndex();
            const filtered = index.filter(item => item.id !== id);
            localStorage.setItem(LocalStorage.KEYS.AUDIO_INDEX, JSON.stringify(filtered));
        } catch (e) {
            console.error('[LocalStorage] 删除音频缓存失败:', e.message);
        }
    }

    /**
     * 清除所有 ia_* 前缀的存储数据（测试用）
     */
    clearAll() {
        try {
            const keysToRemove = Object.values(LocalStorage.KEYS);
            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (e) {
            console.error('[LocalStorage] 清除数据失败:', e.message);
        }
    }

    // ==================== 内部方法 ====================

    /**
     * 获取音频索引数组
     * @returns {Array<{id:string, name:string, duration:number, indexedDBKey:string, cachedAt:number}>}
     */
    _getAudioIndex() {
        try {
            const raw = localStorage.getItem(LocalStorage.KEYS.AUDIO_INDEX);
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {
            console.error('[LocalStorage] 读取音频索引失败:', e.message);
        }
        return [];
    }

    /**
     * 将 Blob 转换为 base64 data URL
     * @param {Blob} blob
     * @returns {Promise<string>}
     */
    _blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Blob 转 base64 失败'));
            reader.readAsDataURL(blob);
        });
    }

    /**
     * 通过 Audio 元素提取音频时长
     * @param {string} dataUrl - base64 data URL
     * @returns {Promise<number>} 时长（秒）
     */
    _extractAudioDuration(dataUrl) {
        return new Promise((resolve) => {
            const audio = new Audio(dataUrl);
            audio.onloadedmetadata = () => {
                resolve(audio.duration);
            };
            audio.onerror = () => {
                resolve(0);
            };
            // 超时保护
            setTimeout(() => resolve(0), 3000);
        });
    }

    // ==================== 自检方法 ====================

    /**
     * 在浏览器控制台执行自检 — 测试完整的 save→get→verify 流程
     * @returns {Promise<void>}
     */
    async _runSelfTest() {
        console.group('[LocalStorage 自检]');
        try {
            // 1. 测试设置
            this.saveUserSettings({ language: 'zh-CN', autoPlay: false });
            const settings = this.getUserSettings();
            console.assert(settings.language === 'zh-CN', '❌ 设置保存失败');
            console.log('✅ 设置读写:', JSON.stringify(settings));

            // 2. 测试记录
            const testRecord = {
                id: 'self-test-' + Date.now(),
                date: new Date(),
                audioId: 'test-audio',
                overallScore: 88,
                details: { textScore: 85, audioScore: 90, feedback: ['Good job'] }
            };
            this.savePracticeRecord(testRecord);
            const records = this.getPracticeRecords();
            const found = records.find(r => r.id === testRecord.id);
            console.assert(found, '❌ 记录保存失败');
            console.log('✅ 记录读写:', records.length, '条记录');

            // 3. 测试音频缓存元数据
            const testBlob = new Blob(['test'], { type: 'audio/webm' });
            await this.cacheAudioFile('test-audio-cache', testBlob);
            const cached = await this.getCachedAudioFile('test-audio-cache');
            console.assert(cached !== null, '❌ 音频缓存失败');
            console.log('✅ 音频缓存元数据:', cached);

            // 4. 清理测试数据
            this.deleteCachedAudioFile('test-audio-cache');
            this.deleteCachedAudioFile('test-audio-cache');
            // 移除测试记录
            const cleanRecords = this.getPracticeRecords().filter(r => r.id !== testRecord.id);
            localStorage.setItem(LocalStorage.KEYS.RECORDS, JSON.stringify(cleanRecords));

            console.log('🎉 LocalStorage 自检通过');
        } catch (e) {
            console.error('❌ LocalStorage 自检异常:', e);
        }
        console.groupEnd();
    }
}
