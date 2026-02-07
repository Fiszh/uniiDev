export const load = ({ params }) => {
  return {
    rest: params.rest?.split('/') || []
  };
};