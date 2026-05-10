/**
 * @file src/storage/IndexedDBStorage.js
 * @description IndexedDB 封装模块 — 音频 Blob 持久化存储
 * 成员5 数据存储模块 (Days 2-4)
 *
 * 与 LocalStorage 配合使用：
 *   - LocalStorage：存储音频元数据索引
 *   - IndexedDBStorage：存储实际的音频 Blob 数据
 *
 * 数据库结构：
 *   - 数据库名: InterpretAssistantDB (v1)
 *   - 对象存储: audio_blobs (keyPath: 'id')
 *   - 记录格式: { id: string, blob: Blob, createdAt: number }
 */

export class IndexedDBStorage {
    /**
     * @param {string} dbName - IndexedDB 数据库名称
     * @param {number} version - 数据库版本号
     */
    constructor(dbName = 'InterpretAssistantDB', version = 1) {
        this.dbName = dbName;
        this.version = version;
    }

    /**
     * 获取数据库信息
     * @returns {{ dbName: string, version: number, objectStore: string }}
     */
    getDatabaseInfo() {
        return {
            dbName: this.dbName,
            version: this.version,
            objectStore: 'audio_blobs'
        };
    }

    /**
     * 保存音频 Blob 到 IndexedDB
     * @param {string} id - 音频唯一标识
     * @param {Blob} blob - 音频 Blob 数据
     * @returns {Promise<void>}
     */
    async saveAudioBlob(id, blob) {
        if (!this._checkSupport()) return;
        try {
            const db = await this._openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction('audio_blobs', 'readwrite');
                const store = transaction.objectStore('audio_blobs');
                const request = store.put({ id, blob, createdAt: Date.now() });

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);

                transaction.oncomplete = () => {
                    db.close();
                };
                transaction.onerror = () => {
                    db.close();
                    reject(transaction.error);
                };
            });
        } catch (e) {
            console.error('[IndexedDBStorage] 保存音频失败:', e.message);
        }
    }

    /**
     * 从 IndexedDB 获取音频 Blob
     * @param {string} id - 音频唯一标识
     * @returns {Promise<Blob|null>} 返回 Blob 或 null（不存在时）
     */
    async getAudioBlob(id) {
        if (!this._checkSupport()) return null;
        try {
            const db = await this._openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction('audio_blobs', 'readonly');
                const store = transaction.objectStore('audio_blobs');
                const request = store.get(id);

                request.onsuccess = () => {
                    const result = request.result;
                    resolve(result ? result.blob : null);
                };
                request.onerror = () => reject(request.error);

                transaction.oncomplete = () => {
                    db.close();
                };
                transaction.onerror = () => {
                    db.close();
                    reject(transaction.error);
                };
            });
        } catch (e) {
            console.error('[IndexedDBStorage] 读取音频失败:', e.message);
            return null;
        }
    }

    /**
     * 从 IndexedDB 删除指定音频
     * @param {string} id - 音频唯一标识
     * @returns {Promise<void>}
     */
    async deleteAudioBlob(id) {
        if (!this._checkSupport()) return;
        try {
            const db = await this._openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction('audio_blobs', 'readwrite');
                const store = transaction.objectStore('audio_blobs');
                const request = store.delete(id);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);

                transaction.oncomplete = () => {
                    db.close();
                };
                transaction.onerror = () => {
                    db.close();
                    reject(transaction.error);
                };
            });
        } catch (e) {
            console.error('[IndexedDBStorage] 删除音频失败:', e.message);
        }
    }

    /**
     * 获取所有已存储的音频 ID 列表
     * @returns {Promise<string[]>}
     */
    async getAllAudioKeys() {
        if (!this._checkSupport()) return [];
        try {
            const db = await this._openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction('audio_blobs', 'readonly');
                const store = transaction.objectStore('audio_blobs');
                const request = store.getAllKeys();

                request.onsuccess = () => {
                    resolve(request.result);
                };
                request.onerror = () => reject(request.error);

                transaction.oncomplete = () => {
                    db.close();
                };
                transaction.onerror = () => {
                    db.close();
                    reject(transaction.error);
                };
            });
        } catch (e) {
            console.error('[IndexedDBStorage] 获取音频键列表失败:', e.message);
            return [];
        }
    }

    // ==================== 内部方法 ====================

    /**
     * 检查浏览器是否支持 IndexedDB
     * @returns {boolean}
     */
    _checkSupport() {
        if (!window.indexedDB) {
            console.warn('[IndexedDBStorage] 当前浏览器不支持 IndexedDB，存储功能不可用');
            return false;
        }
        return true;
    }

    /**
     * 打开 IndexedDB 数据库连接（每次操作后关闭）
     * @returns {Promise<IDBDatabase>}
     */
    _openDB() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                reject(new Error('IndexedDB 不可用'));
                return;
            }

            const request = window.indexedDB.open(this.dbName, this.version);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('audio_blobs')) {
                    db.createObjectStore('audio_blobs', { keyPath: 'id' });
                    console.log('[IndexedDBStorage] 创建对象存储: audio_blobs');
                }
            };

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                console.error('[IndexedDBStorage] 打开数据库失败:', event.target.error?.message);
                reject(event.target.error);
            };

            request.onblocked = () => {
                console.warn('[IndexedDBStorage] 数据库被阻塞，请关闭其他标签页');
            };
        });
    }

    // ==================== 自检方法 ====================

    /**
     * 在浏览器控制台执行自检 — 测试完整的 save→get→delete 流程
     * @returns {Promise<void>}
     */
    async _runSelfTest() {
        console.group('[IndexedDBStorage 自检]');
        try {
            const testId = 'self-test-' + Date.now();
            const testBlob = new Blob(['mock audio data for testing'], { type: 'audio/webm' });

            // 1. 保存
            await this.saveAudioBlob(testId, testBlob);
            console.log('✅ 保存音频 Blob');

            // 2. 读取
            const retrieved = await this.getAudioBlob(testId);
            console.assert(retrieved instanceof Blob, '❌ 读取的应为 Blob 实例');
            console.assert(retrieved.size === testBlob.size, '❌ Blob 大小不匹配');
            console.log('✅ 读取音频 Blob，大小:', retrieved.size, 'bytes');

            // 3. 删除
            await this.deleteAudioBlob(testId);
            const afterDelete = await this.getAudioBlob(testId);
            console.assert(afterDelete === null, '❌ 删除后应为 null');
            console.log('✅ 删除音频 Blob');

            console.log('🎉 IndexedDBStorage 自检通过');
        } catch (e) {
            console.error('❌ IndexedDBStorage 自检异常:', e);
        }
        console.groupEnd();
    }
}
