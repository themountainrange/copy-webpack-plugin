import Promise from 'bluebird';
import loaderUtils from 'loader-utils';

/* eslint-disable import/no-commonjs */
const fs = Promise.promisifyAll(require('fs-extra'));
/* eslint-enable */

export default (opts) => {
    const compilation = opts.compilation;
    // ensure forward slashes
    let relFileDest = opts.relFileDest.replace(/\\/g, '/');
    const relFileSrc = opts.relFileSrc.replace(/\\/g, '/');
    const absFileSrc = opts.absFileSrc;
    const forceWrite = opts.forceWrite;
    const copyUnmodified = opts.copyUnmodified;
    const writtenAssetHashes = opts.writtenAssetHashes;

    return fs
    .statAsync(absFileSrc)
    .then((stat) => {

        // We don't write empty directories
        if (stat.isDirectory()) {
            return;
        }

        function addToAssets(content) {

            relFileDest = loaderUtils.interpolateName(
                {resourcePath: relFileSrc},
                relFileDest,
                {content});

            if (compilation.assets[relFileDest] && !forceWrite) {
                return;
            }

            compilation.assets[relFileDest] = {
                size: function() {
                    return stat.size;
                },
                source: function() {
                    return fs.readFileSync(absFileSrc);
                }
            };

            return relFileDest;
        }

        return fs.readFileAsync(absFileSrc)
        .then((content) => {
            var hash = loaderUtils.getHashDigest(content);
            if (!copyUnmodified &&
                writtenAssetHashes[relFileDest] &&
                writtenAssetHashes[relFileDest] === hash) {
                return;
            }
            writtenAssetHashes[relFileDest] = hash;
            return addToAssets(content);
        });
    });
};
