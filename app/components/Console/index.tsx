import * as React from "react";
import { Terminal } from "./common.client";

export function Console() {
  React.useEffect(() => {
    if (Terminal) {
      const terminal = new Terminal({ cursorBlink: true });
      terminal.open(document.getElementById("terminal")!);
      terminal.runTerminal();

      const listener = terminal.resizeListener.bind(terminal);
      window.addEventListener("resize", listener);

      return () => {
        window.removeEventListener("resize", listener);
      };
    }
  });

  return <div id="terminal" />;
}
