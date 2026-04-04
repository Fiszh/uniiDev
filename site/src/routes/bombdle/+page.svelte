<script lang="ts">
  import { onMount } from "svelte";
  import { disable_root, site_title } from "../../stores/global";
  import { writable } from "svelte/store";
  import { getCookie, setCookie } from "$lib/cookie";
  import { dev } from "$app/environment";

  site_title.set("Bombdle");
  disable_root.set(true);

  let videoPlayer: HTMLVideoElement;
  let play_button: HTMLButtonElement;
  let bomb_section: HTMLElement;
  let skip_p: HTMLElement;
  let timer_p: HTMLElement;
  let results_section: HTMLElement;

  type bombdle_possible_status = "lose" | "win";

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  function clicked() {
    play_button.style.display = "none";
    videoPlayer.classList.remove("blur");
    videoPlayer.play();
  }

  const onPlaying = () => {
    skip_p.classList.remove("hidden");
    document.body.addEventListener("click", skipVideo, {
      once: true,
    });
  };

  const playSound = (file: string | string[]) => {
    const f = Array.isArray(file)
      ? file[Math.floor(Math.random() * file.length)]
      : file;
    const audio = new Audio("bombdle_assets/sounds/" + f);
    audio.volume = 0.5;
    audio.play();
  };

  let inputCode = writable<string[]>([]);
  let code: string = Array.from({ length: 7 }, () =>
    Math.floor(Math.random() * 10),
  ).join("");

  let inputCorrect = writable<number[]>([]); // index numbers, not actuall numbers

  let time_left = writable<number>(50);
  let tries_left = writable<number>(6);

  function endRound(status: bombdle_possible_status, reveal_timeout: number) {
    videoPlayer.src = "bombdle_assets/boom.webm";
    setCookie("bombdle_status", status, tomorrow.toUTCString());

    clearInterval(timerInterval);
    timer_p.classList.add("hidden");
    bomb_section.classList.add("hidden");

    setTimeout(() => {
      revealResults(status);
      videoPlayer.classList.add("blur");
    }, reveal_timeout);
  }

  function defused() {
    endRound("win", 0);
    playSound(sound_list.defused);
  }

  function exploded() {
    endRound("lose", 5000);
    videoPlayer.play();
    videoPlayer.classList.remove("blur");
  }

  function reset() {
    inputCode.set([]);
    playSound(sound_list.wrong);
  }

  const sound_list = {
    start: ["letsgo.wav", "locknload.wav", "moveout.wav"],
    defused: "bombdef.wav",
    time_running_out: "blow.wav",
    wrong: "wrong.wav",
    keypress: "keypress.wav",
  };

  function attemptDefuse(keys: string[]) {
    inputCorrect.update((correct) => {
      for (const [i, num] of code.split("").entries()) {
        if ($inputCode[i] == num && !correct[i]) correct.push(i);
      }

      return correct.sort((a, b) => b - a);
    });

    if (keys.join("") == code) defused();
    if (keys.join("") != code) {
      reset();

      tries_left.update((tries) => {
        tries--;

        setCookie("bombdle_tries", tries, tomorrow.toUTCString());

        if (tries == 0) exploded();

        return tries;
      });
    }
  }

  function handleKey(e: Event) {
    const keyEl = e.target as HTMLButtonElement;

    if (keyEl) {
      const key = keyEl.innerHTML;

      playSound(sound_list.keypress);

      switch (key) {
        case "#":
          attemptDefuse($inputCode);

          break;
        case "*":
          inputCode.set([]);

          break;
        default:
          inputCode.update((keys) => {
            if (keys.length <= 7) keys.push(key);

            return keys;
          });

          if ($inputCode.length >= 7) attemptDefuse($inputCode);

          break;
      }
    }
  }

  const skipVideo = () => (videoPlayer.currentTime = videoPlayer.duration);

  let timerInterval: ReturnType<typeof setInterval>;
  const startTimer = (start_time?: number) => {
    if (start_time) time_left.set(start_time);
    timerInterval = setInterval(
      () =>
        time_left.update((time) => {
          time--;

          if (time <= 0) exploded();
          if (time == 5) playSound(sound_list.time_running_out);

          setCookie("bombdle_time", String(time), tomorrow.toUTCString());

          return time;
        }),
      1000,
    );
  };

  let comeback_in: string;
  function loseTimer() {
    const now = new Date();

    const time_left = new Date(tomorrow.getTime() - now.getTime());

    comeback_in =
      time_left.getHours() +
      "h " +
      time_left.getMinutes() +
      "m " +
      time_left.getSeconds() +
      "s ";
  }

  function revealResults(type: bombdle_possible_status) {
    results_section.classList.remove("win");
    results_section.classList.remove("lose");
    results_section.classList.add(type);

    results_section.classList.remove("hidden");

    loseTimer();
    setInterval(loseTimer, 1000);
  }

  onMount(() => {
    const bombdle_status = getCookie(
      "bombdle_status",
    ) as bombdle_possible_status | null;

    // nuh uh no reseting by refreshing
    code = getCookie("bombdle_code") || code;
    setCookie("bombdle_code", code, tomorrow.toUTCString());

    tries_left.set(
      (getCookie("bombdle_tries") as number | null) || $tries_left,
    );
    setCookie("bombdle_tries", $tries_left, tomorrow.toUTCString());

    if (dev) console.log(code);

    if (bombdle_status) {
      revealResults(bombdle_status);
    } else {
      play_button.style.display = "unset";
    }

    videoPlayer.addEventListener("playing", onPlaying);

    videoPlayer.addEventListener("ended", () => {
      document.body.removeEventListener("click", skipVideo);
      skip_p.classList.add("hidden");

      if (videoPlayer.src.endsWith("plant.webm")) {
        videoPlayer.src = "bombdle_assets/defuse.webm";
        videoPlayer.play();
      } else if (videoPlayer.src.endsWith("defuse.webm")) {
        playSound(sound_list.start);

        videoPlayer.classList.add("blur");
        bomb_section.classList.remove("hidden");

        timer_p.classList.remove("hidden");

        const bombdle_time = getCookie("bombdle_time");

        startTimer(bombdle_time ? Number(bombdle_time) : undefined);
      }
    });
  });

  const keypadButtons = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "*",
    "0",
    "#",
  ];
</script>

<section
  id="results"
  bind:this={results_section}
  class="middle hidden transition lose win"
>
  <h1 id="lose">The bomb exploded!</h1>
  <h1 id="win">You defused the bomb!</h1>
  <h2>The correct code was:</h2>
  <h2 class="code">{code}</h2>
  <h3>Come back in {comeback_in} to try again!</h3>
</section>

<p id="timer" bind:this={timer_p} class="transition hidden">0:{$time_left}</p>

<button
  id="button_play"
  class="middle"
  onclick={clicked}
  bind:this={play_button}>Play</button
>

<section id="bomb" class="middle hidden transition" bind:this={bomb_section}>
  <section id="tries_info">
    <p>Tries left: {$tries_left}</p>
    <p>Guessed correctly:</p>
    <section id="correct_numbers" class="code">
      {#each code.split("") as key, i}
        {#if $inputCorrect.includes(i)}
          <p>
            {key}
          </p>
        {:else}
          <p>-</p>
        {/if}
      {/each}
    </section>
  </section>
  <img src="bombdle_assets/cs_bomb.png" alt="bomb" draggable="false" />
  <section id="code">
    {#each [...Array(7 - ($inputCode ? $inputCode.length : 0)), ...$inputCode] as key, i}
      <p class:number={typeof key != "undefined"} data-index={i}>
        {typeof key == "undefined" ? "-" : key}
      </p>
    {/each}
  </section>
  <section id="keypad">
    {#each keypadButtons as key}
      <button onclick={handleKey}>{key}</button>
    {/each}
  </section>
</section>

<video
  src="bombdle_assets/plant.webm"
  bind:this={videoPlayer}
  class="blur"
  playsinline
>
  <track kind="captions" />
</video>

<p id="skip" class="transition hidden" bind:this={skip_p}>
  Click anywhere to skip
</p>

<p id="credits" class="transition">Idea by: Fehleno, Made by: uniiDev</p>

<style lang="scss">
  .transition {
    transition: all 0.25s ease;
  }

  .hidden {
    opacity: 0 !important;
  }

  video {
    position: absolute;
    height: 100%;
    width: 100%;
    left: 0;
    overflow: hidden;
  }

  .middle {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 2;
  }

  .code {
    display: inline-flex;
    font-family: "Digital7";
    justify-content: center;
    gap: 0.25rem;
  }

  #results {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.25);
    padding: 0.5rem 2rem;
    box-sizing: border-box;

    opacity: 1;

    & > #win,
    & > #lose {
      display: none;
    }

    &.win > #win {
      display: unset;
    }
    &.lose > #lose {
      display: unset;
    }

    h1 {
      &#lose {
        color: #e63535;
      }

      &#win {
        color: #00e676;
      }
    }
  }

  #bomb {
    opacity: 1;
    z-index: 2;

    #tries_info {
      display: flex;
      justify-self: center;
      flex-direction: column;

      position: absolute;

      padding: 0.25rem 2rem;
      box-sizing: border-box;

      font-weight: bold;
      text-align: center;

      background-color: rgba(0, 0, 0, 0.25);

      opacity: 1;
    }

    img {
      width: 40vw;
      width: 40dvw;
      min-width: 100%;
    }

    & > *:not(img) {
      left: 50%;
      transform: translateX(-50%);
    }

    #code {
      position: absolute;
      top: 18.7%;
      font-size: 2.7vw;
      color: rgba(0, 0, 0, 0.8);
      font-family: "Digital7";
      transform: translateX(-34%);
      display: flex;

      p {
        aspect-ratio: 1/1;
        padding-inline: 0.4rem;
      }
    }

    #keypad {
      position: absolute;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      top: 51.74%;
      transform: translateX(-48%);
      gap: 1.17vw 1.37vw;

      button {
        border-radius: 1px;
        aspect-ratio: 1/1;
        font-size: 0vw;
        height: 1.55vw;
        color: #ffffff00;

        &:hover {
          outline: rgb(255, 255, 255) 2px solid;
          background-color: rgba(0, 0, 0, 0.25);
        }
      }
    }
  }

  #skip,
  #timer,
  #credits {
    opacity: 1;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: 2.5%;
    font-weight: bold;
    font-size: 1rem;
    color: #ffffff7e;
  }

  #skip {
    bottom: 5%;
  }

  #timer {
    bottom: unset;
    color: #ffffff;
    font-size: 3rem;
    z-index: 2;
    background-color: rgba(0, 0, 0, 0.5);
    padding: 0.3rem 1rem 0rem 1rem;
    border-bottom: rgb(182, 31, 31) 5px solid;
    border-radius: 0rem 0rem 1rem 1rem;
    box-sizing: border-box;
  }

  #button_play {
    z-index: 3;
    font-size: 5rem;
    font-weight: bold;
    color: white;
    background-color: rgba(0, 0, 0, 0.5);
    padding: 0.25rem 2rem;
    box-sizing: border-box;
    display: none;
  }

  .blur {
    filter: blur(8px);
  }
</style>
