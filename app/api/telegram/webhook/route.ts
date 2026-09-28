import { webhookCallback } from "grammy";
import { bot } from "@/telegram/bot";

const handleUpdate = webhookCallback(bot, "std/http");

export async function POST(request: Request) {
  return await handleUpdate(request);
}