import { createPortal } from "react-dom";

const PrintSheet = ({ children }) => {
  const root = typeof document !== "undefined" ? document.getElementById("root") : null;
  return root ? createPortal(<div className="print-sheet">{children}</div>, root) : null;
};

export default PrintSheet;
