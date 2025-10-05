import Toastify from "toastify-js";
import "toastify-js/src/toastify.css"

export const showToast = ({toastMessage, toastType}: {
   toastMessage: string;
   toastType?: "success" | "error" | "warning" | "info";
}) => {
   let backgroundColor;

   switch (toastType) {
      case "success":
         backgroundColor = "#a3cfbb";
         break;
      case "error":
         backgroundColor = "#f8d7da";
         break;
      case "warning":
         backgroundColor = "#fff3cd";
         break;
      case "info":
      default:
         backgroundColor = "#cff4fc";
         break;
   }

   Toastify({
      text: toastMessage,
      duration: 3000,
      gravity: "top", // 'top' or 'bottom'
      position: "center", // 'left', 'center', or 'right'
      stopOnFocus: true,
      // close: true,
      style: {
         background: backgroundColor,
         borderRadius: "8px",
         fontWeight: "500",
         color: "#111",
         minWidth: '350px',
      },
   }).showToast();
};