import router from "$lib/routerV2";
import crypto from "crypto";

import { Innertube, Log } from "youtubei.js";

import pkg from "../package.json";

const yt = await Innertube.create();

//Log.setLevel(Log.Level.ERROR);

const RequestRouter = new router("youtube");

interface WSInfo {
  id: string;
  version: string;
}

interface WSListener {
  ws: WebSocket;
  id: string;
}

interface Listener {
  livechat: any;
  websockets: WSListener[];
}

interface Connected {
  channel: string;
  ids: string[];
}

let listeners: Record<string, Listener> = {};
let connected: Record<string, Connected> = {};

async function addListener(...args: Parameters<typeof createListener>) {
  const [channel_id, ws_info, ws] = args;

  if (!listeners[channel_id]) await createListener(...args);

  listeners[channel_id] = {
    ...(listeners[channel_id] as Listener),
    websockets: [
      ...((listeners[channel_id] as Listener)["websockets"] as WSListener[]),
      { ...ws_info, ws },
    ],
  };
}

async function removeListener(ws_id: string) {
  const listener = Object.entries(listeners).find(([, l]) =>
    l.websockets.some((w) => w.id === ws_id),
  );

  if (!listener) return;

  const [channel_id] = listener;

  if (!listeners[channel_id]) return;

  listeners[channel_id]["websockets"] = listeners[channel_id][
    "websockets"
  ].filter((l) => l.id != ws_id);

  if (!listeners[channel_id]["websockets"].length) {
    listeners[channel_id]["livechat"].stop();

    delete listeners[channel_id];
  }
}

async function createListener(
  channel_id: string,
  ws_info: WSInfo,
  ws: WebSocket,
) {
  const channel = await yt.getChannel(channel_id);
  const liveTab = await channel.getLiveStreams();

  if (!liveTab.videos[0] || "content_id" in liveTab.videos[0] == false) {
    console.log("no live video found");
    ws.send(JSON.stringify({ error: "channel not live", ...ws_info }));
    return false;
  }

  const liveVideoId = liveTab.videos[0].content_id;
  const info = await yt.getInfo(liveVideoId);
  const livechat = info.getLiveChat();

  listeners[channel_id] = {
    livechat,
    websockets: [],
  };

  livechat.on("chat-update", (action) => {
    if (listeners[channel_id] && listeners[channel_id]["websockets"]) {
      for (const listener of listeners[channel_id]["websockets"]) {
        listener["ws"].send(JSON.stringify(action));
      }
    }
  });
  livechat.on("error", (err) => console.log("livechat error", err));
  livechat.on("start", () => console.log("livechat started"));
  livechat.on("end", () => console.log("livechat end"));
  livechat.start();
}

RequestRouter.add("ws", "/", async (req, res, ws) => {
  if (!ws) return res.status(500).send();

  const ws_id = crypto.randomUUID();

  const ws_info: WSInfo = {
    id: ws_id,
    version: pkg["version"],
  };

  const reqIP = req.headers.get("x-forwarded-for") as string;

  ws.addEventListener("message", async (ev) => {
    const data = RequestRouter.sanitizeObject(JSON.parse(ev.data)) as Record<
      string,
      any
    >;

    console.log(data);

    if (typeof data != "object" || "op" in data == false) {
      ws.send(JSON.stringify({ error: "invalid message", ...ws_info }));
      return ws.close();
    }

    switch (data["op"]) {
      case "subscribe":
        // if (
        //   !reqIP ||
        //   (connected[reqIP] && connected[reqIP]["channel"] != data["channel"])
        // ) {
        //   ws.send(JSON.stringify({ error: "subscribe failed, one channel per IP", ...ws_info }));
        //   return ws.close();
        // }

        addListener(data["channel"], ws_info, ws).catch((err) => {
          console.error("subscribe failed", err);
          ws.send(JSON.stringify({ error: "subscribe failed", ...ws_info }));
        });

        // connected[reqIP] = {
        //   channel: data["channel"],
        //   ids:
        //     reqIP in connected ? [...connected[reqIP]!["ids"], ws_id] : [ws_id],
        // };

        break;
      case "echo":
        ws.send(JSON.stringify({ ...data, ...ws_info }));

        break;
      default:
        ws.send(JSON.stringify({ error: "invalid message", ...ws_info }));

        return ws.close();
    }
  });

  ws.addEventListener("close", () => {
    removeListener(ws_id);

    // const connection = connected[reqIP];
    // if (connection) {
    //   connection["ids"] = connection["ids"].filter((c) => c != ws_id);

    //   if (!connection["ids"].length) delete connected[reqIP];
    // }
  });

  ws.send(JSON.stringify({ type: "welcome", ...ws_info }));
});

export default RequestRouter;
