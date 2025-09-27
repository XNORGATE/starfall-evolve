import StarfallHeader from "@/components/StarfallHeader";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import DashboardPreview from "@/components/DashboardPreview";
import StarfallFooter from "@/components/StarfallFooter";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <StarfallHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <DashboardPreview />
      </main>
      <StarfallFooter />
    </div>
  );
};

export default Index;
