<script lang="ts">
    import { onMount } from "svelte";

    import TwitchIcon from "$lib/assets/glitch_flat_white.svg";

    import { delCookie, getCookie, setCookie } from "$lib/cookie";

    export let onToken: (token: string) => void;
    export let onLogOut: () => void;

    let hasToken: string | null = null;

    onMount(() => {
        hasToken = getCookie("twitchToken") as string;
    });

    const clientId = "t3kbxbtqduq1nunrzeg3s18vdhhc1m";
    const scope = "user:read:email";

    function openTwitchPopup() {
        const redirectUri = `${window.location.origin}/auth`;

        if (hasToken) {
            hasToken = null;
            delCookie("twitchToken");
            onLogOut();
            return;
        }

        const oauthUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}`;

        const width = 500;
        const height = 700;
        const left = window.screenX + (window.innerWidth - width) / 2;
        const top = window.screenY + (window.innerHeight - height) / 2;

        window.open(
            oauthUrl,
            "TwitchLogin",
            `width=${width},height=${height},left=${left},top=${top}`,
        );
    }

    onMount(() => {
        window.addEventListener("message", (event) => {
            if (event.origin !== window.location.origin) return;

            if (event.data?.twitchToken) {
                hasToken = event.data.twitchToken;
                setCookie("twitchToken", event.data.twitchToken, 1);
                onToken?.(event.data.twitchToken);
                console.log("Token saved!");
            }
        });
    });
</script>

<button id="login-button" aria-label="Login" on:click={openTwitchPopup}
    >{#if hasToken}
        <img src={TwitchIcon} alt="Twitch" />
        Logout
    {:else}
        <img src={TwitchIcon} alt="Twitch" />
        Twitch Login
    {/if}</button
>

<style lang="scss">
    @use "sass:color";

    button {
        $background: #141414;
        $accent: #ffffff1b;

        all: unset;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;

        padding: 0.55rem 0.9rem;
        box-sizing: border-box;

        background: $background;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 0.6rem;

        font-weight: 600;

        transition: all 0.05s ease;

        &:hover {
            border-color: $accent;

            transform: translateY(-1px);

            box-shadow:
                0 6px 18px rgba(255, 255, 255, 0.005),
                0 0 12px $accent;
        }

        &:active {
            transform: translateY(0);
        }

        img {
            height: 2rem;
            width: auto;
            aspect-ratio: 1/1;
        }
    }
</style>
