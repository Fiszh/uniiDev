import { queueMessage } from "./discord";

export async function sendAPILog(
  title: string,
  message: { name: string; value: any }[],
  sendTime: number = 5000,
) {
  if (process.env.API_LOGS)
    queueMessage(
      title,
      process.env.API_LOGS,
      {
        content: message
          .flatMap((msg) => msg.name + ": " + msg.value)
          .join("\n"),
      },
      sendTime,
    );
}
