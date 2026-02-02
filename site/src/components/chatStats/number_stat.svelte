<script lang="ts">
    import Wrapper from "./wrapper.svelte";

    export let stat: {
        name: string;
        data: number | string;
    };
</script>

<Wrapper stat={{ name: stat.name }}>
    {stat.data.toLocaleString()}
</Wrapper>
