"use strict";

import axios from "axios";
import QRCode from "qrcode";
import { API_URL, POLLING_INTERVAL } from "./common.js";

/**
 * @returns {Number | null}
 */
function get_user_id() {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const user_id = params.get("user_id");

    if (user_id === null) {
        console.error('URL parameter "user_id" is missing');
        return null;
    } else {
        return user_id;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const user = new User();
});

class User {
    constructor() {
        // set user id
        self.__user_id = get_user_id();
        if (self.__user_id === null) {
            console.error("User ID is not set");
            return;
        }
        document.getElementById("user-id").innerText = self.__user_id;
        console.log(self.__user_id);

        // create qr code
        QRCode.toCanvas(
            document.getElementById("qrcode"),
            self.__user_id,
            function (error) {
                if (error) console.error(error);
            }
        );

        // set balance
        this.sync(true);

        // set event listener
        document
            .getElementById("menu-refresh")
            .addEventListener("click", () => {
                this.sync();
            });

        // polling
        const sync_interval = setInterval(() => {
            if (!this.sync()) clearInterval(sync_interval);
        }, POLLING_INTERVAL);
    }

    sync(login = false) {
        if (login) {
            axios
                .get(`${API_URL}/api/user/login/${self.__user_id}`)
                .then((response) => {
                    if (response.data) console.log("logged in");
                })
                .catch((error) => {
                    console.error(error.response.data.detail);
                    const error_message = error.response.data.detail.message;
                    const error_code = error.response.data.detail.error_code;

                    // IDが使用中の場合はリロードしたのかもしれないので、確認
                    if (error.response.data.detail.error_code === 5) {
                        const login_skip = sessionStorage.getItem("login_skip");
                        if (login_skip == "true") {
                            console.error("login skip");
                            sessionStorage.clear();
                        } else {
                            window.location.href = `./error.html?detail=${error_message}&error_code=${error_code}`;
                        }
                    } else {
                        window.location.href = `./error.html?detail=${error_message}&error_code=${error_code}`;
                    }
                });
        }
        axios
            .get(`${API_URL}/api/user/sync/${self.__user_id}`)
            .then((response) => {
                self.__balance = response.data.balance;
                console.log("synced");
                document.getElementById("balance").innerText = self.__balance;
                return true;
            })
            .catch((error) => {
                console.error(error.response.data.detail);
                window.location.href = `./error.html?detail=${error.response.data.detail.message + " @sync(login=false)"}&error_code=${error.response.detail.error_code}`;
                return false;
            });
    }
}
