export async function getStreamers(): Promise<Streamers[] | []> {
    const response = await fetch('https://api.github.com/repos/Fiszh/chat-stats/contents/');

    if (!response.ok) return [];

    const data = await response.json();

    if (data) {
        return data.map((streamer: Record<string, string>) => ({
            path: streamer.path,
            type: streamer.type,
        }));
    }

    return [];
}

export async function getChatStatsDates(streamer_name: string): Promise<Dates[] | []> {
    console.log(streamer_name);
    const response = await fetch(`https://api.github.com/repos/Fiszh/chat-stats/contents/${streamer_name}`);

    if (!response.ok) return [];

    const data = await response.json();

    if (data) {
        return data.map((date: Record<string, string>) => ({
            title: date.name.replace(".json", ""),
            path: date.name,
            type: date.type,
        }));
    }

    return [];
}

export async function getChatStatsData(streamer_name: string, json: string): Promise<chatStatsData[] | []> {
    const response = await fetch(`https://raw.githubusercontent.com/Fiszh/chat-stats/main/${streamer_name}/${json}`);

    if (!response.ok) return [];

    const data = await response.json();

    if (data) return data;

    return [];
}
