<script lang="ts">
  import LoginButton from "../components/LoginButton.svelte";
  import { TopBar } from "../stores/global";
  import { validateToken } from "$lib/twitch";
  import { delCookie, setCookie } from "$lib/cookie";
  import { dev } from "$app/environment";

  async function handleToken(token: string) {
    const validated = await validateToken(token);

    if (validated) {
      setCookie("login", validated.login, 1);
      setCookie("client_id", validated.client_id, 1);
    }
  }

  function logOut() {
    console.log("log out");

    delCookie("login");
    delCookie("client_id");
  }
</script>

<topbar>
  <a href="/">
    unii.dev {#if dev}
      <small id="dev-version">DEV</small>
    {/if}
  </a>

  <LoginButton onToken={handleToken} onLogOut={logOut} />
</topbar>

<style lang="scss">
  small {
    font-size: 1rem;
  }

  topbar {
    height: 2.5rem;
    display: inline-flex;
    padding-block: 0.5rem;
    justify-content: space-between;
    align-items: center;
    overflow: hidden;
    width: 100%;

    a {
      font-size: 1.5rem;
      font-weight: bold;
    }
  }
</style>
