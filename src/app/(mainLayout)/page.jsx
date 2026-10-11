import Hero from "@/components/landing/Hero";
import {
  FinalCta,
  GapPreview,
  HowItWorks,
  Questions,
  Roles,
} from "@/components/landing/Sections";

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <Questions />
        <GapPreview />
        <HowItWorks />
        <Roles />
        <FinalCta />
      </main>
    </>
  );
}
