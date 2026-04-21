export class TranscriptDisplay {
    constructor(container, transcript = '') {
        this.container = container;
        this.setTranscript(transcript);
    }

    setTranscript(text) {
        this.text = text;
        this.render();
    }

    render() {
        // TODO: 成员4 Day 2任务 - 将文本按句子或单词切分并包裹 <span> 用于高亮
        this.container.innerHTML = `<div class="transcript-box">${this.text || "等待文本加载..."}</div>`;
    }

    // --- 暴露给主应用的接口 ---
    
    highlightWord(wordIndex) {
        // TODO: 移除旧高亮，为第 wordIndex 个单词添加高亮 class
    }

    highlightSentence(sentenceIndex) {
        // TODO: 高亮整句
    }

    scrollToCurrent() {
        // TODO: 控制容器滚动条，使高亮部分保持在视口中央
    }
}