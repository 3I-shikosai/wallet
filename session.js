class User {
    constructor(user_id) {
        this.__user_id = user_id;

        fetch(API_URL + `/user/login/${user_id}`)
            .then((response) => {
                if (!response.ok) {
                    console.error("Login failed");
                    window.alert("ログインに失敗しました\nIDが使用中でないことを確認して再度読み込んでください");
                }
                return response.json();
            })
            .then((json) => {
                this.__session_id = json.session_id;
                this.__balance = json.balance;
                this.__status = json.status;
            })
            .then(() => {
                new QRCode(id_get("qrcode"), {
                    text:
                        String(this.__user_id) +
                        "=" +
                        String(this.__session_id),
                    width: 1024,
                    height: 1024,
                    correctLevel: QRCode.CorrectLevel.H,
                });

                id_get("user-id").innerHTML = String(this.__user_id).padStart(
                    3,
                    "0"
                );

                id_get("balance").innerHTML = this.__balance.toLocaleString();

                setInterval(this.sync_data(), 2000);

                id_get("menu-refresh").addEventListener("click", () =>
                    this.sync_data()
                );
            });
    }

    // TEST
    // ------------------------------------
    print() {
        console.log(this);
    }

    sync_data() {
        /*
         * APIサーバーにユーザーデータを送信
         * SessionIDがサーバー側と違ったらエラーを受け取る
         * balanceを受け取った値で更新
         */
        console.log("Called sync_data()");

        fetch(API_URL + "/user/sync", {
            method: "POST",
            body: JSON.stringify({
                user_id: this.__user_id,
                session_id: this.__session_id,
                balance: this.__balance,
                status: this.__status,
            }),
            headers: {
                "Content-type": "application/json; charset=UTF-8",
            },
        })
            .then((response) => {
                if (!response.ok) {
                    console.error("sync_data error");
                }
                return response.json();
            })
            .then((json) => {
                this.__balance = json.balance;
            })
            .then(() => {
                id_get("balance").innerHTML = this.__balance.toLocaleString();
            });
    }
}

global_user = null;

window.onload = () => {
    const params = new URLSearchParams(document.location.search);

    global_user = new User(Number(params.get("id")));

    console.log("Inited global_user", global_user);
};
