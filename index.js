import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// ==============================
// 🔥 MAHABOTE ENGINE (deterministic)
// ==============================

function generateRow(start) {
  return Array.from({ length: 7 }, (_, i) => ((start + i - 1) % 7) + 1);
}

function calculateMahabote(day, month, year) {
  const yearMod = year % 7 === 0 ? 7 : year % 7;

  const row1 = generateRow(day);
  const row2 = generateRow(month);
  const row3 = generateRow(yearMod);

  const row4 = row1.map((v, i) => v + row2[i] + row3[i]);

  return {
    input: { day, month, year },
    row1,
    row2,
    row3,
    row4,
  };
}

// ==============================
// 🔥 PARSE INPUT
// ==============================

function parseBirth(text) {
  const match = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;

  return {
    day: parseInt(match[1]),
    month: parseInt(match[2]),
    year: parseInt(match[3]),
  };
}

// ==============================
// 🔥 LINE REPLY
// ==============================

async function reply(replyToken, text) {
  await axios.post(
    "https://api.line.me/v2/bot/message/reply",
    {
      replyToken,
      messages: [{ type: "text", text }],
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
    }
  );
}

// ==============================
// 🔥 WEBHOOK
// ==============================

app.post("/webhook", async (req, res) => {
  console.log("🔥 webhook เข้าแล้ว");
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
          await reply(replyToken, "พิมพ์วันเกิดแบบ 14/03/2530");
          continue;
        }

        const mahabote = calculateMahabote(
          birth.day,
          birth.month,
          birth.year
        );

        const resultText = `🔮 ผลคำนวณดวง

วัน: ${birth.day}
เดือน: ${birth.month}
ปี: ${birth.year}

row1: ${mahabote.row1.join(",")}
row2: ${mahabote.row2.join(",")}
row3: ${mahabote.row3.join(",")}
row4: ${mahabote.row4.join(",")}
`;

        await reply(replyToken, resultText);
      } catch (err) {
        console.log("❌ ERROR:", err.message);

        try {
          await reply(replyToken, "⚠️ ระบบมีปัญหา แต่ยังออนไลน์อยู่");
        } catch (e) {
          console.log("reply fail");
        }
      }
    }
  }
});

// ==============================
// 🔥 START SERVER
// ==============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
