import React from "react";
import { motion } from "motion/react";
import { GraduationCap, Zap, Trophy, BookOpen, ArrowRight, CheckCircle2, FileUp, Github, Twitter, Linkedin } from "lucide-react";
import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import "./Home.css";

export function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="home-container">
      {/* Dynamic Background */}
      <div className="bg-glow-1" />
      <div className="bg-glow-2" />

      {/* Hero Section */}
      <header>
        <nav className="home-nav">
          <div className="nav-brand">
            <div className="nav-logo-box">
              <GraduationCap size={28} />
            </div>
            <span className="nav-title">StudyBuddy</span>
          </div>
          <Button className="nav-btn" onClick={() => navigate('/login')}>Sign In</Button>
        </nav>

        <div className="hero-section">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="hero-pill">
              <Zap size={18} />
              <span>AI-Powered Learning Experience</span>
            </div>
            <h1 className="hero-title">
              Master any subject with <span className="text-gradient">gamified magic.</span>
            </h1>
            <p className="hero-desc">
              Upload your dull notes and instantly generate gamified learning materials. Experience AI-generated quizzes, dynamic flashcards, and see your progress skyrocket in minutes.
            </p>
            <div className="hero-actions">
              <Button className="primary-btn" onClick={() => navigate('/signup')}>
                Start Exploring Free
                <ArrowRight size={20} className="ml-2" />
              </Button>
              <Button className="secondary-btn" onClick={() => navigate('/login')}>
                See How It Works
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.85, rotateY: -15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="glass-card-container"
          >
            <div className="glass-card">
              <div className="card-header">
                <div className="streak-info">
                  <div className="icon-box-emerald">
                    <Trophy size={28} />
                  </div>
                  <div>
                    <h3 className="streak-title">Active Streak</h3>
                    <p className="streak-value">12 Days 🔥</p>
                  </div>
                </div>
                <div className="points-info">
                  <h3 className="points-title">Total XP</h3>
                  <p className="points-value">2,450</p>
                </div>
              </div>

              <div className="quiz-list">
                {[
                  "Explain the architecture of Transformers.",
                  "What triggers state updates in React?",
                  "Define the Heisenberg Uncertainty Principle.",
                ].map((q, i) => (
                  <motion.div 
                    key={i} 
                    className="quiz-item"
                    whileHover={{ scale: 1.02 }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + (i * 0.1) }}
                  >
                    <span className="quiz-text">{q}</span>
                    <CheckCircle2 size={24} className="quiz-check" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Features Section */}
      <section className="features-section">
        <motion.div 
          className="features-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="features-title">Unleash Your Brain's Potential</h2>
          <p className="features-desc">StudyBuddy eliminates rote memorization by transforming standard reading into interactive, retention-optimized challenges.</p>
        </motion.div>

        <div className="features-grid">
          {[
            { title: "Smart Generation", desc: "Upload PDFs, DOCX, or direct text and our AI engine synthesizes deep, comprehensive quizzes in seconds.", icon: FileUp, colorClass: "icon-indigo" },
            { title: "Gamified Progression", desc: "Earn experience points, push limits to level up, and maintain daily learning streaks for ultimate motivation.", icon: Trophy, colorClass: "icon-emerald" },
            { title: "Instant Flashcards", desc: "Automatically extract key pivotal concepts from any document and turn them into digital flip-cards.", icon: BookOpen, colorClass: "icon-amber" },
          ].map((feature, i) => (
            <motion.div 
              key={i} 
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
            >
              <div className={`feature-icon-box ${feature.colorClass}`}>
                <feature.icon size={32} />
              </div>
              <h3 className="feature-card-title">{feature.title}</h3>
              <p className="feature-card-desc">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="nav-brand">
              <div className="nav-logo-box">
                <GraduationCap size={24} />
              </div>
              <span className="nav-title">StudyBuddy</span>
            </div>
            <p className="footer-tagline">Empowering students with AI-driven gamified learning. Transform your notes into interactive challenges.</p>
            <div className="social-links">
              <a href="#" className="social-icon"><Github size={20} /></a>
              <a href="#" className="social-icon"><Twitter size={20} /></a>
              <a href="#" className="social-icon"><Linkedin size={20} /></a>
            </div>
          </div>
          
          <div className="footer-grid">
            <div className="footer-column">
              <h4 className="footer-heading">Product</h4>
              <a href="#" className="footer-link">Features</a>
              <a href="#" className="footer-link">AI Quizzes</a>
              <a href="#" className="footer-link">Flashcards</a>
            </div>
            <div className="footer-column">
              <h4 className="footer-heading">Resources</h4>
              <a href="#" className="footer-link">Guide</a>
              <a href="#" className="footer-link">Community</a>
              <a href="#" className="footer-link">FAQ</a>
            </div>
            <div className="footer-column">
              <h4 className="footer-heading">Legal</h4>
              <a href="#" className="footer-link">Privacy</a>
              <a href="#" className="footer-link">Terms</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">&copy; {new Date().getFullYear()} StudyBuddy AI. All rights reserved.</p>
            <p className="made-with">Made with ✨ for lifelong learners.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
