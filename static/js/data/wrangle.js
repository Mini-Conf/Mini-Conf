const calcAllKeys = function (allPapers, allKeys) {
  const collectAuthors = new Set();
  const collectKeywords = new Set();
  const collectSessions = new Set();

  allPapers.forEach((d) => {
    d.content.authors.forEach((a) => collectAuthors.add(a));
    d.content.keywords.forEach((a) => collectKeywords.add(a));
    d.content.session.forEach((a) => collectSessions.add(a));
    allKeys.titles.push(d.content.title);
  });
  allKeys.authors = Array.from(collectAuthors);
  allKeys.keywords = Array.from(collectKeywords);
  allKeys.session = Array.from(collectSessions);
  allKeys.session.sort();
};
