import "dotenv/config";
import readline from "readline";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";


const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, (ans) => res(ans.trim())));

const apiIdRaw = process.env.API_ID;
const apiHash = process.env.API_HASH;

if (!apiIdRaw || !apiHash) {
  console.error("❌ .env da API_ID va API_HASH bo‘lishi shart.");
  process.exit(1);
}

const apiId = Number(apiIdRaw);
if (!Number.isFinite(apiId)) {
  console.error("❌ API_ID raqam bo‘lishi kerak.");
  process.exit(1);
}

// session bo‘sh bo‘lsa: yangi login qiladi
const stringSession = new StringSession("");

(async () => {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await ask("📱 Telefon raqam (masalan +99890...): "),
    phoneCode: async () => await ask("🔐 Telegram SMS/Telegram code: "),
    password: async () => await ask("🔒 2FA password (bo‘lmasa Enter): "),
    onError: (err) => console.error("Login error:", err),
  });

  console.log("\n✅ Ulandi!");
  console.log("👇 Session string (buni saqlab qo‘ying, maxfiy):\n");
  console.log(client.session.save());

  await client.disconnect();
  rl.close();
})().catch((e) => {
  console.error("❌ Xatolik:", e);
  rl.close();
  process.exit(1);
});
