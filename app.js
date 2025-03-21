const FB_URL = "https://graph.facebook.com/v22.0";
const FB_TOKEN = "";
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

async function downloadImage(url, index) {
        const fs = require("fs");
        const axios = require("axios");
        const path = require("path");
        const fileName = `image_${index + 1}.jpg`;
        const writer = fs.createWriteStream(path.resolve(__dirname, fileName));

        const response = await axios({
                url,
                method: "GET",
                responseType: "stream",
        });

        response.data.pipe(writer);

        writer.on("finish", () => {
                console.log(`Downloaded: ${fileName}`);
        });
}

async function main() {
        const data = await getFacebookPhotos();
        for (let i = 0; i < data.length; i++) {
                await downloadImage(data[i], i);
        }
}

main();


Log in or sign up to view
https://graph.facebook.com
