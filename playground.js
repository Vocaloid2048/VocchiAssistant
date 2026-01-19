const axios = require('axios');

async function generateAIReply(content) {
    try {
        // 使用Ollama API
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'qwen2.5:0.5b',
            prompt: `你是一個夢幻的AI，總是處於半夢半醒的狀態，回覆風格特別飄忽、沒重點，像在說夢話。請根據用戶的殘響內容，給出一個夢幻的、抽象的、沒有邏輯的回覆。不要直接回應內容，而是像在喃喃自語一樣。

用戶的殘響：${content}

回覆：`,
            stream: false,
            options: {
                num_ctx: 512,
                num_predict: 30,
                temperature: 0.8,
                top_p: 0.9
            }
        });

        return response.data.response || '?';
    } catch (error) {
        console.error('AI回覆生成失敗:', error);
        return error;
    }
}

// 發送AI回覆
async function sendAIReply() {
    // Read from terminal
    const content = '今天心情有點低落，遇上很多不順的事情了。';
    const reply = await generateAIReply(content);
    console.log('AI回覆:', reply);
}

(async() => {
    await sendAIReply();
})();