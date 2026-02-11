<script lang="ts">
    import Wrapper, { type Stat } from "./wrapper.svelte";

    interface numberStat extends Stat {
        data: number;
    }

    export let stat: numberStat;
</script>

<!-- number stats have nothing to search -->
<Wrapper {...stat} search={false}>
    {stat.data.toLocaleString()}
</Wrapper>
