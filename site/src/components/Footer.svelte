<script>
  import { API_URL } from "../stores/global";

  import GitHubIcon from "$lib/assets/GitHub_Invertocat_White.svg";
</script>

<footer>
  <hr />
  <section>
    unii.dev

    <span>
      <nav title="footer-links">
        <a href="https://github.com/Fiszh" target="_blank">
          <img src={GitHubIcon} alt="GitHub" />
          GitHub
        </a>
        <a href={API_URL + "/docs"} target="_blank">Developers</a>
      </nav>
    </span>
  </section>
</footer>

<style lang="scss">
  footer {
    padding-block: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.7rem;

    nav {
      display: inline-flex;
      gap: 1rem;
    }

    section {
      display: flex;
      justify-content: space-between;
      padding-inline: 0.25rem;
    }

    a {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;

      img {
        height: 0.7rem;
      }
    }
  }
</style>
