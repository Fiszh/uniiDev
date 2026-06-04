<script lang="ts">
  import { ArrowRight, Heart } from "@lucide/svelte";
  import { API_URL, site_title } from "../stores/global";
  import Button from "../components/Button.svelte";
  import Section from "../components/landing/Section.svelte";
  import Project from "../components/landing/Project.svelte";
  import Repo from "../components/landing/Repo.svelte";

  interface ProjectLinks {
    title: string;
    description: string;
    href: string;
    tags?: string[];
  }

  const projectLinks: ProjectLinks[] = [
    {
      title: "UChat",
      description: "Twitch chat overlay for streamers",
      href: "https://chat.unii.dev/",
      tags: ["Twitch", "7TV", "BTTV", "FFZ"],
    },
    {
      title: "Cop Slop Title Guessr",
      description: "YouTube thumbnail title guessing game",
      href: "/guessr/",
      tags: ["YouTube", "Daily Game"],
    },
    {
      title: "Chat Stats",
      description: "Twitch chat statistics viewer",
      href: "/chatStats/",
      tags: ["Charts", "Analytics"],
    },
    {
      title: "Unofficial 7TV API documentation (docs proxy)",
      description: "Unofficial 7TV API documentation proxy",
      href: `${API_URL}/seventv`,
      tags: ["7TV", "API", "Docs", "Proxy"],
    },
  ];

  interface RepoLinks {
    title: string;
    description: string;
    href: string;
  }

  const repoLinks: RepoLinks[] = [
    {
      title: "unii.dev",
      description: "This Website",
      href: "https://github.com/Fiszh/uniiDev",
    },
    {
      title: "UChat",
      description: "Chat Overlay",
      href: "https://github.com/Fiszh/UChat",
    },
    {
      title: "YAUTC",
      description: "Custom Twitch",
      href: "https://github.com/Fiszh/YAUTC",
    },
    {
      title: "7TVPaintsViewer",
      description: "7TV Paint Viewer (Archived)",
      href: "https://github.com/Fiszh/7TVPaintsViewer",
    },
  ];

  site_title.set("Home");
</script>

<aside id="hero">
  <p id="hero-label">uniiDev</p>
  <img id="hero-logo" src="https://cdn.unii.dev/logo.avif" alt="uniiDev Logo" />
  <section id="hero-dsc">
    <p>
      Self-taught coder specializing in TypeScript, Svelte, and Bun. Working on
      tools for the Twitch streamers. Almost everything is open source.
    </p>
    <p>
      Reach me via <a
        href="{API_URL}/twitch/528761326"
        target="_blank"
        rel="noopener noreferrer nofollow">Twitch whispers</a
      >
      or
      <a
        href="https://discord.com/users/703639905691238490"
        target="_blank"
        rel="noopener noreferrer nofollow">Discord</a
      >.
    </p>
  </section>
  <section id="hero-buttons">
    <Button primary href={"https://chat.unii.dev/"} target="_blank">
      Configure UChat
      {#snippet iconRight()}
        <ArrowRight size="1rem" />
      {/snippet}
    </Button>
    <Button danger href={"https://buymeacoffee.com/jzlnkf5qgo"} target="_blank">
      {#snippet icon()}
        <Heart fill="currentColor" size="1rem" />
      {/snippet}
      Support
    </Button>
    <Button secondary>GitHub</Button>
  </section>
</aside>

<Section index={1} title={"Projects"}>
  {#each projectLinks as project}
    <Project {...project} />
  {/each}
</Section>

<Section index={2} title={"Repos"}>
  <div id="repos-layout">
    {#each repoLinks as repo}
      <Repo {...repo} />
    {/each}
  </div>
</Section>

<style lang="scss">
  #hero {
    display: flex;
    flex-direction: column;
    gap: 2rem;

    max-width: 25rem;

    img {
      max-width: 15rem;
    }

    #hero-label,
    #hero-dsc {
      text-align: left;
      font-size: 1rem;
      color: #f0ede88c;
    }

    #hero-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.7rem;
    }
  }

  #repos-layout {
    display: grid;
    gap: 0.7rem;
    grid-template-columns: repeat(2, 1fr);
  }

  @keyframes heartbeat {
    0% {
      transform: scale(1);
    }

    14% {
      transform: scale(1.1);
    }

    28% {
      transform: scale(1);
    }

    42% {
      transform: scale(1.05);
    }

    70% {
      transform: scale(1);
    }

    100% {
      transform: scale(1);
    }
  }
</style>
