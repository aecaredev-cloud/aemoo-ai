import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// =========================
// 🔮 GENERATE HOROSCOPE
// =========================
function generatePrediction(day, month, year) {
  return `
🔮 ตัวตน
คุณเป็นคนคิดเยอะกว่าที่คนอื่นเห็น ชอบเก็บอะไรไว้ข้างในลึกๆ
ภายนอกดูนิ่ง แต่ข้างในไม่เคยหยุดคิด โดยเฉพาะเรื่องอนาคตและความมั่นคง

💰 การเงิน
ช่วงนี้มีจังหวะเงินเข้า แต่เก็บไม่ค่อยอยู่
มีเกณฑ์ได้เงินจากโอกาสใหม่ หรืออะไรที่ไม่คาดคิด

❤️ ความรัก
เป็นคนรักจริง แต่ที่ผ่านมาเหมือนให้ผิดคน
ลึกๆยังมีเรื่องค้างคาในใจที่ยังไม่ได้ปล่อย

🔥 จุดเปลี่ยนชีวิต
จะมีการเปลี่ยนแปลงใหญ่ในช่วง 3-6 เดือนนี้
เป็นจังหวะที่ต้อง “ตัดสินใจบางอย่าง”

⚠️ คำเตือน
ระวังการไว้ใจคนผิด โดยเฉพาะเรื่องเงินหรือความลับ

👉 ถ้าตรง พิมพ์ “ลึก” เพื่อดูรายละเอียด
`;
}

// =========================
// 📩 REPLY TO LINE
// =========================
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
        Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
      },
    }
  );
}

// =========================
// 📥 WEBHOOK
// =========================
app.post("/webhook", async (req, res) => {
  res.sendStatus(200);

  try {
    const event = req.body.events[0];
    const text = event.message.text;
    const replyToken = event.replyToken;

    // ถ้า user พิมพ์ "ลึก"
    if (text.trim() === "ลึก") {
      return reply(
        replyToken,
        "🔮 ดวงลึก: คุณกำลังจะได้โอกาสใหม่ที่เปลี่ยนชีวิต แต่ต้องกล้าตัดสิ่งเดิมก่อน"
      );
    }

    // parse วันเกิด
    const match = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!match) {
      return reply(replyToken, "กรุณาพิมพ์วันเกิด เช่น 14/03/2530");
    }

    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    const year = parseInt(match[3]);

    const result = generatePrediction(day, month, year);

    await reply(replyToken, result);
  } catch (err) {
    console.error(err);
  }
});

// =========================
// 🚀 START SERVER
// =========================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🔥 AEMOO RUNNING ON PORT", PORT);
});
