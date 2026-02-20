require("dotenv").config();

const express = require("express");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");

// ===== ENV =====
const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;
const GROUP_ID = process.env.GROUP_ID; // string
const SESSION_STRING = process.env.SESSION_STRING;

if (!SESSION_STRING) {
  throw new Error("❌ SESSION_STRING yo‘q. Render’da ishlamaydi.");
}

// ===== WEB SERVER =====
const app = express();
app.get("/", (req, res) => res.send("USERBOT ALIVE ✅"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🌐 Web server alive on port", PORT));

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
  "taksi kerak aka","taksi bormi aka","кетишим керак","боришим керак",
];

// ===== BLACKLIST =====
const BLACKLIST = [
  "kishi kerak","киши керак","avto moshina","авто мошина",
  "pochta olaman","почта оламан","yuk olaman","юк оламан",
  "pochta ham olamiz","почта ҳам оламиз",
  "srochni yuramiz","srochni ketamiz","srochniy yuramiz","srochniga yuramiz",
  "odam qo'shish","1 odam kerak","2 odam kerak","3 odam kerak","odam kerak","manzildan","avto",
  "joyimiz bor","odam pochta","poshda olamiz","onix taksi","taksi bar","adam poshta bolsa","1 kishi kera",
  "daromad topishni xohlaysizmi?","daromad topishni xohlaysizmi",
  "poshta olamiz","poshta olaman","taksi bor","taksi bormi","yuk bor","yuk bormi",
  "1 odam garak","2 odam garak","3 odam garak","pochta ham olaman","jonaymiz","pochtaham olamiz",
  "3 kishi kerak","4 kishi kerak","5 kishi kerak","2 kishi kk","adam pochta bolsa",
  "srochni getamiz","moshin bor","pochta olomon","odam olamiz","yuramiz","ayollar bor","1 ta kam",
  "#yuramiz","pochta xizmati bor","yuriladi","taxi bor","pochta ham olamiz","mashin bor",
  "2 kishi kerak","taxi bar","1 kishi kere","pochta xam olamiz","poshtaxam olamiz","2 kishi kk",
  "1 kishi kere","pochta olamiz","pochta olamiz","ODAM KAM","ПОЧТА ОЛАМИЗ","ISHCHI KERAK","ta kam","TA KAM",
];

// ===== helper: match topish =====
function findMatch(text, arr) {
  return arr.find((x) => text.includes(x));
}

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
    if (String(chat.id) === String(GROUP_ID)) return;

    // 1) KEYWORDS bo'lishi shart
    const keywordHit = findMatch(text, KEYWORDS);
    if (!keywordHit) return;

    // 2) BLACKLIST'dan 1 ta bo'lsa ham olma (skip)
    const blacklistHit = findMatch(text, BLACKLIST);
    if (blacklistHit) {
      // xohlasang log qilib ko'rasan qaysi so'z urdi
      console.log("⛔ BLACKLIST HIT:", blacklistHit, "| TEXT:", text);
      return;
    }

    // ===== MAʼLUMOT =====
    // ===== MAʼLUMOT =====
const sender = await message.getSender();
const userId = sender?.id;
const username = sender?.username ? `@${sender.username}` : "yo'q";
const firstName = sender?.firstName || "";
const lastName = sender?.lastName || "";
const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Noma'lum";
const phone = sender?.phone ? `+${sender.phone}` : "yo'q";
const groupName = chat.title || chat.username || "Nomaʼlum guruh";
const groupUsername = chat.username ? `@${chat.username}` : `ID:${chat.id}`;

let messageLink = "❌ link yo'q";
if (chat.username) {
  messageLink = `https://t.me/${chat.username}/${message.id}`;
}

const forwardText = `1. ID: ${userId}
2. Ismi: ${fullName}
3. Foydalanuvchi: ${username}
4. Telefon raqami: ${phone}
5. Guruh: ${groupUsername}
5. ${message.message}`;

await client.sendMessage(GROUP_ID, { message: forwardText });

    console.log("✅ FORWARDEd | keyword:", keywordHit);

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
