<script lang="ts">
    import { onMount } from "svelte";
    import { connect, messages } from "$lib/sennyOverlay/ws";
    import { disable_root } from "../../stores/global";

    let audio: HTMLAudioElement;
    let lastKey: string | null = null;

    disable_root.set(true);

    export let data: Record<string, number>;

    onMount(() => {
        connect(data.bits);
        audio = new Audio("/sound.wav");
    });

    $: {
        const last = $messages.at(-1);
        if (last && audio) {
            const key = last.date;

            if (key !== lastKey) {
                lastKey = key;
                audio.currentTime = 0;
                audio.volume = 0.5;
                audio.play();
            }
        }
    }
</script>

<main>
    {#if $messages.length}
        {#each $messages as message}
            <p>
                <img src={message.url} alt="icon" />{message.name}
                {message.count}
            </p>
        {/each}
    {:else}
        Waiting for combos...
    {/if}

    <p id="warning">{data.bits} OR MORE BITS REQUIRED</p>
</main>

<style lang="scss">
    :root {
        color: white;
        font-weight: bold;
        font-size: 2rem;
    }

    #warning {
        color: red;
        font-size: 0.7rem;
    }

    p {
        all: unset;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;

        img {
            height: 2rem;
            object-fit: contain;
        }
    }

    :global(body) {
        background: transparent !important;
        font-size: 1rem !important;
    }

    main {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        height: 100dvh;
        width: 100dvw;
    }
</style>
