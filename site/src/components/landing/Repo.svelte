<script lang="ts">
  type Props = {
    title: string;
    description: string;
    href: string;
  };

  const { title, description, href }: Props = $props();
</script>

<a {href} target="_blank" class="transition">
  <h2>{title}</h2>
  <p>{description}</p>
</a>

<style lang="scss">
  a {
    display: flex;
    flex-direction: column;
    position: relative;

    background: #ffffff08;
    border: 1px solid #ffffff14;
    padding: 1rem;
    border-radius: 0.25rem;

    &:hover {
      background: #ffffff0f;
      border-color: #ffffff29;
    }
  }

  h2 {
    font-size: 1.1rem;
  }

  p {
    font-size: 0.75rem;
    color: #f0ede866;
  }
</style>
