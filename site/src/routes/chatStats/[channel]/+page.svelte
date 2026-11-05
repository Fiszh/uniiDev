<script lang="ts">
  import Button from "$components/inputs/Button.svelte";
  import { API_URL, site_title } from "$stores/global";
  import { onMount } from "svelte";

  type Data = string[];

  let months = $state<Data>([]);
  let failed = $state(false);

  const { data } = $props();

  onMount(() => {
    site_title.set(data.channel + " Stats");

    fetch(API_URL + "/v4/channels/" + data.channel)
      .then(async (result) => {
        months = (await result.json()) as Data;
      })
      .catch((err) => {
        failed = true;
      });
  });
</script>

<div>
  {#if months.length}
    <h1>Select a streamer</h1>
    {#each months as month}
      <Button href={month} primary>{month}</Button>
    {/each}
  {:else}
    <h1>Loading {data.channel}...</h1>
  {/if}
  {#if failed}
    <h2>Failed</h2>
  {/if}
  <Button href="../" secondary>Back</Button>
</div>

<style lang="scss">
  div {
    width: 100%;
    height: 100%;

    gap: 0.5rem;

    display: flex;
    justify-content: safe center;
    align-items: center;
    flex-direction: column;
  }
</style>
