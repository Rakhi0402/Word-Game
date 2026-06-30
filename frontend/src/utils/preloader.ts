class AssetPreloader {
  private static instance: AssetPreloader;
  private imageCache: Map<string, HTMLImageElement> = new Map();

  private assetsToPreload = [
    '/assets/background/login_bg.png',
    '/assets/background/home_bg.png',
    '/assets/background/card_coll_bg.jpeg',
    '/assets/background/leaderboard_bg.jpeg',
    '/assets/background/achievements.jpeg',
    '/assets/card_pack/po_common.png',
    '/assets/card_pack/monkey_common.png',
    '/assets/card_pack/crane_common.png',
    '/assets/card_pack/mantis_rare.png',
    '/assets/card_pack/viper_rare.png',
    '/assets/card_pack/tigress_rare.png',
    '/assets/card_pack/shifu_epic.png',
    '/assets/card_pack/dragon_warrior_po_epic.png',
    '/assets/card_pack/oogway_legendary.png',
  ];

  private constructor() {}

  public static getInstance(): AssetPreloader {
    if (!AssetPreloader.instance) {
      AssetPreloader.instance = new AssetPreloader();
    }
    return AssetPreloader.instance;
  }

  public getCachedImage(url: string): HTMLImageElement | undefined {
    return this.imageCache.get(url);
  }

  public async preloadAll(onProgress: (percent: number) => void): Promise<void> {
    const total = this.assetsToPreload.length;
    if (total === 0) { onProgress(100); return; }
    let loadedCount = 0;

    const loadPromises = this.assetsToPreload.map(async (url) => {
      try {
        const img = new Image();
        img.src = url;
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve(); // don't block on missing assets
        });
        if ('decode' in img) {
          await img.decode().catch(() => {});
        }
        this.imageCache.set(url, img);
      } catch (_) {
        // silently continue
      } finally {
        loadedCount++;
        onProgress(Math.floor((loadedCount / total) * 100));
      }
    });

    await Promise.all(loadPromises);
  }
}

export const assetPreloader = AssetPreloader.getInstance();
export default assetPreloader;
