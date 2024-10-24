import axios from "axios";
import QRCode from "qrcode";
import { API_URL } from "./common.js";

document.getElementById("refresh").addEventListener("click", () => {
    genQRCode();
});

async function genQRCode() {
    const base_url = "https://3i-shikosai.github.io/wallet/html/user.html";
    const response = await axios.post(`${API_URL}/api/admin/create_user`, {
        password: "hello",
    });
    const user_id = response.data.user_id;
    const url = `${base_url}?user_id=${user_id}`;

    console.log(url);
    // create qr code
    QRCode.toCanvas(
        document.getElementById("qr-canvas"),
        url,
        function (error) {
            if (error) console.error("QRコード生成エラー", error);
        }
    );
}
