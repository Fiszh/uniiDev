<script lang="ts">
  import { getCookie, setCookie } from "$lib/cookie";
  import { onMount } from "svelte";
  import { API_URL, site_title } from "../../stores/global";

  import moment from "moment/min/moment-with-locales";

  site_title.set("Title Guessr");

  interface RoundState {
    index: number;
    wrong: number;
    correct: number;
    answer: null | number;
    answered: boolean;
  }

  interface levelInfo {
    thumbnail: string;
    titles: string[];
    url?: string;
  }

  interface Answer {
    title: string;
    url: string;
  }

  interface GuessrCookie {
    index: number;
    wrong: number;
    correct: number;
  }

  let mounted = $state(false);

  let roundState = $state<RoundState>({
    index: 0,
    wrong: 0,
    correct: 0,
    answer: null,
    answered: false,
  });

  let levels = $state<levelInfo[]>([]);

  $effect(() => {
    if (roundState.index > 0 && roundState.index < 6 && !levels.length)
      fetchRound();
  });

  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);

  async function fetchRound() {
    const roundsRes = await fetch(API_URL + "/guessr/rounds");

    levels = await roundsRes.json();
  }

  async function checkGuess(index: number) {
    if (roundState.answered) return;

    const guessRes = await fetch(
      API_URL + "/guessr/guess?index=" + String(roundState.index - 1),
    );

    if (!guessRes.ok) return alert("Failed to process guess");

    const data = (await guessRes.json()) as Answer;

    if (data) {
      roundState.answered = true;
      const titleIndex = levels[roundState.index - 1].titles.indexOf(
        data.title,
      );

      roundState.answer = titleIndex;
      levels[roundState.index - 1].url = data.url;

      index == titleIndex ? roundState.correct++ : roundState.wrong++;

      const guessrCookie: GuessrCookie = {
        index: Math.max(roundState.index + 1, 0),
        wrong: roundState.wrong,
        correct: roundState.correct,
      };

      setCookie("guessr", JSON.stringify(guessrCookie), tomorrow.toUTCString());
    } else {
      return alert("Failed to process guess");
    }
  }

  const next = () => {
    roundState.index++;
    roundState.answer = null;
    roundState.answered = false;
  };

  let msUntilReset = $state<number>(0);

  onMount(() => {
    const guessrCookie = getCookie("guessr") as string | null;

    if (guessrCookie) {
      roundState = {
        ...roundState,
        ...(JSON.parse(guessrCookie) as GuessrCookie),
      };
    }

    mounted = true;

    setInterval(() => {
      const now = new Date();
      msUntilReset =
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 1,
        ) - now.getTime();
    }, 1000);
  });

  moment.locale(navigator.language);
</script>

<h1>Cop Slop Title Guessr</h1>
<h4>Match thumbnail to the correct title</h4>

{#if !mounted}
  Loading site...
{:else if roundState.index == 0}
  <small>5 rounds, 4 titles each - guess which one is real.</small>
  <button id="play" onclick={() => (roundState.index = 1)}>Play</button>
{:else if levels.length || 5 < roundState.index}
  {#if 6 > roundState.index}
    <section id="guessr">
      <section id="score">
        <p>Round: {roundState.index}/5</p>
        <p id="wrong">Wrong: {roundState.wrong}/5</p>
        <p id="correct">Correct: {roundState.correct}/5</p>
      </section>
      <img src={levels[roundState.index - 1].thumbnail} alt="thumbnail" />
      <section id="titles">
        {#each levels[roundState.index - 1].titles as title, i}
          <button
            class:wrong={typeof roundState.answer == "number" &&
              roundState.answer != i}
            class:correct={typeof roundState.answer == "number" &&
              roundState.answer == i}
            onclick={() => checkGuess(i)}>{title}</button
          >
        {/each}
      </section>
      {#if "url" in levels[roundState.index - 1]}
        <a href={levels[roundState.index - 1].url} target="_blank"
          >Watch here: {levels[roundState.index - 1].url}</a
        >
      {/if}
      {#if roundState.answered}
        <button onclick={next}>Next</button>
      {/if}
    </section>
  {:else}
    <section id="results">
      <h2>Game Completed!</h2>
      <section id="score">
        <p id="wrong">Wrong: {roundState.wrong}/5</p>
        <p id="correct">Correct: {roundState.correct}/5</p>
      </section>
      <p>
        Refreshes: {moment.duration(msUntilReset).humanize(true)}
      </p>
    </section>
  {/if}
{:else if !levels.length}
  Loading...
{/if}

<style lang="scss">
  button {
    background-color: rgba(0, 0, 0, 0.5);
    padding: 0.25rem 1rem;
    color: white;
    border-radius: 0.5rem;
    border: 1px #333 solid;

    transition: all 0.3s ease;

    &:hover {
      background-color: rgba(0, 0, 0, 0.25);
      border-radius: 0.25rem;
      border: 1px #888888 solid;
    }
  }

  #results {
    text-align: center;
  }

  small,
  #play {
    margin-top: 0.75rem;
  }

  #score {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    width: 100%;

    font-weight: 400;

    #wrong {
      color: rgb(153, 50, 50);
    }

    #correct {
      color: rgb(50, 153, 55);
    }
  }

  a {
    color: rgb(106, 164, 211);
  }

  #guessr {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    & > *:not(button) {
      border-radius: 0.5rem;
      border: 1px #333 solid;
    }

    text-align: center;

    #score {
      padding: 0.25rem;
    }

    img {
      aspect-ratio: 16/9;
      max-height: 30dvh;
      object-fit: contain;
      padding: 1rem;
    }

    #titles {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;

      border: none;
      border-radius: none;

      button {
        width: 100%;

        &:global(.wrong) {
          border-color: rgb(153, 50, 50);
          background-color: rgb(59, 0, 0);
        }

        &:global(.correct) {
          border-color: rgb(50, 153, 55);
          background-color: rgb(0, 59, 8);
        }
      }
    }
  }
</style>
