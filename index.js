export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('OK');
  }

  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {

      const replyToken = event.replyToken;
      const userText = event.message.text;

      let replyText = "ยังไม่เข้าใจ 🤔";

      if (userText.toLowerCase().includes("hi")) {
        replyText = "ติดแล้ว 🔥";
      }

      await fetch("https://api.line.me/v2/bot/message/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer ใส่_token_ของพี่"
        },
        body: JSON.stringify({
          replyToken: replyToken,
          messages: [
            {
              type: "text",
              text: replyText
            }
          ]
        })
      });
    }
  }

  return res.status(200).send("OK");
}
