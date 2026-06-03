<script lang="ts">
  import {
    ArrowRight,
    Check,
    CloudAlert,
    ServerOff,
    Wrench,
  } from "@lucide/svelte";

  const { type = "fail", message, href, since = 1, till }: StatusMessage = $props();

  const messages = {
    issues: "We're having issues - some features may be unavailable",
    outage: "We're experiencing a major outage - working on it",
    annoucement: "",
    resolved: "Issues have been resolved!",
    fail: "Unable to fetch status info",
  };
</script>

{#snippet icon(type: StatusMessage["type"])}
  {#if type == "issues"}
    <Wrench size="1rem" />
  {:else if type == "outage"}
    <ServerOff size="1rem" />
  {:else if type == "resolved"}
    <Check size="1rem" />
  {:else if type == "fail"}
    <CloudAlert size="1rem" />
  {/if}
{/snippet}

{#if !href}
  <div id="banner" class={type}>
    {@render icon(type)}
    {#if !message && type in messages}
      {messages[type]}
    {:else}
      {message}
    {/if}
  </div>
{:else}
  <a id="banner" {href} target="_blank" class="link annoucement">
    {@render icon(type)}
    {#if !message && type in messages}
      {messages[type]}
    {:else}
      {message}
    {/if}
    <ArrowRight size="1rem" />
  </a>
{/if}

<style lang="scss">
  #banner {
    --background: #141414;

    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0.25rem 0.5rem;
    gap: 0.5rem;
    background: var(--background);

    &.issues {
      --background: #e48e24;
    }

    &.outage {
      --background: #cb1d1d;
    }

    &.annoucement {
      --background: #33596d;
    }

    &.resolved {
      --background: #336d44;
    }
  }

  a:hover {
    cursor: pointer;
  }
</style>
