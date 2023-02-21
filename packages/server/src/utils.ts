export const shuffle = <T>(array: T[]) => {
  const arrCopy = [...array];
  const shuffled = arrCopy.sort(() => 0.5 - Math.random());
  return shuffled;
};
