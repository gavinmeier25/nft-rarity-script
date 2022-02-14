const fs = require('fs/promises');
const { reduce, map, sortBy } = require('lodash');

(async () => {
  const statJsonData = await fs.readFile('./stats.json');
  const statsDataParsed = JSON.parse(statJsonData);

  const categoryPercentagesMap = reduce(
    Object.entries(statsDataParsed),
    (mapAcc, traitCategory) => {
      const traitCategoriesPercentages = reduce(
        Object.entries(traitCategory[1]),
        (acc, val) => {
          return {
            ...acc,
            [val[0]]: 1 / (val[1] / 3000),
          };
        },
        {},
      );

      return {
        ...mapAcc,
        [traitCategory[0]]: traitCategoriesPercentages,
      };
    },
    {},
  );

  const completeMetaJson = await fs.readFile('./complete.json');

  const completeMetaParsed = JSON.parse(completeMetaJson);

  const withScores = map(completeMetaParsed, nft => {
    const withScoresAdded = nft.attributes.map(({ trait_type, value }) => {
      return {
        [trait_type]: trait_type,
        [value]: value,
        score: categoryPercentagesMap[trait_type][value],
      };
    });

    const totalScore = reduce(
      withScoresAdded,
      (totalScoreAcc, withScoresAddedItem) => {
        return totalScoreAcc + withScoresAddedItem.score;
      },
      0,
    );

    return {
      ...nft,
      totalScore,
      attributes: withScoresAdded,
    };
  });

  const sortedByScore = sortBy(withScores, 'totalScore').reverse();

  await fs.writeFile('./score.json', JSON.stringify(sortedByScore, null, 4));
})();
