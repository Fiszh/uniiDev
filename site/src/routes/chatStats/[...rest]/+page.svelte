<script lang="ts">
    import { site_title, TopBar } from "../../../stores/global";

    import * as chatStats from "$lib/chatStats";

    import StretchButton from "../../../components/StretchButton.svelte";
    import List from "../../../components/chatStats/list.svelte";
    import { setGap } from "$lib/styling.js";
    import { fade } from "svelte/transition";
    import NumberStat from "../../../components/chatStats/number_stat.svelte";
    import { onMount } from "svelte";
    import { getCookie } from "$lib/cookie.js";
    import Wrapper from "../../../components/chatStats/wrapper.svelte";

    site_title.set("Chat Stats");

    TopBar.update((data) => {
        data = {
            ...data,
            login: true,
        };

        return data;
    });

    const { params } = $props();

    function getDerivedParams() {
        const rest = Array.isArray(params.rest)
            ? params.rest
            : params.rest.split("/");

        return {
            channel: rest[0],
            json: rest[1],
        };
    }

    let buttonsType = $state<string>("");

    let jsonButtons = $state<Streamers[]>([]);
    let dateButtons = $state<Dates[]>([]);
    let chatStats_Data: chatStatsData[] = [];
    const rowData = {
        number: {} as Record<string, number>,
        list: {} as Record<number, listStatData[]>,
    };

    function isListStatData(stat: chatStatsData): stat is listStatData {
        return typeof stat === "object" && stat !== null && "row" in stat;
    }

    let user_login = $state<string | null>("");

    $effect(() => {
        const { channel, json } = getDerivedParams();

        console.log(channel, json);

        (async () => {
            setGap("1rem");

            if (!channel) {
                console.log("getting channel");
                const channels_res = await chatStats.getStreamers();
                if (channels_res?.length)
                    jsonButtons = channels_res.filter(
                        (dir) => dir.type === "dir",
                    );

                buttonsType = "channel";
            } else if (!json) {
                console.log("getting json");
                dateButtons = await chatStats.getChatStatsDates(channel);

                buttonsType = "json";
            } else {
                console.log("getting data");
                chatStats_Data = await chatStats.getChatStatsData(
                    channel,
                    json,
                );

                const dataValues: chatStatsData[] =
                    Object.values(chatStats_Data);
                const dataEntries: [string, chatStatsData][] =
                    Object.entries(chatStats_Data);

                const capitalize = (str: string) =>
                    str ? str[0].toUpperCase() + str.slice(1) : str;

                for (const [key, value] of dataEntries) {
                    if (
                        ["streamer_id"].includes(key) ||
                        typeof value != "number"
                    )
                        continue;

                    const name = capitalize(key.replace(/_/g, " "));

                    rowData["number"][name] = value;
                }

                console.log(rowData);

                for (const stat of dataValues) {
                    if (!isListStatData(stat) || rowData.list[stat.row])
                        continue;

                    rowData.list[stat.row] = dataValues.filter(
                        (s): s is listStatData =>
                            isListStatData(s) && s.row === stat.row,
                    );
                }

                buttonsType = "stats";
                setGap("0rem");

                if (user_login) statsForUser = getUserStats();
            }
        })();
    });

    type UserStat = {
        name: string;
        data: number;
    };

    let statsForUser = $state<UserStat[]>([]);

    function onCookieChange() {
        console.log("cookie changed");

        user_login = getCookie("login");

        statsForUser = getUserStats();
    }

    function getUserStats() {
        if (!rowData?.list || !user_login) return [] as UserStat[];

        const login = user_login.toLowerCase();

        return Object.values(rowData.list)
            .flatMap((lists) => lists)
            .flatMap((list) => {
                const match = list.data.find(
                    (d) => String(d.name ?? "").toLowerCase() === login,
                );

                return match
                    ? [{ name: list.stat_name, data: match.count }]
                    : [];
            }) as UserStat[];
    }

    onMount(() => {
        user_login = getCookie("login");

        window.addEventListener("cookiechange", onCookieChange);
    });
</script>

<p id="segments">
    <a href="/chatStats">home</a>
    {#each params.rest.split("/") as param, i}
        <a
            transition:fade={{ duration: 200 }}
            href="/chatStats/{params.rest
                .split('/')
                .slice(0, i + 1)
                .join('/')}">/{param}</a
        >
    {/each}
</p>

{#if buttonsType == "channel"}
    {#each jsonButtons as jsonButton}
        <StretchButton
            button={{
                title: jsonButton.path,
                link: window.location.href + "/" + jsonButton.path,
                new_window: false,
            }}
        />
    {/each}
{:else if buttonsType == "json"}
    {#each dateButtons as dateButton}
        <StretchButton
            button={{
                title: dateButton.title,
                link: window.location.href + "/" + dateButton.path,
                new_window: false,
            }}
        />
    {/each}
{:else if buttonsType == "stats"}
    {#if user_login}
        <p>{user_login + "'s stats"}</p>
        <section id="row">
            {#each statsForUser as stat}
                <NumberStat {stat} />
            {/each}
        </section>
    {/if}

    <section id="row">
        {#each Object.entries(rowData["number"]) as [key, value]}
            <NumberStat stat={{ name: key, data: value }} />
        {/each}
    </section>

    {#each Object.values(rowData["list"]) as lists}
        <section id="row">
            {#each lists as list}
                <List
                    name={list.stat_name}
                    data={list.data.sort((a, b) => b.count - a.count)}
                />
            {/each}
        </section>
    {/each}

    <a href="https://chat.unii.dev" target="_blank">Check out UChat</a>
{:else}
    <p>Please wait...</p>
{/if}

<style lang="scss">
    a {
        padding-block: 0.5rem;
        box-sizing: border-box;

        &:hover {
            text-decoration: underline;
        }
    }

    #segments {
        font-size: 1.5rem;
        font-weight: bold;
        display: inline-flex;
    }

    #row {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;

        gap: 2.5rem;
        padding: 1.5rem 2.5rem;
        box-sizing: border-box;
        font-size: 1rem;

        width: 100%;

        border-bottom: 1px solid;
        border-image: linear-gradient(
                to right,
                #33333300 5%,
                #333 20%,
                #333 80%,
                #33333300 95%
            )
            1;

        &:last-child {
            border: none;
        }
    }
</style>
