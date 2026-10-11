import MotionProvider from "@/components/landing/MotionProvider";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }) {
  return (
    <div>
      <Navbar />
      <Toaster/>
      <MotionProvider>{children}</MotionProvider>
      <Footer />
    </div>
  );
}
