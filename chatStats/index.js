const streamers_buttons = document.getElementById("streamers_buttons");
const json_data = document.getElementById("json_data");

const user_data = document.getElementById("user_data");
const username = user_data.querySelector("#username");
const user_row = user_data.querySelector("#stats");

const user_login = getCookie("user_login");

if (user_login) {
    username.textContent = `${user_login}'s stats`;
    user_data.style.display = "flex";
}

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
            for (const { name, count } of source) {
                overallMessages[name] = (overallMessages[name] || 0) + count;
            }
        } else if (typeof source === 'object' && source !== null) {
            for (const [name, message_count] of Object.entries(source)) {
                overallMessages[name] = (overallMessages[name] || 0) + message_count;
            }
        }
    }

    addCounts(data["message_count_offline"]["data"]);
    addCounts(data["message_count_online"]["data"]);

    return Object.entries(overallMessages)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
}

async function displayChatStats(streamer_name, json) {
    const response = await fetch(`https://raw.githubusercontent.com/Fiszh/chat-stats/main/${streamer_name}/${json}`);

    if (!response.ok) { return false; };

    const data = await response.json();

    if (data) {
        const overall = mergeMessages(data);

        data["overall_messages"] = {
            stat_name: "Overall Messages",
            row: 1,
            data: overall
        }

        let allStats = [];

        for (const key in data) {
            const stat = data[key];

            if (stat && typeof stat === "object" && "data" in stat) {
                allStats.push(stat);
            }
        }

        allStats.sort((a, b) => a.row - b.row);

        for (const stat of allStats) {
            console.log(stat);

            displayList(stat["stat_name"], stat["data"], stat["row"]);
        }

        smoothCount(document.querySelector('#users #stat_number'), data["unique_chatters"]);
        smoothCount(document.querySelector('#messages #stat_number'), data["total_messages"]);
        smoothCount(document.querySelector('#average_messages #stat_number'), data["total_messages"] / data["unique_chatters"]);
    } else {
        json_data.innerHTML = "Error, no data...";
    }
}

function getIcon(name) {
    try {
        const lowercase = name.toLowerCase();

        switch (true) {
            case lowercase.includes("message count offline"):
                return { icon: "message_circle", gradient: "linear-gradient(to bottom, #cbd5e1, #6b7280)" }; // gray gradient
            case lowercase.includes("message count online"):
                return { icon: "message_circle", gradient: "linear-gradient(to bottom, #4ade80, #16a34a)" }; // green gradient
            case lowercase.includes("overall messages"):
            case lowercase.includes("top linkers"):
                return { icon: "trending_up", gradient: "linear-gradient(to bottom, #a78bfa, #7c3aed)" }; // purple gradient
            case lowercase.includes("top emoters"):
                return { icon: "smile", gradient: "linear-gradient(to bottom, #fde047, #ca8a04)" }; // yellow gradient
            case lowercase.includes("7tv"):
                return { icon: "smile", gradient: "linear-gradient(to bottom, #60a5fa, #2563eb)" }; // blue gradient
            case lowercase.includes("bttv"):
                return { icon: "smile", gradient: "linear-gradient(to bottom, #fb923c, #c2410c)" }; // orange gradient
            case lowercase.includes("ffz"):
                return { icon: "smile", gradient: "linear-gradient(to bottom, #f472b6, #be185d)" }; // pink gradient
            default:
                return null;
        }
    } catch (err) {
        console.error(`Error in getIconAndColor with name: "${name}"`, err);
        return null;
    }
}

async function displayList(name, data, row) {
    if (!data.length || !name) { return; };

    const stat_row = document.createElement("div");
    stat_row.className = "stat_info";

    const stat_header = document.createElement("div");
    stat_header.className = "stat_header";

    const stat_name = document.createElement("div");
    stat_name.className = "stat_name";

    const stat_icon = document.createElement("img");
    stat_icon.className = "stat_icon";

    const icon = getIcon(name);

    if (icon) {
        stat_icon.src = `imgs/${icon.icon}.svg`;
        stat_icon.className = "stat_icon";
        stat_header.style.background = icon.gradient;
        stat_icon.alt = icon;
    }

    const stat_data = document.createElement("ul");
    stat_data.className = "stat_data";

    let row_element = document.getElementById(`row_${row}`);

    if (!row_element) {
        row_element = document.createElement("section");

        row_element.id = `row_${row}`;
        row_element.className = "stat_row";
        json_data.appendChild(row_element);
    }

    stat_name.textContent = name
        .replace(/_/g, " ")
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    data.forEach((stat_key, i) => {
        const row_data = document.createElement("li");

        const leftSpan = document.createElement('span');
        const rightSpan = document.createElement('span');

        const numberSpan = document.createElement('span');
        numberSpan.className = "position";
        numberSpan.textContent = `#${i + 1}`;

        let img;
        if (stat_key?.url) {
            img = document.createElement('img');
            img.src = stat_key.url;
            img.loading = "lazy";
        }

        const nameSpan = document.createElement('span');
        let val = stat_key.count;
        nameSpan.textContent = stat_key.name;
        nameSpan.className = "item_name";

        if (user_login && stat_key.name == user_login) {
            const p = document.createElement("p");
            p.textContent = `${name}: ${stat_key.count}`;

            user_row.appendChild(p);
        }

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