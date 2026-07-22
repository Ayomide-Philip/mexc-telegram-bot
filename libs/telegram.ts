// lib/telegram.ts
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { NewMessage } from "telegram/events";
import { ParsedSignal, parseSignal } from "./parsedSignals";

type BotState = {
  processedMessageIds: Set<number>;
  signals: NonNullable<ParsedSignal>[];
};

declare global {
  var __botState: BotState | undefined;
}

export const state: BotState =
  globalThis.__botState ??
  (globalThis.__botState = {
    processedMessageIds: new Set(),
    signals: [],
  });

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
      console.log("New message received:", text);
      console.log("New signal:", parseSignal(text));
      const parsedSignal = parseSignal(text, Date.now());
      if (parsedSignal) {
        state.signals.push(parsedSignal);
      }
    },
    new NewMessage({
      chats: [-1002004401199, "testingtelegramsignals"],
    }),
  );

  console.log("Telegram listener running");
}
