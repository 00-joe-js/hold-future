const path = require('path');
const fs = require('fs/promises');

const replaceAssetsReferences = async (filename) => {

    const fileContents = await fs.readFile(filename, "utf-8");

    const updatedFileContents = fileContents.replace(/\/assets/g, "assets");

    await fs.writeFile(filename, updatedFileContents);
    
};

const replaceBlippyReferenceCSS = async (cssFileName, blippyFileName) => {

    const fileContents = await fs.readFile(cssFileName, "utf-8");

    const lookFor = "url(assets/blippy.png)";

    const updatedFileContents = fileContents.replace(lookFor, `url(${path.basename(blippyFileName)})`);

    await fs.writeFile(cssFileName, updatedFileContents);

};

(async () => {

    const buildPath = path.join(__dirname, './dist');

    let dir;
    try {
        dir = await fs.readdir(buildPath);
    } catch (e) {
        console.log("Build first.");
        process.kill(1);
    }

    // Replace "/assets" with "assets" in index.html and assets/index.nnn.js file
    const htmlFileName = path.join(buildPath, '/index.html');

    const assetsPath = path.join(buildPath, '/assets')
    const assetsDir = await fs.readdir(assetsPath);
    const jsFileName = path.join(assetsPath, assetsDir.find(f => path.extname(f) === ".js"));

    const cssFileName = path.join(assetsPath, assetsDir.find(f => path.extname(f) === ".css"));
    const blippyPngName = path.join(assetsPath, assetsDir.find(f => path.extname(f) === ".png" && f.includes("blippy")));

    try {
        await replaceAssetsReferences(htmlFileName);
        await replaceAssetsReferences(jsFileName);
        await replaceBlippyReferenceCSS(cssFileName, blippyPngName);
    } catch (e) {
        console.error(e);
        process.kill(1);
    }

    console.log("Complete.");

})();