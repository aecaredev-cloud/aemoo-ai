const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const LINE_TOKEN = process.env.LINE_ACCESS_TOKEN;

// ===== reply =====
async function reply(replyToken, text) {
    await axios.post(
        'https://api.line.me/v2/bot/message/reply',
        {
            replyToken,
            messages: [{ type: 'text', text }]
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LINE_TOKEN}`
            }
        }
    );
}

// ===== webhook =====
app.post('/webhook', async (req, res) => {
    console.log("🔥 webhook เข้าแล้ว");

    res.sendStatus(200);

    const events = req.body.events || [];

    for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text') {

            const replyToken = event.replyToken;
            const userText = event.message.text;

            console.log("📩 message:", userText);

            try {
                const aiRes = await axios.post(
                    "https://api.openai.com/v1/chat/completions",
                    {
                        model: "gpt-4o-mini",
                        messages: [
                            { role: "system", content: "คุณคือหมอดูไทย วิเคราะห์แม่น ตรง ไม่ถามคำถามกลับ" },
                            { role: "user", content: userText }
                        ]
                    },
                    {
                        headers: {
                            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                            "Content-Type": "application/json"
                        }
                    }
                );

                const aiText = aiRes.data.choices[0].message.content;

                await reply(replyToken, aiText);

            } catch (err) {
                console.log("❌ ERROR:", err.response?.data || err.message);
                await reply(replyToken, "ระบบขัดข้องชั่วคราว");
            }
        }
    }
});

// ===== start =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("🚀 Server running");
});
