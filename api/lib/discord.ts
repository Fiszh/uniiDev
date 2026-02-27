const api_base = "https://discord.com/api/";

let queuedMessages: Record<string, (string | Record<string, any>)[]> = {};

export async function sendMessage(
  webhook_url: string,
  body: (string | Record<string, any>)[],
  message_id?: string,
) {
  const [, id, token] = webhook_url.match(/webhooks\/([^/]+)\/([^/]+)/) || [];

  if (!id || !token) return false;

  const mappedBody = body.reduce<{
    content?: string;
    embeds?: Record<string, any>[];
  }>((acc, body_part) => {
    if (typeof body_part == "string")
      acc["content"] = (acc["content"] ?? "") + "\n" + body_part;

    if (typeof body_part == "object")
      acc["embeds"] = [...(acc["embeds"] || []), body_part];

    return acc;
  }, {});

  const response = await fetch(
    api_base +
      `webhooks/${id}/${token}${message_id ? `/messages/${message_id}` : "?wait=true"}`,
    {
      method: message_id ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mappedBody),
    },
  );

  if (!response.ok) return response.status;

  if (response.status == 204) return true;

  const data = await response.json();

  return data;
}

async function sendQueuedMessage(url: string) {
  const body: (string | Record<string, any>)[] | undefined =
    queuedMessages[url];

  if (!body) return false;

  const messageMap = body.map((message, i) => {
    if (typeof message == "string") return message;

    return {
      title: `API Message #${i + 1}`,
      fields: !message.content ? message : undefined,
      description: message.content || undefined,
      color: message.color ?? 0x00ff00,
      timestamp: (message.timestamp instanceof Date
        ? message.timestamp
        : new Date()
      ).toISOString(),
    };
  });

  await sendMessage(url, messageMap);
  delete queuedMessages[url];
}

export async function queueMessage(
  url: string,
  body: string | Record<string, any>,
  time: number,
) {
  if (queuedMessages[url]) {
    if (queuedMessages[url].length >= 10) {
      await sendQueuedMessage(url);
    } else {
      return queuedMessages[url].push(body);
    }
  }

  queuedMessages[url] = [body];

  setTimeout(() => {
    sendQueuedMessage(url);
  }, time);
}
