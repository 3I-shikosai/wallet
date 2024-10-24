import axios from "axios";
import QRCode from "qrcode";
import { API_URL } from "./common.js";

document.addEventListener("DOMContentLoaded", async () => {
    // パスワード認証
    const password = await authenticate();

    // QRコード生成(スペースキー, エンターキー)
    document.addEventListener("keyup", (e) => {
        const key = e.key;

        if (key === " " || key === "Enter") {
            console.log("key pressed");
            genQRCode(password);
        }
    });

    // QRコード生成(リフレッシュボタン)
    document.getElementById("refresh").addEventListener("click", () => {
        document.getElementById("refresh").blur();
        genQRCode(password);
    });
});

async function genQRCode(password) {
    const qr_canvas = document.getElementById("qr-canvas");
    const base_url = "https://3i-shikosai.github.io/wallet/html/user.html";
    const response = await axios.post(`${API_URL}/api/admin/create_user`, {
        password: password,
    });
    const user_id = response.data.user_id;
    const url = `${base_url}?user_id=${user_id}`;

    console.log(url);
    // create qr code
    QRCode.toCanvas(
        qr_canvas,
        url,
        {
            width: qr_canvas.width,
            margin: 0,
        },
        function (error) {
            if (error) console.error("QRコード生成エラー", error);
        }
    );
}

async function authenticate() {
    return new Promise((resolve) => {
        document
            .getElementById("password-form")
            .addEventListener("submit", async (e) => {
                e.preventDefault();

                const password = document.getElementById("password").value;

                const response = await axios.post(
                    `${API_URL}/api/admin/verify_password`,
                    {
                        password: password,
                    }
                );
                if (response.data.success) {
                    document.getElementById("login-view").style.display =
                        "none";
                    resolve(password);
                } else {
                    alert("パスワードが違います");
                    document.getElementById("password").value = "";
                }
            });
    });
}
