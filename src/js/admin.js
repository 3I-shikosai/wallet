import jsQR from "jsqr";
import axios from "axios";
import { API_URL, BALANCE_CONTROL_STEP } from "./common.js";

// ============================================================
// ロード時に実行
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
    // ログイン処理
    const password = await authenticate();

    // ユーザーのデータを管理するクラスのインスタンス化
    let user = new User(password);

    // モード切替用ボタンのイベントリスナー
    // cancelボタン
    document.getElementById("menu-cancel").addEventListener("click", () => {
        document.getElementById("scan-view").style.display = "none";
        document.getElementById("control-view").style.display = "block";
        document.getElementById("menu-cancel").style.display = "none";
        document.getElementById("menu-scan").style.display = "inline";
    });

    // scanボタン
    document.getElementById("menu-scan").addEventListener("click", () => {
        document.getElementById("scan-view").style.display = "block";
        document.getElementById("control-view").style.display = "none";
        document.getElementById("menu-cancel").style.display = "inline";
        document.getElementById("menu-scan").style.display = "none";

        user = new User(password);
    });

    // 残高操作ポップアップの表示
    document
        .getElementById("balance-control-button")
        .addEventListener("click", () => {
            document.getElementById("balance-control-popup").style.display =
                "block";
        });

    // Delete User
    document.getElementById("reset-button").addEventListener("click", () => {
        const ok = window.confirm("本当にこのユーザーを削除しますか？");
        if (ok) {
            user.deleteUser();

            document.getElementById("scan-view").style.display = "block";
            document.getElementById("control-view").style.display = "none";
            document.getElementById("menu-cancel").style.display = "inline";
            document.getElementById("menu-scan").style.display = "none";
            user = new User(password);
        }
    });
});

// ============================================================
// ユーザーのデータを管理するクラス
// ============================================================
class User {
    constructor(password) {
        this.isScanMode = true;
        this.balance = 0;
        this.password = password;

        const qr_scanner = new QRCode();
        qr_scanner.scan().then((data) => {
            this.user_id = data;
            document.getElementById("user-id").innerText = data;
            this.fetchBalance().then((balance) => {
                this.balance = balance;
                document.getElementById("balance").innerText = balance;
            });
            switch_mode();
        });

        // 残高操作フォームのイベントリスナー
        document
            .getElementById("balance-control-form")
            .addEventListener("submit", (event) => {
                event.preventDefault();
                const amount = document.getElementById(
                    "balance-control-input"
                ).value;
                const balance = this.balance + parseInt(amount);
                this.setBalance(balance).then(() => {
                    document.getElementById("balance").innerText = String(
                        this.balance
                    );
                    document.getElementById("balance-control-input").value =
                        "0";
                });
                document.getElementById("balance-control-popup").style.display =
                    "none";
            });

        document
            .getElementById("balance-control-plus")
            .addEventListener("click", () => {
                const input = document.getElementById("balance-control-input");
                const val = input.value;
                const ret = String(parseInt(val) + BALANCE_CONTROL_STEP);
                input.value = ret;
            });

        document
            .getElementById("balance-control-minus")
            .addEventListener("click", () => {
                const input = document.getElementById("balance-control-input");
                const val = input.value;
                const ret = String(parseInt(val) - BALANCE_CONTROL_STEP);
                input.value = ret;
            });
    }

    // ユーザーのデータを取得
    async fetchBalance() {
        const response = await axios.post(`${API_URL}/api/admin/get_balance`, {
            password: this.password,
            user_id: this.user_id,
        });
        self.balance = response.data.balance;
        document.getElementById("balance").innerHTML = String(self.balance);
        return response.data.balance;
    }

    // 残高の変更リクエスト
    async setBalance(balance) {
        const response = await axios.post(`${API_URL}/api/admin/set_balance`, {
            password: this.password,
            user_id: this.user_id,
            balance: balance,
        });
        this.balance = response.data.balance;
        document.getElementById("balance").innerText = String(this.balance);
        console.log("setBalance", response.data);
    }

    async deleteUser() {
        await axios.post(`${API_URL}/api/admin/delete_user`, {
            password: this.password,
            user_id: this.user_id,
        });
        console.log("deleted user");
    }
}

// ============================================================
// ログイン処理（パスワード認証）
// ============================================================
function authenticate() {
    return new Promise((resolve) => {
        document
            .getElementById("password-form")
            .addEventListener("submit", async (event) => {
                event.preventDefault();
                const password = document.getElementById("password").value;

                axios
                    .post(`${API_URL}/api/admin/verify_password`, {
                        password: password,
                    })
                    .then((response) => {
                        const success = response.data.success;
                        if (success) {
                            document.getElementById(
                                "login-view"
                            ).style.display = "none";
                            console.log("Login successful");
                            resolve(password);
                        } else {
                            alert("Invalid password");
                            document.getElementById("password").value = "0";
                        }
                    });
            });
    });
}

// ============================================================
// モード切替
// ============================================================
const switch_mode = (function () {
    let is_scan_mode = true;

    return () => {
        if (is_scan_mode) {
            document.getElementById("scan-view").style.display = "none";
            document.getElementById("control-view").style.display = "block";
            document.getElementById("menu-cancel").style.display = "none";
            document.getElementById("menu-scan").style.display = "inline";
        } else {
            document.getElementById("scan-view").style.display = "block";
            document.getElementById("control-view").style.display = "none";
            document.getElementById("menu-cancel").style.display = "inline";
            document.getElementById("menu-scan").style.display = "none";
        }
        is_scan_mode = !is_scan_mode;
    };
})();

// ============================================================
// QRコードスキャン
// ============================================================
class QRCode {
    constructor() {
        this.video = document.createElement("video");
        this.canvas = document.getElementById("qr-canvas");
        this.ctx = this.canvas.getContext("2d");
        this.msg = document.getElementById("qr-msg");

        this.userMedia = {
            audio: false,
            video: {
                facingMode: "environment",
                width: 640,
                height: 480,
            },
        };

        navigator.mediaDevices.getUserMedia(this.userMedia).then((stream) => {
            this.video.srcObject = stream;
            this.video.setAttribute("playsinline", true);
            this.video.play();
        });
    }

    scan = () => {
        return new Promise((resolve) => {
            this.msg.innerText = "Loading video...";
            const inner_scan = () => {
                if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
                    this.canvas.height = this.video.videoHeight;
                    this.canvas.width = this.video.videoWidth;
                    this.ctx.drawImage(
                        this.video,
                        0,
                        0,
                        this.canvas.width,
                        this.canvas.height
                    );
                    const img = this.ctx.getImageData(
                        0,
                        0,
                        this.canvas.width,
                        this.canvas.height
                    );
                    const code = jsQR(img.data, img.width, img.height, {
                        inversionAttempts: "dontInvert",
                    });
                    if (code) {
                        this.drawRect(code.location);
                        resolve(code.data);
                    } else {
                        this.msg.innerText = "detecting QR Code...";
                    }
                }
                setTimeout(inner_scan, 250);
            };
            inner_scan();
        });
    };

    drawRect(location) {
        this.drawLine(location.topLeftCorner, location.topRightCorner);
        this.drawLine(location.topRightCorner, location.bottomRightCorner);
        this.drawLine(location.bottomRightCorner, location.bottomLeftCorner);
        this.drawLine(location.bottomLeftCorner, location.topLeftCorner);
    }

    drawLine(begin, end) {
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = "#00ff59";
        this.ctx.beginPath();
        this.ctx.moveTo(begin.x, begin.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();
    }
}
