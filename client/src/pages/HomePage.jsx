import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import ApiStatus from '../components/ApiStatus';
import RolesSection from '../components/RolesSection';
import Footer from '../components/Footer';

const HomePage = () => {
  return (
    <>
      <Header />
      <main className="container" style={{ flex: '1' }}>
        <Hero />
        <ApiStatus />
        <RolesSection />
      </main>
      <Footer />
    </>
  );
};

export default HomePage;
