import { writable } from "svelte/store";

export let site_title = writable<string>("");
export let TopBar = writable({
    login: false,
})
export let disable_root = writable<boolean>(false);