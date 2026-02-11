<script lang="ts" module>
    import type { Snippet } from "svelte";

    export type Stat = {
        name: string;
        icon?: string;
        search?: boolean;
        children?: Snippet;
        searchValue?: string;
    };
</script>

<script lang="ts">
    let {
        name,
        icon = "",
        search = true,
        children,
        searchValue = $bindable(""),
    }: Stat = $props();
</script>

<div class="stat">
    <p id="stat_name">
        <span>
            {#if icon}<img src={icon} alt="icon" />{/if}
            {name}
        </span>

        {#if typeof search == "undefined" ? true : search}
            <input placeholder="Search..." bind:value={searchValue}/>
        {/if}
    </p>
    <li>
        {@render children?.()}
    </li>
</div>

<style lang="scss">
    .stat {
        border-radius: 1rem;
        border: 1px #333 solid;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        background: linear-gradient(to bottom, #111316, #0b0c0e);
        overflow: hidden;
        font-weight: bold;
        min-width: max-content;
        flex: auto;

        & > * {
            padding-inline: 1rem;
        }

        li {
            padding: 0.5rem;
            display: flex;
            flex-direction: column;
            gap: 0.15rem;
            max-height: 20rem;
            overflow-x: hidden;
            overflow-y: auto;
        }

        *::-webkit-scrollbar {
            width: 0.5rem;
        }

        *::-webkit-scrollbar-track {
            background-color: rgba(255, 255, 255, 0);
        }
    }

    #stat_name {
        font-weight: bolder;
        display: flex;
        align-items: center;
        font-size: 1.3rem;
        border-bottom: 1px #333 solid;
        padding-block: 0.5rem;
        background: linear-gradient(to right, #1a1a1a, #3d3d3d00);
        justify-content: space-between;

        span {
            display: flex;
            align-items: center;
        }

        input {
            all: unset;
            background-color: rgba(0, 0, 0, 0.25);
            padding: 0rem 0.5rem;
            border-radius: 0.5rem;
        }

        img {
            max-height: 2rem;
        }
    }
</style>
