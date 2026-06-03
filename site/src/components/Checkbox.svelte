<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";

  type Props = {
    checked: boolean;
    icon?: Snippet;
    iconChecked?: Snippet;
  } & HTMLInputAttributes;

  let { checked = $bindable(false), icon, iconChecked }: Props = $props();
</script>

<label class="checkbox" class:checked>
  <input type="checkbox" bind:checked />
  {#if iconChecked && checked}
    <span class="box">
      {@render iconChecked()}
    </span>
  {:else if icon}
    <span class="box">
      {@render icon()}
    </span>
  {/if}
</label>

<style lang="scss">
  label {
    position: relative;

    background: #141414;
    color: #ffffff53;
    padding: 0.25rem;
    border-radius: 0.25rem;

    cursor: pointer;

    &.checked {
      background: #ffffff1f;
      color: white;
    }

    input {
      position: absolute;
      width: 100%;
      height: 100%;
      visibility: hidden;
    }
  }
</style>
