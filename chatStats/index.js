const streamers_buttons = document.getElementById("streamers_buttons");
const json_data = document.getElementById("json_data");

function setQueryParam(key, value) {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value);
    const newUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    history.replaceState(null, '', newUrl);
    window.location.reload();
}

function getQueryParams() {
    return new Promise((resolve) => {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params.entries()) {
            result[key] = value;
        }
        resolve(result);
    });
}

async function getStreamers() {
    const response = await fetch('https://api.github.com/repos/Fiszh/chat-stats/contents/');

    if (!response.ok) { return false; };

    const data = await response.json();

    if (data) {
        return data.map(streamer => ({
            text: streamer.name,
            query_name: "name",
            query: streamer.name
        }));
    } else {
        return [];
    }
}

async function displayButtons(buttons_data) {
    if (!buttons_data?.length) {
        streamers_buttons.innerHTML = "Failed...";
    }

    for (const key in buttons_data) {
        const button_data = buttons_data[key];
        const button = document.createElement("button");

        button.textContent = button_data.text;

        button.addEventListener('click', () => {
            setQueryParam(button_data.query_name, button_data.query);
        });

        streamers_buttons.appendChild(button);
    }
}

async function getChatStatsDates(streamer_name) {
    const response = await fetch(`https://api.github.com/repos/Fiszh/chat-stats/contents/${streamer_name}`);

    if (!response.ok) { return false; };

    const data = await response.json();

    if (data) {
        return data.map(date => ({
            text: date.name.replace(".json", ""),
            query_name: "json",
            query: date.name
        }));
    } else {
        return [];
    }
}

function mergeMessages(data) {
    const overallMessages = {};

    function addCounts(source) {
        if (Array.isArray(source)) {
            for (const { username, message_count } of source) {
                overallMessages[username] = (overallMessages[username] || 0) + message_count;
            }
        } else if (typeof source === 'object' && source !== null) {
            for (const [username, count] of Object.entries(source)) {
                overallMessages[username] = (overallMessages[username] || 0) + count;
            }
        }
    }

    addCounts(data.message_count_offline);
    addCounts(data.message_count_online);

    return overallMessages;
}

async function displayChatStats(streamer_name, json) {
    const response = await fetch(`https://raw.githubusercontent.com/Fiszh/chat-stats/main/${streamer_name}/${json}`);

    if (!response.ok) { return false; };

    const data = await response.json();

    if (data) {
        const overall = mergeMessages(data);

        const stats_data = [
            { name: "message_count_offline", data: data.message_count_offline },
            { name: "message_count_online", data: data.message_count_online },
            { name: "overall_messages", data: overall },
            { name: "top_linkers", data: data.top_linkers },
            { name: "top_emoters", data: data.top_emoters },
            { name: "top_emotes", data: data.top_emotes },
        ];

        for (const key in stats_data) {
            const stat = stats_data[key];

            if (!stat.data) { continue; };

            // FOR STATS WITH MULTIPLE ROWS
            if (["top_emotes"].includes(stat.name)) {
                for (stat_key in stat.data) {
                    const stat_row = stat.data[stat_key];

                    const channel_emotes = Object.entries(stat_row)
                        .filter(([key, emote]) => emote.set === "channel")
                        .map(([key, emote]) => emote);

                    const global_emotes = Object.entries(stat_row)
                        .filter(([key, emote]) => emote.set === "global")
                        .map(([key, emote]) => emote);

                    if (channel_emotes?.length) {
                        const stat_name = `${stat_key} - Channel`;
                        displayList(channel_emotes, stat_name);
                    }

                    if (global_emotes?.length) {
                        const stat_name = `${stat_key} - Global`;
                        displayList(global_emotes, stat_name);
                    }

                    if (!global_emotes?.length && !channel_emotes?.length) {
                        displayList(stat_row, stat_key);
                    }
                }
            } else {
                if (stat?.data?.[0]?.message_count || stat?.data?.[0]?.emote_count) {
                    const message_count = stat.data.reduce((acc, user) => {
                        acc[user.username] = user?.message_count || user?.emote_count || 0;
                        return acc;
                    }, {});

                    displayList({ name: stat.name, data: message_count });
                } else {
                    displayList(stat);
                }
            }
        }
    } else {
        json_data.innerHTML = "Error, no data...";
    }
}

async function displayList(stat, stat_key) {
    const stat_row = document.createElement("div");
    stat_row.className = "stat_row";

    const stat_name = document.createElement("div");
    stat_name.className = "stat_name";

    const stat_search = document.createElement("input");
    stat_search.className = "stat_search";

    const stat_data = document.createElement("ul");
    stat_data.className = "stat_data";

    if (!stat) { return; };

    const isCountBased = typeof Object.values(stat)[0] === 'object' && 'count' in Object.values(stat)[0];

    if (!isCountBased) {
        stat_name.textContent = stat.name
            .replace(/_/g, " ")
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    } else {
        stat_name.textContent = stat_key;
    }

    const sortedKeys = Object.keys(isCountBased ? stat : stat.data).sort((a, b) => {
        const getVal = key => {
            const val = isCountBased ? stat[key] : stat.data[key];
            return typeof val === 'object' && 'count' in val ? val.count : val;
        };

        return getVal(b) - getVal(a);
    });

    sortedKeys.forEach((stat_key, i) => {
        const row_data = document.createElement("li");

        const numberSpan = document.createElement('span');
        numberSpan.textContent = `${i + 1}. `;
        row_data.appendChild(numberSpan);

        if (isCountBased && stat[stat_key].url) {
            const img = document.createElement('img');
            img.src = stat[stat_key].url;
            img.loading = "lazy";
            row_data.appendChild(img);
        }

        const textSpan = document.createElement('span');
        let val = isCountBased ? stat[stat_key].count : stat.data[stat_key];
        if (typeof val === 'number') {
            val = val.toLocaleString();
        }
        textSpan.textContent = `${stat?.[stat_key]?.name ? stat[stat_key].name : stat_key}: ${val}`;
        row_data.appendChild(textSpan);

        stat_data.appendChild(row_data);
    });

    // stat_row.appendChild(stat_search);
    stat_row.appendChild(stat_name);
    stat_row.appendChild(stat_data);

    json_data.appendChild(stat_row);
}

getQueryParams()
    .then(async result => {
        if (Object.keys(result)?.length) {
            if (result["name"]) {
                if (result["json"]) {
                    displayChatStats(result["name"], result["json"]);
                } else {
                    const chatStats_dates = await getChatStatsDates(result["name"]);

                    displayButtons(chatStats_dates);
                }
            }
        } else {
            const streamer_names = await getStreamers();

            displayButtons(streamer_names);
        }
    })
    .catch(error => {
        // handle the error here
        console.error(error);
    });