const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Simple JSON Memory Storage
const MEMORY_FILE = path.join(__dirname, 'memory.json');

function getMemory() {
    if (!fs.existsSync(MEMORY_FILE)) return {};
    try {
        return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
    } catch (e) {
        return {};
    }
}

function saveMemory(memory) {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
}

// LINE Messaging API Helper
async function replyToLine(replyToken, text) {
    const url = 'https://api.line.me/v2/bot/message/reply';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
    };
    const data = {
        replyToken: replyToken,
        messages: [{ type: 'text', text: text }]
    };
    try {
        await axios.post(url, data, { headers });
    } catch (error) {
        console.error('Error replying to LINE:', error.response ? error.response.data : error.message);
    }
}

// OpenAI API Helper
async function getAIResponse(userId, userMessage) {
    const memory = getMemory();
    const userSession = memory[userId] || { messages: [], count: 0 };

    // Monetization Logic: Limit 3 messages
    if (userSession.count >= 3) {
        return "ยังมีบางอย่างที่คุณยังไม่รู้...\nปลดล็อกคำทำนายทั้งหมด 49 บาท";
    }

    const systemPrompt = `You are a professional fortune teller.

Style:
- Direct, calm, deep
- Not generic
- Not overly positive
- Make user feel “this is about me”

Structure:
1. Hook (pull attention immediately)
2. Insight (specific, personal)
3. Timeframe (3-7 days / 1 month)
4. Ending hook (make user want to ask more)

Rules:
- NEVER ask questions back
- NEVER repeat user input
- MUST give prediction immediately
- MUST feel specific and real`;

    const messages = [
        { role: "system", content: systemPrompt },
        ...userSession.messages,
        { role: "user", content: userMessage }
    ];

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o-mini",
            messages: messages,
            max_tokens: 500
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const aiText = response.data.choices[0].message.content;

        // Update Memory
        userSession.messages.push({ role: "user", content: userMessage });
        userSession.messages.push({ role: "assistant", content: aiText });
        
        // Keep last 5 messages (10 items including assistant)
        if (userSession.messages.length > 10) {
            userSession.messages = userSession.messages.slice(-10);
        }
        
        userSession.count += 1;
        memory[userId] = userSession;
        saveMemory(memory);

        return aiText;
    } catch (error) {
        console.error('Error calling OpenAI:', error.response ? error.response.data : error.message);
        return "ขออภัย ดวงดาวกำลังเคลื่อนที่ผิดปกติ... ลองใหม่อีกครั้งในภายหลัง";
    }
}

// Webhook Endpoint
app.post('/webhook', async (req, res) => {
    const events = req.body.events;
    if (!events || events.length === 0) {
        return res.status(200).send('OK');
    }

    for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
            const replyToken = event.replyToken;
            const userId = event.source.userId;
            const userText = event.message.text;

            const aiResponse = await getAIResponse(userId, userText);
            await replyToLine(replyToken, aiResponse);
        }
    }

    res.status(200).send('OK');
});

app.get('/', (req, res) => {
    res.send('AI Fortune Teller Bot is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
