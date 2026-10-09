<script lang="ts">
  import Button from "$components/inputs/Button.svelte";
  import Input from "$components/inputs/Input.svelte";
  import { getCookie } from "$lib/cookie";
  import { API_URL, site_title } from "$stores/global";
  import { Plus } from "@lucide/svelte";

  site_title.set("sennyk4 clip comp");

  let clips = $state([""]);

  const addClip = () => (clips = [...clips, ""]);

  async function submit() {
    const clearedClips = clips.filter(Boolean);

    if (!clearedClips.length) return alert("No clips!");

    const twitchToken = getCookie("twitchToken");

    if (!twitchToken) return alert("Please login!");

    fetch(API_URL + "/clipcomp", {
      method: "POST",
      body: clearedClips.join(" "),
      headers: {
        "Content-Type": "text/plain",
        "x-auth-token": `Bearer ${twitchToken}`,
      },
    })
      .then((results) => {
        if (results.ok) return alert("Submitted!");
        throw new Error("");
      })
      .catch(() => {
        alert("Error occurred, please try again later");
      });
  }
</script>

{#snippet plusIcon()}
  <Plus />
{/snippet}

<section id="main">
  <img src="/chud.png" alt="chud" />

  <h1>Submit Your Clips</h1>
  <h3>sennyk4 clip comp</h3>
  <h4 class="flashing">submit clips that make senny look bad</h4>
  <h4 class="flashing">this isn't a simple clip comp</h4>

  <section id="clips">
    {#each clips as _, index (index)}
      <Input
        bind:value={clips[index]}
        style="width: 25vw;"
        placeholder="Clip..."
      />
    {/each}
    <Button secondary center icon={plusIcon} onclick={addClip}>Add more</Button>
  </section>

  <Button primary onclick={submit}>Submit Clips</Button>
</section>

<style lang="scss">
  #main {
    width: 100%;
    height: 100%;

    gap: 0.5rem;

    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    img {
      width: 25vw;
      border-radius: 0.5rem;
      object-fit: contain;
    }

    #clips {
      display: flex;
      flex-direction: column;

      gap: 0.5rem;

      max-height: 25vh;
      overflow-y: auto;
    }
  }

  .flashing {
    color: red;
    animation: flash 1.2s linear infinite;
  }

  @keyframes flash {
    0%,
    100% {
      text-shadow: 0 0 8px rgba(255, 0, 0, 1);
    }
    50% {
      text-shadow: 0 0 0 rgb(255, 0, 0);
    }
  }
</style>
