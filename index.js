import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// =============================
// 🔮 BASIC ENGINE (ง่าย + เสถียร)
// =============================
function generateRow(start) {
return Array.from({ length: 7 }, (_, i) => ((start + i - 1) % 7) + 1);
}

function calculateProfile(day, month, year) {
const yearMod = year % 7 === 0 ? 7 : year % 7;

const row1 = generateRow(day);
const row2 = generateRow(month);
const row3 = generateRow(yearMod);

const row4 = row1.map((v, i) => v + row2[i] + row3[i]);

return {
summary: {
dominant: row4.sort((a,b)=>b-a)[0],
pattern: row1[0]
}
};
}

// =============================
// 🤖 AI CALL (ตัวขาย)
// =============================
async function callAI(profile) {
const res = await axios.post(
"https://api.openai.com/v1/chat/completions",
{
model: "gpt-4o-mini",
messages: [
{
role: "system",
content: `คุณคือ “นักโหราศาสตร์ไทยระดับอาจารย์”

กฎ:

- ห้ามพูดเลข
- ห้าม technical
- ต้องแม่นเชิงจิตวิทยา
- พูดเหมือนหมอดูจริง

โครง:

1. ตัวตน
2. การเงิน
3. ความรัก
4. จุดเปลี่ยน
5. คำเตือน

สั้น กระชับ แต่แรง

จบด้วย:
👉 ถ้าตรง พิมพ์ 'ลึก'"}, { role: "user", content: JSON.stringify(profile) } ] }, { headers: { Authorization:"Bearer ${process.env.OPENAI_API_KEY}`,
"Content-Type": "application/json"
}
}
);

return res.data.choices[0].message.content;
}

// =============================
// 📩 LINE REPLY
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
Authorization: "Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}"
}
}
);
}

// =============================
// 🔥 WEBHOOK
// =============================
app.post("/webhook", async (req, res) => {
res.sendStatus(200);

try {
const event = req.body.events[0];
const text = event.message.text;
const replyToken = event.replyToken;

// ====== STEP 1: เช็ค "ลึก" ======
if (text === "ลึก") {
  return reply(replyToken,

`🔓 ดวงลึกของคุณ

- การเงิน 3 ปี
- ความรักจริง vs คนผ่านมา
- จุดพีคชีวิต

ค่าดู: 59 บาท

พิมพ์ "ตกลง" เพื่อดูต่อ`);
}

// ====== STEP 2: เช็ค "ตกลง" ======
if (text === "ตกลง") {
  return reply(replyToken,

`💰 ระบบชำระเงิน (เดี๋ยวใส่ทีหลัง)

โอนแล้วแจ้งสลิป`);
}

// ====== STEP 3: parse วันเกิด ======
const match = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);

if (!match) {
  return reply(replyToken, "พิมพ์วันเกิด เช่น 14/03/2530");
}

const day = parseInt(match[1]);
const month = parseInt(match[2]);
const year = parseInt(match[3]);

// ====== STEP 4: คำนวณ ======
const profile = calculateProfile(day, month, year);

// ====== STEP 5: AI ======
const aiText = await callAI(profile);

// ====== STEP 6: ตอบ ======
await reply(replyToken, aiText);

} catch (err) {
console.error(err);
}
});

// =============================
// 🚀 START SERVER
// =============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log("🔥 AEMOO RUNNING:", PORT);
});
