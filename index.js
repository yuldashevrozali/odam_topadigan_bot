require("dotenv").config();

const express = require("express");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");

// ===== 🔧 HELPER FUNCTIONS =====

function normalizeUserId(id) {
  if (!id) return null;
  return String(BigInt(id));
}

function findMatch(text, arr) {
  return arr.find((x) => text.includes(x));
}

function makeEnv(prefix) {
  const apiId = Number(process.env[`API_ID_${prefix}`]);
  const apiHash = process.env[`API_HASH_${prefix}`];
  const groupId = process.env[`GROUP_ID_${prefix}`];
  const sessionString = process.env[`SESSION_STRING_${prefix}`];
  const adminId = process.env[`ADMIN_ID_${prefix}`];

  if (!apiId || !apiHash || !groupId || !sessionString || !adminId) {
    throw new Error(
      `❌ ENV yetarli emas: API_ID_${prefix}, API_HASH_${prefix}, GROUP_ID_${prefix}, SESSION_STRING_${prefix}, ADMIN_ID_${prefix}`
    );
  }

  return { apiId, apiHash, groupId, sessionString, adminId };
}

// ===== WEB SERVER =====
const app = express();
app.get("/", (req, res) => res.send("USERBOTS ALIVE ✅"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🌐 Web server alive on port", PORT));

// ===== KEYWORDS & BLACKLIST =====
const KEYWORDS = [
  "taksi kerak","taxi kerak","такси керак","taksi kerek","taksi kere",
  "taksi bormi","taxi bormi","такси борми","taksi bormu",
  "bormoqchiman","borishim kerak","ketishim kerak","бормоқчиман",
  "taksi chaqir","taxi chaqir","taksi chaqiring","taksi yuboring",
  "yuk bor","yuk tashish","yuk yetkazish","pochta bor","pochta tashish",
  "odam bor","kishi bor","1 kishi","2 kishi","3 kishi","4 kishi","5 kishi",
  "ikki kishimiz","uch kishimiz","o'zim boraman",
  "srochni","shoshilinch","tez ketish kerak","tez borish kerak",
  "taksi","taxi kerak","yuk","pochta bor","haydovchi kerak","mashina kerak",
  "taksi ker","taxi ker","taksi kera","yuk boru","odam boru",
  "taksi kerak aka","taksi bormi aka","kетишим керак","боришим керак",
];

const BLACKLIST = [
  "kishi kerak","киши керак","avto moshina","авто мошина",
  "pochta olaman","почта оламан","yuk olaman","юк оламан",
  "pochta ham olamiz","почта ҳам оламиз","mahsulot","BAGAJ BOR","Aksiya narxi","1 TA ODAM KAM",
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
  "1 kishi kere","POʻCHTA OLAMIZ","pochta olamiz","pochta olamiz","ODAM POSHTA OLMIZ","ODAM KAM","ПОЧТА ОЛАМИЗ","ISHCHI KERAK","ta kam","TA KAM","BAGAJ BOR",
];

// ===== GLOBAL STATE =====
const userForwardLimits = new Map(); 
const bannedUsers = new Set(); 

// ===== ADMIN COMMANDS HELPER =====
// Bu funksiya buyruqlarni qayta ishlaydi va javob beradi
async function handleAdminCommand(client, prefix, text, chatId, adminId) {
  const parts = text.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const arg = parts[1];

  if (!arg) {
    await client.sendMessage(chatId, { message: `❌ Noto'g'ri foydalanish. Masalan: ${cmd} @username yoki /${cmd} 123456` });
    return;
  }

  // @ belgisini olib tashlash
  const targetId = arg.startsWith('@') ? arg.slice(1) : arg;

  if (cmd === '/ban') {
    bannedUsers.add(targetId);
    await client.sendMessage(chatId, { message: `✅ [BOT-${prefix}] Banned: ${targetId}` });
    console.log(`🔨 [BOT-${prefix}] Banned: ${targetId}`);
    
  } else if (cmd === '/check') {
    const isBanned = bannedUsers.has(targetId);
    await client.sendMessage(chatId, { message: `🔍 [BOT-${prefix}] ${targetId}: ${isBanned ? '🚫 BANNED' : '✅ Not Banned'}` });
    
  } else if (cmd === '/unban') {
    bannedUsers.delete(targetId);
    await client.sendMessage(chatId, { message: `✅ [BOT-${prefix}] Unbanned: ${targetId}` });
    console.log(`🔓 [BOT-${prefix}] Unbanned: ${targetId}`);
  }
}

// ===== MAIN USERBOT FUNCTION =====
async function startUserbot(prefix) {
  const { apiId, apiHash, groupId, sessionString, adminId } = makeEnv(prefix);

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
      const sender = await message.getSender();
      if (!sender) return;
      
      // Sender ID ni normalizatsiya qilish (admin tekshiruvi uchun)
      const senderId = normalizeUserId(sender.id);

      // 🔥 1. ADMIN BUYRUQLARINI TEKSHIRISH (ENG MUHIM QISM)
      // Agar xabar yuboruvchi ADMIN bo'lsa, buyruqlarni ishlatamiz
      if (senderId === normalizeUserId(adminId)) {
        if (text.startsWith('/ban') || text.startsWith('/check') || text.startsWith('/unban')) {
          // Javobni qayerga yuborish: xususiy chatmi yoki guruhmi?
          const replyTo = message.isPrivate ? senderId : groupId;
          await handleAdminCommand(client, prefix, text, replyTo, adminId);
          return; // Buyruq bajarildi, keyingi kodga o'tmaymiz
        }
      }

      // 0) Xabar uzunligi tekshiruvi
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

      // 1) KEYWORDS tekshiruvi
      const keywordHit = findMatch(text, KEYWORDS);
      if (!keywordHit) return;

      // 2) BLACKLIST tekshiruvi
      const blacklistHit = findMatch(text, BLACKLIST);
      if (blacklistHit) {
        console.log(`⛔ [BOT-${prefix}] BLACKLIST HIT:`, blacklistHit, "| TEXT:", text);
        return;
      }

      // ===== MAʼLUMOTLARNI TAYYORLASH =====
      const rawUserId = sender?.id;
      const userId = normalizeUserId(rawUserId);

      if (!userId) {
        console.log(`⚠️ [BOT-${prefix}] UserId topilmadi, skip`);
        return;
      }

      // 3) Banned user check (Global Setdan tekshiramiz)
      // Username yoki ID bo'yicha tekshirish
      const username = sender?.username;
      const isBanned = bannedUsers.has(userId) || (username && bannedUsers.has(username));
      
      if (isBanned) {
        console.log(`⛔ [BOT-${prefix}] BANNED USER SKIP: ${userId} (@${username})`);
        return;
      }

      // 4) User forward limit: 3 ta kuniga
      let timestamps = userForwardLimits.get(userId) || [];
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      timestamps = timestamps.filter(ts => now - ts < oneDayMs);
      
      if (timestamps.length >= 3) {
        console.log(`⛔ [BOT-${prefix}] USER LIMIT REACHED: ${userId}`);
        return;
      }

      // Forward qilish uchun ma'lumotlar
      const senderFirstName = sender?.firstName || "";
      const senderLastName = sender?.lastName || "";
      const fullName = [senderFirstName, senderLastName].filter(Boolean).join(" ") || "Noma'lum";
      const phone = sender?.phone ? `+${sender.phone}` : "yo'q";
      const groupUsername = chat.username ? `@${chat.username}` : `ID:${chat.id}`;

      let messageLink = "❌ link yo'q";
      if (chat.username) {
        messageLink = `https://t.me/${chat.username}/${message.id}`;
      }

      const forwardText = `[BOT-${prefix}]
1. ID: ${userId}
2. Ismi: ${fullName}
3. Foydalanuvchi: ${username ? '@'+username : "yo'q"}
4. Telefon raqami: ${phone}
5. Guruh: ${groupUsername}
6. Link: ${messageLink}
7. Xabar: ${message.message}`;

      await client.sendMessage(groupId, { message: forwardText });
      
      timestamps.push(now);
      userForwardLimits.set(userId, timestamps);
      
      console.log(`✅ [BOT-${prefix}] FORWARDED | keyword: ${keywordHit} | user: ${userId} | (${timestamps.length}/3)`);
      
    } catch (e) {
      console.log(`❌ [BOT-${prefix}] handler error:`, e?.message || e);
    }
  }, new NewMessage({}));

  // ===== AUTO RECONNECT =====
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

  // ===== XOTIRA TOZALASH =====
  setInterval(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    for (const [uid, tsArr] of userForwardLimits.entries()) {
      const fresh = tsArr.filter(ts => now - ts < oneDayMs);
      if (fresh.length === 0) {
        userForwardLimits.delete(uid);
      } else {
        userForwardLimits.set(uid, fresh);
      }
    }
  }, 60 * 60 * 1000);

  return client;
}

// ===== START 2 TA BOT =====
(async () => {
  try {
    await startUserbot("1");
    await startUserbot("2");
    console.log("🚀 Ikki userbot ham ishga tushdi.");
  } catch (err) {
    console.error("❌ Botlarni ishga tushirishda xato:", err.message);
    process.exit(1);
  }
})();