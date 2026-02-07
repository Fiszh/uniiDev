<script lang="ts">
	import { MetaTags } from "svelte-meta-tags";
	import { disable_root, site_title, TopBar } from "../stores/global";

	const site_icon = "https://cdn.unii.dev/favicon.png";

	import GitHubIcon from "$lib/assets/GitHub_Invertocat_White.svg";
	import LoginButton from "../components/LoginButton.svelte";

	async function handleToken(token: string) {
		console.log(token);
	}

	function logOut() {
		console.log("log out");
	}

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={site_icon} type="image/png" />

	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<MetaTags
	title={$site_title || "unknown"}
	titleTemplate="%s · uniiDev"
	description="Self-taught coder working with TypeScript, Bun, and open-source Twitch tools."
	canonical="https://unii.dev/"
/>

{#if !$disable_root}
	<a href="https://github.com/Fiszh" id="GitHub">
		<img src={GitHubIcon} alt="GitHub" />
	</a>

	<topbar>
		<main>
			<div id="logo">
				<img src="https://cdn.unii.dev/logo.avif" alt="uniiDev Logo" />
			</div>
			{$site_title}
		</main>

		{#if $TopBar.login}
			<LoginButton onToken={handleToken} onLogOut={logOut} />
		{/if}
	</topbar>
{/if}

<main id="main">
	{@render children()}
</main>

{#if !$disable_root}
	<style lang="scss">
		#main {
			width: 100%;
			height: 100%;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: var(--main-gap);
			overflow-y: auto;
			overflow-x: hidden;
			padding: 1rem;
		}

		topbar {
			padding: 1rem 0.5rem;
			box-sizing: border-box;
			border-bottom: #333 1px solid;
			font-weight: bold;
			width: 100%;
			display: flex;
			align-items: center;
			background-color: black;

			&:has(> *:nth-child(1)) {
				justify-content: space-between;
			}

			main {
				display: flex;
				align-items: center;
				gap: 1rem;
			}

			#logo {
				max-width: 7rem;
			}
		}

		#GitHub {
			position: fixed;

			bottom: 1rem;
			right: 1rem;

			img {
				max-height: 2rem;
				width: auto;
				object-fit: contain;
			}
		}
	</style>
{/if}
