<script lang="ts">
  import Button from "$components/inputs/Button.svelte";
  import { API_URL, site_title } from "$stores/global";
  import { onMount } from "svelte";

  type Data = { channel_id: string; username: string }[];

  let streamers = $state<Data>([]);
  let failed = $state(false);

  onMount(() => {
    site_title.set("Chat Stats");

    fetch(API_URL + "/v4/channels")
      .then(async (result) => {
        streamers = (await result.json()) as Data;
      })
      .catch((err) => {
        failed = true;
      });
  });
</script>

<div>
  {#if streamers.length}
    <h1>Select a streamer</h1>
    {#each streamers as streamer}
      <Button href={streamer.username} primary>{streamer.username}</Button>
    {/each}
  {:else}
    <h1>Loading...</h1>
  {/if}
  {#if failed}
    <h2>Failed</h2>
  {/if}
  <Button href="/" primary={!streamers.length} secondary={!!streamers.length}>
    Homepage
  </Button>
</div>

<style lang="scss">
  div {
    width: 100%;
    height: 100%;

    gap: 0.5rem;

    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }
</style>
