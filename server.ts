import next from "next";
import { createServer } from "http";
import { parse } from "url";
import { config } from "dotenv";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { NewMessage } from "telegram/events";

config();

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

export const state = {
  processedMessageIds: new Set<number>(),
  signals: [] as { text: string; ts: number }[],
};

async function startTelegramListener() {
  const client = new TelegramClient(
    new StringSession(process.env.TELEGRAM_SESSION_STRING!),
    Number(process.env.TELEGRAM_API_ID),
    process.env.TELEGRAM_API_HASH!,
    { connectionRetries: 5 },
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await client.start({} as any);

  client.addEventHandler(
    async (event) => {
      const msgId = event.message.id;
      if (state.processedMessageIds.has(msgId)) return;
      state.processedMessageIds.add(msgId);

      const text = event.message.message;
      console.log("New signal:", text);
      state.signals.push({ text, ts: Date.now() });
    },
    new NewMessage({ chats: ["cosmasanalyst"] }),
  );

  console.log("Telegram listener running");
}

app.prepare().then(async () => {
  await startTelegramListener();
  createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  }).listen(3000, () => {
    console.log("> Ready on http://localhost:3000");
  });
});
