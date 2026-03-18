<script lang="ts" module>
  import { ListEnd } from "@lucide/svelte";
  import type { Snippet } from "svelte";

  export type Stat = {
    name: string;
    icon?: string;
    search?: boolean;
    reverse?: boolean;
    children?: Snippet;
    searchValue?: string;
    reverseValue?: boolean;
  };
</script>

<script lang="ts">
  let {
    name,
    icon = "",
    search = true,
    reverse = true,
    children,
    searchValue = $bindable(""),
    reverseValue = $bindable(false),
  }: Stat = $props();
</script>

<div class="stat">
  <p id="stat_name">
    <span>
      {#if icon}<img src={icon} alt="icon" />{/if}
      {name}
    </span>

    <span id="additional">
      {#if typeof reverse == "undefined" ? true : search}
        <label id="reverse" title="Reverse List">
          <input type="checkbox" bind:checked={reverseValue} />
          <ListEnd style="pointer-events: none;" />
        </label>
      {/if}
      {#if typeof search == "undefined" ? true : search}
        <input placeholder="Search..." bind:value={searchValue} />
      {/if}
    </span>
  </p>
  <li>
    {@render children?.()}
  </li>
</div>

<style lang="scss">
  .stat {
    border-radius: 1rem;
    border: 1px #333 solid;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    background: linear-gradient(to bottom, #111316, #0b0c0e);
    overflow: hidden;
    font-weight: bold;
    width: max-content;
    flex: auto;

    max-width: 100%;

    & > * {
      padding-inline: 1rem;
    }

    li {
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      max-height: 20rem;
      overflow-x: hidden;
      overflow-y: auto;

      text-overflow: ellipsis;
    }

    *::-webkit-scrollbar {
      width: 0.5rem;
    }

    *::-webkit-scrollbar-track {
      background-color: rgba(255, 255, 255, 0);
    }
  }

  #stat_name {
    font-weight: bolder;
    display: flex;
    align-items: center;
    font-size: 1.3rem;
    border-bottom: 1px #333 solid;
    padding-block: 0.5rem;
    background: linear-gradient(to right, #1a1a1a, #3d3d3d00);
    justify-content: space-between;

    span {
      display: flex;
      align-items: center;
    }

    #additional {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    #reverse,
    input {
      all: unset;
      background-color: rgba(0, 0, 0, 0.25);
      padding: 0rem 0.5rem;
      border-radius: 0.5rem;
      border: 0.1rem solid #333;
    }

    #reverse {
      aspect-ratio: 1/1;
      padding: 0.2rem;
      cursor: pointer;

      &:has(input:checked) {
        background-color: rgba(255, 255, 255, 0.15);
      }

      input {
        display: none;
        width: 100%;
        height: 100%;
      }
    }

    img {
      max-height: 2rem;
    }
  }
</style>
