import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// =============================
// 🔥 MAHABOTE ENGINE
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
    input: { day, month, yearBE },
    row1,
    row2,
    row3,
    row4
  };
}

// =============================
// 🔥 PARSE วันเกิดจากข้อความ
// =============================

function parseBirth(text) {
  const match = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    return {
      day: parseInt(match[1]),
      month: parseInt(match[2]),
      year: parseInt(match[3])
    };
  }
  return null;
}

// =============================
// 🔥 AI CALL
// =============================

async function askAI(userText, mahabote) {
  const prompt = `
คุณคือหมอดูไทยระดับสูง ใช้ศาสตร์มหาโหร (Mahabote)

ห้ามมั่ว ห้ามเดา
ต้องอ้างอิงข้อมูลนี้เท่านั้น:

${JSON.stringify(mahabote, null, 2)}

คำถามของผู้ใช้:
${userText}

ให้วิเคราะห์เป็น:
- พื้นดวง
- การงาน
- การเงิน
- คำแนะนำ

เขียนแบบมืออาชีพ กระชับ น่าเชื่อถือ
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
        const birth = parseBirth(userText);

        if (!birth) {
          await reply(replyToken, "กรุณาพิมพ์วันเกิด เช่น 14/03/2530");
          continue;
        }

        const mahabote = calculateMahabote(
          birth.day,
          birth.month,
          birth.year
        );

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
