import React from 'react';
import RequestForm from './RequestForm';
import { useIsMobile, useIsTablet } from '../hooks/useMediaQuery';

const Home: React.FC = () => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-16">
            {/* Hero Content */}
            <div className="lg:w-1/2 text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight mb-4 sm:mb-6">
                Request files from{' '}
                <span className="text-primary-600 relative">
                  anyone
                  <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary-200" viewBox="0 0 100 12" preserveAspectRatio="none">
                    <path d="M0,8 Q50,0 100,8" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                </span>{' '}
                with ease
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-700 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Stop chasing files through email chains. Create a secure link and get what you need—no logins, no hassle.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <a 
                  href="#create-request" 
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-primary-600 text-white font-semibold rounded-xl shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all duration-300 text-center text-base sm:text-lg focus:outline-none focus:ring-4 focus:ring-primary-200"
                >
                  Create Request
                </a>
                <a 
                  href="#how-it-works" 
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-primary-600 font-semibold rounded-xl shadow-md hover:shadow-lg border-2 border-primary-100 hover:border-primary-200 transition-all duration-300 text-center text-base sm:text-lg focus:outline-none focus:ring-4 focus:ring-primary-200"
                >
                  Learn More
                </a>
              </div>
            </div>
            
            {/* Hero Image */}
            <div className="lg:w-1/2 mt-8 lg:mt-0 w-full max-w-lg lg:max-w-none">
              <div className="relative">
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-500">
                  <img
                    src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                    alt="File sharing illustration"
                    className="w-full h-auto aspect-[4/3] object-cover"
                    loading="lazy"
                  />
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-primary-200 rounded-full opacity-60"></div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-blue-200 rounded-full opacity-40"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-12 sm:py-16 lg:py-20 bg-gray-50 px-4 sm:px-6">
        <div className="container mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              How It Works
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Three simple steps to streamline your file collection process
            </p>
          </div>
          
          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {[
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ),
                bgColor: "bg-blue-100",
                iconColor: "text-blue-600",
                title: "1. Create Request",
                description: "Fill out a simple form with your email, a description of what files you need, and an optional deadline."
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                ),
                bgColor: "bg-green-100",
                iconColor: "text-green-600",
                title: "2. Share Link",
                description: "Share the generated link with your client via email, message, or any way you prefer."
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                ),
                bgColor: "bg-purple-100",
                iconColor: "text-purple-600",
                title: "3. Receive Files",
                description: "Get notified when files are uploaded. Download immediately or access them anytime."
              }
            ].map((step, index) => (
              <div key={index} className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 group">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 ${step.bgColor} rounded-2xl flex items-center justify-center mb-4 sm:mb-6 ${step.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                  {step.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Create Request Section */}
      <section id="create-request" className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          {/* Section Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Create Your File Request
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Fill out the form to generate a secure link that you can share with anyone
            </p>
          </div>
          
          {/* Request Form Container */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Benefits Sidebar */}
              <div className="lg:w-5/12 bg-gradient-to-br from-primary-600 to-primary-700 p-6 sm:p-8 lg:p-10 text-white">
                <div className="h-full flex flex-col justify-center">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 sm:mb-8">
                    How it helps you
                  </h3>
                  <ul className="space-y-4 sm:space-y-6">
                    {[
                      "No accounts needed for file upload",
                      "Auto-expiring links for security",
                      "Email notifications when files arrive",
                      "Easy file management in one place"
                    ].map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 mr-3 sm:mr-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm sm:text-base leading-relaxed">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Form Container */}
              <div className="lg:w-7/12 p-6 sm:p-8 lg:p-10">
                <RequestForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA Section */}
      <section className="bg-gray-50 py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            Ready to simplify your workflow?
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
            Join professionals who have streamlined their file collection process with FileNest.
          </p>
          <a 
            href="#create-request" 
            className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-primary-600 text-white font-semibold rounded-xl shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all duration-300 text-base sm:text-lg focus:outline-none focus:ring-4 focus:ring-primary-200"
          >
            Create Your First Request
          </a>
        </div>
      </section>
    </div>
  );
};

export default Home; 