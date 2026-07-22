// lib/telegram.ts
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { NewMessage } from "telegram/events";

export const state = {
  processedMessageIds: new Set<number>(),
  signals: [] as { text: string; ts: number }[],
};

export async function startTelegramListener() {
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
    new NewMessage({
      chats: ["cosmasanalyst", "LeveragLab", "testingtelegramsignals"],
    }),
  );

  console.log("Telegram listener running");
}
