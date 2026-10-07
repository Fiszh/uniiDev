<script lang="ts">
  import { MetaTags } from "svelte-meta-tags";
  import { isMobile, site_title } from "$stores/global";

  const site_icon = "https://cdn.unii.dev/favicon.png";

  import { onMount } from "svelte";
  import Topbar from "$components/topbar.svelte";
  import Footer from "$components/Footer.svelte";

  import Banner from "$components/Banner.svelte";

  let mounted = $state<boolean>(false);

  import "$styles/reset.css";
  import "$styles/app.scss";
  import "$styles/variables.scss";

  onMount(() => (mounted = true));

  let { data, children } = $props();

  const setMobile = () => isMobile.set(window.innerWidth <= 768);

  onMount(() => {
    setMobile();
    window.addEventListener("resize", setMobile);
  });
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

<Banner
  type="outage"
  message="The main website is currently being rewriten, some features might be missing or not working."
/>

{#if !mounted}
  Loading...
{:else}
  <main id="main">
    <Topbar />

    <div class="content">
      {@render children()}
    </div>

    <Footer />
  </main>
{/if}

<style lang="scss">
  #main {
    width: 100%;
    height: 100%;

    height: 100vh;
    width: 100vw;

    height: 100dvh;
    width: 100dvw;

    padding: 0.5rem 1rem 0rem 1rem;

    display: flex;
    flex-direction: column;

    gap: 4rem;

    overflow-y: auto;
    overflow-x: hidden;

    .content {
      flex: 1 0 auto;
    }
  }
</style>
