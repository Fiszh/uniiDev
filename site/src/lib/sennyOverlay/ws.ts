import { writable } from "svelte/store";

interface EventSubData {
    ws: WebSocket | null,
    reconnect_url: string | null,
}

let EventSub: EventSubData = {
    ws: null,
    reconnect_url: null
}

interface Message {
    name: string,
    url: string,
    count: string,
    date: string
}

export const messages = writable<Message[]>([]);

export function connect(bits: number = 50) {
    if (EventSub.ws) return;
    EventSub.ws = new WebSocket('wss://hermes.twitch.tv/v1?clientId=kimne78kx3ncx6brgo4mv6wki5h1ko');

    EventSub.ws.addEventListener('open', () => {
        console.log('Connected');

        console.log(`Connected to WebSocket, playing alert at ${bits} bits!`);
    });

    EventSub.ws.addEventListener('message', (data: any) => {
        data = JSON.parse(data.data.toString());

        console.log(data);

        if (data?.type) {
            switch (data?.type) {
                case "welcome":
                    if (!EventSub.ws) break;
                    if (!EventSub.reconnect_url) {
                        EventSub.ws.send(JSON.stringify({
                            type: "subscribe",
                            id: "hii",
                            subscribe: {
                                id: "hi",
                                type: "pubsub",
                                pubsub: {
                                    topic: "activity-feed-moderator-v2.146110596"
                                }
                            },
                            timestamp: new Date().toISOString()
                        }));
                    }

                    //EventSub.reconnect_url = data?.welcome?.recoveryUrl ?? null;

                    break;
                case "notification":
                    const pubsubs = JSON.parse(data?.notification?.pubsub);

                    console.log(pubsubs);

                    if (!pubsubs?.data) break;
                    const payload = pubsubs.data;

                    console.log(payload);

                    if (payload.type != "BITS_ONE_TAP_REDEMPTION") break;

                    const parsed: Message = {
                        name: payload.title["en-US"][0].token["display_name"] as string,
                        url: payload.custom_icon_url,
                        count: payload.content["en-US"].map((part: Record<string, string | number>) => String(part.token)).filter(Boolean).join(""),
                        date: new Date().toISOString()
                    }

                    const num = Number((parsed?.count?.replace(/\D+/g, "") ?? ""));

                    if (num >= bits || parsed?.name == "uniiDev") {
                        messages.update(msgs => [...msgs.slice(-4), parsed]);
                    }

                    break;
                default:
                    //console.log("Unknown message type", data);

                    break;
            }
        }
    });

    EventSub.ws.addEventListener('close', () => {
        console.log('Disconnected');

        EventSub.ws = null;

        setInterval(() => {
            connect();
        }, 500);
    });

    EventSub.ws.addEventListener('error', (err) => {
        console.error('Error:', err);

        if (EventSub.ws) EventSub.ws.close();
    });
}