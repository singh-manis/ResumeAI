import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./FeatureCarousel.css"; // We'll create this CSS next

const FeatureCarousel = ({ items }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    // Auto-scroll effect
    useEffect(() => {
        const timer = setInterval(() => {
            handleNext();
        }, 5000); // Change every 5 seconds
        return () => clearInterval(timer);
    }, [currentIndex]);

    const handleNext = () => {
        setDirection(1);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    };

    const handlePrev = () => {
        setDirection(-1);
        setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
    };

    // Get visible items (current, next, next-next for 3-item view)
    const getVisibleItems = () => {
        const visible = [];
        for (let i = 0; i < 3; i++) {
            visible.push(items[(currentIndex + i) % items.length]);
        }
        return visible;
    };

    return (
        <div className="carousel-container">
            <div className="carousel-track">
                <AnimatePresence initial={false} mode="popLayout" custom={direction}>
                    {getVisibleItems().map((item, index) => (
                        <motion.div
                            key={`${item.title}-${currentIndex + index}`} // Unique key for animation
                            className={`carousel-card card-position-${index}`}
                            initial={{ opacity: 0, x: 100, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: index === 1 ? 1.05 : 0.95, zIndex: index === 1 ? 10 : 1 }}
                            exit={{ opacity: 0, x: -100, scale: 0.8 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            layout
                        >
                            <div className={`carousel-card-inner ${item.image ? 'has-image' : ''}`}>
                                {item.image ? (
                                    <div className="card-image-wrapper">
                                        <img src={item.image} alt={item.title} className="card-image" />
                                        <div className="card-overlay"></div>
                                    </div>
                                ) : (
                                    <div className={`card-icon-wrapper ${item.color}`}>
                                        {item.icon}
                                    </div>
                                )}
                                <div className="card-content">
                                    <h3>{item.title}</h3>
                                    <p>{item.description}</p>
                                </div>
                            </div>
                            <div className="card-glass-shine" />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div className="carousel-controls">
                <button onClick={handlePrev} className="control-btn prev">
                    <ChevronLeft size={24} />
                </button>
                <div className="carousel-dots">
                    {items.map((_, idx) => (
                        <span
                            key={idx}
                            className={`dot ${idx === currentIndex ? 'active' : ''}`}
                            onClick={() => {
                                setDirection(idx > currentIndex ? 1 : -1);
                                setCurrentIndex(idx);
                            }}
                        />
                    ))}
                </div>
                <button onClick={handleNext} className="control-btn next">
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>
    );
};

export default FeatureCarousel;
