import { Link, NavLink } from 'react-router-dom';
import { BatteryCharging, Menu, X } from 'lucide-react';
import { useState } from 'react';
export default function Navbar() {
  const [open, setOpen] = useState(false);
  return <header className="navbar"><Link to="/" className="brand" onClick={() => setOpen(false)}><span className="brand-mark"><BatteryCharging size={23}/></span><span>VRD <b>POWER ENERGIES</b><small>Powering possibilities</small></span></Link>
    <button className="menu-toggle" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
    <nav className={open ? 'nav-links open' : 'nav-links'}><NavLink to="/" onClick={() => setOpen(false)}>Home</NavLink><NavLink to="/products" onClick={() => setOpen(false)}>Solutions</NavLink><NavLink to="/about" onClick={() => setOpen(false)}>About</NavLink><NavLink to="/contact" onClick={() => setOpen(false)}>Contact</NavLink><Link className="button button-small" to="/quote" onClick={() => setOpen(false)}>Request a quote</Link></nav>
  </header>;
}
