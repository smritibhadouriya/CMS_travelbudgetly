import "./globals.css";
import Toaster from "@/components/Toaster";

export const metadata = {
  title: "TravelBudgetly CMS",
  description: "TravelBudgetly admin / content management system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
