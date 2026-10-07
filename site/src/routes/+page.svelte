<script lang="ts">
  import { ArrowRight, Heart } from "@lucide/svelte";
  import { site_title } from "../stores/global";
  import Button from "$components/inputs/Button.svelte";

  site_title.set("Home");
</script>

<section id="main">
  <img id="hero-logo" src="https://cdn.unii.dev/logo.avif" alt="uniiDev Logo" />
  <p>I code stuff</p>
  <section id="hero-buttons">
    <Button primary href="https://chat.unii.dev/">
      Configure UChat
      {#snippet iconRight()}
        <ArrowRight size="1rem" />
      {/snippet}
    </Button>
    <Button href="/chatStats/" secondary>Chat Stats</Button>
    <Button danger href="https://buymeacoffee.com/jzlnkf5qgo">
      {#snippet icon()}
        <Heart fill="currentColor" size="1rem" />
      {/snippet}
      Support
    </Button>
    <Button href="https://github.com/Fiszh">GitHub</Button>
  </section>
</section>

<style lang="scss">
  #main {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;

    height: 100%;

    img {
      max-width: 15rem;
    }

    #hero-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.7rem;
    }
  }

  @media (max-width: 768px) {
    #hero-buttons {
      flex-direction: column;
      align-items: center;
    }
  }
</style>
