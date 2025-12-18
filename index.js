require("dotenv").config();

const express = require("express");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");

const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;
const GROUP_ID = BigInt(process.env.GROUP_ID);
const SESSION_STRING = process.env.SESSION_STRING;

if (!SESSION_STRING) {
  throw new Error("❌ SESSION_STRING yo‘q. Render’da ishlamaydi.");
}

// 🌐 WEB SERVER (Render uchun)
const app = express();
app.get("/", (req, res) => res.send("USERBOT ALIVE ✅"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🌐 Web server alive on port", PORT);
});

// 🤖 USERBOT
const stringSession = new StringSession(SESSION_STRING);

const client = new TelegramClient(
  stringSession,
  apiId,
  apiHash,
  { connectionRetries: 5 }
);

const KEYWORDS = [
  "taksi kerak",
  "taksi bormi",
  "bormoqchiman",
  "taksi chaqir",
  "yuk bor",
  "yuk tashish",
  "kishi bor",
  "odam bor",
  "pochta bor",
  "такси керак",
  "такси борми",
  "бормоқчиман",
];

(async () => {
  console.log("🔐 Userbot ulanmoqda...");

  await client.connect();
  console.log("✅ USERBOT ULANDA (SESSION orqali)");

  client.addEventHandler(
    async (event) => {
      const message = event.message;
      if (!message || !message.message) return;

      const text = message.message.toLowerCase();
      if (!KEYWORDS.some(k => text.includes(k))) return;

      let chat;
      try {
        chat = await message.getChat();
      } catch {
        return;
      }
      if (!chat || chat.id === GROUP_ID) return;

      const sender = await message.getSender();
      const userId = sender?.id;

      const username = sender?.username
        ? `@${sender.username}`
        : `ID:${userId}`;

      const groupName =
        chat.title ||
        chat.username ||
        "Nomaʼlum guruh";

      let messageLink = "❌ link yo‘q";
      if (chat.username) {
        messageLink = `https://t.me/${chat.username}/${message.id}`;
      }

      const date = new Date().toLocaleString("uz-UZ");

      const forwardText = `💬Text: ${message.message}

👤ID: ${userId}
⏰Sana: ${date}

🔗Username: ${username}
🔗Guruh: ${groupName}

✉️Xabarga o'tish:
${messageLink}
`;

      await client.sendMessage(GROUP_ID, { message: forwardText });

      // 🗑 admin bo‘lsa o‘chir
      try {
        const me = await client.getMe();
        const participant = await client.getParticipant(chat, me.id);
        const role = participant?.participant?.className;

        if (
          role === "ChannelParticipantAdmin" ||
          role === "ChannelParticipantCreator"
        ) {
          await message.delete();
        }
      } catch {}
    },
    new NewMessage({})
  );
})();


// ♻️ AUTO RECONNECT (Render fix)
setInterval(async () => {
  try {
    if (!client.connected) {
      console.log("♻️ Reconnecting Telegram...");
      await client.connect();
      console.log("✅ Reconnected");
    }
  } catch (e) {
    console.log("❌ Reconnect error:", e.message);
  }
}, 60 * 1000); // har 1 daqiqa
