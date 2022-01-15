import type { MetaFunction, LinksFunction } from "remix";
import xtermStyles from "xterm/css/xterm.css";
import { Console } from "~/components";
import styles from "~/styles/index.css";

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: xtermStyles },
    { rel: "stylesheet", href: styles },
  ];
};

export const meta: MetaFunction = () => {
  return {
    title: "Manuel Maldonado",
    description: "The Matrix",
  };
};

export default function Index() {
  return <Console />;
}
