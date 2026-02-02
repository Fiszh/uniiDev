<script lang="ts">
    import Wrapper from "./wrapper.svelte";

    export let list: {
        icon?: string;
        name: string;
        data: Record<string, any>[];
        tracking_start?: string;
    };
</script>

{#if list.data && list.data.length}
    <Wrapper stat={{ icon: list.icon, name: list.name }}>
        {#each list.data as stat, i}
            <ol>
                <p>{i + 1}.</p>
                {#if stat["url"]}
                    <img src={stat["url"]} alt="icon" loading="lazy" />
                {/if}
                <p>{stat.name}</p>
                <p>({stat.count.toLocaleString()})</p>
            </ol>
        {/each}

        {#if list.tracking_start}
            <div id="tracking_start">
                <p>Started tracking:</p>
                <p>{list.tracking_start}</p>
            </div>
        {/if}
    </Wrapper>
{/if}

<style lang="scss">
    ol {
        display: flex;
        align-items: center;
        gap: 0.25rem;

        img {
            max-height: 1.5rem;
        }
    }

    ol {
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;

        background: linear-gradient(to bottom right, #1a1d22, #0f1013);

        &:nth-child(1) {
            background: linear-gradient(to bottom right, #facc15, #ca8a04);
            box-shadow: 0 10px 15px -3px rgb(255 193 0 / 25%);
            color: white;
        }

        &:nth-child(2) {
            background: linear-gradient(to bottom right, #d1d5db, #6b7280);
            box-shadow: 0 10px 15px -3px rgba(156, 163, 175, 0.25);
            color: white;
        }

        &:nth-child(3) {
            background: linear-gradient(to bottom right, #f59e0b, #b45309);
            box-shadow: 0 10px 15px -3px rgba(217, 119, 6, 0.25);
            color: white;
        }
    }
</style>
