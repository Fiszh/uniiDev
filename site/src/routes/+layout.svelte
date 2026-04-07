<script lang="ts">
  import { MetaTags } from "svelte-meta-tags";
  import { disable_root, site_title, TopBar } from "../stores/global";

  const site_icon = "https://cdn.unii.dev/favicon.png";

  import GitHubIcon from "$lib/assets/GitHub_Invertocat_White.svg";
  import LoginButton from "../components/LoginButton.svelte";

  import { validateToken } from "$lib/twitch";

  import { dev } from "$app/environment";
  import { delCookie, setCookie } from "$lib/cookie";
  import { onMount } from "svelte";

  let status_message = $state<null | string>();

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

  onMount(async () => {
    const api_status = await fetch("http://api.localhost:3000/status");

    const status_data = await api_status.json();

    if (status_data.message) {
      const date_now = Date.now();

      if (status_data.till >= date_now) {
        status_message = status_data.message;
      }
    }
  });

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={site_icon} type="image/png" />

  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<MetaTags
  title={$site_title || "unknown"}
  titleTemplate="%s · uniiDev"
  description="Self-taught coder working with TypeScript, Bun, and open-source Twitch tools."
  canonical="https://unii.dev/"
/>

{#if dev}
  <p id="dev-version">DEV VERSION</p>
{/if}

{#if !$disable_root}
  <a href="https://github.com/Fiszh" id="GitHub">
    <img src={GitHubIcon} alt="GitHub" />
  </a>

  <topbar>
    <main>
      <div id="logo">
        <img src="https://cdn.unii.dev/logo.avif" alt="uniiDev Logo" />
      </div>
      {$site_title}
    </main>

    {#if $TopBar.login}
      <LoginButton onToken={handleToken} onLogOut={logOut} />
    {/if}
  </topbar>
  {#if status_message}
    <section id="status">{status_message}</section>
  {/if}
{/if}

<main id="main">
  {@render children()}
</main>

{#if !$disable_root}
  <style lang="scss">
    #main {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--main-gap);
      overflow-y: auto;
      overflow-x: hidden;
      padding: 1rem;
    }

    topbar {
      padding: 0.8rem 1.2rem;
      box-sizing: border-box;

      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;

      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(10px);

      border-bottom: 1px solid rgba(255, 255, 255, 0.08);

      font-weight: 600;
      position: sticky;
      top: 0;
      z-index: 100;

      &:has(> *:nth-child(1)) {
        justify-content: space-between;
      }

      main {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      #logo {
        max-width: 7rem;
      }
    }

    #GitHub {
      position: fixed;

      bottom: 1.25rem;
      right: 1.25rem;

      img {
        max-height: 2rem;
        width: auto;
        object-fit: contain;
      }
    }
  </style>
{/if}

<style lang="scss">
  #dev-version {
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    background-color: rgba(0, 0, 0, 0.85);
    border-radius: 25rem;
    padding: 0.25rem 1rem;
    z-index: 1000000000;
    font-weight: bold;
  }

  #status {
    border-bottom: 0.15rem solid #ffffff;
    width: 100%;
    text-align: center;
    padding: 0.25rem 0.5rem;
    box-sizing: border-box;
    background-color: rgba(255, 255, 255, 0.021);
    font-weight: bold;
  }
</style>
