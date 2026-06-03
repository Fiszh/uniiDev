<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";

  type Props = {
    children?: Snippet;
  } & HTMLInputAttributes;

  let {
    value = $bindable(""),
    placeholder,
    minlength,
    maxlength,
    ...restProps
  }: Props = $props();
</script>

<input bind:value {placeholder} {minlength} {maxlength} {...restProps} />

<style lang="scss">
  input {
    outline: none;
    border: none;
    border-radius: 0.25rem;
    padding-inline: 0.25rem;
  }
</style>
