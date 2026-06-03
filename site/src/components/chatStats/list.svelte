<script lang="ts">
  import { onMount } from "svelte";
  import { type Stat } from "./wrapper.svelte";
  import Input from "../Input.svelte";
  import Checkbox from "../Checkbox.svelte";
  import { ListEnd } from "@lucide/svelte";

  interface ListStat extends Stat {
    data: Record<string, any>[];
    tracking_start?: string;
  }

  let searchQuery = $state("");
  let reverseState = $state(false);

  let { data, tracking_start = "", ...restData }: ListStat = $props();

  let topCount = $state<number>(0);

  onMount(() => (topCount = data[0].count));

  interface listDataIndexed extends listData {
    index: number;
  }

  function searchFilter(listData: ListStat["data"], query: string) {
    if (!query.length)
      return listData
        .map((item, index) => ({ ...item, index: index + 1 }))
        .filter(Boolean);

    const exactMatch = /".+?"/g.test(query);

    return data
      .map((item, index) => {
        const isQuery = exactMatch
          ? String(item.name || "") == query.replace(/"/g, "")
          : String(item.name || "")
              .toLowerCase()
              .includes(query.toLowerCase());

        return isQuery ? { ...item, index: index + 1 } : null;
      })
      .filter(Boolean);
  }

  let filtered = $derived(searchFilter(data, searchQuery)) as listDataIndexed[];

  const blockedUsers = ["desktopsetup"];
</script>

{#if data && data.length}
  <div id="top">
    <aside>
      Leaderboard <p id="label">{restData.name}</p>
    </aside>

    {#snippet icon()}
      <ListEnd size="1rem" />
    {/snippet}

    <div>
      <Checkbox bind:checked={reverseState} {icon} title={"Reverse"} />
      <Input placeholder={"Name..."} bind:value={searchQuery} />
    </div>
  </div>
  <ul>
    {#each reverseState ? [...filtered].reverse() : filtered as stat, i}
      <li
        data-index={stat.index || i + 1}
        class:censored={blockedUsers.includes(
          typeof stat.name == "string" ? stat.name.toLowerCase() : "",
        )}
      >
        <div id="censor" class="transition"></div>
        <span id="stat-name">
          <p id="stat-index">{stat.index || i + 1}</p>
          {#if stat["url"]}
            <img
              src={stat["url"]}
              alt="icon"
              loading="lazy"
              class:untracked={stat["at"] == 0 && stat["count"] == 0}
            />
          {/if}
          <p id="name">{stat.name}</p>
        </span>
        <div id="progress-bar">
          <div id="bar" style="width: {(stat.count / topCount) * 100}%"></div>
        </div>
        <p id="stat-count">{stat.count.toLocaleString()}</p>
      </li>
      <hr />
    {/each}
  </ul>

  {#if tracking_start}
    <div id="tracking_start">
      <p>Started tracking:</p>
      <p>{tracking_start}</p>
    </div>
  {/if}
{/if}

<style lang="scss">
  #top {
    display: inline-flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;

    & > * {
      display: inline-flex;
      align-items: center;
    }

    div {
      gap: 0.5rem;
    }

    aside {
      gap: 1rem;

      #label {
        font-size: 0.6rem;
        border: 1px solid #ffffff1a;
        padding: 0.15rem 0.5rem;
        border-radius: 1rem;
        color: #f0ede859;
      }
    }
  }

  ul {
    all: unset;
    max-height: 15rem;
    overflow-x: hidden;
    overflow-y: auto;
    width: 100%;

    &::-webkit-scrollbar {
      width: 0.5rem;
    }
  }

  li {
    display: inline-flex;
    align-items: center;
    width: 100%;
    position: relative;

    padding: 0.25rem 0.5rem;
    box-sizing: border-box;

    img {
      max-height: 1.5rem;
    }

    &.censored {
      cursor: pointer;

      #censor {
        width: 100%;
        height: 100%;
        position: absolute;
        background: black;
        z-index: 10000000;
        pointer-events: none;
      }

      &:hover #censor {
        width: 0%;
      }
    }
  }

  hr {
    width: 100%;
  }

  .untracked {
    outline: rgb(110, 209, 255) 1px solid;
    border-radius: 0.2rem;
  }

  #stat-name {
    width: 25%;
    min-width: 25%;
    display: inline-flex;
    gap: 0.5rem;
    flex-shrink: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 0.25rem;

    cursor: pointer;

    &:hover {
      width: max-content;
    }

    #name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  #stat-count {
    width: 10%;
    text-align: right;
    flex-shrink: 0;
    color: #434241;
  }

  #progress-bar {
    width: 100%;
    height: 0.25rem;
    background: #ffffff0f;
    border-radius: 0.1rem;
    overflow: hidden;

    #bar {
      height: 100%;
    }
  }

  li {
    --color: #434241;

    &[data-index="1"] {
      --color: #facc15;
    }

    &[data-index="2"] {
      --color: #d1d5db;
    }

    &[data-index="3"] {
      --color: #f59e0b;
    }

    #bar {
      background: var(--color);
    }

    #stat-index {
      color: var(--color);
    }
  }
</style>
