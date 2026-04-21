export class AudioPlayer {
    /**
     * @param {HTMLElement} container - 挂载的DOM容器
     * @param {string} audioUrl - 初始音频地址
     */
    constructor(container, audioUrl = '') {
        this.container = container;
        this.audioUrl = audioUrl;
        this.render(); // 初始化DOM
    }

    render() {
        // TODO: 成员4 Day 2任务 - 渲染播放器DOM结构 (播放按钮、进度条等)
        this.container.innerHTML = `<div class="audio-player-ui">播放器加载中...</div>`;
    }

    // --- 暴露给主应用的接口 ---
    
    play() { console.log("UI: 播放状态更新"); }
    pause() { console.log("UI: 暂停状态更新"); }
    stop() { console.log("UI: 停止状态更新"); }
    seekTo(time) { console.log(`UI: 进度条跳转至 ${time}`); }
    
    // 事件回调注册
    onTimeUpdate(callback) { this._onTimeUpdate = callback; }
    onEnded(callback) { this._onEnded = callback; }
}