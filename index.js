import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// =============================
// 🔥 MAHABOTE ENGINE (ง่ายก่อน)
// =============================

function generateRow(start) {
  return Array.from({ length: 7 }, (_, i) => ((start + i - 1) % 7) + 1);
}

function calculateMahabote(day, month, yearBE) {
  const year = yearBE % 7 === 0 ? 7 : yearBE % 7;

  const row1 = generateRow(day);
  const row2 = generateRow(month);
  const row3 = generateRow(year);

  const row4 = row1.map((v, i) => v + row2[i] + row3[i]);

  return {
    row1,
    row2,
    row3,
    row4
  };
}

// =============================
// 🔥 AI CALL
// =============================

async function askAI(userText, mahabote) {
  const prompt = `
คุณคือหมอดูไทยระดับสูง ใช้ข้อมูลนี้เท่านั้นในการทำนาย ห้ามมั่ว

ข้อมูลดวง:
${JSON.stringify(mahabote)}

คำถาม:
${userText}

ให้ทำนายแบบมืออาชีพ อิงข้อมูลจริงเท่านั้น
`;

  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  return res.data.choices[0].message.content;
}

// =============================
// 🔥 LINE REPLY
// =============================

async function reply(replyToken, text) {
  await axios.post(
    "https://api.line.me/v2/bot/message/reply",
    {
      replyToken,
      messages: [{ type: "text", text }]
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
      }
    }
  );
}

// =============================
// 🔥 WEBHOOK
// =============================

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);

  const events = req.body.events || [];

  for (const event of events) {
    if (event.type === "message") {
      const replyToken = event.replyToken;
      const userText = event.message.text;

      console.log("📩", userText);

      try {
        // 🔥 DEMO INPUT (เดี๋ยวค่อยทำ dynamic)
        const mahabote = calculateMahabote(3, 5, 2530);

        const aiText = await askAI(userText, mahabote);

        await reply(replyToken, aiText);

      } catch (err) {
        console.error(err.response?.data || err.message);
        await reply(replyToken, "ระบบขัดข้องชั่วคราว");
      }
    }
  }
});

// =============================
// 🚀 START SERVER
// =============================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Server running"));
