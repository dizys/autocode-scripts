const lib = require('lib')({token: process.env.STDLIB_SECRET_TOKEN});
const RSSParser = require('rss-parser');
const rssParser = new RSSParser();

let sources = {
  '网易新闻': 'https://rsshub.app/netease/news/rank/whole/click/day',
  '趣头条': 'https://rsshub.app/qutoutiao/category/1',
  '开源中国': 'https://rsshub.app/oschina/news',
}; // RSS subscriptions

let data = [];
let promises = [];

async function fetchNewsAndPushToData(sourceName, sourceURL) {
  try {
    let feed = await rssParser.parseURL(sourceURL);
    data.push({
      source: sourceName,
      items: feed.items,
    });
  } catch (e) {
    console.error(e)
  }
}

for (let [sourceName, sourceURL] of Object.entries(sources)) {
  promises.push(fetchNewsAndPushToData(sourceName, sourceURL));
}

await Promise.all(promises);
let sourceNames = Object.keys(sources);
data = data.sort((a, b) => sourceNames.indexOf(a.source) - sourceNames.indexOf(b.source));

let markdown = data.map(({source, items}) => {
  let itemsMarkdown = items.map(item => `<${item.link}|${item.title}>`).join('\n');
  return `*${source}*\n${itemsMarkdown}`;
}).join('\n\n');

await lib.slack.channels['@0.7.3'].messages.create({
  channel: `#randomness`,
  blocks: [
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": markdown,
        }
      ]
    }
  ],
  username: `News Daily`,
  icon_url: `https://tse1-mm.cn.bing.net/th?id=OIP.OLFxIG00XWCiv8sYh1r0cAHaHa&w=170&h=160&c=8&rs=1&qlt=90&dpr=2&pid=3.1&rm=2`
});


return 'ok';
