// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	interface Streamers {
		path: string,
		type: string
	}

	interface Dates extends Streamers {
		title: string
	}

	interface listData {
		name: string;
		count: number;
		at: number;
		url?: string;
	}

	interface listStatData {
		stat_name: string;
		row: number;
		data: listData[];
		tracking_start?: string;
	}

	interface longestMessage {
		message: string;
		sent_on: number;
		sent_by: string;
	}

	type chatStatsData = listStatData | string | number | longestMessage;
}

export { };
