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

        all: unset;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.3rem;
        padding: 0.6rem 0.7rem;
        box-sizing: border-box;
        background-color: $background;
        transition: all 0.3s ease-in-out;
        border-radius: 0.5rem;

        img {
            height: 2rem;
            width: auto;
            aspect-ratio: 1/1;
        }

        &:hover {
            background-color: color.adjust($background, $lightness: 5%);
            gap: 0.4rem;
            outline: 1px solid white;
        }
    }
</style>
