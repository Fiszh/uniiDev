// +page.ts
import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
  const bits = Number(url.searchParams.get('bits')) || 50;
  return { bits };
};
