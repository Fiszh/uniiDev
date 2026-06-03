<script lang="ts">
  import { ArrowRight } from "@lucide/svelte";

  type Props = {
    title: string;
    description: string;
    href: string;
    tags?: string[];
  };

  const { title, description, href, tags = [] }: Props = $props();
</script>

<a {href} target="_blank">
  <aside>
    <h2>{title}</h2>
    <p>{description}</p>
    {#if tags.length}
      <ul>
        {#each tags as tag}
          <li>{tag}</li>
        {/each}
      </ul>
    {/if}
  </aside>

  <p id="arrow" class="transition"><ArrowRight size="1rem" /></p>

  <hr />
</a>

<style lang="scss">
  a,
  aside {
    display: flex;
    flex-direction: column;
    position: relative;
  }

  #arrow {
    position: absolute;
    top: 50%;
    right: 1%;
    color: #ffffff14;
  }

  a {
    gap: 0.5rem;

    &:hover {
      #arrow {
        right: 0%;
        color: #ffffff31;
      }

      hr {
        border-color: #ffffff31;
      }
    }
  }

  h2 {
    font-size: 1.1rem;
  }

  ul {
    display: inline-flex;
    gap: 0.25rem;
    font-size: 0.6rem;
    padding-top: 0.25rem;
    color: #f0ede866;

    li {
      padding: 0.15rem 0.4rem;
      border: 1px solid #ffffff1a;
      border-radius: 0.2rem;
    }
  }

  p {
    font-size: 0.75rem;
    color: #f0ede866;
  }
</style>
