<script lang="ts">
    let button: {
        title: string;
        link?: string;
        new_window?: boolean;
    };

    let onClick: (() => void) | undefined = undefined;

    export { button, onClick };

    const click = () => onClick?.();

    const target =
        typeof button.new_window == "boolean"
            ? button.new_window
                ? "_blank"
                : ""
            : "_blank";
</script>

{#if button.link}
    <a href={button.link} {target} rel="noopener noreferrer">
        {button.title}
    </a>
{:else if onclick}
    <button onclick={click}>
        {button.title}
    </button>
{/if}

<style lang="scss">
    button,
    a {
        padding: 0.5rem 1.5rem;
        box-sizing: border-box;

        background-color: rgba(0, 0, 0, 0.25);

        font-size: 1.2rem;

        border: 1px #333 solid;
        border-radius: 1rem;

        transition: all 0.2s linear;

        font-weight: bold;

        &:hover {
            padding: 0.5rem 1.8rem;
            border-radius: 0.5rem;

            background-color: rgba(27, 27, 27, 0.25);
            border: 1px #6a6a6a solid;
        }
    }
</style>
