// ------------------------- Constatnts -----------------------------
const LOGIN_PASSWORD = "utMMzzS=Y";
const MAX_BALANCE = 1000;
const MIN_BALANCE = 0;
const INITIAL_BALANCE = 100;
const RISEFALL_STEP = 10;

// ------------------------- Password Encoder -----------------------
const CHAR_LIST =
    "AVWXYZ#=BCDEFGHIJ^KLMNOa$bcdefghijkPQRSTU+!lmnopqrstuvwxyz".split("");
const encode = (src) => {
    for (let i = 0; i < src.charCodeAt(0) % 10; i++) {
        src = src + CHAR_LIST[(src.charCodeAt(0) + i * 5) % CHAR_LIST.length];
    }
    let ascii = src.split("").map((ch) => ch.charCodeAt(0));
    ascii = ascii.map((code) => {
        const idx = ((-1 * code) ** 3 + 32) ** 2 % CHAR_LIST.length;
        return CHAR_LIST[idx];
    });
    return ascii.join("");
};

const genPassword = (pass) => {
    console.log(encode(pass));
};

// ------------------------ Password Certification -------------------
let entered_raw_password = "";
id_get("password-form").addEventListener("submit", (e) => {
    e.preventDefault();
    entered_raw_password = id_get("password").value;
    if (encode(entered_raw_password) == LOGIN_PASSWORD) {
        id_get("certification-frame").style.display = "none";
        id_get("admin-view").style.display = "block";
    } else {
        window.alert("password incorrect!");
    }
    return false;
});


// ----------------------- User Class -----------------------
class UserData {
    constructor(id) {
        this.__user_id = id;
        id_get("user-id").innerHTML = String(this.__user_id);

        fetch(API_URL + `/balance/${id}`)
            .then((response) => response.json())
            .then((json) => {
                this.__number = json.number;
                this.__balance = json.balance;
            })
            .then(() => {
                id_get("balance").innerHTML = String(this.__balance);
            });
    }

    balance() {
        return this.__balance;
    }

    refresh() {
        fetch(API_URL + `/balance/${this.__user_id}`)
            .then((response) => response.json())
            .then((json) => {
                console.log(json);
                this.__balance = json.balance;
            })
            .then(() => {
                id_get("balance").innerHTML = String(this.__balance);
            });
    }

    inc(diff) {
        fetch(API_URL + "/inc", {
            method: "PUT",
            body: JSON.stringify({
                password: entered_raw_password,
                user_id: this.__user_id,
                number: this.__number,
                diff: diff,
            }),
            headers: {
                "Content-type": "application/json; charset=UTF-8",
            },
        })
            .then((response) => response.json())
            .then((json) => {
                this.__balance = json.balance;
            })
            .then(() => {
                this.refresh();
            });
    }

    reset() {
        fetch(API_URL + "/reset", {
            method: "PUT",
            body: JSON.stringify({
                password: entered_raw_password,
                user_id: this.__user_id,
                number: this.__number,
                diff: 0,
            }),
            headers: {
                "Content-type": "application/json; charset=UTF-8",
            },
        })
            .then((response) => response.json())
            .then((json) => console.log(json));
    }
}

// Global variable - UserData instance
let global_user = null;

// init user's data with QR-code
const initUser = (userId) => {
    global_user = new UserData(userId);
};

// Init rise & fall input value to 0
window.onload = () => {
    id_get("risefall-input").value = "0";
};

// --------------------- Scan & Control Mode Switch ---------------------
const clojure_mode_switch = () => {
    let is_scan_mode = true;

    return () => {
        if (is_scan_mode) {
            // Switch into Control panel
            document.getElementById("qr-wrapper").style.display = "none";
            document.getElementById("control-wrapper").style.display = "block";
            document.getElementById("menu-cancel").style.display = "none";
            document.getElementById("menu-scan").style.display = "inline";
            if (global_user == null) {
                id_get("user-id").innerHTML = "#####";
                id_get("balance").innerHTML = "#####";
            }
        } else {
            // Switch to QR-code Scanning mode
            document.getElementById("qr-wrapper").style.display = "block";
            document.getElementById("control-wrapper").style.display = "none";
            document.getElementById("menu-cancel").style.display = "inline";
            document.getElementById("menu-scan").style.display = "none";
            startTick();
        }
        is_scan_mode = !is_scan_mode;
        return is_scan_mode;
    };
};
const mode_switch = clojure_mode_switch();

// --------------------- QR Code Scanning ---------------------------
const video = document.createElement("video");
const canvas = document.getElementById("qr-canvas");
const ctx = canvas.getContext("2d");
const msg = document.getElementById("qr-msg");

// Camera preparation
const userMedia = {
    audio: false,
    video: {
        facingMode: "environment",
        width: 640,
        height: 480,
    },
};
navigator.mediaDevices.getUserMedia(userMedia).then((stream) => {
    video.srcObject = stream;
    video.setAttribute("playsinline", true);
    video.play();
    startTick();
});

const startTick = () => {
    msg.innerText = "Loading video...";
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(img.data, img.width, img.height, {
            inversionAttempts: "dontInvert",
        });
        if (code) {
            drawRect(code.location);
            console.log(code.data);

            const user_id = code.data.split("=").shift();
            initUser(Number(user_id));
            mode_switch();

            return;
        } else {
            msg.innerText = "QRコードを検出しています...";
        }
    }
    setTimeout(startTick, 250);
};

const drawRect = (location) => {
    drawLine(location.topLeftCorner, location.topRightCorner);
    drawLine(location.topRightCorner, location.bottomRightCorner);
    drawLine(location.bottomRightCorner, location.bottomLeftCorner);
    drawLine(location.bottomLeftCorner, location.topLeftCorner);
};

const drawLine = (begin, end) => {
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#00ff59";
    ctx.beginPath();
    ctx.moveTo(begin.x, begin.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
};

// Event Listeners

id_get("menu-cancel").addEventListener("click", mode_switch);
id_get("menu-scan").addEventListener("click", mode_switch);

// Reject Non-integer input
id_get("risefall-input").addEventListener("input", (input) => {
    input.target.value = input.target.value.replace(/[^0-9]/g, "");
});

// Increase Input Value
id_get("risefall-inc").addEventListener("click", () => {
    let value = Number(id_get("risefall-input").value);
    value += RISEFALL_STEP;
    id_get("risefall-input").value = String(value);
});

// Decrease Input Value
id_get("risefall-dec").addEventListener("click", () => {
    let value = Number(id_get("risefall-input").value);
    value -= RISEFALL_STEP;
    id_get("risefall-input").value = String(value);
});

id_get("risefall-button").addEventListener("click", () => {
    id_get("risefall-popup").style.display = "block";
});

// ----- submit rise & fall request -----
//
id_get("risefall-ok").addEventListener("click", () => {
    // get input value
    diff = id_get("risefall-input").value;
    diff = diff.replace("/[^1-9]/g", "");
    diff = Number(diff);

    // check input value
    const balance = global_user.balance() + diff;
    if (MIN_BALANCE <= balance && balance <= MAX_BALANCE) {
        global_user.inc(diff);

        id_get("risefall-popup").style.display = "none";

        setTimeout(() => {
            global_user.refresh();
        }, 100);

        id_get("risefall-input").value = "0";
    } else {
        window.alert("【不正な値】上限・下限を超えています");
        id_get("risefall-input").value = "0";
    }
});

id_get("reset-button").addEventListener("click", () => {
    let yes = window.confirm("本当にリセットしますか？");
    if (yes) {
        global_user.reset();
        global_user.refresh();
        setTimeout(() => {
            global_user.reset();
            global_user.refresh();
        }, 100);
    }
});
