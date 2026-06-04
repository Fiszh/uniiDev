<script lang="ts">
  import Wrapper, { type Stat } from "./wrapper.svelte";

  interface numberStat extends Stat {
    data: number;
  }

  export let stat: numberStat;
</script>

<div>
  <p id="stat-name">{stat.name}</p>
  <p id="state-count">{stat.data.toLocaleString()}</p>
</div>

<style>
    div {
        background: #141414;
        padding-block: 1rem;
        padding-inline: 1.25rem 5rem;
        width: max-content;
        border-radius: 1rem;

        text-align: left;

        border: 1px solid #ffffff14;
    }
    
    #stat-name {
        color: #f0ede84d;
    }

    #state-count {
      font-family: "Syne";
      font-size: 2rem;
      font-weight: bolder;
    }
</style>
