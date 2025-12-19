require("dotenv").config();

const express = require("express");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");

// ===== ENV =====
const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;
const GROUP_ID = process.env.GROUP_ID; // string qilib oldik
const SESSION_STRING = process.env.SESSION_STRING;

if (!SESSION_STRING) {
  throw new Error("❌ SESSION_STRING yo‘q. Render’da ishlamaydi.");
}

// ===== WEB SERVER =====
const app = express();
app.get("/", (req, res) => res.send("USERBOT ALIVE ✅"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("🌐 Web server alive on port", PORT)
);

// ===== USERBOT =====
const client = new TelegramClient(
  new StringSession(SESSION_STRING),
  apiId,
  apiHash,
  { connectionRetries: 5 }
);

// ===== KEYWORDS =====
const KEYWORDS = [
  "taksi kerak","taxi kerak","такси керак","taksi kerek","taksi kere",
  "taksi bormi","taxi bormi","такси борми","taksi bormu",
  "bormoqchiman","borishim kerak","ketishim kerak","бормоқчиман",
  "taksi chaqir","taxi chaqir","taksi chaqiring","taksi yuboring",
  "yuk bor","yuk tashish","yuk yetkazish","pochta bor","pochta tashish",
  "odam bor","kishi bor","1 kishi","2 kishi","3 kishi","4 kishi","5 kishi",
  "ikki kishimiz","uch kishimiz","o‘zim boraman",
  "srochni","shoshilinch","tez ketish kerak","tez borish kerak",
  "taksi","taxi kerak","yuk","pochta bor","haydovchi kerak","mashina kerak",
  "taksi ker","taxi ker","taksi kera","yuk boru","odam boru",
  "taksi kerak aka","taksi bormi aka",
];

// ===== BLACKLIST =====
const BLACKLIST = [
  "kishi kerak","киши керак","avto moshina","авто мошина",
  "pochta olaman","почта оламан","yuk olaman","юк оламан",
  "pochta ham olamiz","почта ҳам оламиз",
  "srochni yuramiz","srochni ketamiz","srochniy yuramiz",
  "odam qo'shish","1 odam kerak","2 odam kerak","3 odam kerak","ODAM KERAK","Manzildan","AVTO",
  "joyimiz bor","odam pochta","poshda olamiz",
  "1 odam garak","2 odam garak","3 odam garak",
  "srochni getamiz","moshin bor","pochta olomon","TAXI BOR","POCHTA HAM OLAMIZ","mashin bor","2 KISHI KERAK","TAXI BAR","1 KISHI KERE","YURAMIZ","POCHTA OLAMIZ"
];

// ===== START =====
(async () => {
  console.log("🔐 Userbot ulanmoqda...");
  await client.connect();
  console.log("✅ USERBOT ULANDA");

  client.addEventHandler(async (event) => {
    const message = event.message;
    if (!message?.message) return;

    const text = message.message.toLowerCase().trim();

    let chat;
    try {
      chat = await message.getChat();
    } catch {
      return;
    }
    if (!chat) return;

    // 🔒 O‘z guruhimizdan kelgan bo‘lsa — SKIP
    if (String(chat.id) === GROUP_ID) return;

    const hasKeyword = KEYWORDS.some(k => text.includes(k));
    if (!hasKeyword) return;

    const hasBlacklist = BLACKLIST.some(b => text.includes(b));
    if (hasBlacklist) return;

    // ===== MAʼLUMOT =====
    const sender = await message.getSender();
    const userId = sender?.id;
    const username = sender?.username ? `@${sender.username}` : `ID:${userId}`;
    const groupName = chat.title || chat.username || "Nomaʼlum guruh";

    let messageLink = "❌ link yo‘q";
    if (chat.username) {
      messageLink = `https://t.me/${chat.username}/${message.id}`;
    }

    const date = new Date().toLocaleString("uz-UZ");

    const forwardText = `🚖 YANGI MIJOZ

💬 Xabar:
${message.message}

👤 User: ${username}
🆔 ID: ${userId}
👥 Guruh: ${groupName}
⏰ Sana: ${date}

🔗 Xabar linki:
${messageLink}
`;

    await client.sendMessage(GROUP_ID, { message: forwardText });

  }, new NewMessage({}));

})();

// ===== AUTO RECONNECT =====
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
}, 60 * 1000);
