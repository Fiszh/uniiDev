<script>
    import { site_title } from "../stores/global";

  function goBack() {
    history.back();
  }

  site_title.set("Oops!")
</script>

<main>
  <div id="info">
    <h1>Oops! page not found.</h1>
    <p>
      Looks like the page you're trying to reach doesn't exist or was moved. <br>
      Check the URL or try one of the options below.
    </p>
    <div id="buttons">
      <button on:click={goBack}>Go back a page</button>
      <a href="/">Go back homepage</a>
    </div>
  </div>
  <img src="https://cdn.unii.dev/404.avif" alt="404" />
</main>

<style lang="scss">
  main {
    display: flex;
    align-items: center;
    justify-content: space-between;

    width: 100%;
    height: 100%;

    padding: 50px;
    box-sizing: border-box;
  }

  #info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
  }

  h1 {
    font-size: 2.5rem;
  }

  p {
    width: 40dvw;
  }

  #buttons {
    display: flex;
    gap: 25px;

    & > * {
      all: unset;
      transition: all 0.3s;
      padding: 0.75rem 2rem;
      background: rgba(255 255 255 / 0.1);
      border: 1px solid #555;
      border-radius: 12px;
      color: #eee;
      cursor: pointer;
      text-decoration: none;
      font-size: 1rem;

      &:hover {
        background-color: rgba(255, 255, 255, 0.068);
        border-radius: 10px;
        border: 1px white solid;
      }
    }
  }

  img {
    aspect-ratio: 1 / 1;
    height: 20dvw;
    border-radius: 10px;
  }
</style>
