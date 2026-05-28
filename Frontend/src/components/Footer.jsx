import React from 'react';
import { Linkedin, Github, Globe, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full bg-stone-50 border-t border-stone-200/60 py-12 mt-auto font-sans">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Creator Info */}
        <div className="text-center md:text-left space-y-1">
          <p className="text-sm font-bold text-amber-950">
            SlamBook <span className="font-normal text-stone-500">by</span> Nathan Mendis
          </p>
          <p className="text-xs text-stone-400">
            &copy; {new Date().getFullYear()} All rights reserved. Built with nostalgia and modern tech.
          </p>
        </div>

        {/* Social / Portfolio Links */}
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/nathanmendis"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-stone-500 hover:text-amber-900 transition-colors text-sm font-medium"
            title="GitHub Profile"
          >
            <Github className="w-4 h-4" />
            <span>GitHub</span>
          </a>
          <a
            href="https://www.linkedin.com/in/nathan-mendis-a2318122a/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-stone-500 hover:text-amber-900 transition-colors text-sm font-medium"
            title="LinkedIn Profile"
          >
            <Linkedin className="w-4 h-4" />
            <span>LinkedIn</span>
          </a>
          <a
            href="https://nathanmendis.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-stone-500 hover:text-amber-900 transition-colors text-sm font-medium"
            title="Personal Portfolio"
          >
            <Globe className="w-4 h-4" />
            <span>Portfolio</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
