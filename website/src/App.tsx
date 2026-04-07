import { motion } from 'motion/react';
import { Download, Sprout, Target, ChevronRight, Trees, Leaf, LineChart, Mail } from 'lucide-react';
import Scene from './Scene';

function App() {
  return (
    <>
      <Scene />
      
      <div className="ui-layer">
        
        {/* Navigation */}
        <nav className="glass-nav">
          <div className="container flex justify-between align-center" style={{ height: '80px' }}>
            <a href="#" className="nav-logo">
              <Sprout color="#22c55e" size={32} />
              <span>Biome</span>
            </a>
            <ul className="nav-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#download">Download</a></li>
              <li><a href="https://github.com/devantaris/Biome" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>GitHub</a></li>
            </ul>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="section container">
          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(34, 197, 94, 0.1)', padding: '0.4rem 1rem', borderRadius: '20px', border: '1px solid rgba(34, 197, 94, 0.2)', marginBottom: '1.5rem', color: '#86efac', fontSize: '0.9rem', fontWeight: 600 }}
            >
              <Leaf size={16} /> Welcome to Focus Forest Pro
            </motion.div>
            
            <h1 className="hero-title">
              Focus is a <span className="text-gradient">world</span> you build.
            </h1>
            <p className="hero-subtitle">
              Immerse yourself in deep work. Biome transforms your productivity into a living, breathing ecosystem on your desktop.
            </p>
            <div className="flex gap-4">
              <a href="https://github.com/devantaris/Biome/releases" target="_blank" rel="noreferrer" className="btn btn-primary">
                <Download size={20} />
                Get Biome
              </a>
              <a href="#features" className="btn btn-glass">
                Explore features
                <ChevronRight size={20} />
              </a>
            </div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              style={{ marginTop: '3rem', fontSize: '0.85rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Target size={16} /> Try grabbing and dragging the island!
            </motion.p>
          </motion.div>
        </section>

        {/* Cinematic Media Section */}
        <section id="features" className="container" style={{ paddingTop: '5rem', paddingBottom: '4rem' }}>
          
          <div className="text-center" style={{ maxWidth: '800px', margin: '0 auto 2rem auto', pointerEvents: 'none' }}>
            <h2 style={{ fontSize: '3.5rem', marginBottom: '1rem', letterSpacing: '-0.02em' }} className="text-gradient">
              Experience Focus.
            </h2>
          </div>

          <div className="sticky-wrapper">
            
            {/* The Sticky Video Player */}
            <div className="sticky-container">
              <video 
                src="/biome-demo.mp4" 
                className="video-player"
                autoPlay 
                muted 
                loop 
                playsInline
              />
              
              {/* CSS Replica of the System Tray floating over the video */}
              <div className="tray-widget">
                 <div className="tray-header">
                    <span className="tray-title">FOCUSING</span>
                    <span style={{ fontSize: '1.2rem' }}>🌹</span>
                 </div>
                 <div className="tray-time">07:53</div>
                 <div className="tray-progress-bg">
                    <div className="tray-progress-fill"></div>
                 </div>
                 <div className="tray-buttons">
                    <button className="tray-btn primary">OPEN APP</button>
                    <button className="tray-btn">HIDE</button>
                 </div>
              </div>
            </div>

            {/* Scrollable Text Blocks overlaying the video */}
            <div className="scroll-text-container">
              
              <div className="scroll-block">
                <motion.div className="scroll-card" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ margin: "-200px" }} transition={{ duration: 0.6 }}>
                  <div className="feature-icon-wrapper"><Trees size={26} /></div>
                  <h3 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Your World. Alive.</h3>
                  <p style={{ color: '#bbf7d0', fontSize: '1.1rem', lineHeight: 1.6 }}>
                    Every minute of deep focus is translated into physical growth. Watch your desktop terrarium expand with lush trees and dynamic environments based entirely on your productivity.
                  </p>
                </motion.div>
              </div>

              <div className="scroll-block" style={{ justifyContent: 'flex-end' }}>
                <motion.div className="scroll-card" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ margin: "-200px" }} transition={{ duration: 0.6 }}>
                  <div className="feature-icon-wrapper"><Target size={26} /></div>
                  <h3 style={{ fontSize: '2rem', marginBottom: '1rem' }}>No Distractions.</h3>
                  <p style={{ color: '#bbf7d0', fontSize: '1.1rem', lineHeight: 1.6 }}>
                    With a gorgeous, unintrusive system tray presence and full-screen blocking capabilities, Biome gets out of your way and forces you to do the work.
                  </p>
                </motion.div>
              </div>

              <div className="scroll-block">
                <motion.div className="scroll-card" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ margin: "-200px" }} transition={{ duration: 0.6 }}>
                  <div className="feature-icon-wrapper"><LineChart size={26} /></div>
                  <h3 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Unprecedented Insights.</h3>
                  <p style={{ color: '#bbf7d0', fontSize: '1.1rem', lineHeight: 1.6 }}>
                    From granular timeline heatmaps to unlockable ancient achievements natively synced via the cloud. Biome is the only focus engine you will ever need.
                  </p>
                </motion.div>
              </div>

            </div>
          </div>
        </section>

        {/* Creator Identity Section */}
        <section className="creator-section border-t border-glass-border">
           <div className="creator-card">
              <div className="creator-avatar">DK</div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Devansh Kumar</h2>
              <p style={{ color: '#4ade80', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.9rem', marginBottom: '1rem' }}>Creator & Lead Developer</p>
              <p style={{ color: '#bbf7d0', fontSize: '1.1rem', lineHeight: 1.6, maxWidth: '400px' }}>
                I built Biome because standard productivity tools felt lifeless. I wanted a tool that rewarded focus with immersive visual progression.
              </p>
              <div className="creator-links">
                 <a href="https://www.linkedin.com/in/devansh-kumar-3b3701217/" target="_blank" rel="noreferrer" className="creator-link" title="LinkedIn">
                    in
                 </a>
                 <a href="https://github.com/devantaris" target="_blank" rel="noreferrer" className="creator-link" title="GitHub">
                    &lt;/&gt;
                 </a>
                 <a href="mailto:work.devanshkumar@gmail.com" className="creator-link" title="Email Me">
                    <Mail size={22} />
                 </a>
              </div>
           </div>
        </section>

        {/* Download Section */}
        <section id="download" className="download-cta-section container">
          <motion.div 
            className="download-card glass-panel"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
          >
            <div className="download-icon">
              <Download size={42} />
            </div>
            <h2 style={{ fontSize: '3.5rem', marginBottom: '1rem' }} className="text-gradient">Ready to plant your seed?</h2>
            <p style={{ color: '#bbf7d0', fontSize: '1.2rem', marginBottom: '3rem', maxWidth: '450px' }}>
              Download the Windows setup and start building your focus ecosystem today.
            </p>
            
            <a href="https://github.com/devantaris/Biome/releases" target="_blank" rel="noreferrer" className="btn btn-primary" style={{ padding: '1.2rem 3rem', fontSize: '1.25rem', width: '100%', maxWidth: '380px', borderRadius: '16px' }}>
              Download for Windows
            </a>
            <p style={{ fontSize: '0.85rem', color: '#16a34a', marginTop: '2rem', fontWeight: 500 }}>
              Version 3.0.0 • Requires Windows 10+
            </p>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="footer" style={{ pointerEvents: 'auto' }}>
          <div className="container">
            <div className="footer-grid">
              <div className="footer-brand">
                <a href="#" className="nav-logo" style={{ marginBottom: '1rem' }}>
                  <Sprout color="#22c55e" size={32} />
                  <span>Biome</span>
                </a>
                <p>
                  A premium focus app that rewards your deep work by building beautiful dynamic worlds on your desktop. 
                </p>
              </div>
              
              <div>
                <h4>Explore</h4>
                <ul className="footer-links">
                  <li><a href="#features">Ecosystem Features</a></li>
                  <li><a href="#download">Download App</a></li>
                  <li><a href="#">Patch Notes</a></li>
                  <li><a href="https://github.com/devantaris/Biome" target="_blank" rel="noreferrer">Open Source GitHub</a></li>
                </ul>
              </div>

              <div>
                <h4>Legal & Support</h4>
                <ul className="footer-links">
                  <li><a href="#">Privacy Policy</a></li>
                  <li><a href="#">Terms of Service</a></li>
                  <li><a href="#">Contact Us</a></li>
                </ul>
              </div>
            </div>
            
            <div className="footer-bottom">
              <p>© {new Date().getFullYear()} Biome Focus Forest Pro. Cultivated with intent. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default App;
