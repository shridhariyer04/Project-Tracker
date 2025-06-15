"use client"
import React from 'react';
import { FileText, AlertCircle, CheckCircle, ArrowRight, Users, Sparkles } from 'lucide-react';
import { SignInButton } from '@clerk/nextjs';
import Link from "next/link"

const LandingPage = () => {
  const features = [
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Track Tasks",
      description: "Organize and monitor your project tasks with clarity and focus."
    },
    {
      icon: <AlertCircle className="w-5 h-5" />,
      title: "Log Issues",
      description: "Document problems as they arise and track their resolution."
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: "Stay Focused",
      description: "Keep your projects on track with simple, effective management."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white to-purple-50/30"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl"></div>
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-4 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">Simple. Clean. Effective.</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-tight text-gray-900 mb-8 leading-tight">
            Project tracking
            <br />
            <span className="font-medium bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">made simple</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Focus on what matters. Track your tasks, document issues, and keep your projects moving forward with effortless simplicity.
          </p>
          
          <SignInButton mode="modal">
           <Link
  href="/dashboard"
  className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-medium transition-all duration-300 inline-flex items-center space-x-3 hover:scale-105 shadow-lg hover:shadow-xl"
>
  <span>Start your project</span>
  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
</Link>
          </SignInButton>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 lg:px-8 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-light text-gray-900 mb-4">
              Everything you need
            </h2>
            <p className="text-lg text-gray-600 font-light">
              Built for individuals who value simplicity and effectiveness
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group p-8 bg-white/80 backdrop-blur-sm rounded-3xl border border-white/50 hover:border-blue-200/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 shadow-lg">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
                  index === 0 ? 'bg-gradient-to-br from-blue-100 to-blue-50 group-hover:from-blue-200 group-hover:to-blue-100 text-blue-700' :
                  index === 1 ? 'bg-gradient-to-br from-purple-100 to-purple-50 group-hover:from-purple-200 group-hover:to-purple-100 text-purple-700' :
                  'bg-gradient-to-br from-green-100 to-green-50 group-hover:from-green-200 group-hover:to-green-100 text-green-700'
                }`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed font-light">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Vision */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full px-4 py-2 mb-8">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Coming Soon</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-light text-gray-900 mb-6">
            Built for today, <span className="font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">ready for tomorrow</span>
          </h2>
          
          <p className="text-lg text-gray-600 mb-8 font-light leading-relaxed">
            Start with personal project management today. Team collaboration features are on the horizon, 
            designed to maintain the same simplicity you love.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-light mb-6">
            Ready to get organized?
          </h2>
          <p className="text-xl text-gray-300 mb-10 font-light">
            Join the simplicity movement. Start tracking your projects the right way.
          </p>
          <SignInButton mode="modal">
            <button className="group bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-2xl font-medium transition-all duration-300 inline-flex items-center space-x-3 hover:scale-105 shadow-2xl">
              <span>Get started now</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </SignInButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-8 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex justify-center items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-light text-gray-900 text-lg">ProjectHub</span>
          </div>
          <p className="text-gray-500 font-light">
            Crafted with care for project simplicity
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;