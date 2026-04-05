const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// 🔥 Webhook
app.post('/webhook', async (req, res) => {
  const events = req.body.events;

  if (!events || events.length === 0) {
    return res.status(200).send('OK');
  }

  // ✅ ตอบทันที (กัน timeout)
  res.status(200).send('OK');

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const replyToken = event.replyToken;

      await axios.post(
        'https://api.line.me/v2/bot/message/reply',
        {
          replyToken: replyToken,
          messages: [
            {
              type: 'text',
              text: 'ติดแล้ว 🔥'
            }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  }
});

// 🔥 สำคัญมาก (เปิด server)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server is running on port ' + PORT);
});
