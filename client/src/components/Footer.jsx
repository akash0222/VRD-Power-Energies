import { Link } from 'react-router-dom';
import { MapPin, MessageCircle } from 'lucide-react';
export default function Footer() {
  return <footer className="footer"><div><Link to="/" className="brand footer-brand"><span className="brand-mark">VRD</span><span>POWER ENERGIES<small>Battery solutions</small></span></Link><p>Battery enquiries for electric mobility and energy storage.</p></div><div><h4>Explore</h4><Link to="/products">Solutions</Link><Link to="/about">About us</Link><Link to="/quote">Request a quote</Link></div><div><h4>Contact</h4><p><MapPin size={15}/> Kannauj, Uttar Pradesh, India</p><a href="https://wa.me/919956191939" target="_blank" rel="noreferrer"><MessageCircle size={15}/> +91 9956191939</a><p className="muted">Business email to be confirmed</p></div><div className="footer-bottom">© {new Date().getFullYear()} VRD Power Energies. Product details are confirmed on enquiry.</div></footer>;
}
