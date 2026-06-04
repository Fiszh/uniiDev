<script lang="ts">
  import { MetaTags } from "svelte-meta-tags";
  import { disable_root, site_title } from "../stores/global";

  const site_icon = "https://cdn.unii.dev/favicon.png";

  import { dev } from "$app/environment";
  import { onMount } from "svelte";
  import Topbar from "../components/topbar.svelte";
  import Footer from "../components/Footer.svelte";

  let status_message = $state<null | string>();
  let mounted = $state<boolean>(false);

  import "../reset.css";
  import "../global.scss";

  import Banner from "../components/Banner.svelte";

  onMount(() => (mounted = true));

  let { data, children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={site_icon} type="image/png" />

  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<MetaTags
  title={$site_title || "Loading..."}
  titleTemplate="%s · uniiDev"
  description="Self-taught coder working with TypeScript, Bun, and open-source Twitch tools."
  canonical="https://unii.dev/"
/>

{#if mounted}
  {#if data.statusMessage == null}
    <Banner type="fail" />
  {:else if data.statusMessage && (data.statusMessage.type || data.statusMessage.message)}
    <Banner {...data.statusMessage} />
  {/if}
{/if}

{#if dev}
  <p id="dev-version">DEV VERSION</p>
{/if}

<div class="noise background"></div>
<div class="grid-lines background"></div>
<div class="accent-blob background"></div>

{#if !mounted}
  Loading...
{:else}
  <main id="main">
    {#if !$disable_root}
      <Topbar />

      {#if status_message}
        <section id="status">{status_message}</section>
      {/if}
    {/if}

    {@render children()}

    {#if !$disable_root}
      <Footer />
    {/if}
  </main>
{/if}

{#if !$disable_root}
  <style lang="scss">
    #main {
      font-family: "BLMelody", "Amiri", sans-serif, "Noto Color Emoji";

      width: 100%;
      height: 100%;

      height: 100vh;
      width: 100vw;

      height: 100dvh;
      width: 100dvw;

      background: #0a0a0a;

      padding: 0.5rem 21.5rem;

      display: flex;
      flex-direction: column;

      gap: 4rem;

      overflow-y: auto;
      overflow-x: hidden;
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

    @media (max-width: 768px) {
      #main {
        padding: 0.5rem 1rem;
      }

      #GitHub {
        display: none;
      }
    }
  </style>
{/if}

<style lang="scss">
  .background {
    position: fixed;
    inset: 0;
    pointer-events: none;
  }

  .noise {
    background-image: url("/noise.svg");
    opacity: 0.035;
  }

  .grid-lines {
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 3.5rem 3.5rem;
  }

  .accent-blob {
    inset: unset;
    width: 35rem;
    height: 35rem;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.04) 0%,
      transparent 70%
    );
    top: -50dvh;
    right: -25dvw;
  }

  #dev-version {
    position: absolute;
    bottom: 1rem;
    left: 1rem;
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
