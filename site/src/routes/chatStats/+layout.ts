export const trailingSlash = "always";

export const load = ({ params }) => {
  return {
    channel: params.channel,
    month: params.month,
  };
};
