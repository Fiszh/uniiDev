<script lang="ts">
  import type { Snippet } from "svelte";
  import type {
    HTMLButtonAttributes,
    HTMLAnchorAttributes,
  } from "svelte/elements";

  type Props = {
    href?: string | null;
    primary?: boolean;
    secondary?: boolean;
    danger?: boolean;
    icon?: Snippet;
    iconRight?: Snippet;
    children?: Snippet;
  } & HTMLButtonAttributes &
    HTMLAnchorAttributes;

  const {
    href,
    primary,
    secondary,
    danger,
    icon,
    iconRight,
    children,
    ...restProps
  }: Props = $props();
</script>

{#if href}
  <a class="transition noHover" {href} class:primary class:secondary class:danger {...restProps}>
    {@render icon?.()}
    {@render children?.()}
    {@render iconRight?.()}
  </a>
{:else}
  <button class="transition" class:primary class:secondary class:danger {...restProps}>
    {@render icon?.()}
    {@render children?.()}
    {@render iconRight?.()}
  </button>
{/if}

<style lang="scss">
  a,
  button {
    padding: 0.5rem 0.7rem;
    box-sizing: border-box;
    border-radius: 0.2rem;

    gap: 0.2rem;

    display: inline-flex;
    justify-content: center;
    align-items: center;

    font-weight: bold;

    &.primary {
      color: black;
      background: white;

      &:hover {
        opacity: 0.75;
      }
    }

    &.secondary {
      color: #f0ede899;
      outline-color: #f0ede899;
      outline-width: 1px;
      outline-style: solid;

      &:hover {
        outline-color: #f0ede8e6;
        color: #f0ede8e6;
      }
    }

    &.danger {
      color: #e05a5a;
      outline-color: #e05a5a59;
      outline-width: 1px;
      outline-style: solid;

      &:hover {
        outline-color: #e05a5ab3;
        background: #e05a5a14;
      }
    }
  }
</style>
