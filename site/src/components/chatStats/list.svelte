<script lang="ts">
    import Wrapper, { type Stat } from "./wrapper.svelte";

    interface ListStat extends Stat {
        data: Record<string, any>[];
        tracking_start?: string;
    }

    let searchQuery = $state("");

    let { data, tracking_start = "", ...restData }: ListStat = $props();

    interface listDataIndexed extends listData {
        index: number;
    }

    function searchFilter(listData: ListStat["data"], query: string) {
        if (!query.length) return listData;

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

    let filtered = $derived(
        searchFilter(data, searchQuery),
    ) as listDataIndexed[];
</script>

{#if data && data.length}
    <Wrapper {...restData} bind:searchValue={searchQuery}>
        {#each filtered as stat, i}
            <ol data-index={stat.index || i + 1}>
                <p>{stat.index || i + 1}.</p>
                {#if stat["url"]}
                    <img src={stat["url"]} alt="icon" loading="lazy" />
                {/if}
                <p>{stat.name}</p>
                <p>({stat.count.toLocaleString()})</p>
            </ol>
        {/each}

        {#if tracking_start}
            <div id="tracking_start">
                <p>Started tracking:</p>
                <p>{tracking_start}</p>
            </div>
        {/if}
    </Wrapper>
{/if}

<style lang="scss">
    ol {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        width: 100%;

        img {
            max-height: 1.5rem;
        }
    }

    ol {
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;

        background: linear-gradient(to bottom right, #1a1d22, #0f1013);
    }

    ol[data-index="1"] {
        background: linear-gradient(to bottom right, #facc15, #ca8a04);
        box-shadow: 0 10px 15px -3px rgb(255 193 0 / 25%);
        color: white;
    }

    ol[data-index="2"] {
        background: linear-gradient(to bottom right, #d1d5db, #6b7280);
        box-shadow: 0 10px 15px -3px rgba(156, 163, 175, 0.25);
        color: white;
    }

    ol[data-index="3"] {
        background: linear-gradient(to bottom right, #f59e0b, #b45309);
        box-shadow: 0 10px 15px -3px rgba(217, 119, 6, 0.25);
        color: white;
    }
</style>
