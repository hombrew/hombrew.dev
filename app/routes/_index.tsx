import type { MetaFunction, LinksFunction } from "@remix-run/node";
import xtermStyles from "xterm/css/xterm.css?url";
import { Console } from "~/components";
import styles from "~/styles/index.css?url";

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: xtermStyles },
    { rel: "stylesheet", href: styles },
  ];
};

export const meta: MetaFunction = () => {
  return [
    {
      title: "Manuel Maldonado",
      description: "The Matrix",
    },
  ];
};

export default function Index() {
  return <Console />;
}
