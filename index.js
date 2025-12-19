// require("dotenv").config();

// const express = require("express");
// const { TelegramClient } = require("telegram");
// const { StringSession } = require("telegram/sessions");
// const { NewMessage } = require("telegram/events");

// const apiId = Number(process.env.API_ID);
// const apiHash = process.env.API_HASH;
// const GROUP_ID = BigInt(process.env.GROUP_ID);
// const SESSION_STRING = process.env.SESSION_STRING;

// if (!SESSION_STRING) {
//   throw new Error("❌ SESSION_STRING yo‘q. Render’da ishlamaydi.");
// }

// // 🌐 WEB SERVER (Render uchun)
// const app = express();
// app.get("/", (req, res) => res.send("USERBOT ALIVE ✅"));
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log("🌐 Web server alive on port", PORT);
// });

// // 🤖 USERBOT
// const stringSession = new StringSession(SESSION_STRING);

// const client = new TelegramClient(
//   stringSession,
//   apiId,
//   apiHash,
//   { connectionRetries: 5 }
// );

// const KEYWORDS = [
//   // ===== TAKSI KERAK =====
//   "taksi kerak", "taxi kerak", "такси керак", "тaksi kerak",
//   "taksi kerek", "taksi kere", "taxi kerek",
//   "taksi lazim", "taksi zarur", "taksi topiladi",
//   "menga taksi kerak", "menga taxi kerak",
//   "taksi plz", "taxi pls", "taxi please",

//   // ===== TAKSI BORMI =====
//   "taksi bormi", "taxi bormi", "такси борми",
//   "taksi bormu", "taksi bormi?",
//   "taksi yo‘qmi", "taksi topiladimi",
//   "yaqin taksi bormi", "bo‘sh taksi bormi",
//   "taksi bormi hozir", "hozir taksi bormi",

//   // ===== BORISH / KETISH =====
//   "bormoqchiman",
//   "borishim kerak", "ketishim kerak",
//   "бормоқчиман", "yo‘lga chiqaman",
//   "tez borishim kerak", "shoshilib ketishim kerak",

//   // ===== TAKSI CHAQIRISH =====
//   "taksi chaqir", "taxi chaqir",
//   "taksi chaqiring", "taksi chaqirsangiz",
//   "taksi olib bering", "taksi yuboring",
//   "taksi chaqirib bering",
//   "taksi topib bering",

//   // ===== YUK / POCHTA =====
//   "yuk bor", "yuk tashish", "yuk yetkazish",
//   "yuk tashish kerak", "yuk olib borish kerak",
//   "kichik yuk bor", "katta yuk bor",
//   "pochta bor", "pochta tashish",
//   "pochta jo‘natish", "pochta yetkazish",
//   "pochta olib borish kerak",
//   "yuk bormi tashiydigan",

//   // ===== ODAM / KISHI SONI =====
//   "odam bor", "kishi bor",
//   "1 kishi", "2 kishi", "3 kishi", "4 kishi", "5 kishi", "6 kishi",
//   "ikki kishimiz", "uch kishimiz",
//   "o‘zim boraman",

//   // ===== SHOSHILINCH / TEZ =====
//   "srochni", "srochni ketish",
//   "srochni borish kerak",
//   "shoshilinch ketishim kerak", 
//   "tez ketish kerak", "tez borish kerak",

//   // ===== UMUMIY / QISQA =====
//   "taksi", "taxi",
//   "yuk", "pochta",
//   "haydovchi kerak",
//   "mashina kerak",
//   "avto kerak",

//   // ===== XATOLI / ARALASH YOZILISHLAR =====
//   "taksi ker", "taxi ker",
//   "taksi kerekk", "taksi kera",
//   "такси кера", "такси кер",
//   "yuk boru", "odam boru",
//   "taksi bormi aka",
//   "taksi kerak aka",
//   "taksi bor mi"
// ];


// const BLACKLIST = [
//   "kishi kerak",
//   "киши керак",
//   "авто мошина",
//   "avto moshina",
//   "Moshin bor",
//   "pochta olomon",
//   "pochta ham olamiz",
//   "почта ҳам оламиз",
//   "srochni yuramiz",
//   "cрочни юрамиз",
//   "srochni ketamiz",
//   "JOYIMIZ BOR",
//   "Odam pochta",
//   "ODAM POCHTA",
//   "srochniy ketamiz",
//   "srochniy yuramiz",
//   "srochniy boramiz", 
//   "poshda olamiz",
//   "POSHDA OLAMIZ",
//   "SROCHNI GETAMIZ",
//   "odam qo'shish",
//   "1 ODAM GARAK",
//   "2 ODAM GARAK",
//   "3 ODAM GARAK",
//   "1 ODAM KERAK",
//   "pochta olaman",
//   "почта оламан",
//   "yuk olaman",
//   "юк оламан"

// ];


// (async () => {
//   console.log("🔐 Userbot ulanmoqda...");

//   await client.connect();
//   console.log("✅ USERBOT ULANDA (SESSION orqali)");

//   client.addEventHandler(
//     async (event) => {
//       const message = event.message;
//       if (!message || !message.message) return;
  
//       const text = message.message.toLowerCase();
  
//       let chat;
//       try {
//         chat = await message.getChat();
//       } catch {
//         return;
//       }
//       if (!chat) return;
  
//       // 🔹 Agar shaxsiy guruhda qora ro'yxatdagi so'z bo'lsa, o'chir
//       if (chat.id === GROUP_ID && BLACKLIST.some(word => text.includes(word))) {
//         await message.delete();
//         return;
//       }
  
//       // 🔹 Agar shaxsiy guruhda bo'lsa, boshqa hech narsa qilma
//       if (chat.id === GROUP_ID) return;
  
//       // 🔹 Agar qora ro'yxatdagi so'z bo'lsa, xabarni qayta ishlama
//       if (BLACKLIST.some(word => text.includes(word))) {
//     // Agar shaxsiy guruhda bo'lsa o'chir
//     if (chat.id === GROUP_ID) {
//         await message.delete();
//     }
//     // Qora ro'yxatdagi xabarni boshqa joyga forward qilma
//     return;
// }
  
//       // 🔹 Agar kalit so'zlardan hech biri bo'lmasa, ham ishlama
//       if (!KEYWORDS.some(k => text.includes(k))) return;

//     const sender = await message.getSender();
//     const userId = sender?.id;

//     const username = sender?.username
//       ? `@${sender.username}`
//       : `ID:${userId}`;

//     const groupName =
//       chat.title ||
//       chat.username ||
//       "Nomaʼlum guruh";

//     let messageLink = "❌ link yo‘q";
//     if (chat.username) {
//       messageLink = `https://t.me/${chat.username}/${message.id}`;
//     }

//     const date = new Date().toLocaleString("uz-UZ");

//     const forwardText = `💬Text: ${message.message}

// 👤ID: ${userId}
// ⏰Sana: ${date}

// 🔗Username: ${username}
// 🔗Guruh: ${groupName}

// ✉️Xabarga o'tish:
// ${messageLink}
// `;

//     // 📤 Guruhga yuborish
//     await client.sendMessage(GROUP_ID, { message: forwardText });

//     // 🗑 admin bo‘lsa o‘chir
//     try {
//       const me = await client.getMe();
//       const participant = await client.getParticipant(chat, me.id);
//       const role = participant?.participant?.className;

//       if (
//         role === "ChannelParticipantAdmin" ||
//         role === "ChannelParticipantCreator"
//       ) {
//         await message.delete();
//       }
//     } catch {}
//   },
//   new NewMessage({})
// );
// })();


// // ♻️ AUTO RECONNECT (Render fix)
// setInterval(async () => {
//   try {
//     if (!client.connected) {
//       console.log("♻️ Reconnecting Telegram...");
//       await client.connect();
//       console.log("✅ Reconnected");
//     }
//   } catch (e) {
//     console.log("❌ Reconnect error:", e.message);
//   }
// }, 60 * 1000); // har 1 daqiqa


require("dotenv").config();

const express = require("express");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");

// ===== ENV =====
const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;
const GROUP_ID = BigInt(process.env.GROUP_ID);
const SESSION_STRING = process.env.SESSION_STRING;

if (!SESSION_STRING) {
  throw new Error("❌ SESSION_STRING yo‘q. Render’da ishlamaydi.");
}

// ===== WEB SERVER (Render alive) =====
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
  "taksi","taxi","yuk","pochta","haydovchi kerak","mashina kerak",
  "taksi ker","taxi ker","taksi kera","yuk boru","odam boru",
  "taksi kerak aka","taksi bormi aka",
];

// ===== BLACKLIST =====
const BLACKLIST = [
  "kishi kerak","киши керак","avto moshina","авто мошина",
  "pochta olaman","почта оламан","yuk olaman","юк оламан",
  "pochta ham olamiz","почта ҳам оламиз",
  "srochni yuramiz","srochni ketamiz","srochniy yuramiz",
  "odam qo'shish","1 odam kerak","2 odam kerak","3 odam kerak",
  "joyimiz bor","odam pochta","poshda olamiz","1 ODAM GARAK",
  "2 ODAM GARAK","3 ODAM GARAK","SROCHNI GETAMIZ","Moshin bor","pochta olomon"
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

  const hasKeyword = KEYWORDS.some(k => text.includes(k));
  const hasBlacklist = BLACKLIST.some(b => text.includes(b));

  // 🔒 O‘z guruhimizdan kelgan bo‘lsa — o‘tma
  if (chat.id === GROUP_ID) return;

  // ❌ Keyword yo‘q — o‘tma
  if (!hasKeyword) return;

  // ⚠️ Keyword bor, lekin blacklist ham bor — SKIP
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

  const forwardText = `🚖 *YANGI MIJOZ*

💬 *Xabar:*
${message.message}

👤 *User:* ${username}
🆔 *ID:* ${userId}
👥 *Guruh:* ${groupName}
⏰ *Sana:* ${date}

🔗 *Xabar linki:*
${messageLink}
`;

  await client.sendMessage(GROUP_ID, {
    message: forwardText,
    parseMode: "markdown"
  });

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
