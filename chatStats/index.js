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
            { name: "message_count_offline", data: data.message_count_offline, row: 0, icon: "message_circle" },
            { name: "message_count_online", data: data.message_count_online, row: 0, icon: "message_circle_green" },
            { name: "overall_messages", data: overall, row: 0, icon: "trending_up_purple" },
            { name: "top_linkers", data: data.top_linkers, row: 1, icon: "link" },
            { name: "top_emoters", data: data.top_emoters, row: 1, icon: "smile_yellow" },
            { name: "top_emotes", data: data.top_emotes, row: null, icon: null },
        ];

        for (const key in stats_data) {
            const stat = stats_data[key];

            if (!stat.data) { continue; };

            // FOR STATS WITH MULTIPLE ROWS
            if (["top_emotes"].includes(stat.name)) {
                for (const stat_key in stat.data) {
                    const stat_row = stat.data[stat_key];
                    const entries = Object.entries(stat_row);

                    const channel_emotes = entries
                        .filter(([key, emote]) => emote.set === "channel")
                        .map(([key, emote]) => emote);

                    const global_emotes = entries
                        .filter(([key, emote]) => emote.set === "global")
                        .map(([key, emote]) => emote);

                    const other_emotes = entries
                        .filter(([key, emote]) => emote.set !== "channel" && emote.set !== "global")
                        .map(([key, emote]) => emote);

                    if (channel_emotes.length) {
                        const stat_name = `${stat_key} - Channel`;
                        displayList(channel_emotes, stat_name, 3, getIcon(stat_name));
                    }

                    if (global_emotes.length) {
                        const stat_name = `${stat_key} - Global`;
                        displayList(global_emotes, stat_name, 3, getIcon(stat_name));
                    }

                    if (other_emotes.length) {
                        const stat_name = stat_key;
                        displayList(other_emotes, stat_name, 3, getIcon(stat_name));
                    }
                }
            } else {
                if (stat?.data?.[0]?.message_count || stat?.data?.[0]?.emote_count) {
                    const message_count = stat.data.reduce((acc, user) => {
                        acc[user.username] = user?.message_count || user?.emote_count || 0;
                        return acc;
                    }, {});

                    displayList({ name: stat.name, data: message_count, row: stat.row, icon: stat.icon });
                } else {
                    displayList(stat);
                }
            }
        }

        smoothCount(document.querySelector('#users #stat_number'), data["unique_chatters"]);
        smoothCount(document.querySelector('#messages #stat_number'), data["total_messages"]);
        smoothCount(document.querySelector('#average_messages #stat_number'), data["total_messages"] / data["unique_chatters"]);
    } else {
        json_data.innerHTML = "Error, no data...";
    }
}

function getIcon(name) {
    const lowercase = name.toLowerCase();
    if (lowercase.includes("7tv")) {
        return lowercase.includes("global") ? "smile_mint" : "smile_blue";
    }
    if (lowercase.includes("bttv")) return "smile_orange";
    if (lowercase.includes("ffz")) return "smile_pink";
    return null;
}

async function displayList(stat, stat_key, row, icon) {
    const stat_row = document.createElement("div");
    stat_row.className = "stat_info";

    const stat_header = document.createElement("div");
    stat_header.className = "stat_header";

    const stat_name = document.createElement("div");
    stat_name.className = "stat_name";

    const stat_icon = document.createElement("img");
    stat_icon.className = "stat_icon";

    if (!icon && stat?.icon) {
        icon = stat.icon;
    }

    if (icon) {
        stat_icon.src = `imgs/${icon}.svg`;
        stat_icon.alt = icon;
    }

    const stat_data = document.createElement("ul");
    stat_data.className = "stat_data";

    if (!row && stat?.row >= 0) {
        row = stat.row;
    }

    if (!(row >= 0)) {
        return;
    }

    if (!stat) { return; };

    let row_element = document.getElementById(`row_${row}`);

    if (!row_element) {
        row_element = document.createElement("section");

        row_element.id = `row_${row}`;
        row_element.className = "stat_row";
        json_data.appendChild(row_element);
    }

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

        const leftSpan = document.createElement('span');
        const rightSpan = document.createElement('span');

        const numberSpan = document.createElement('span');
        numberSpan.className = "position";
        numberSpan.textContent = `${i + 1}`;

        let img;
        if (isCountBased && stat[stat_key].url) {
            img = document.createElement('img');
            img.src = stat[stat_key].url;
            img.loading = "lazy";
        }

        const nameSpan = document.createElement('span');
        let val = isCountBased ? stat[stat_key].count : stat.data[stat_key];
        nameSpan.textContent = stat?.[stat_key]?.name ? stat[stat_key].name : stat_key;
        nameSpan.className = "item_name";

        if (typeof val === 'number') {
            val = val.toLocaleString();
        }

        const valueSpan = document.createElement('span');
        valueSpan.className = "value";
        valueSpan.textContent = val;

        leftSpan.appendChild(numberSpan);
        if (img) { leftSpan.appendChild(img) };
        leftSpan.appendChild(nameSpan);
        rightSpan.appendChild(valueSpan);

        row_data.appendChild(leftSpan);
        row_data.appendChild(rightSpan);

        stat_data.appendChild(row_data);
    });

    stat_header.appendChild(stat_icon);
    stat_header.appendChild(stat_name);
    stat_row.appendChild(stat_header);
    stat_row.appendChild(stat_data);

    row_element.appendChild(stat_row);
}

function smoothCount(element, target, duration = 1000, maxDecimals = 2) {
    const start = +element.textContent.replace(/,/g, '') || 0;
    const range = target - start;
    const startTime = performance.now();

    function numberWithCommas(x) {
        let fixed = x.toFixed(maxDecimals);
        fixed = fixed.replace(/\.?0+$/, '');
        const parts = fixed.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    }

    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = start + range * progress;
        element.textContent = numberWithCommas(current);

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

getQueryParams()
    .then(async result => {
        if (Object.keys(result)?.length) {
            if (result["name"]) {
                if (result["json"]) {
                    json_data.style.display = "flex";
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