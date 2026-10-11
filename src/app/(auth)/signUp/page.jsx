import SignUpForm from "@/components/auth/SignUpForm";

export const metadata = {
  title: "Create account | SkillGraph",
  description: "Create a free SkillGraph account and get your first skill gap analysis.",
};

export default function RegisterPage() {
  return <SignUpForm />;
}