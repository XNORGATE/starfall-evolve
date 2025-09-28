import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import DeploymentManager from "./DeploymentManager";

const Index = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/deploy" element={<DeploymentManager />} />
      </Routes>
    </Router>
  );
};

export default Index;
