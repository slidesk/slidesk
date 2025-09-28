/**
 * This component replaces all
 *
 * `!test(my string)`
 *
 * with
 *
 * Test: my string
 */
export default (data) => {
  let newData = data;
  [...newData.matchAll(/!test\((.*)\)/g)].forEach((match) => {
    newData = newData.replace(match[0], `Test: ${match[1]}`);
  });
  return newData;
};
