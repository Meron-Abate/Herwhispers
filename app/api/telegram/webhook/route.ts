import { webhookCallback } from "grammy"

type UpdateHandler = (
  request: Request
) => Promise<Response>

let handleUpdate: UpdateHandler | null =
  null

/*
 * The bot is imported lazily. Creating a Bot requires
 * TELEGRAM_BOT_TOKEN, so a static import would make every
 * build fail when the token is not present in the build
 * environment.
 */
async function getHandler(): Promise<UpdateHandler> {
  if (handleUpdate) {
    return handleUpdate
  }

  const { bot } = await import(
    "@/telegram/bot"
  )

  handleUpdate = webhookCallback(
    bot,
    "std/http"
  )

  return handleUpdate
}

export async function POST(request: Request) {
  let handler: UpdateHandler

  try {
    handler = await getHandler()
  } catch (error) {
    console.error(
      "Telegram webhook is not configured:",
      error
    )

    return Response.json(
      {
        error:
          "Telegram webhook is not configured.",
      },
      {
        status: 503,
      }
    )
  }

  return handler(request)
}
