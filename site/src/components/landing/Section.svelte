<script lang="ts">
  import type { Snippet } from "svelte";

  type Props = { children: Snippet; index: number; title: string };

  const { children, index, title }: Props = $props();
</script>

<hr class="transition"/>

<nav>
  <span>
    <p id="index">{index > 9 ? index : "0" + index}</p>
    <p id="title">{title}</p>
  </span>

  {@render children()}
</nav>

<style lang="scss">
  span {
    display: flex;
    gap: 1rem;
    font-weight: bold;
    font-size: 0.8rem;

    #index {
      color: rgba(240, 237, 232, 0.3);
    }

    #title {
      color: rgba(240, 237, 232, 0.9);
    }
  }

  nav {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
</style>
