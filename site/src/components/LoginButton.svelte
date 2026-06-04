<script lang="ts">
  import { onMount } from "svelte";

  import TwitchIcon from "$lib/assets/glitch_flat_white.svg";

  import { delCookie, getCookie, setCookie } from "$lib/cookie";
  import Button from "./Button.svelte";

  let hasToken = $state<string | null>(null);

  type Props = {
    onToken: (token: string) => void;
    onLogOut: () => void;
  };

  const { onToken, onLogOut }: Props = $props();

  onMount(() => {
    hasToken = getCookie("twitchToken") as string;
  });

  const clientId = "t3kbxbtqduq1nunrzeg3s18vdhhc1m";
  const scope = "user:read:email user:read:moderated_channels";

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

<Button primary aria-label="Login" onclick={openTwitchPopup}>
  {#if hasToken}
    Logout
  {:else}
    Login
  {/if}
</Button>