const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const LINE_TOKEN = process.env.LINE_ACCESS_TOKEN;

// ==============================
// 🔥 ฟังก์ชัน reply (ตอบทันที)
// ==============================
async function replyToLine(replyToken, text) {
    await axios.post(
        'https://api.line.me/v2/bot/message/reply',
        {
            replyToken: replyToken,
            messages: [{ type: 'text', text: text }]
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LINE_TOKEN}`
            }
        }
    );
}

// ==============================
// 🔥 ฟังก์ชัน push (ตอบทีหลัง)
// ==============================
async function pushToLine(userId, text) {
    await axios.post(
        'https://api.line.me/v2/bot/message/push',
        {
            to: userId,
            messages: [{ type: 'text', text: text }]
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LINE_TOKEN}`
            }
        }
    );
}

// ==============================
// 🔥 webhook หลัก
// ==============================
app.post('/webhook', async (req, res) => {
    res.sendStatus(200);

    const events = req.body.events;

    for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text') {

            const replyToken = event.replyToken;
            const userId = event.source.userId;
            const userText = event.message.text;

            try {
                // ✅ ตอบทันที (กัน replyToken หมดอายุ)
                await replyToLine(replyToken, "กำลังดูดวงให้อยู่นะ 🔮");

                // ✅ จำลอง AI (เดี๋ยวค่อยต่อ OpenAI ทีหลัง)
                const aiText = `คุณพิมพ์ว่า: ${userText}`;

                // ✅ push ตอบจริง
                await pushToLine(userId, aiText);

            } catch (err) {
                console.log("ERROR:", err.response?.data || err.message);
            }
        }
    }
});

// ==============================
// start server
// ==============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
