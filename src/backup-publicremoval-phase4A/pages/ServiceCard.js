import React from 'react';
import { ChevronRight, Globe, Smartphone, Settings, Users, FileText, GraduationCap, Wrench, UserCheck, Star, Zap, Shield, Award  } from 'lucide-react';

export default function MeraSoftwareHomepage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg">
                M
              </div>
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">MeraSoftware</span>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="text-gray-600 hover:text-purple-600 font-medium">Dashboard</a>
              <a href="#" className="text-gray-600 hover:text-purple-600 font-medium">Projects</a>
              <a href="#" className="text-gray-600 hover:text-purple-600 font-medium">Support</a>
            </nav>
            <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all">
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section with Photo */}
      <section className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Custom Software
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> Solutions</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                We build exclusive software that perfectly fits your business needs. No templates, just custom code.
              </p>
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transition-all flex items-center">
                Start Your Project <ChevronRight className="ml-2 w-5 h-5" />
              </button>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-r from-purple-400 to-blue-500 rounded-3xl p-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="bg-gradient-to-r from-purple-600 to-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Settings className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Custom Development</h3>
                      <p className="text-gray-600">Built exactly for your needs</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid - From 1st Code with Slightly Larger Boxes */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-gray-600">Choose the perfect solution for your business</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group bg-gradient-to-br from-blue-500 to-blue-600 p-8 rounded-2xl text-white cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1">
              <Globe className="w-8 h-8 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold mb-2">Website Development</h3>
              <p className="text-blue-100 text-sm">Custom responsive websites</p>
            </div>

            <div className="group bg-gradient-to-br from-purple-500 to-purple-600 p-8 rounded-2xl text-white cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1">
              <Settings className="w-8 h-8 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold mb-2">Web Software</h3>
              <p className="text-purple-100 text-sm">Business management systems</p>
            </div>

            <div className="group bg-gradient-to-br from-pink-500 to-pink-600 p-8 rounded-2xl text-white cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1">
              <Smartphone className="w-8 h-8 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold mb-2">Mobile Apps</h3>
              <p className="text-pink-100 text-sm">Native mobile applications</p>
            </div>

            <div className="group bg-gradient-to-br from-green-500 to-green-600 p-8 rounded-2xl text-white cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1">
              <Wrench className="w-8 h-8 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold mb-2">Support Services</h3>
              <p className="text-green-100 text-sm">Updates & maintenance</p>
            </div>
          </div>
        </div>
      </section>

       {/* Why Choose Us - Clickable Cards */}
      <section className="bg-gradient-to-br from-slate-900 to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose MeraSoftware?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="text-center cursor-pointer hover:bg-white hover:bg-opacity-10 p-6 rounded-xl transition-all group">
              <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-emerald-300 transition-colors">100% Custom Code</h3>
              <p className="text-gray-300 text-sm mb-3">No templates or builders, pure custom development</p>
              <ChevronRight className="w-4 h-4 text-white mx-auto group-hover:translate-x-1 transition-transform" />
            </div>

            <div className="text-center cursor-pointer hover:bg-white hover:bg-opacity-10 p-6 rounded-xl transition-all group">
              <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-emerald-300 transition-colors">Premium Quality</h3>
              <p className="text-gray-300 text-sm mb-3">High-quality solutions that exceed expectations</p>
              <ChevronRight className="w-4 h-4 text-white mx-auto group-hover:translate-x-1 transition-transform" />
            </div>

            <div className="text-center cursor-pointer hover:bg-white hover:bg-opacity-10 p-6 rounded-xl transition-all group">
              <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-emerald-300 transition-colors">Secure & Reliable</h3>
              <p className="text-gray-300 text-sm mb-3">Built with security and reliability in mind</p>
              <ChevronRight className="w-4 h-4 text-white mx-auto group-hover:translate-x-1 transition-transform" />
            </div>

            <div className="text-center cursor-pointer hover:bg-white hover:bg-opacity-10 p-6 rounded-xl transition-all group">
              <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-emerald-300 transition-colors">Expert Team</h3>
              <p className="text-gray-300 text-sm mb-3">Experienced developers and designers</p>
              <ChevronRight className="w-4 h-4 text-white mx-auto group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* What Do You Need - From 2nd Code */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Do You Need?</h2>
            <p className="text-gray-600">Tell us your requirements and we'll build it</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer group">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Simple Website</h3>
              <p className="text-gray-600 mb-4">Professional business website with modern design</p>
              <div className="text-blue-600 font-medium group-hover:text-blue-700">Starting from ₹15,000</div>
            </div>

            <div className="text-center p-6 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer group">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Web Software</h3>
              <p className="text-gray-600 mb-4">Custom business management systems</p>
              <div className="text-purple-600 font-medium group-hover:text-purple-700">Starting from ₹50,000</div>
            </div>

            <div className="text-center p-6 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer group">
              <div className="bg-gradient-to-r from-pink-500 to-pink-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Mobile App</h3>
              <p className="text-gray-600 mb-4">Native iOS and Android applications</p>
              <div className="text-pink-600 font-medium group-hover:text-pink-700">Starting from ₹1,00,000</div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Ready Solutions - From 2nd Code */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Ready Solutions</h2>
            <p className="text-gray-600">Ready-to-deploy solutions for various business needs</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 p-6 rounded-xl hover:shadow-lg transition-all cursor-pointer group">
              <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Local Business Setup</h3>
              <p className="text-gray-600 text-sm mb-4">Get your business online with professional presence</p>
              <div className="text-orange-600 font-medium text-sm group-hover:text-orange-700">Learn More →</div>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-xl hover:shadow-lg transition-all cursor-pointer group">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Management Systems</h3>
              <p className="text-gray-600 text-sm mb-4">Manage customers, staff, and operations</p>
              <div className="text-blue-600 font-medium text-sm group-hover:text-blue-700">Learn More →</div>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-xl hover:shadow-lg transition-all cursor-pointer group">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <UserCheck className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Service Solutions</h3>
              <p className="text-gray-600 text-sm mb-4">Public service and complaint management</p>
              <div className="text-purple-600 font-medium text-sm group-hover:text-purple-700">Learn More →</div>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-xl hover:shadow-lg transition-all cursor-pointer group">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Website Updates</h3>
              <p className="text-gray-600 text-sm mb-4">Regular updates and maintenance</p>
              <div className="text-green-600 font-medium text-sm group-hover:text-green-700">Learn More →</div>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-xl hover:shadow-lg transition-all cursor-pointer group">
              <div className="bg-red-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Wrench className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Software Upgrades</h3>
              <p className="text-gray-600 text-sm mb-4">Add features to existing software</p>
              <div className="text-red-600 font-medium text-sm group-hover:text-red-700">Learn More →</div>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-xl hover:shadow-lg transition-all cursor-pointer group">
              <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Educational Portals</h3>
              <p className="text-gray-600 text-sm mb-4">College and institute websites</p>
              <div className="text-indigo-600 font-medium text-sm group-hover:text-indigo-700">Learn More →</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Project?</h2>
          <p className="text-purple-100 mb-8 text-lg">Let's discuss your requirements and create the perfect solution</p>
          <button className="bg-white text-purple-600 px-8 py-4 rounded-full font-semibold hover:shadow-xl transition-all">
            Get Free Consultation
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white w-8 h-8 rounded flex items-center justify-center font-bold">
                M
              </div>
              <span className="ml-2 text-xl font-semibold">MeraSoftware</span>
            </div>
            <p className="text-gray-400">© 2025 MeraSoftware. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}