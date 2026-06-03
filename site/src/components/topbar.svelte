<script lang="ts">
  import LoginButton from "../components/LoginButton.svelte";
  import { TopBar } from "../stores/global";
  import { validateToken } from "$lib/twitch";
  import { delCookie, setCookie } from "$lib/cookie";

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
    unii.dev
  </a>

  {#if $TopBar.login}
    <LoginButton onToken={handleToken} onLogOut={logOut} />
  {/if}
</topbar>

<style lang="scss">
  a {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  topbar {
    max-height: 2.5rem;
    min-height: 2.5rem;
    display: inline-flex;
    padding-block: 0.5rem;
    justify-content: space-between;
    align-items: center;
    font-size: 1.5rem;
    font-weight: 500;
    overflow: hidden;
    width: 100%;
  }
</style>
