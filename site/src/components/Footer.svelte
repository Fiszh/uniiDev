<script>
  import { API_URL } from "../stores/global";
</script>

<footer>
  <hr />
  <section>
    unii.dev

    <span>
      <nav title="footer-links">
        <a href="https://github.com/Fiszh" target="_blank">GitHub</a>
        <a href={API_URL + "/docs"} target="_blank">Developers</a>
      </nav>
    </span>
  </section>
</footer>

<style lang="scss">
  a:hover {
    text-decoration: underline;
  }

  footer {
    padding-block: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.7rem;

    section {
      display: flex;
      justify-content: space-between;
    }
  }
</style>
