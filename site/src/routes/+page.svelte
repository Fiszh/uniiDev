<script>
    import { Heart } from "@lucide/svelte";
    import LinkButton from "../components/StretchButton.svelte";
    import { site_title } from "../stores/global";

    const site_links = [
        {
            title: "Configure the Chat Overlay (UChat)",
            link: "https://chat.unii.dev/",
        },
        { title: "Chat Stats", link: "/chatStats/" },
        {
            title: "Unofficial 7TV API documentation (docs proxy)",
            link: "https://api.unii.dev/seventv",
        },
    ];

    const repo_links = [
        {
            title: "This Website",
            link: "https://github.com/Fiszh/uniiDev",
        },
        {
            title: "UChat (Chat Overlay)",
            link: "https://github.com/Fiszh/UChat",
        },
        {
            title: "YAUTC (Custom Twitch)",
            link: "https://github.com/Fiszh/YAUTC",
        },
        {
            title: "7TVPaintsViewer",
            link: "https://github.com/Fiszh/7TVPaintsViewer",
        },
    ];

    site_title.set("Home");
</script>

<section id="about_me">
    <h2>About me</h2>
    <p>Hi! I'm a self-taught coder using TypeScript, Svelte, SCSS and Bun.</p>
    <p>
        Working on a <a
            href="https://chat.unii.dev/"
            target="_blank"
            rel="noopener noreferrer">chat overlay for Twitch</a
        >.
    </p>
    <p>
        Started with Roblox Lua, then learned JavaScript for a <a
            href="https://fiszh.github.io/YAUTC/"
            target="_blank"
            rel="noopener noreferrer">small project</a
        >.
    </p>
    <p>
        Almost everything I make is open source on my <a
            href="https://github.com/Fiszh"
            target="_blank"
            rel="noopener noreferrer">GitHub</a
        >.
    </p>
    <p>
        Reach me via <a
            href="https://api.unii.dev/twitch/528761326"
            target="_blank"
            rel="noopener noreferrer nofollow">Twitch whispers</a
        >
        or
        <a
            href="https://discord.com/users/703639905691238490"
            target="_blank"
            rel="noopener noreferrer nofollow">Discord</a
        >.
    </p>
    <p id="heart">
        <a
            href="https://buymeacoffee.com/jzlnkf5qgo"
            target="_blank"
            rel="noopener noreferrer"
        >
            <Heart fill="red" color="red" size="4rem" />
        </a>
    </p>
</section>

<nav aria-label="Site Links">
    {#each site_links as link}
        <LinkButton button={link} />
    {/each}
</nav>
<a
    href="https://api.unii.dev/docs/"
    target="_blank"
    rel="noopener noreferrer"
    class="hidden"
>
    Also check out the API
</a>

<h2>GitHub Repos</h2>

<nav aria-label="GitHub Repositories">
    {#each repo_links as link}
        <LinkButton button={link} />
    {/each}
</nav>

<style lang="scss">
    #about_me {
        text-align: center;
        font-size: 1.3rem;
    }

    nav {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }

    #heart {
        font-size: 3rem;
        display: flex;
        justify-content: center;

        a {
            display: block;
        }

        &:hover {
            color: rgb(255, 0, 0);
            text-shadow: 0 0 5px rgb(255, 0, 0);
            animation: heartbeat 0.6s infinite;
        }
    }

    a {
        color: rgb(203, 242, 255);

        &:hover {
            text-decoration: underline;
        }

        &.hidden {
            color: rgba(255, 255, 255, 0.25);
            font-size: 1rem;
        }
    }

    @keyframes heartbeat {
        0% {
            transform: scale(1);
        }

        14% {
            transform: scale(1.1);
        }

        28% {
            transform: scale(1);
        }

        42% {
            transform: scale(1.05);
        }

        70% {
            transform: scale(1);
        }

        100% {
            transform: scale(1);
        }
    }
</style>
