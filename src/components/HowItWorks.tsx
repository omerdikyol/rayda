import { useEffect, useState, useRef } from 'react';
import { Search, MapPin, Navigation, Clock, CheckCircle } from 'lucide-react';

const HowItWorks = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 5);
    }, 3000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const steps = [
    {
      icon: Search,
      title: 'Open the App',
      description: 'Access Rayda from any device with an internet connection',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: MapPin,
      title: 'View Live Map',
      description: 'See real-time positions of all Marmaray trains on the interactive map',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Navigation,
      title: 'Select Your Station',
      description: 'Click on any station or use the search to find your destination',
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      icon: Clock,
      title: 'Check Arrival Times',
      description: 'View accurate predictions for upcoming trains at your selected station',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: CheckCircle,
      title: 'Plan Your Journey',
      description: 'Make informed decisions about your commute with real-time data',
      color: 'from-green-500 to-green-600'
    }
  ];

  return (
    <section id="how-it-works" ref={sectionRef} className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <span className="inline-block px-4 py-2 mb-4 text-sm font-semibold text-purple-600 bg-purple-100 rounded-full">
            HOW IT WORKS
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Get Started in
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              {' '}5 Simple Steps
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-xl text-gray-600">
            Track trains and plan your journey with ease
          </p>
        </div>

        {/* Steps Container */}
        <div className="relative">
          {/* Progress Line */}
          <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gray-200">
            <div 
              className="absolute top-0 left-0 w-full bg-gradient-to-b from-purple-600 to-pink-600 transition-all duration-1000"
              style={{ height: `${(activeStep + 1) * 20}%` }}
            ></div>
          </div>

          {/* Steps */}
          <div className="space-y-12 relative">
            {steps.map((step, index) => {
              const isActive = index === activeStep;
              const isPassed = index < activeStep;
              const isLeft = index % 2 === 0;

              return (
                <div
                  key={step.title}
                  className={`flex items-center gap-8 transition-all duration-700 ${
                    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                  } ${isLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  {/* Content Card */}
                  <div className={`flex-1 ${isLeft ? 'lg:text-right' : 'lg:text-left'}`}>
                    <div className={`inline-block p-6 bg-white rounded-2xl shadow-lg ${
                      isActive ? 'shadow-2xl scale-105' : ''
                    } transition-all duration-500`}>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-gray-600">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Icon Circle */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isActive 
                        ? `bg-gradient-to-br ${step.color} shadow-xl scale-110`
                        : isPassed
                        ? 'bg-green-500 shadow-lg'
                        : 'bg-gray-200'
                    }`}>
                      <step.icon className={`w-10 h-10 ${
                        isActive || isPassed ? 'text-white' : 'text-gray-500'
                      }`} />
                    </div>
                    
                    {/* Step Number */}
                    <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isActive
                        ? 'bg-purple-600 text-white'
                        : isPassed
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Pulse Animation for Active Step */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-full animate-ping bg-purple-400 opacity-30"></div>
                    )}
                  </div>

                  {/* Empty Space for Layout */}
                  <div className="flex-1 hidden lg:block"></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className={`text-center mt-16 transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`} style={{ transitionDelay: '1000ms' }}>
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => {
                const mapSection = document.getElementById('map-section');
                mapSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              Try It Now
            </button>
            <button className="px-8 py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transform hover:-translate-y-1 transition-all duration-200">
              Watch Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;