<script lang="ts">
    export let stat: {
        name: string;
        icon?: string;
    };
</script>

<div class="stat">
    <p id="stat_name">
        {#if stat.icon}<img src={stat.icon} alt="icon" />{/if}
        {stat.name}
    </p>
    <li>
        <slot />
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
        width: 100%;
        overflow: hidden;
        font-weight: bold;

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

        img {
            max-height: 2rem;
        }
    }
</style>
