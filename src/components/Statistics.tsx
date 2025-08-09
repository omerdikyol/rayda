import { useEffect, useState, useRef } from 'react';
import { TrendingUp, Users, Clock, Activity } from 'lucide-react';

interface CounterProps {
  end: number;
  duration: number;
  suffix?: string;
  prefix?: string;
  isVisible: boolean;
}

const AnimatedCounter = ({ end, duration, suffix = '', prefix = '', isVisible }: CounterProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(startValue + (end - startValue) * easeOutQuart);
      
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, isVisible]);

  return (
    <span>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

const Statistics = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const stats = [
    {
      icon: TrendingUp,
      value: 700000,
      suffix: '+',
      label: 'Daily Passengers',
      description: 'People use Marmaray every day',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Users,
      value: 255,
      suffix: 'M',
      label: 'Annual Riders',
      description: 'Total passengers per year',
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      icon: Clock,
      value: 99.7,
      suffix: '%',
      label: 'On-Time Performance',
      description: 'Trains arriving within 3 minutes',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Activity,
      value: 4,
      suffix: ' min',
      label: 'Peak Frequency',
      description: 'During rush hours',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <span className="inline-block px-4 py-2 mb-4 text-sm font-semibold text-emerald-600 bg-emerald-100 rounded-full">
            IMPACT
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Connecting Millions
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
              Across Two Continents
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-xl text-gray-600">
            The Marmaray railway system is the backbone of Istanbul's public transportation
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`relative group transition-all duration-700 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {/* Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>

                {/* Counter */}
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  <AnimatedCounter
                    end={stat.value}
                    duration={2000}
                    suffix={stat.suffix}
                    isVisible={isVisible}
                  />
                </div>

                {/* Label */}
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {stat.label}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600">
                  {stat.description}
                </p>

                {/* Decorative Element */}
                <div className="absolute top-6 right-6 w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-500"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className={`mt-16 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-3xl p-8 transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`} style={{ transitionDelay: '800ms' }}>
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Did You Know?
            </h3>
            <p className="text-lg text-gray-700 mb-6">
              The Marmaray tunnel is the world's deepest immersed tube tunnel at 60.46 meters below sea level. 
              It connects Europe and Asia in just 4 minutes, making it one of the most significant 
              engineering achievements of the 21st century.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="px-6 py-3 bg-white rounded-full shadow-md">
                <span className="text-sm font-semibold text-gray-700">13.6 km underwater tunnel</span>
              </div>
              <div className="px-6 py-3 bg-white rounded-full shadow-md">
                <span className="text-sm font-semibold text-gray-700">150 years in planning</span>
              </div>
              <div className="px-6 py-3 bg-white rounded-full shadow-md">
                <span className="text-sm font-semibold text-gray-700">Earthquake resistant design</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Statistics;