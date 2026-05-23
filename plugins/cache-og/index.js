const CACHE_PATH = '.cache/og-images';

export default {
  async onPreBuild({ utils }) {
    const success = await utils.cache.restore(CACHE_PATH);
    if (success) {
      console.log(`Restored OG image cache from previous build`);
    } else {
      console.log(`No OG image cache found, will generate fresh`);
    }
  },
  async onPostBuild({ utils }) {
    const success = await utils.cache.save(CACHE_PATH);
    if (success) {
      console.log(`Saved OG image cache for next build`);
    }
  },
};
