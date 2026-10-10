import Hero from "@/components/landing/Hero";
import { FinalCta, GapPreview, HowItWorks, Questions, Roles } from "@/components/landing/Sections";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Questions />
        <GapPreview />
        <HowItWorks />
        <Roles />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}