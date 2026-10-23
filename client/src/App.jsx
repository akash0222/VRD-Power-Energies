import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import About from './pages/About';
import Contact from './pages/Contact';
import Quote from './pages/Quote';
export default function App(){return <><Navbar/><Routes><Route path="/" element={<Home/>}/><Route path="/products" element={<Products/>}/><Route path="/about" element={<About/>}/><Route path="/contact" element={<Contact/>}/><Route path="/quote" element={<Quote/>}/><Route path="*" element={<main className="page-wrap"><h1>Page not found</h1><a href="/">Return home</a></main>}/></Routes><Footer/></>}
