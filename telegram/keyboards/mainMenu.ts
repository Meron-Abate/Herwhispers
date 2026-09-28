import { InlineKeyboard } from "grammy";

export function mainMenuKeyboard() {
  return new InlineKeyboard()
    .text(" Doctor / Health Question", "doctor_question")
    .row()
    .text(" Share Anonymous Story", "anonymous_story")
    .row()
    .text(" Get Pad Support", "get_pad_support");
}