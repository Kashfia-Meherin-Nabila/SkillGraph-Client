import MotionProvider from "@/components/landing/MotionProvider";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";

export default function RootLayout({ children }) {
  return (
    <div>
      <Navbar />
      <MotionProvider>{children}</MotionProvider>
      <Footer />
    </div>
  );
}
