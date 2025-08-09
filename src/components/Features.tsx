import { useEffect, useState, useRef } from 'react';
import { 
  Zap, Shield, Globe, Smartphone, BarChart3, Users, 
  Clock, MapPin, Wifi, Bell, Calendar, Layers 
} from 'lucide-react';

const Features = () => {
  const [isVisible, setIsVisible] = useState(false);
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

  const mainFeatures = [
    {
      icon: Zap,
      title: 'Real-time Tracking',
      description: 'Live train positions updated every second with precise location data',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      icon: Globe,
      title: 'Full Network Coverage',
      description: 'Complete Marmaray line from Halkalı to Gebze with all 43 stations',
      color: 'from-blue-400 to-cyan-500'
    },
    {
      icon: Shield,
      title: 'Accurate Predictions',
      description: 'AI-powered arrival time predictions based on real schedule data',
      color: 'from-green-400 to-emerald-500'
    },
    {
      icon: Smartphone,
      title: 'Mobile Optimized',
      description: 'Responsive design that works perfectly on all device sizes',
      color: 'from-purple-400 to-pink-500'
    }
  ];

  const additionalFeatures = [
    { icon: BarChart3, label: 'Live Statistics' },
    { icon: Users, label: 'Crowd Predictions' },
    { icon: Clock, label: 'Schedule Integration' },
    { icon: MapPin, label: 'Station Finder' },
    { icon: Wifi, label: 'Offline Support' },
    { icon: Bell, label: 'Delay Alerts' },
    { icon: Calendar, label: 'Trip Planning' },
    { icon: Layers, label: 'Multi-route View' }
  ];

  return (
    <section id="features" ref={sectionRef} className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <span className="inline-block px-4 py-2 mb-4 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full">
            FEATURES
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
              Navigate Istanbul's Rails
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-xl text-gray-600">
            Advanced features designed to make your commute smarter and more predictable
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {mainFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className={`group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}></div>
              
              {/* Icon */}
              <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>

              {/* Hover Indicator */}
              <div className="absolute bottom-4 right-4 w-2 h-2 bg-gray-300 rounded-full group-hover:bg-blue-600 transition-colors duration-300"></div>
            </div>
          ))}
        </div>

        {/* Additional Features */}
        <div className={`bg-gradient-to-r from-blue-600 to-emerald-600 rounded-3xl p-8 shadow-xl transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`} style={{ transitionDelay: '400ms' }}>
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            Plus Many More Features
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {additionalFeatures.map((feature, index) => (
              <div
                key={feature.label}
                className="flex flex-col items-center p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors duration-300 group"
              >
                <feature.icon className="w-8 h-8 text-white mb-2 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-sm font-medium text-white/90">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className={`text-center mt-12 transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`} style={{ transitionDelay: '600ms' }}>
          <button className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 border border-gray-200">
            Explore All Features →
          </button>
        </div>
      </div>
    </section>
  );
};

export default Features;