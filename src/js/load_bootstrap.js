import "bootstrap";
import * as css from "bootstrap/dist/css/bootstrap.min.css";

const bootstrap_style = document.createElement("style");
bootstrap_style.textContent = css.default;
document.head.appendChild(bootstrap_style);
