import { js } from '../../core';
import Cache from './cache';
import downloader from './downloader';
import packManager from './pack-manager';
import { removeFilesCache } from './shared';
import parser from './parser';
import dependUtil from './depend-util';
import factory from './factory';
import { releaseManager } from './release-manager';

interface IGameAsset {
    id: string[]
    uuid: string[]
}

export class InterruptManager {
    private gameAssets = new Cache<IGameAsset>();

    addToGameAssets  (gameCode: string, id: string, uuid: string): void  {
        if (gameCode === '') return;

        const gameAsset = this.gameAssets.get(gameCode);
        if (gameAsset) {
            if (!js.array.contains(gameAsset.id, id)) {
                gameAsset.id.push(id);
            }
            if (!js.array.contains(gameAsset.uuid, uuid)) {
                gameAsset.uuid.push(uuid);
            }
        } else {
            this.gameAssets.add(gameCode, { id: [id], uuid: [uuid] });
        }
    }

    stopDownloadAssets (gameCode: string): void {
        const gameAsset = this.gameAssets.get(gameCode);
        if (gameAsset) {
            const { id, uuid } = gameAsset;

            // releaseManager.releaseByUuid(id);
            // releaseManager.releaseByUuid(uuid);

            downloader.removeQueueDownloading(id);
            downloader.removeQueueDownloading(uuid);

            packManager.removeDownloading(id);
            packManager.removeDownloading(uuid);

            removeFilesCache(id);
            removeFilesCache(uuid);

            parser.removeParsing(id);
            parser.removeParsing(uuid);

            dependUtil.removeArray(id);
            dependUtil.removeArray(uuid);

            this.gameAssets.remove(gameCode);
        }
    }
}

export default new InterruptManager();
