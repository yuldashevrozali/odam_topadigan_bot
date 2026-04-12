require("dotenv").config();

const express = require("express");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");

// ===== WEB SERVER (Render healthcheck) =====
const app = express();
app.get("/", (req, res) => res.send("USERBOTS ALIVE ✅"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🌐 Web server alive on port", PORT));

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
  "pochta ham olamiz","почта ҳам оламиз","mahsulot","БАГАЧ БОР","Aksiya narxi","1 TA ODAM KAM",
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
  "1 kishi kere","AYOL KISHI BOR","POʻCHTA OLAMIZ","pochta olamiz","pochta olamiz","ODAM POSHTA OLMIZ","ODAM KAM","ПОЧТА ОЛАМИЗ","ISHCHI KERAK","ta kam","TA KAM",
];

// ===== helper =====
function findMatch(text, arr) {
  return arr.find((x) => text.includes(x));
}

// ===== factory: bitta userbot start qiladigan funksiya =====
function makeEnv(prefix) {
  const apiId = Number(process.env[`API_ID_${prefix}`]);
  const apiHash = process.env[`API_HASH_${prefix}`];
  const groupId = process.env[`GROUP_ID_${prefix}`]; // string
  const sessionString = process.env[`SESSION_STRING_${prefix}`];

  if (!apiId || !apiHash || !groupId || !sessionString) {
    throw new Error(
      `❌ ENV yetarli emas: API_ID_${prefix}, API_HASH_${prefix}, GROUP_ID_${prefix}, SESSION_STRING_${prefix}`
    );
  }

  return { apiId, apiHash, groupId, sessionString };
}

async function startUserbot(prefix) {
  const { apiId, apiHash, groupId, sessionString } = makeEnv(prefix);

  const client = new TelegramClient(
    new StringSession(sessionString),
    apiId,
    apiHash,
    { connectionRetries: 5 }
  );

  console.log(`🔐 [BOT-${prefix}] ulanmoqda...`);
  await client.connect();
  console.log(`✅ [BOT-${prefix}] ULANDA`);

  client.addEventHandler(async (event) => {
    try {
      const message = event.message;
      if (!message?.message) return;

      const text = message.message.toLowerCase().trim();

      // 0) Agar xabar 130 belgidan uzun bo'lsa — SKIP
      if (text.length > 130) {
        console.log(`⛔ [BOT-${prefix}] MESSAGE TOO LONG: ${text.length} chars`);
        return;
      }

      let chat;
      try {
        chat = await message.getChat();
      } catch {
        return;
      }
      if (!chat) return;

      // 🔒 O‘z guruhimizdan kelgan bo‘lsa — SKIP (har bot o‘z GROUP_ID sini tekshiradi)
      if (String(chat.id) === String(groupId)) return;

      // 1) KEYWORDS bo'lishi shart
      const keywordHit = findMatch(text, KEYWORDS);
      if (!keywordHit) return;

      // 2) BLACKLIST'dan 1 ta bo'lsa ham olma (skip)
      const blacklistHit = findMatch(text, BLACKLIST);
      if (blacklistHit) {
        console.log(`⛔ [BOT-${prefix}] BLACKLIST HIT:`, blacklistHit, "| TEXT:", text);
        return;
      }

      // ===== MAʼLUMOT =====
      const sender = await message.getSender();
      const userId = sender?.id;
      const username = sender?.username ? `@${sender.username}` : "yo'q";
      const firstName = sender?.firstName || "";
      const lastName = sender?.lastName || "";
      const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Noma'lum";
      const phone = sender?.phone ? `+${sender.phone}` : "yo'q";
      const groupUsername = chat.username ? `@${chat.username}` : `ID:${chat.id}`;

      let messageLink = "❌ link yo'q";
      if (chat.username) {
        messageLink = `https://t.me/${chat.username}/${message.id}`;
      }

      const forwardText = `[BOT-${prefix}]
1. ID: ${userId}
2. Ismi: ${fullName}
3. Foydalanuvchi: ${username}
4. Telefon raqami: ${phone}
5. Guruh: ${groupUsername}
6. Link: ${messageLink}
7. Xabar: ${message.message}`;

      await client.sendMessage(groupId, { message: forwardText });
      console.log(`✅ [BOT-${prefix}] FORWARDED | keyword:`, keywordHit);
    } catch (e) {
      console.log(`❌ [BOT-${prefix}] handler error:`, e?.message || e);
    }
  }, new NewMessage({}));

  // ===== AUTO RECONNECT (har bot alohida) =====
  setInterval(async () => {
    try {
      if (!client.connected) {
        console.log(`♻️ [BOT-${prefix}] Reconnecting Telegram...`);
        await client.connect();
        console.log(`✅ [BOT-${prefix}] Reconnected`);
      }
    } catch (e) {
      console.log(`❌ [BOT-${prefix}] Reconnect error:`, e?.message || e);
    }
  }, 60 * 1000);

  return client;
}

// ===== START 2 TA BOT =====
(async () => {
  // 1-bot
  await startUserbot("1");

  // 2-bot
  await startUserbot("2");

  console.log("🚀 Ikki userbot ham ishga tushdi.");
})();