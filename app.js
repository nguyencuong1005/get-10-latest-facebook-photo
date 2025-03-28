const fs = require("fs");
const path = require("path");
const downloader = require("nodejs-file-downloader");

const outputPath = "";

const FB_URL = "https://graph.facebook.com/v22.0";
const FB_TOKEN ="";

async function getFacebookPhotos() {
        let result = [];
        let url = `${FB_URL}/me/feed?fields=attachments{subattachments}&access_token=${FB_TOKEN}&limit=10`;

        while (result.length < 10) {
                const { data, next_url } = await fbResToVecString(url, 10 - result.length);
                result = result.concat(data);
                url = next_url;
        }
        return result;
}

async function fbResToVecString(url, left) {
        const res = await fetch(url);
        const response = await res.json();

        const next_url = response.next || "";

        const data = response.data
                .filter((item) => item?.attachments?.data?.length)
                .flatMap((item) => item.attachments.data)
                .filter((attachment) => attachment.subattachments?.data?.length)
                .flatMap((attachment) => attachment.subattachments.data)
                .filter((subattachment) => subattachment.type === "photo")
                .map((subattachment) => subattachment?.media?.image?.src ?? "")
                .filter((src) => !!src)
                .slice(0, left);
        return { data, next_url };
}

async function startDownload() {
        const url = await getFacebookPhotos();
        for (let picUrl = 0; picUrl < url.length; picUrl++) {
                await new downloader({
                        url: url[picUrl],
                        directory: "./downloads",
                        fileName: `${picUrl}.png`,
                        cloneFiles: false,
                }).download();
                try {
                        console.log("All done");
                } catch (error) {
                        console.log("Download failed", error);
                }
        }
}

async function main() {
        await startDownload();
        const currentDir = process.cwd();
        const downloadsPath = path.join(currentDir, "downloads");
        fs.readdir(downloadsPath, (err, files) => {
                if (err) {
                        console.error("Error reading directory:", err);
                        return;
                }
                console.log("Files in Downloads directory:", files);

                for (let file of files) {
                        const sourceFile = path.join(downloadsPath, file);
                        const destFile = path.join(outputPath, file);

                        fs.copyFile(sourceFile, destFile, (writeError) => {
                                if (writeError) {
                                        console.error(
                                                `Error copying ${file} to output:`,
                                                writeError
                                        );
                                } else {
                                        console.log(`Successfully copied ${file} to ${outputPath}`);
                                }
                        });
                }
        });
}

main();
