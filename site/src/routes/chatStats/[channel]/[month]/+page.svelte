<script lang="ts">
  import Button from "$components/inputs/Button.svelte";
  import { getCookie } from "$lib/cookie.js";
  import { API_URL, site_title } from "$stores/global";
  import { error } from "@sveltejs/kit";
  import { onMount } from "svelte";

  type ChatStats = {
    streamer_name: string;
    streamer_id: number;
    [key: string]:
      | {
          name: string;
          data: number | UserStat[] | EmoteStat[];
          row?: number;
        }
      | string
      | number;
  };

  type UserStat = {
    username: string;
    value: number;
  };

  type EmoteStat = {
    name: string;
    emote_id: string;
    url: string;
    uses: number;
  };

  let stats = $state<ChatStats | null>(null);
  let failed = $state(false);

  const { data } = $props();

  let rows: Record<string, string[]> = $state({});

  let twitchToken = $state<string | null>("");

  onMount(() => {
    site_title.set(data.channel! + " " + data.month + " Stats");

    twitchToken = getCookie("twitchToken");

    fetch(`${API_URL}/v4/channels/${data.channel}/${data.month}?limit=25`, {
      headers: {
        "x-auth-token": twitchToken ? "Bearer " + twitchToken : "",
      },
    })
      .then(async (result) => {
        stats = (await result.json()) as ChatStats;

        rows = Object.entries(stats).reduce<Record<string, string[]>>(
          (acc, [key, value]) => {
            if (
              typeof value == "object" &&
              Array.isArray(value.data) &&
              value["row"]
            ) {
              acc[String(value["row"])] = [
                ...(acc[String(value["row"])] ?? []),
                key,
              ];
            }

            return acc;
          },
          {},
        );
      })
      .catch((err) => {
        failed = true;
      });
  });

  async function loadMoreData(key: string) {
    const entry = stats?.[key];
    if (!stats || !entry || typeof entry !== "object" || !Array.isArray(entry.data))
      return;

    try {
      const result = await fetch(
        `${API_URL}/v4/channels/${data.channel}/${data.month}/${key}?p=${entry.data.length + 1}&id=${stats["streamer_id"]}`,
        {
          headers: {
            "x-auth-token": twitchToken ? "Bearer " + twitchToken : "",
          },
        },
      );

      const extended = (await result.json()) as (UserStat | EmoteStat)[];
      entry.data = [...entry.data, ...extended] as typeof entry.data;
    } catch {
      error(500); // TODO: rate limit message
    }
  }

  async function scrolledStat(e: Event, key: string) {
    //console.log(e);

    if (!(e.target instanceof HTMLElement)) return;

    const target = e.target;

    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const offsetHeight = target.offsetHeight;

    const scrollPercent = (scrollTop / (scrollHeight - offsetHeight)) * 100;

    const loading = target.getAttribute("data-loading");

    // console.log(scrollHeight - offsetHeight, scrollTop);
    // console.log(scrollPercent);
    // console.log(target.getAttribute("data-loading"));

    if (scrollPercent >= 90 && loading != "true") {
      console.log("loading");
      target.setAttribute("data-loading", "true");

      await loadMoreData(key);

      target.setAttribute("data-loading", "false");
    }
  }
</script>

{#snippet numberStat(name: string, data: number)}
  <div class="number_stat">
    <p class="stat_name">{name}:</p>
    <p>{data.toLocaleString()}</p>
  </div>
{/snippet}

{#snippet listStat(name: string, data: Record<string, any>[], key: string)}
  <div class="stat">
    <p class="stat_name">
      {name}
    </p>
    <li onscroll={(e) => scrolledStat(e, key)} data-loading="false">
      {#if data && data.length}
        {#each data as stat, i}
          <ol>
            <span>
              <p>{i + 1}.</p>
              {#if stat["url"]}
                <img src={stat["url"]} alt="icon" />
              {/if}
              <p>{stat.name ?? stat.username}</p>
            </span>
            <p>{(stat.value ?? stat.uses).toLocaleString()}</p>
          </ol>
        {/each}
      {:else}
        <p>No Data</p>
      {/if}
    </li>
  </div>
{/snippet}

<div id="display">
  {#await stats}
    <h1>Loading {data.channel} {data.month}...</h1>
  {:then chatStats}
    {#if chatStats}
      <h1>{data.channel}'s {data.month} chat stats</h1>

      <section id="stats">
        <section class="row wrap">
          {#each Object.values(chatStats) as value}
            {#if typeof value == "object" && typeof value.data == "number"}
              {@render numberStat(value.name, value.data)}
            {/if}
          {/each}
        </section>

        {#each Object.values(rows) as row}
          <section class="row">
            {#each row as key}
              {#if typeof chatStats[key] == "object" && Array.isArray(chatStats[key].data)}
                {@render listStat(
                  chatStats[key].name,
                  chatStats[key].data,
                  key,
                )}
              {/if}
            {/each}
          </section>
        {/each}
      </section>
    {/if}
  {:catch err}
    <h2>Failed</h2>
  {/await}
  <Button href="../" secondary>Back</Button>
</div>

<style lang="scss">
  #display {
    width: 100%;

    gap: 0.5rem;

    display: flex;
    justify-content: safe center;
    align-items: center;
    flex-direction: column;
  }

  li,
  ol,
  p {
    all: unset;
  }

  h1 {
    text-align: center;
  }

  #stats {
    display: flex;
    flex-direction: column;
    width: 100%;
    align-items: center;
    gap: 2.5rem;

    .row {
      display: flex;
      width: 100%;
      gap: 5rem;
      padding-inline: 5rem;
      box-sizing: border-box;
      justify-content: center;

      &.wrap {
        flex-wrap: wrap;
      }
    }
  }

  .stat_name {
    font-weight: bold;
    font-size: 1.25rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    max-height: 15rem;
    width: 100%;
    gap: 0.5rem;

    li {
      overflow-y: auto;
      overflow-x: hidden;
      display: flex;
      gap: 0.25rem;
      flex-direction: column;
      padding-inline: 0.25rem;

      ol {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.25rem;
        border-radius: 0.5rem;

        --color: #434241;
        --text-color: #ffffff;

        &:nth-child(1) {
          --color: linear-gradient(180deg, #f8dc78, #d8a31e);
          --text-color: #2b2100;
        }

        &:nth-child(2) {
          --color: linear-gradient(180deg, #e6e9ee, #a9b0ba);
          --text-color: #1c1f24;
        }

        &:nth-child(3) {
          --color: linear-gradient(180deg, #dc9660, #a35a28);
          --text-color: #2a1404;
        }

        color: var(--text-color);
        background: var(--color);

        span {
          display: flex;
          gap: 0.25rem;
          align-items: center;
        }
      }

      img {
        max-height: 1.5rem;
        border-radius: 0.25rem;
      }
    }
  }

  .number_stat {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.85rem 1rem;
    background: #1a1a1a;
    border: 1px solid #2c2c2c;
    border-radius: 0.5rem;

    p {
      margin: 0;
    }
  }

  @media (max-width: 768px) {
    #stats {
      gap: 0.5rem;
      height: 100%;

      .row {
        flex-direction: column;
        gap: 0.5rem;
        padding-inline: 0.5rem;
      }
    }
  }
</style>
