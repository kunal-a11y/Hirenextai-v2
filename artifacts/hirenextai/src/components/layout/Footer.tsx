import { Link } from "wouter";
import { Logo } from "@/components/Logo";
import { Linkedin, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react";

const aboutLinks = [
  { label: "About HirenextAI", href: "/about" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
];

const supportLinks = [
  { label: "Help Center", href: "/help-center" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
  { label: "Refund Policy", href: "/refund-policy" },
];

const socials = [
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/5 relative z-10 mt-12">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/">
              <Logo size="lg" />
            </Link>
            <p className="mt-4 text-white/50 text-sm leading-relaxed max-w-xs">
              The AI-powered job search platform helping professionals in India land their next role faster, smarter, and with more confidence.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-purple-400 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* About */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-5">About</h4>
            <ul className="space-y-3">
              {aboutLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-white/50 text-sm hover:text-purple-400 transition-colors duration-200">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-5">Support</h4>
            <ul className="space-y-3">
              {supportLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-white/50 text-sm hover:text-purple-400 transition-colors duration-200">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-5">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                <a href="mailto:support@hirenextai.com" className="text-white/50 text-sm hover:text-purple-400 transition-colors duration-200">
                  support@hirenextai.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                <a href="tel:+919999999999" className="text-white/50 text-sm hover:text-purple-400 transition-colors duration-200">
                  +91 99999 99999
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                <span className="text-white/50 text-sm">
                  Bengaluru, Karnataka<br />India
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent mb-8" />

        {/* Bottom Row */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-white/30 text-sm text-center">
            &copy; 2026 HirenextAI. All rights reserved.
          </p>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <Link href="/privacy-policy" className="text-white/30 text-xs hover:text-purple-400 transition-colors duration-200">Privacy Policy</Link>
            <Link href="/terms" className="text-white/30 text-xs hover:text-purple-400 transition-colors duration-200">Terms of Service</Link>
            <Link href="/cookies" className="text-white/30 text-xs hover:text-purple-400 transition-colors duration-200">Cookie Policy</Link>
            <Link href="/refund-policy" className="text-white/30 text-xs hover:text-purple-400 transition-colors duration-200">Refund Policy</Link>
            <Link href="/contact" className="text-white/30 text-xs hover:text-purple-400 transition-colors duration-200">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
