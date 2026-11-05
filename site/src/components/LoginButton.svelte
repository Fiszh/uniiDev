<script lang="ts">
  import { onMount } from "svelte";

  import { delCookie, getCookie, setCookie } from "$lib/cookie";
  import Button from "./inputs/Button.svelte";

  let hasToken = $state<string | null>(null);

  type Props = {
    onToken: (token: string) => void;
    onLogOut: () => void;
    clientId?: string;
    scopes?: string[];
    cookie?: string;
    age?: number;
  };

  const {
    onToken,
    onLogOut,
    clientId = "t3kbxbtqduq1nunrzeg3s18vdhhc1m",
    scopes = ["user:read:moderated_channels"],
    cookie = "twitchToken",
    age = 1,
  }: Props = $props();

  function openTwitchPopup() {
    const redirectUri = `${window.location.origin}/auth`;

    if (hasToken) {
      hasToken = null;
      delCookie(cookie);
      onLogOut();
      return;
    }

    const oauthUrl = new URL("https://id.twitch.tv/oauth2/authorize");

    oauthUrl.searchParams.set("client_id", clientId);
    oauthUrl.searchParams.set("redirect_uri", redirectUri);
    oauthUrl.searchParams.set("response_type", "token");
    oauthUrl.searchParams.set("scope", scopes.join(" "));

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
    hasToken = getCookie(cookie);
    if (hasToken) onToken?.(hasToken);

    window.addEventListener("message", (event) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.twitchToken) {
        hasToken = event.data.twitchToken;
        setCookie(cookie, event.data.twitchToken, age);
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
    Login with Twitch
  {/if}
</Button>
