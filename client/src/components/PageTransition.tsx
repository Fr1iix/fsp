import React, { useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import type { Engine } from 'tsparticles-engine';

const PageTransition: React.FC = () => {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          particles: {
            number: {
              value: 150,
              density: {
                enable: true,
                value_area: 800
              }
            },
            color: {
              value: '#3b82f6'
            },
            shape: {
              type: 'circle'
            },
            opacity: {
              value: 0.5,
              random: true,
              animation: {
                enable: true,
                speed: 1,
                opacity_min: 0.1,
                sync: false
              }
            },
            size: {
              value: 2.5,
              random: true
            },
            move: {
              enable: true,
              speed: 1,
              direction: 'none',
              random: true,
              straight: false,
              outModes: {
                default: 'out'
              }
            }
          },
          interactivity: {
            events: {
              onHover: {
                enable: true,
                mode: 'repulse'
              }
            },
            modes: {
              repulse: {
                distance: 100,
                duration: 0.4
              }
            }
          },
          background: {
            color: {
              value: 'transparent'
            }
          }
        }}
      />
    </div>
  );
};

export default PageTransition;

