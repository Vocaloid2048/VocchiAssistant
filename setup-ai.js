const axios = require('axios');

// 設置Ollama模型
async function setupOllama() {
    try {
        console.log('正在拉取模型...');

        // 拉取qwen2.5:0.5b模型
        await axios.post('http://localhost:11434/api/pull', {
            name: 'qwen2.5:0.5b'
        });
        

        console.log('模型拉取完成！');
        console.log('AI回覆功能已準備就緒。');

    } catch (error) {
        console.error('設置AI模型失敗:', error.message);
        console.log('請確保Ollama Docker容器正在運行。');
        console.log('運行: docker-compose up -d');
        console.log('然後重新運行此腳本。');
    }
}

setupOllama();